"use client";

import { useState, useEffect } from "react";
import { ListChecks, Wallet, BarChart2, Calendar as CalendarIcon, Search, AlertTriangle } from 'lucide-react';

// --- Funções Auxiliares para Datas ---
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

// --- Tipagem dos Dados do Dashboard ---
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
      if (!response.ok) {
        throw new Error('Falha ao buscar dados do servidor.');
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

      <div className="bg-slate-800/50 p-4 rounded-xl shadow-lg mb-4 flex flex-col gap-4 ring-1 ring-white/10">
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-400 mr-2">Períodos Rápidos:</span>
            <button onClick={() => handlePresetClick('este-mes')} className={`px-3 py-1 text-sm rounded-full transition-colors ${activePreset === 'este-mes' ? 'bg-purple-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>Este Mês</button>
            <button onClick={() => handlePresetClick('mes-passado')} className={`px-3 py-1 text-sm rounded-full transition-colors ${activePreset === 'mes-passado' ? 'bg-purple-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>Mês Passado</button>
            <button onClick={() => handlePresetClick('este-ano')} className={`px-3 py-1 text-sm rounded-full transition-colors ${activePreset === 'este-ano' ? 'bg-purple-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>Este Ano</button>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-slate-700">
            <div className="w-full sm:w-auto">
                <label htmlFor="dataInicio" className="block text-sm font-medium text-slate-400 mb-1">Ou selecione um período:</label>
                <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input type="date" id="dataInicio" value={dataInicio} onChange={(e) => { setDataInicio(e.target.value); setActivePreset(null); }} className="pl-10 p-2 bg-slate-700 border border-slate-600 rounded-md w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-200" style={{ colorScheme: 'dark' }} />
                </div>
            </div>
            <div className="w-full sm:w-auto">
                <label htmlFor="dataFim" className="block text-sm font-medium text-slate-400 mb-1 invisible">Data Fim</label>
                <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input type="date" id="dataFim" value={dataFim} onChange={(e) => { setDataFim(e.target.value); setActivePreset(null); }} className="pl-10 p-2 bg-slate-700 border border-slate-600 rounded-md w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-200" style={{ colorScheme: 'dark' }} />
                </div>
            </div>
            <button onClick={handleFiltrarClick} className="w-full sm:w-auto mt-auto bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-500 flex items-center justify-center gap-2 transition-colors">
                <Search className="h-5 w-5" />
                Filtrar
            </button>
        </div>
      </div>

      <div className="mb-8 text-center sm:text-left">
        <p className="text-sm text-slate-500">
            Exibindo resultados para o período de <span className="font-semibold text-slate-400">{toBrazilianFormat(periodoExibido.inicio)}</span> até <span className="font-semibold text-slate-400">{toBrazilianFormat(periodoExibido.fim)}</span>
        </p>
      </div>
      
      {dados && dados.totalLancamentos > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg flex items-center space-x-4 ring-1 ring-white/10">
                <div className="bg-blue-900/50 p-3 rounded-full"><ListChecks className="h-6 w-6 text-blue-400" /></div>
                <div>
                    <h2 className="text-slate-400 font-medium">Total de Lançamentos</h2>
                    <p className="text-3xl font-bold text-white">{dados.totalLancamentos}</p>
                </div>
            </div>
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg flex items-center space-x-4 ring-1 ring-white/10">
                <div className="bg-green-900/50 p-3 rounded-full"><Wallet className="h-6 w-6 text-green-400" /></div>
                <div>
                    <h2 className="text-slate-400 font-medium">Valor Total no Período</h2>
                    <p className="text-3xl font-bold text-green-400">{dados.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
            </div>
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg flex items-center space-x-4 ring-1 ring-white/10">
                <div className="bg-purple-900/50 p-3 rounded-full"><BarChart2 className="h-6 w-6 text-purple-400" /></div>
                <div>
                    <h2 className="text-slate-400 font-medium">Valor Médio por Lançamento</h2>
                    <p className="text-3xl font-bold text-white">{(dados.totalLancamentos > 0 ? dados.valorTotal / dados.totalLancamentos : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
            </div>
          </div>
          <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg overflow-x-auto ring-1 ring-white/10">
            <h2 className="text-xl font-bold mb-4 text-white">Lançamentos</h2>
            <div className="min-w-full">
                <table className="w-full text-left">
                    <thead>
                        <tr>
                            <th className="py-3 px-4 text-xs uppercase tracking-wider font-bold text-slate-400">Fornecedor</th>
                            <th className="py-3 px-4 text-xs uppercase tracking-wider font-bold text-slate-400">Vencimento</th>
                            <th className="py-3 px-4 text-xs uppercase tracking-wider font-bold text-slate-400 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {dados.lancamentos.map((lanc, index) => (
                        <tr key={index} className="hover:bg-slate-700/50">
                            <td className="py-4 px-4 font-medium text-slate-200">{lanc.fornecedor}</td>
                            <td className="py-4 px-4 text-slate-400">{lanc.vencimento}</td>
                            <td className="py-4 px-4 text-slate-200 font-semibold text-right">{lanc.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        </>
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