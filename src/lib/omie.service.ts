// src/lib/omie.service.ts

// --- CONFIGURAÇÃO ---
const OMIE_APP_KEY = process.env.OMIE_APP_KEY;
const OMIE_APP_SECRET = process.env.OMIE_APP_SECRET;

// Validação
if (!OMIE_APP_KEY || !OMIE_APP_SECRET) {
    throw new Error("As variáveis de ambiente OMIE_APP_KEY e OMIE_APP_SECRET não foram definidas.");
}

// --- INTERFACES ---
export interface ContaPagar {
  codigo_cliente_fornecedor: number;
  valor_documento: number;
  data_vencimento: string;
  observacao: string;
}
export interface Cliente {
  codigo_cliente_omie: number;
  nome_fantasia: string;
}

// Interface que o frontend espera receber
export interface MovimentoFinanceiro {
  codigo_cliente_fornecedor: number;
  valor: number;
  data_lancamento: string;
}

// Interface interna para tipar a resposta bruta da API ListarMovimentos
interface OmieMovimentoRaw {
  detalhes?: {
    nCodCliente?: number;
    dDtPagamento?: string;
    cGrupo?: string;
  };
  resumo?: {
    nValPago?: number;
  };
}

// +++ DEFINIÇÃO DOS VALORES EXATOS DOS CONTRATOS +++
// Mapeia o ID do fornecedor (nCodCliente) para o valor exato esperado do contrato
const VALORES_CONTRATOS_FIXOS: { [key: number]: number } = {
  4807594928: 3030.40, // RIT SOLUCOES
  4807594778: 1350.00, // BRFIBRA (Valor atualizado)
  5202017644: 1021.65  // WORLDNET
};
// Lista apenas dos IDs dos fornecedores de contrato fixo
const IDS_FORNECEDORES_CONTRATO = Object.keys(VALORES_CONTRATOS_FIXOS).map(Number);
// (Removemos VALORES_ALTERNATIVOS pois agora há apenas um valor por fornecedor)


// --- FUNÇÃO DE LÓGICA DE BUSCA ---

// Função genérica para chamar a API Omie (sem alterações)
async function consultarOmie(call: string, params: any, endpointUrl: string): Promise<any> {
    const fullUrl = `https://app.omie.com.br/api/v1${endpointUrl}`;
    const requestBody = { "call": call, "app_key": OMIE_APP_KEY, "app_secret": OMIE_APP_SECRET, "param": [params] };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(fullUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody), signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (!response.ok || data.faultstring) {
            console.error(`Erro na API Omie (${call}): Status ${response.status}`, data.faultstring || 'Sem faultstring');
            throw new Error(data.faultstring || `Erro HTTP: ${response.status}`);
        }
        return data;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') { throw new Error('A requisição para a API Omie demorou muito (Timeout).'); }
        console.error(`Falha ao consultar Omie (${call}): ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

// Função buscarTodosOsClientes (sem alterações)
export async function buscarTodosOsClientes(): Promise<Cliente[]> {
    console.log("Service: Iniciando busca de todos os clientes...");
    const primeiraPagina = await consultarOmie("ListarClientes", { "pagina": 1, "registros_por_pagina": 500 }, "/geral/clientes/");
    if (!primeiraPagina || !primeiraPagina.clientes_cadastro) return [];
    let todosOsClientes = primeiraPagina.clientes_cadastro;
    const totalDePaginas = primeiraPagina.total_de_paginas;
    if (totalDePaginas > 1) {
        for (let i = 2; i <= totalDePaginas; i++) {
            const paginaResult = await consultarOmie("ListarClientes", { "pagina": i, "registros_por_pagina": 500 }, "/geral/clientes/");
            if (paginaResult && paginaResult.clientes_cadastro) { todosOsClientes = todosOsClientes.concat(paginaResult.clientes_cadastro); }
        }
    }
    console.log(`Service: ${todosOsClientes.length} clientes/fornecedores carregados.`);
    return todosOsClientes;
}


// +++ FUNÇÃO FINAL ATUALIZADA com filtro de valor EXATO (BRFIBRA = 1350) +++
export async function buscarMovimentosPagamentoDoPeriodo(dataDe: string, dataAte: string): Promise<MovimentoFinanceiro[]> {
    console.log(`Service: Iniciando busca de PAGAMENTOS DE CONTRATOS FIXOS (valores exatos) de ${dataDe} a ${dataAte}...`); // Log atualizado

    const params = {
        "nPagina": 1,
        "nRegPorPagina": 500,
        "dDtPagtoDe": dataDe,
        "dDtPagtoAte": dataAte
    };
    const call = "ListarMovimentos";
    const endpointUrl = "/financas/mf/";

    let primeiraPagina;
    try {
        primeiraPagina = await consultarOmie(call, params, endpointUrl);
    } catch (error) {
        console.error("Erro ao buscar a primeira página de movimentos:", error);
        return [];
    }

    if (!primeiraPagina || !Array.isArray(primeiraPagina.movimentos)) {
        console.warn(`Service: A API Omie (${call}) não retornou a lista 'movimentos'.`);
        return [];
    }

    let todosOsMovimentos: OmieMovimentoRaw[] = primeiraPagina.movimentos;

    // Paginação
    const totalDePaginas = primeiraPagina.nTotPaginas || 1;
    const nomeParamPagina = 'nPagina';

    if (totalDePaginas > 1) {
        const paramsPaginacao = { ...params, nRegPorPagina: 500 };
        for (let i = 2; i <= totalDePaginas; i++) {
            try {
                const paginaResult = await consultarOmie(call, { ...paramsPaginacao, [nomeParamPagina]: i }, endpointUrl);
                if (paginaResult && Array.isArray(paginaResult.movimentos)) {
                    todosOsMovimentos = todosOsMovimentos.concat(paginaResult.movimentos);
                } else {
                    console.warn(`Página ${i} não retornou a lista 'movimentos'.`);
                }
            } catch (error) {
                console.error(`Erro ao buscar página ${i} de movimentos:`, error);
            }
        }
    }

    console.log(`Service: Busca de movimentos finalizada. Total de ${todosOsMovimentos.length} movimentos brutos carregados.`);

    // --- Mapeamento e Filtro Final para VALORES EXATOS ESPECÍFICOS ---
    const movimentosMapeados = todosOsMovimentos
        // 1. Filtra apenas CONTA_A_PAGAR
        .filter((mov: OmieMovimentoRaw) => mov.detalhes?.cGrupo === 'CONTA_A_PAGAR')

        // 2. Filtra pelos fornecedores de contrato E pelo VALOR EXATO definido
        .filter((mov: OmieMovimentoRaw) => {
            const codCliente = mov.detalhes?.nCodCliente;
            const valorPago = mov.resumo?.nValPago;

            // Verifica se é um dos fornecedores de contrato
            if (codCliente === undefined || !IDS_FORNECEDORES_CONTRATO.includes(codCliente)) {
                return false; // Não é um fornecedor de contrato
            }

            // Verifica se o valor pago bate EXATAMENTE com o valor definido (com tolerância)
            if (valorPago === undefined) return false;

            const valorEsperado = VALORES_CONTRATOS_FIXOS[codCliente]; // Pega o valor definido para este fornecedor

            // Compara com tolerância de 1 centavo
            if (Math.abs(valorPago - valorEsperado) > 0.01) {
                // Log opcional para ver o que foi filtrado
                // console.log(`Filtrando valor exato: Fornecedor ${codCliente}, Valor Pago: ${valorPago}, Esperado: ${valorEsperado}`);
                return false; // Valor não bate com o esperado
            }

            return true; // Passou nos filtros
        })
        // 3. Mapeia para o formato esperado pelo frontend
        .map((mov: OmieMovimentoRaw) => {
            const codFornecedor = mov.detalhes!.nCodCliente;
            const valorMov = mov.resumo!.nValPago;
            const dataMov = mov.detalhes!.dDtPagamento;

            if (codFornecedor == null || valorMov == null || dataMov == null) { return null; }

            return {
                codigo_cliente_fornecedor: codFornecedor,
                valor: valorMov,
                data_lancamento: dataMov
            } as MovimentoFinanceiro;
        })
        // 4. Remove quaisquer itens nulos
        .filter((mov): mov is MovimentoFinanceiro => mov !== null);

    console.log(`Service: Mapeamento finalizado. ${movimentosMapeados.length} PAGAMENTOS COM VALORES EXATOS encontrados.`); // Log atualizado

    return movimentosMapeados;
}