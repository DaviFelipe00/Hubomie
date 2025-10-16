// src/app/api/omie/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import * as OmieService from '@/lib/omie.service';
import { Cliente } from '@/lib/omie.service';

export const dynamic = 'force-dynamic';

const IDS_FORNECEDORES_PADRAO = [4807594928, 4807594778, 5202017644];

let cachedClientes: { data: Cliente[]; timestamp: number } | null = null;
const CACHE_DURATION_MS = 10 * 60 * 1000;

async function getClientesComCache(): Promise<Cliente[]> {
    const agora = Date.now();
    if (cachedClientes && (agora - cachedClientes.timestamp) < CACHE_DURATION_MS) {
        return cachedClientes.data;
    }
    const novosClientes = await OmieService.buscarTodosOsClientes();
    cachedClientes = { data: novosClientes, timestamp: agora };
    return novosClientes;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        let dataDe = searchParams.get('de');
        let dataAte = searchParams.get('ate');
        let fornecedoresQuery = searchParams.get('fornecedores');

        if (!dataDe || !dataAte) {
            const hoje = new Date();
            const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            dataDe = primeiroDiaDoMes.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            dataAte = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
        
        const idsParaFiltrar = fornecedoresQuery 
            ? fornecedoresQuery.split(',').map(Number)
            : IDS_FORNECEDORES_PADRAO;

        const [todosOsClientes, todasAsContasDaAPI] = await Promise.all([
            getClientesComCache(),
            OmieService.buscarTodasContasAPagarDoPeriodo(dataDe, dataAte)
        ]);
        
        const parseDate = (dateStr: string): Date => {
            const [day, month, year] = dateStr.split('/').map(Number);
            return new Date(year, month - 1, day);
        };

        // --- FILTRO ADICIONAL PARA GARANTIR A DATA DE VENCIMENTO ---
        const dataInicioFiltro = parseDate(dataDe);
        const dataFimFiltro = parseDate(dataAte);

        const contasNoPeriodoDeVencimento = todasAsContasDaAPI.filter(conta => {
            if (!conta.data_vencimento) return false;
            const dataVencimento = parseDate(conta.data_vencimento);
            return dataVencimento >= dataInicioFiltro && dataVencimento <= dataFimFiltro;
        });
        // --- FIM DO FILTRO ADICIONAL ---

        const mapaDeNomes = new Map<number, string>();
        todosOsClientes.forEach(cliente => mapaDeNomes.set(cliente.codigo_cliente_omie, cliente.nome_fantasia));
        
        const idSet = new Set(idsParaFiltrar);
        // Agora filtramos a lista que já foi verificada pela data de vencimento
        const contasFiltradas = contasNoPeriodoDeVencimento.filter(conta => idSet.has(conta.codigo_cliente_fornecedor));
        
        const valorTotal = contasFiltradas.reduce((acc, conta) => acc + conta.valor_documento, 0);
        
        const lancamentosOrdenados = contasFiltradas.map(conta => ({
            fornecedor: mapaDeNomes.get(conta.codigo_cliente_fornecedor) || "Desconhecido",
            valor: conta.valor_documento,
            vencimento: conta.data_vencimento,
        })).sort((a, b) => parseDate(b.vencimento).getTime() - parseDate(a.vencimento).getTime());

        return NextResponse.json({
            totalLancamentos: contasFiltradas.length,
            valorTotal,
            lancamentos: lancamentosOrdenados,
        });

    } catch (error) {
        console.error("Erro no endpoint da API:", error);
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";

        if (errorMessage.includes('Timeout') || errorMessage.toLowerCase().includes('fetch failed')) {
            return NextResponse.json({ title: "Problema no servidor da Omie", message: "Não foi possível carregar os dados no momento." }, { status: 503 });
        }
        return NextResponse.json({ title: "Erro Interno no Servidor", message: "Ocorreu um erro inesperado." }, { status: 500 });
    }
}