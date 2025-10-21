"use client";

import { useState, useEffect, useMemo } from "react";
import { AlertTriangle } from 'lucide-react';
import { GraficoDespesas } from "@/components/dashboard/GraficoDespesas";
import { FiltrosDashboard } from "@/components/dashboard/FiltrosDashboard";
import { CardsResumo } from "@/components/dashboard/CardsResumo";
import { TabelaLancamentos } from "@/components/dashboard/TabelaLancamentos";
import { ResumoPorFornecedor } from "@/components/dashboard/ResumoPorFornecedor";

// --- Tipagens ---
const toInputDate = (date: Date): string => date.toISOString().split('T')[0];
const toApiDate = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};
type Periodo = 'este-mes' | 'mes-passado' | 'este-ano' | null;

// Interface esperada da resposta da API
interface DadosDashboard {
  totalLancamentos: number;
  valorTotal: number;
  lancamentos: { fornecedor: string; valor: number; vencimento: string; }[];
}
interface Fornecedor { id: number; nome: string; }

export default function DashboardPage() {
  const [dados, setDados] = useState<DadosDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [activePreset, setActivePreset] = useState<Periodo>('este-mes');
  const [periodoExibido, setPeriodoExibido] = useState({ inicio: '', fim: '' });

  const [listaFornecedores, setListaFornecedores] = useState<Fornecedor[]>([]);
  const [fornecedoresSelecionados, setFornecedoresSelecionados] = useState<number[]>([]);

  // Busca a lista de fornecedores (sem alterações)
  useEffect(() => {
    const fetchFornecedores = async () => {
      try {
        const response = await fetch('/api/fornecedores');
        if (!response.ok) throw new Error('Falha ao buscar fornecedores.');
        const data = await response.json();
        setListaFornecedores(data);
      } catch (err) {
        console.error("Erro ao buscar fornecedores:", err);
      }
    };
    fetchFornecedores();
  }, []);

  // Função para buscar dados da API /api/omie
  const fetchData = async (inicio: string, fim: string, fornecedoresIds: number[]) => {
    // Adiciona log para verificar os parâmetros
    console.log(`Buscando dados de ${toApiDate(inicio)} a ${toApiDate(fim)} para fornecedores: ${fornecedoresIds.join(',') || 'todos'}`);
    try {
      setIsLoading(true);
      setError(null);
      setDados(null); // Limpa dados antigos antes de buscar novos

      const params = new URLSearchParams({ de: toApiDate(inicio), ate: toApiDate(fim) });
      if (fornecedoresIds.length > 0) {
        params.append('fornecedores', fornecedoresIds.join(','));
      }

      const url = `/api/omie?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Erro ${response.status} ao buscar dados.` })); // Trata erro caso a resposta não seja JSON
        console.error("Erro da API:", errorData);
        throw new Error(errorData.message || 'Falha ao buscar dados do servidor.');
      }
      const data: DadosDashboard = await response.json();

      // --- LOG PARA VERIFICAR OS DADOS RECEBIDOS ---
      console.log("Dados recebidos da API:", data);

      // Validação básica da estrutura recebida
      if (typeof data.totalLancamentos !== 'number' || typeof data.valorTotal !== 'number' || !Array.isArray(data.lancamentos)) {
          console.error("Estrutura de dados inesperada recebida da API:", data);
          throw new Error("Formato de dados inválido recebido do servidor.");
      }

      setDados(data);
      setPeriodoExibido({ inicio, fim });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido";
      console.error("Erro ao buscar dados do dashboard:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Lógica dos presets (sem alterações)
  const handlePresetClick = (periodo: Periodo) => {
    const hoje = new Date();
    let inicio = new Date(), fim = hoje;
    if (periodo === 'este-mes') inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    else if (periodo === 'mes-passado') {
      inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    }
    else if (periodo === 'este-ano') inicio = new Date(hoje.getFullYear(), 0, 1);

    const inicioStr = toInputDate(inicio);
    const fimStr = toInputDate(fim);
    setDataInicio(inicioStr);
    setDataFim(fimStr);
    setActivePreset(periodo);
    fetchData(inicioStr, fimStr, fornecedoresSelecionados);
  };

  // Efeito inicial para carregar 'este-mes' (sem alterações)
  useEffect(() => {
    handlePresetClick('este-mes');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependência vazia para rodar só na montagem

  // Lógica do botão filtrar (sem alterações)
  const handleFiltrarClick = () => {
    setActivePreset(null); // Limpa o preset ativo ao usar datas manuais
    fetchData(dataInicio, dataFim, fornecedoresSelecionados);
  };

  // Cálculo dos gastos por fornecedor (adicionado log)
  const gastosPorFornecedor = useMemo(() => {
    // Verifica se 'dados' e 'dados.lancamentos' existem e se 'lancamentos' é um array
    if (!dados || !Array.isArray(dados.lancamentos)) {
        console.log("Calculando gastosPorFornecedor: dados ou lancamentos inválidos.");
        return [];
    }
    console.log("Calculando gastosPorFornecedor com:", dados.lancamentos);
    const gastos = dados.lancamentos.reduce((acc, lanc) => {
      // Adiciona verificação se 'lanc' e suas propriedades existem
      if (lanc && lanc.fornecedor && typeof lanc.valor === 'number') {
        acc[lanc.fornecedor] = (acc[lanc.fornecedor] || 0) + lanc.valor;
      } else {
        console.warn("Item de lançamento inválido encontrado:", lanc);
      }
      return acc;
    }, {} as Record<string, number>);

    const resultado = Object.entries(gastos)
                           .map(([nome, valor]) => ({ nome, valor }))
                           .sort((a, b) => b.valor - a.valor);
    console.log("Resultado gastosPorFornecedor:", resultado);
    return resultado;
  }, [dados]); // Depende apenas de 'dados'

  // Preparação dos dados para o gráfico (adicionado log)
  const dadosParaGrafico = useMemo(() => {
      const labels = gastosPorFornecedor.map(item => item.nome);
      const valores = gastosPorFornecedor.map(item => item.valor);
      console.log("Preparando dadosParaGrafico:", { labels, valores });
      return { labels, valores };
  }, [gastosPorFornecedor]); // Depende do resultado do useMemo anterior

  // Renderização do Loading inicial
  if (isLoading && !dados && !error) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-slate-900">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-slate-700 h-12 w-12 mb-4 animate-spin border-t-purple-500"></div>
        <p className="text-xl text-slate-400">A carregar dados da Omie...</p>
      </main>
    );
  }

  // Renderização de Erro
  if (error && !isLoading) { // Mostra erro apenas se não estiver carregando
    return (
      <main className="p-4 sm:p-8 bg-slate-900 min-h-screen font-sans text-slate-300">
         <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Gestão de Contratos</h1>
            <p className="text-slate-400 mt-1">Análise de despesas com fornecedores de internet.</p>
         </header>
         <FiltrosDashboard /* Passa as props mesmo com erro para permitir nova busca */
            dataInicio={dataInicio} setDataInicio={(v) => { setDataInicio(v); setActivePreset(null); }}
            dataFim={dataFim} setDataFim={(v) => { setDataFim(v); setActivePreset(null); }}
            activePreset={activePreset}
            handlePresetClick={handlePresetClick}
            handleFiltrarClick={handleFiltrarClick}
            isLoading={isLoading} // Pode ainda estar carregando se o erro foi nos fornecedores
            fornecedores={listaFornecedores}
            fornecedoresSelecionados={fornecedoresSelecionados}
            setFornecedoresSelecionados={setFornecedoresSelecionados}
         />
        <div className="bg-slate-800 p-8 rounded-xl shadow-lg text-center flex flex-col items-center ring-1 ring-red-500/30 mt-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-white">Ocorreu um Erro</h3>
            <p className="text-slate-400 mt-2 max-w-md">{error}</p>
             <button
               onClick={() => fetchData(dataInicio, dataFim, fornecedoresSelecionados)} // Botão para tentar novamente
               className="mt-4 bg-purple-600 text-white font-bold py-2 px-4 rounded hover:bg-purple-700 transition-colors"
             >
               Tentar Novamente
             </button>
        </div>
      </main>
    );
  }

  // Renderização Principal
  return (
    <main className="p-4 sm:p-8 bg-slate-900 min-h-screen font-sans text-slate-300">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Gestão de Contratos</h1>
        <p className="text-slate-400 mt-1">Análise de despesas com fornecedores de internet.</p>
      </header>

      <FiltrosDashboard
        dataInicio={dataInicio} setDataInicio={(v) => { setDataInicio(v); setActivePreset(null); }}
        dataFim={dataFim} setDataFim={(v) => { setDataFim(v); setActivePreset(null); }}
        activePreset={activePreset}
        handlePresetClick={handlePresetClick}
        handleFiltrarClick={handleFiltrarClick}
        isLoading={isLoading} // Passa o estado de loading para o botão
        fornecedores={listaFornecedores}
        fornecedoresSelecionados={fornecedoresSelecionados}
        setFornecedoresSelecionados={setFornecedoresSelecionados}
      />

      {/* Exibe o período apenas se houver dados ou não estiver carregando */}
      {!isLoading && periodoExibido.inicio && periodoExibido.fim && (
        <div className="mb-8 text-center sm:text-left">
          <p className="text-sm text-slate-500">
              A exibir resultados para o período de <span className="font-semibold text-slate-400">{toApiDate(periodoExibido.inicio)}</span> a <span className="font-semibold text-slate-400">{toApiDate(periodoExibido.fim)}</span>
          </p>
        </div>
      )}

      {/* Condição para exibir dados OU mensagem de "nenhum lançamento" OU loading */}
      {isLoading ? (
          <div className="flex flex-col items-center justify-center mt-10">
              <div className="loader ease-linear rounded-full border-4 border-t-4 border-slate-700 h-12 w-12 mb-4 animate-spin border-t-purple-500"></div>
              <p className="text-xl text-slate-400">A carregar...</p>
          </div>
      ) : dados && dados.totalLancamentos > 0 ? (
        <div className="space-y-8">
          {/* Garante que 'dados' não é null antes de passar para CardsResumo */}
          <CardsResumo dados={dados} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GraficoDespesas dadosDoGrafico={dadosParaGrafico} />
            <ResumoPorFornecedor gastosPorFornecedor={gastosPorFornecedor} />
          </div>
          {/* Garante que 'dados.lancamentos' existe antes de passar para TabelaLancamentos */}
          <TabelaLancamentos lancamentos={dados.lancamentos} />
        </div>
      ) : (
        // Mostra "Nenhum lançamento" apenas se não estiver carregando e não houver erro
        !error && (
            <div className="bg-slate-800 p-8 rounded-xl shadow-lg text-center flex flex-col items-center ring-1 ring-white/10 mt-8">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
                <h3 className="text-xl font-semibold text-white">Nenhum Lançamento Encontrado</h3>
                <p className="text-slate-400 mt-2 max-w-md">
                    Tente ajustar o período ou os fornecedores no filtro.
                </p>
            </div>
        )
      )}
    </main>
  );
}