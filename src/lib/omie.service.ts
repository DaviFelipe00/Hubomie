// --- CONFIGURAÇÃO ---
// Lemos as variáveis de ambiente aqui, no local que se comunica com a API externa.
const OMIE_APP_KEY = process.env.OMIE_APP_KEY;
const OMIE_APP_SECRET = process.env.OMIE_APP_SECRET;

// --- INTERFACES (Exportamos para que a route.ts também possa usá-las) ---
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

// --- FUNÇÕES DE LÓGICA DE BUSCA ---

// Esta função é privada ao serviço, pois só é usada internamente.
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

// Exportamos as funções que a nossa API Route vai precisar consumir.
export async function buscarTodosOsClientes(): Promise<Cliente[]> {
    console.log("Service: Iniciando busca de todos os clientes...");
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
    console.log(`Service: ${todosOsClientes.length} clientes/fornecedores carregados.`);
    return todosOsClientes;
}

export async function buscarTodasContasAPagarDoPeriodo(dataDe: string, dataAte: string): Promise<ContaPagar[]> {
    console.log(`Service: Iniciando busca de contas a pagar de ${dataDe} a ${dataAte}...`);
    const params = { "pagina": 1, "registros_por_pagina": 500, "filtrar_por_data_de": dataDe, "filtrar_por_data_ate": dataAte };
    const primeiraPagina = await consultarOmie("ListarContasPagar", params, "/financas/contapagar/");
    if (!primeiraPagina || !primeiraPagina.conta_pagar_cadastro) return [];

    let todasAsContas = primeiraPagina.conta_pagar_cadastro;
    const totalDePaginas = primeiraPagina.total_de_paginas;
    
    console.log(`Service: Total de ${primeiraPagina.total_de_registros} contas encontradas em ${totalDePaginas} páginas.`);
    if (totalDePaginas > 1) {
        for (let i = 2; i <= totalDePaginas; i++) {
            const paginaResult = await consultarOmie("ListarContasPagar", { ...params, pagina: i }, "/financas/contapagar/");
            if (paginaResult && paginaResult.conta_pagar_cadastro) {
                todasAsContas = todasAsContas.concat(paginaResult.conta_pagar_cadastro);
            }
        }
    }
    console.log(`Service: Busca de contas finalizada. Total de ${todasAsContas.length} contas carregadas da API.`);
    return todasAsContas;
}