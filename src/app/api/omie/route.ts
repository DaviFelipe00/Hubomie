// src/app/api/omie/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import * as OmieService from '@/lib/omie.service';
import { Cliente, MovimentoFinanceiro } from '@/lib/omie.service'; // Importa a interface correta

export const dynamic = 'force-dynamic';

// Atualiza a lista padrão para incluir Mundivox
const IDS_FORNECEDORES_PADRAO = [
    4807594928, // RIT
    4807594778, // BRFIBRA
    5202017644, // WORLDNET
    4807594893  // MUNDIVOX <<< ADICIONADO AQUI
];

let cachedClientes: { data: Cliente[]; timestamp: number } | null = null;
const CACHE_DURATION_MS = 10 * 60 * 1000;

async function getClientesComCache(): Promise<Cliente[]> {
    // ... (função sem alterações)
    const agora = Date.now();
    if (cachedClientes && (agora - cachedClientes.timestamp) < CACHE_DURATION_MS) { return cachedClientes.data; }
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
            // ... (lógica de data padrão sem alterações)
            const hoje = new Date();
            const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            dataDe = primeiroDiaDoMes.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            dataAte = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }

        // Usa a lista padrão atualizada se nenhum fornecedor for passado na query
        const idsParaFiltrar = fornecedoresQuery
            ? fornecedoresQuery.split(',').map(Number)
            : IDS_FORNECEDORES_PADRAO;

        // Usa a função correta que busca movimentos
        const [todosOsClientes, todosOsMovimentosDaAPI] = await Promise.all([
            getClientesComCache(),
            OmieService.buscarMovimentosPagamentoDoPeriodo(dataDe, dataAte) // Já busca os movimentos filtrados pelo service
        ]);

        const parseDate = (dateStr: string): Date => {
            const [day, month, year] = dateStr.split('/').map(Number);
            return new Date(year, month - 1, day);
        };

        const mapaDeNomes = new Map<number, string>();
        todosOsClientes.forEach(cliente => mapaDeNomes.set(cliente.codigo_cliente_omie, cliente.nome_fantasia));

        const idSet = new Set(idsParaFiltrar);

        // Filtra os movimentos retornados pelo service com base nos IDs selecionados (ou padrão)
        const movimentosFiltrados = todosOsMovimentosDaAPI.filter(mov =>
            idSet.has(mov.codigo_cliente_fornecedor)
        );

        const valorTotal = movimentosFiltrados.reduce((acc, mov) => acc + mov.valor, 0);

        // Mapeia para o formato final
        const lancamentosOrdenados = movimentosFiltrados.map(mov => ({
            fornecedor: mapaDeNomes.get(mov.codigo_cliente_fornecedor) || `ID ${mov.codigo_cliente_fornecedor}`, // Adiciona fallback para nome
            valor: mov.valor,
            vencimento: mov.data_lancamento, // Nome do campo esperado pelo frontend
        })).sort((a, b) => parseDate(b.vencimento).getTime() - parseDate(a.vencimento).getTime());

        // Log final antes de retornar (opcional)
        console.log(`API: Retornando ${lancamentosOrdenados.length} lançamentos após filtro por fornecedores selecionados/padrão.`);

        return NextResponse.json({
            totalLancamentos: lancamentosOrdenados.length, // Usa o tamanho da lista final
            valorTotal,
            lancamentos: lancamentosOrdenados,
        });

    } catch (error) {
        // ... (bloco catch sem alterações)
        console.error("Erro no endpoint da API:", error);
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
        if (errorMessage.includes('Timeout') || errorMessage.toLowerCase().includes('fetch failed')) {
            return NextResponse.json({ title: "Problema no servidor da Omie", message: "Não foi possível carregar os dados no momento." }, { status: 503 });
        }
        return NextResponse.json({ title: "Erro Interno no Servidor", message: "Ocorreu um erro inesperado." }, { status: 500 });
    }
}