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
    cGrupo?: string; // Campo usado para filtrar
  };
  resumo?: {
    nValPago?: number;
  };
}

const ID_RIT = 4807594928;
const VALOR_FIXO_RIT = 3030.40;
const ID_BRFIBRA = 4807594778;
const ID_WORLDNET = 5202017644;
const ID_MUNDIVOX = 4807594893;

// Lista dos IDs dos fornecedores que queremos incluir
const IDS_FORNECEDORES_RELEVANTES = [ID_RIT, ID_BRFIBRA, ID_WORLDNET, ID_MUNDIVOX];


// --- FUNÇÃO DE LÓGICA DE BUSCA ---

// Função genérica para chamar a API Omie (mantém logs de erro)
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
            console.error(`Erro na API Omie (${call}): Status ${response.status}`, data.faultstring || 'Sem faultstring'); // Mantém log de erro
            throw new Error(data.faultstring || `Erro HTTP: ${response.status}`);
        }
        return data;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') { throw new Error('A requisição para a API Omie demorou muito (Timeout).'); } // Mantém erro de timeout
        console.error(`Falha ao consultar Omie (${call}): ${error instanceof Error ? error.message : String(error)}`); // Mantém log de erro genérico
        throw error;
    }
}

// Função buscarTodosOsClientes (mantém logs de início/fim)
export async function buscarTodosOsClientes(): Promise<Cliente[]> {
    console.log("Service: Iniciando busca de todos os clientes..."); // Mantido
    const primeiraPagina = await consultarOmie("ListarClientes", { "pagina": 1, "registros_por_pagina": 500 }, "/geral/clientes/");
    if (!primeiraPagina || !primeiraPagina.clientes_cadastro) return [];
    let todosOsClientes = primeiraPagina.clientes_cadastro;
    const totalDePaginas = primeiraPagina.total_de_paginas;
    if (totalDePaginas > 1) {
        for (let i = 2; i <= totalDePaginas; i++) {
            try { // Adicionado try/catch para paginação
                const paginaResult = await consultarOmie("ListarClientes", { "pagina": i, "registros_por_pagina": 500 }, "/geral/clientes/");
                if (paginaResult && paginaResult.clientes_cadastro) { todosOsClientes = todosOsClientes.concat(paginaResult.clientes_cadastro); }
            } catch(error) {
                 console.error(`Erro ao buscar página ${i} de clientes:`, error);
            }
        }
    }
    console.log(`Service: ${todosOsClientes.length} clientes/fornecedores carregados.`); // Mantido
    return todosOsClientes;
}


// +++ FUNÇÃO FINAL LIMPA +++
export async function buscarMovimentosPagamentoDoPeriodo(dataDe: string, dataAte: string): Promise<MovimentoFinanceiro[]> {
    console.log(`Service: Iniciando busca de PAGAMENTOS (RIT valor fixo, outros qualquer valor) de ${dataDe} a ${dataAte}...`); // Mantido

    const params = { "nPagina": 1, "nRegPorPagina": 500, "dDtPagtoDe": dataDe, "dDtPagtoAte": dataAte };
    const call = "ListarMovimentos";
    const endpointUrl = "/financas/mf/";

    let primeiraPagina;
    try {
        primeiraPagina = await consultarOmie(call, params, endpointUrl);
    } catch (error) {
        // Log de erro já está em consultarOmie
        return [];
    }

    if (!primeiraPagina || !Array.isArray(primeiraPagina.movimentos)) {
        console.warn(`Service: A API Omie (${call}) não retornou a lista 'movimentos'.`); // Mantém aviso importante
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
                     // Mantém aviso se uma página falhar
                    console.warn(`Página ${i} não retornou a lista 'movimentos'.`);
                }
            } catch (error) {
                // Log de erro já está em consultarOmie
                // Apenas loga qual página falhou
                console.error(`Erro ao buscar página ${i} de movimentos.`);
            }
        }
    }

    // console.log(`Service: Busca de movimentos finalizada. Total de ${todosOsMovimentos.length} movimentos brutos carregados.`); // Log removido (opcional)

    // --- Mapeamento e Filtro Final (sem logs internos) ---
    const movimentosMapeados = todosOsMovimentos
        .filter((mov: OmieMovimentoRaw) => mov.detalhes?.cGrupo === 'CONTA_A_PAGAR')
        .filter((mov: OmieMovimentoRaw) => {
            const codCliente = mov.detalhes?.nCodCliente;
            const valorPago = mov.resumo?.nValPago;

            if (codCliente === undefined || !IDS_FORNECEDORES_RELEVANTES.includes(codCliente)) {
                return false;
            }
            if (codCliente === ID_RIT) {
                if (valorPago === undefined || Math.abs(valorPago - VALOR_FIXO_RIT) > 0.01) {
                    return false;
                }
            } else {
                if (valorPago === undefined) {
                    return false;
                }
            }
            return true;
        })
        .map((mov: OmieMovimentoRaw) => {
            const codFornecedor = mov.detalhes!.nCodCliente;
            const valorMov = mov.resumo!.nValPago;
            const dataMov = mov.detalhes!.dDtPagamento;
            if (codFornecedor == null || valorMov == null || dataMov == null) { return null; }
            return { codigo_cliente_fornecedor: codFornecedor, valor: valorMov, data_lancamento: dataMov } as MovimentoFinanceiro;
        })
        .filter((mov): mov is MovimentoFinanceiro => mov !== null);

    // Log final mantido
    console.log(`Service: Mapeamento finalizado. ${movimentosMapeados.length} PAGAMENTOS RELEVANTES encontrados.`);

    return movimentosMapeados;
}