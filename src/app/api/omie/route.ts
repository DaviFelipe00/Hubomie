import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// --- CONFIGURAÇÃO ---
const OMIE_APP_KEY = process.env.OMIE_APP_KEY;
const OMIE_APP_SECRET = process.env.OMIE_APP_SECRET;
const IDS_FORNECEDORES_INTERNET = [5202017644, 4807594778, 4807594928];

// --- INTERFACES ---
interface ContaPagar {
  codigo_cliente_fornecedor: number;
  valor_documento: number;
  data_vencimento: string;
  observacao: string;
}
interface Cliente {
  codigo_cliente_omie: number;
  nome_fantasia: string;
}

// --- FUNÇÕES DE LÓGICA (sem alterações) ---
async function consultarOmie(call: string, params: any, endpointUrl: string) {
    const fullUrl = `https://app.omie.com.br/api/v1${endpointUrl}`;
    const requestBody = { "call": call, "app_key": OMIE_APP_KEY, "app_secret": OMIE_APP_SECRET, "param": [params] };
    try {
        const response = await fetch(fullUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
        const data = await response.json();
        if (!response.ok || data.faultstring) { throw new Error(data.faultstring || response.statusText); }
        return data;
    } catch (error) {
        console.error(`Falha ao buscar página: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

async function buscarTodosOsClientes(): Promise<Cliente[]> {
    console.log("Iniciando busca de todos os clientes...");
    const primeiraPagina = await consultarOmie("ListarClientes", { "pagina": 1, "registros_por_pagina": 500 }, "/geral/clientes/");
    if (!primeiraPagina || !primeiraPagina.clientes_cadastro) return [];
    let todosOsClientes = primeiraPagina.clientes_cadastro;
    const totalDePaginas = primeiraPagina.total_de_paginas;
    if (totalDePaginas > 1) {
        for (let i = 2; i <= totalDePaginas; i++) {
            const paginaResult = await consultarOmie("ListarClientes", { "pagina": i, "registros_por_pagina": 500 }, "/geral/clientes/");
            if (paginaResult && paginaResult.clientes_cadastro) {
                todosOsClientes = todosOsClientes.concat(paginaResult.clientes_cadastro);
            }
        }
    }
    console.log(`${todosOsClientes.length} clientes/fornecedores carregados.`);
    return todosOsClientes;
}

async function buscarTodasContasAPagarDoPeriodo(dataDe: string, dataAte: string): Promise<ContaPagar[]> {
    console.log(`Iniciando busca de contas a pagar de ${dataDe} a ${dataAte}...`);
    const params = { "pagina": 1, "registros_por_pagina": 500, "filtrar_por_data_de": dataDe, "filtrar_por_data_ate": dataAte };
    const primeiraPagina = await consultarOmie("ListarContasPagar", params, "/financas/contapagar/");
    if (!primeiraPagina || !primeiraPagina.conta_pagar_cadastro) return [];
    let todasAsContas = primeiraPagina.conta_pagar_cadastro;
    const totalDePaginas = primeiraPagina.total_de_paginas;
    console.log(`Total de ${primeiraPagina.total_de_registros} contas (potencialmente incorretas) encontradas em ${totalDePaginas} páginas.`);
    if (totalDePaginas > 1) {
        for (let i = 2; i <= totalDePaginas; i++) {
            const paginaResult = await consultarOmie("ListarContasPagar", { ...params, pagina: i }, "/financas/contapagar/");
            if (paginaResult && paginaResult.conta_pagar_cadastro) {
                todasAsContas = todasAsContas.concat(paginaResult.conta_pagar_cadastro);
            }
        }
    }
    console.log(`Busca de contas finalizada. Total de ${todasAsContas.length} contas carregadas da API.`);
    return todasAsContas;
}


// --- O ENDPOINT DA API (COM DUPLA CHECAGEM) ---
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        let dataDe = searchParams.get('de');
        let dataAte = searchParams.get('ate');

        if (!dataDe || !dataAte) {
            const hoje = new Date();
            const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            const ultimoDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
            dataDe = primeiroDiaDoMes.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            dataAte = ultimoDiaDoMes.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
        
        console.log(`Endpoint chamado para o período: ${dataDe} a ${dataAte}`);

        const [todosOsClientes, todasAsContasDaAPI] = await Promise.all([
            buscarTodosOsClientes(),
            buscarTodasContasAPagarDoPeriodo(dataDe, dataAte)
        ]);

        // --- INÍCIO DA LÓGICA DE DUPLA CHECAGEM ---
        
        // Função auxiliar para converter nossa data DD/MM/AAAA para um objeto Date
        const parseDate = (dateStr: string): Date => {
            const [day, month, year] = dateStr.split('/').map(Number);
            return new Date(year, month - 1, day);
        };

        const dataInicioFiltro = parseDate(dataDe);
        const dataFimFiltro = parseDate(dataAte);

        console.log(`Aplicando filtro de segurança local de ${dataInicioFiltro.toLocaleDateString()} a ${dataFimFiltro.toLocaleDateString()}`);
        
        const contasRealmenteNoPeriodo = todasAsContasDaAPI.filter(conta => {
            if (!conta.data_vencimento) return false;
            const dataVencimento = parseDate(conta.data_vencimento);
            // Compara as datas para garantir que a conta está dentro do período solicitado
            return dataVencimento >= dataInicioFiltro && dataVencimento <= dataFimFiltro;
        });

        console.log(`A API retornou ${todasAsContasDaAPI.length} contas. Após o filtro de segurança, restaram ${contasRealmenteNoPeriodo.length}.`);

        // --- FIM DA LÓGICA DE DUPLA CHECAGEM ---
        
        // O resto do código agora usa a lista JÁ CORRIGIDA 'contasRealmenteNoPeriodo'
        const mapaDeNomes = new Map<number, string>();
        todosOsClientes.forEach(cliente => mapaDeNomes.set(cliente.codigo_cliente_omie, cliente.nome_fantasia));
        
        const idSet = new Set(IDS_FORNECEDORES_INTERNET);
        const contasDeInternet = contasRealmenteNoPeriodo.filter(conta => idSet.has(conta.codigo_cliente_fornecedor));
        
        const valorTotal = contasDeInternet.reduce((acc, conta) => acc + conta.valor_documento, 0);
        
        const resultado = {
            totalLancamentos: contasDeInternet.length,
            valorTotal: valorTotal,
            lancamentos: contasDeInternet.map(conta => ({
                fornecedor: mapaDeNomes.get(conta.codigo_cliente_fornecedor) || "Desconhecido",
                valor: conta.valor_documento,
                vencimento: conta.data_vencimento,
            })).sort((a, b) => new Date(b.vencimento.split('/').reverse().join('-')).getTime() - new Date(a.vencimento.split('/').reverse().join('-')).getTime()),
        };
        
        return NextResponse.json(resultado);
    } catch (error) {
        console.error("Erro no endpoint da API:", error);
        return NextResponse.json({ message: "Erro ao buscar dados da Omie." }, { status: 500 });
    }
}