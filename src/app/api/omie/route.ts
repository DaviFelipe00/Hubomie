import { NextResponse, type NextRequest } from 'next/server';
// Importamos as funções do nosso novo serviço e as interfaces que ele exporta
import * as OmieService from '@/lib/omie.service';

export const dynamic = 'force-dynamic';

// A lista de IDs de fornecedores agora é a única configuração que fica na API Route,
// pois ela é específica para a regra de negócio deste endpoint.
const IDS_FORNECEDORES_INTERNET = [5202017644, 4807594778, 4807594928];

// --- O ENDPOINT DA API (AGORA MUITO MAIS LIMPO) ---
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
        
        console.log(`API Route: Endpoint chamado para o período: ${dataDe} a ${dataAte}`);

        // Delega as buscas para o OmieService, executando em sequência para evitar rate limit.
        const todosOsClientes = await OmieService.buscarTodosOsClientes();
        const todasAsContasDaAPI = await OmieService.buscarTodasContasAPagarDoPeriodo(dataDe, dataAte);
        
        // A lógica de processamento e filtragem continua aqui, pois é a
        // responsabilidade da API Route preparar a resposta para o frontend.

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