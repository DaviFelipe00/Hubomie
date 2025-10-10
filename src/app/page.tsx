"use client";

import { useState, useEffect, useMemo } from "react";
import { AlertTriangle } from 'lucide-react';
import { GraficoDespesas } from "@/components/dashboard/GraficoDespesas";
import { FiltrosDashboard } from "@/components/dashboard/FiltrosDashboard";
import { CardsResumo } from "@/components/dashboard/CardsResumo";
import { TabelaLancamentos } from "@/components/dashboard/TabelaLancamentos";

// --- Tipagens ---
const toInputDate = (date: Date): string => date.toISOString().split('T')[0];
const toApiDate = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};
const toBrazilianFormat = (dateString: string): string => {
    if (!dateString) return '...';
    return toApiDate(dateString);
}
type Periodo = 'este-mes' | 'mes-passado' | 'este-ano' | null;
interface DadosDashboard {
  totalLancamentos: number;
  valorTotal: number;
  lancamentos: {
    fornecedor: string;
    valor: number;
    vencimento: string;
  }[];
}

export default function DashboardPage() {
  const [dados, setDados] = useState<DadosDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [activePreset, setActivePreset] = useState<Periodo>('este-mes');
  const [periodoExibido, setPeriodoExibido] = useState({ inicio: '', fim: '' });

  const fetchData = async (inicio: string, fim: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({ de: toApiDate(inicio), ate: toApiDate(fim) });
      const url = `/api/omie?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) { throw new Error('Falha ao buscar dados do servidor.'); }
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
    let inicio = new Date(), fim = new Date();
    switch (periodo) {
      case 'este-mes':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        fim = hoje;
        break;
      case 'mes-passado':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        break;
      case 'este-ano':
        inicio = new Date(hoje.getFullYear(), 0, 1);
        fim = hoje;
        break;
      default: return;
    }
    const inicioStr = toInputDate(inicio);
    const fimStr = toInputDate(fim);
    setDataInicio(inicioStr);
    setDataFim(fimStr);
    setActivePreset(periodo);
    fetchData(inicioStr, fimStr);
  };
  
  useEffect(() => {
    handlePresetClick('este-mes');
  }, []);

  const handleFiltrarClick = () => {
    setActivePreset(null);
    fetchData(dataInicio, dataFim);
  };
  
  const dadosParaGrafico = useMemo(() => {
    if (!dados || !dados.lancamentos) return { labels: [], valores: [] };
    const gastos = dados.lancamentos.reduce((acc, l) => {
      acc[l.fornecedor] = (acc[l.fornecedor] || 0) + l.valor;
      return acc;
    }, {} as Record<string, number>);
    const sorted = Object.entries(gastos).sort(([, a], [, b]) => b - a);
    return { labels: sorted.map(([n]) => n), valores: sorted.map(([, v]) => v) };
  }, [dados]);

  if (isLoading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-slate-900">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-slate-700 h-12 w-12 mb-4 animate-spin border-t-purple-500"></div>
        <p className="text-xl text-slate-400">Carregando dados da Omie...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-slate-900 text-red-400">
        <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-2">Ocorreu um Erro</h2>
            <p>{error}</p>
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
        dataInicio={dataInicio}
        setDataInicio={(val) => { setDataInicio(val); setActivePreset(null); }}
        dataFim={dataFim}
        setDataFim={(val) => { setDataFim(val); setActivePreset(null); }}
        activePreset={activePreset}
        handlePresetClick={handlePresetClick}
        handleFiltrarClick={handleFiltrarClick}
        isLoading={isLoading}
      />
      
      <div className="mb-8 text-center sm:text-left">
        <p className="text-sm text-slate-500">
            Exibindo resultados para o período de <span className="font-semibold text-slate-400">{toBrazilianFormat(periodoExibido.inicio)}</span> até <span className="font-semibold text-slate-400">{toBrazilianFormat(periodoExibido.fim)}</span>
        </p>
      </div>
      
      {dados && dados.totalLancamentos > 0 ? (
        <div className="space-y-8">
          <CardsResumo dados={dados} />
          <GraficoDespesas dadosDoGrafico={dadosParaGrafico} />
          <TabelaLancamentos lancamentos={dados.lancamentos} />
        </div>
      ) : (
        <div className="bg-slate-800 p-8 rounded-xl shadow-lg text-center flex flex-col items-center ring-1 ring-white/10">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-xl font-semibold text-white">Nenhum Lançamento Encontrado</h3>
            <p className="text-slate-400 mt-2 max-w-md">
                Tente ajustar o período no filtro ou verifique se existem dados na Omie para as datas e fornecedores selecionados.
            </p>
        </div>
      )}
    </main>
  );
}