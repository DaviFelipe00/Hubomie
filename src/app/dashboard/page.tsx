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

  // --- NOVOS ESTADOS PARA O FILTRO DE FORNECEDOR ---
  const [listaFornecedores, setListaFornecedores] = useState<Fornecedor[]>([]);
  const [fornecedoresSelecionados, setFornecedoresSelecionados] = useState<number[]>([]);

  // Busca a lista de fornecedores quando o componente monta
  useEffect(() => {
    const fetchFornecedores = async () => {
      try {
        const response = await fetch('/api/fornecedores');
        if (!response.ok) throw new Error('Falha ao buscar fornecedores.');
        const data = await response.json();
        setListaFornecedores(data);
      } catch (err) {
        // Não define um erro principal, apenas regista no console
        console.error(err);
      }
    };
    fetchFornecedores();
  }, []);

  const fetchData = async (inicio: string, fim: string, fornecedoresIds: number[]) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({ de: toApiDate(inicio), ate: toApiDate(fim) });
      // Adiciona os IDs dos fornecedores à URL da API se houver algum selecionado
      if (fornecedoresIds.length > 0) {
        params.append('fornecedores', fornecedoresIds.join(','));
      }

      const url = `/api/omie?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao buscar dados do servidor.');
      }
      const data = await response.json();
      setDados(data);
      setPeriodoExibido({ inicio, fim });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro");
    } finally {
      setIsLoading(false);
    }
  };

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
    // Dispara a busca com os fornecedores atualmente selecionados
    fetchData(inicioStr, fimStr, fornecedoresSelecionados);
  };

  useEffect(() => {
    handlePresetClick('este-mes');
  }, []);

  const handleFiltrarClick = () => {
    setActivePreset(null);
    fetchData(dataInicio, dataFim, fornecedoresSelecionados);
  };

  const gastosPorFornecedor = useMemo(() => {
    if (!dados?.lancamentos) return [];
    const gastos = dados.lancamentos.reduce((acc, lanc) => {
      acc[lanc.fornecedor] = (acc[lanc.fornecedor] || 0) + lanc.valor;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(gastos).map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor);
  }, [dados]);

  const dadosParaGrafico = {
    labels: gastosPorFornecedor.map(item => item.nome),
    valores: gastosPorFornecedor.map(item => item.valor),
  };

  if (isLoading && !dados) { // Mostra o loading inicial
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-slate-900">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-slate-700 h-12 w-12 mb-4 animate-spin border-t-purple-500"></div>
        <p className="text-xl text-slate-400">A carregar dados da Omie...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="bg-slate-800 p-8 rounded-xl shadow-lg text-center flex flex-col items-center ring-1 ring-red-500/30">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-white">Ocorreu um Erro</h3>
            <p className="text-slate-400 mt-2 max-w-md">{error}</p>
        </div>
      </main>
    );
  }

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
        isLoading={isLoading}
        fornecedores={listaFornecedores}
        fornecedoresSelecionados={fornecedoresSelecionados}
        setFornecedoresSelecionados={setFornecedoresSelecionados}
      />

      <div className="mb-8 text-center sm:text-left">
        <p className="text-sm text-slate-500">
            A exibir resultados para o período de <span className="font-semibold text-slate-400">{toApiDate(periodoExibido.inicio)}</span> a <span className="font-semibold text-slate-400">{toApiDate(periodoExibido.fim)}</span>
        </p>
      </div>

      {dados && dados.totalLancamentos > 0 ? (
        <div className="space-y-8">
          <CardsResumo dados={dados} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GraficoDespesas dadosDoGrafico={dadosParaGrafico} />
            <ResumoPorFornecedor gastosPorFornecedor={gastosPorFornecedor} />
          </div>
          <TabelaLancamentos lancamentos={dados.lancamentos} />
        </div>
      ) : (
        <div className="bg-slate-800 p-8 rounded-xl shadow-lg text-center flex flex-col items-center ring-1 ring-white/10">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-xl font-semibold text-white">Nenhum Lançamento Encontrado</h3>
            <p className="text-slate-400 mt-2 max-w-md">
                Tente ajustar o período ou os fornecedores no filtro.
            </p>
        </div>
      )}
    </main>
  );
}