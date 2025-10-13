// src/app/api/omie/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import * as OmieService from '@/lib/omie.service';
import { Cliente } from '@/lib/omie.service';

export const dynamic = 'force-dynamic';

const IDS_FORNECEDORES_INTERNET = [5202017644, 4807594778, 4807594928];

let cachedClientes: { data: Cliente[]; timestamp: number } | null = null;
const CACHE_DURATION_MS = 10 * 60 * 1000;

async function getClientesComCache(): Promise<Cliente[]> {
    const agora = Date.now();
    if (cachedClientes && (agora - cachedClientes.timestamp) < CACHE_DURATION_MS) {
        console.log("CACHE: Retornando clientes do cache.");
        return cachedClientes.data;
    }
    console.log("CACHE: Cache expirado ou inexistente. Buscando clientes na API...");
    const novosClientes = await OmieService.buscarTodosOsClientes();
    cachedClientes = {
        data: novosClientes,
        timestamp: agora,
    };
    return novosClientes;
}

export async function GET(request: NextRequest) {
    try {
        // ... (toda a sua lógica de sucesso permanece exatamente a mesma)
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

        const [todosOsClientes, todasAsContasDaAPI] = await Promise.all([
            getClientesComCache(),
            OmieService.buscarTodasContasAPagarDoPeriodo(dataDe, dataAte)
        ]);
        
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
        
        const mapaDeNomes = new Map<number, string>();
        todosOsClientes.forEach(cliente => mapaDeNomes.set(cliente.codigo_cliente_omie, cliente.nome_fantasia));
        
        const idSet = new Set(IDS_FORNECEDORES_INTERNET);
        const contasDeInternet = contasRealmenteNoPeriodo.filter(conta => idSet.has(conta.codigo_cliente_fornecedor));
        
        const valorTotal = contasDeInternet.reduce((acc, conta) => acc + conta.valor_documento, 0);
        
        const lancamentosOrdenados = contasDeInternet.map(conta => ({
            fornecedor: mapaDeNomes.get(conta.codigo_cliente_fornecedor) || "Desconhecido",
            valor: conta.valor_documento,
            vencimento: conta.data_vencimento,
            _vencimentoDate: parseDate(conta.data_vencimento)
        }))
        .sort((a, b) => b._vencimentoDate.getTime() - a._vencimentoDate.getTime())
        .map(({ _vencimentoDate, ...resto }) => resto);

        const resultado = {
            totalLancamentos: contasDeInternet.length,
            valorTotal: valorTotal,
            lancamentos: lancamentosOrdenados,
        };
        
        return NextResponse.json(resultado);

    } catch (error) {
        console.error("Erro no endpoint da API:", error);

        // --- INÍCIO DA TRATATIVA DE ERRO ---
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";

        // Verifica se o erro foi de timeout ou outro problema de conexão com a Omie
        if (errorMessage.includes('Timeout') || errorMessage.toLowerCase().includes('fetch failed')) {
            return NextResponse.json(
                { 
                  title: "Problema no servidor da Omie",
                  message: "Não foi possível carregar os dados no momento. Por favor, tente novamente em alguns instantes." 
                }, 
                { status: 503 } // 503 Service Unavailable
            );
        }

        // Para outros erros da Omie, repassa a mensagem
        if (error instanceof Error) {
            return NextResponse.json(
                {
                    title: "Erro retornado pela Omie",
                    message: error.message
                },
                { status: 400 } // 400 Bad Request
            )
        }

        // Para qualquer outro tipo de erro, retorna uma mensagem genérica
        return NextResponse.json(
            { 
              title: "Erro Interno no Servidor",
              message: "Ocorreu um erro inesperado ao processar sua solicitação." 
            }, 
            { status: 500 }
        );
        // --- FIM DA TRATATIVA DE ERRO ---
    }
}