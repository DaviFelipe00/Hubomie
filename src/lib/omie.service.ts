// src/lib/omie.service.ts

const OMIE_APP_KEY = process.env.OMIE_APP_KEY;
const OMIE_APP_SECRET = process.env.OMIE_APP_SECRET;

if (!OMIE_APP_KEY || !OMIE_APP_SECRET) {
    throw new Error("As variáveis de ambiente OMIE_APP_KEY e OMIE_APP_SECRET não foram definidas.");
}

export interface ContaPagar {
  codigo_cliente_fornecedor: number;
  valor_documento: number;
  data_vencimento: string;
  data_pagamento: string;
  observacao: string;
}
export interface Cliente {
  codigo_cliente_omie: number;
  nome_fantasia: string;
}

async function consultarOmie(call: string, params: any, endpointUrl: string) {
    const fullUrl = `https://app.omie.com.br/api/v1${endpointUrl}`;
    const requestBody = { "call": call, "app_key": OMIE_APP_KEY, "app_secret": OMIE_APP_SECRET, "param": [params] };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(fullUrl, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        const data = await response.json();
        if (!response.ok || data.faultstring) { 
            throw new Error(data.faultstring || `Erro HTTP: ${response.status}`); 
        }
        return data;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('A requisição para a API Omie demorou muito para responder (Timeout).');
        }
        console.error(`Falha ao consultar Omie (${call}): ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

export async function buscarTodosOsClientes(): Promise<Cliente[]> {
    // Esta função permanece a mesma e está correta
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
    return todosOsClientes;
}

// --- LÓGICA CORRIGIDA ---
// Voltamos a usar o filtro por "data de" (emissão), que é o que a API aceita.
export async function buscarTodasContasAPagarDoPeriodo(dataDe: string, dataAte: string): Promise<ContaPagar[]> {
    console.log(`Service: Buscando contas LANÇADAS de ${dataDe} a ${dataAte}...`);
    
    const params = { 
        "pagina": 1, 
        "registros_por_pagina": 500, 
        "filtrar_por_data_de": dataDe, 
        "filtrar_por_data_ate": dataAte 
    };

    const primeiraPagina = await consultarOmie("ListarContasPagar", params, "/financas/contapagar/");
    if (!primeiraPagina || !primeiraPagina.conta_pagar_cadastro) return [];

    let todasAsContas = primeiraPagina.conta_pagar_cadastro;
    const totalDePaginas = primeiraPagina.total_de_paginas;
    
    if (totalDePaginas > 1) {
        for (let i = 2; i <= totalDePaginas; i++) {
            const paginaResult = await consultarOmie("ListarContasPagar", { ...params, pagina: i }, "/financas/contapagar/");
            if (paginaResult && paginaResult.conta_pagar_cadastro) {
                todasAsContas = todasAsContas.concat(paginaResult.conta_pagar_cadastro);
            }
        }
    }
    console.log(`Service: Busca de contas por lançamento finalizada. Total de ${todasAsContas.length} contas carregadas.`);
    return todasAsContas;
}