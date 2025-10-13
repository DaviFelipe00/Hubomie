// src/app/api/omie/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import * as OmieService from '@/lib/omie.service';
import { Cliente } from '@/lib/omie.service'; // Supondo que você exporte essa interface

export const dynamic = 'force-dynamic';

const IDS_FORNECEDORES_INTERNET = [5202017644, 4807594778, 4807594928];

// --- NOSSO CACHE SIMPLES EM MEMÓRIA ---
// Guardará a lista de clientes para não buscá-la toda hora.
let cachedClientes: { data: Cliente[]; timestamp: number } | null = null;
const CACHE_DURATION_MS = 10 * 60 * 1000; // Cache de 10 minutos

async function getClientesComCache(): Promise<Cliente[]> {
    const agora = Date.now();

    // Se o cache existe E não expirou, retorna os dados do cache
    if (cachedClientes && (agora - cachedClientes.timestamp) < CACHE_DURATION_MS) {
        console.log("CACHE: Retornando clientes do cache.");
        return cachedClientes.data;
    }

    // Se não, busca os dados na API
    console.log("CACHE: Cache expirado ou inexistente. Buscando clientes na API...");
    const novosClientes = await OmieService.buscarTodosOsClientes();
    
    // Atualiza o cache com os novos dados e o timestamp atual
    cachedClientes = {
        data: novosClientes,
        timestamp: agora,
    };
    
    return novosClientes;
}


// --- O ENDPOINT DA API OTIMIZADO ---
export async function GET(request: NextRequest) {
    try {
        // Lógica de datas (permanece igual)
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
        
        console.log(`API Route: Endpoint chamado para o período: ${dataDe} a ${dataAte}`);

        // 1. DISPARAMOS AS BUSCAS EM PARALELO
        // A busca de clientes agora usa nossa função com cache.
        const [todosOsClientes, todasAsContasDaAPI] = await Promise.all([
            getClientesComCache(),
            OmieService.buscarTodasContasAPagarDoPeriodo(dataDe, dataAte)
        ]);
        
        // Lógica de processamento e filtragem (permanece a mesma, pois já era eficiente)
        const parseDate = (dateStr: string): Date => {
            const [day, month, year] = dateStr.split('/').map(Number);
            return new Date(year, month - 1, day);
        };
        const dataInicioFiltro = parseDate(dataDe);
        const dataFimFiltro = parseDate(dataAte);

        const contasRealmenteNoPeriodo = todasAsContasDaAPI.filter(conta => {
            if (!conta.data_vencimento) return false;
            const dataVencimento = parseDate(conta.data_vencimento);
            return dataVencimento >= dataInicioFiltro && dataVencimento <= dataFimFiltro;
        });

        console.log(`API Route: ${todasAsContasDaAPI.length} contas recebidas do serviço. ${contasRealmenteNoPeriodo.length} estão no período correto.`);
        
        // Uso de Map e Set já é otimizado, mantemos como está
        const mapaDeNomes = new Map<number, string>();
        todosOsClientes.forEach(cliente => mapaDeNomes.set(cliente.codigo_cliente_omie, cliente.nome_fantasia));
        
        const idSet = new Set(IDS_FORNECEDORES_INTERNET);
        const contasDeInternet = contasRealmenteNoPeriodo.filter(conta => idSet.has(conta.codigo_cliente_fornecedor));
        
        const valorTotal = contasDeInternet.reduce((acc, conta) => acc + conta.valor_documento, 0);
        
        // 2. OTIMIZAÇÃO NA ORDENAÇÃO
        // Evitamos criar Datas repetidamente dentro do sort, o que melhora a performance.
        const lancamentosOrdenados = contasDeInternet.map(conta => ({
            fornecedor: mapaDeNomes.get(conta.codigo_cliente_fornecedor) || "Desconhecido",
            valor: conta.valor_documento,
            vencimento: conta.data_vencimento,
            // Criamos a data uma única vez para ordenação
            _vencimentoDate: parseDate(conta.data_vencimento)
        }))
        .sort((a, b) => b._vencimentoDate.getTime() - a._vencimentoDate.getTime())
        // Removemos o campo auxiliar após a ordenação
        .map(({ _vencimentoDate, ...resto }) => resto);

        const resultado = {
            totalLancamentos: contasDeInternet.length,
            valorTotal: valorTotal,
            lancamentos: lancamentosOrdenados,
        };
        
        return NextResponse.json(resultado);
    } catch (error) {
        console.error("Erro no endpoint da API:", error);
        return NextResponse.json({ message: "Erro ao buscar dados da Omie." }, { status: 500 });
    }
}