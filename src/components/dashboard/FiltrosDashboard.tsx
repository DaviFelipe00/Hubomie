"use client";

import { Calendar as CalendarIcon, Search } from 'lucide-react';

type Periodo = 'este-mes' | 'mes-passado' | 'este-ano' | null;

interface FiltrosProps {
  dataInicio: string;
  setDataInicio: (value: string) => void;
  dataFim: string;
  setDataFim: (value: string) => void;
  activePreset: Periodo;
  handlePresetClick: (periodo: Periodo) => void;
  handleFiltrarClick: () => void;
  isLoading: boolean;
}

export function FiltrosDashboard({
  dataInicio,
  setDataInicio,
  dataFim,
  setDataFim,
  activePreset,
  handlePresetClick,
  handleFiltrarClick,
  isLoading,
}: FiltrosProps) {
  return (
    <div className="bg-slate-800/50 p-4 rounded-xl shadow-lg mb-8 flex flex-col gap-4 ring-1 ring-white/10">
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
            <input type="date" id="dataInicio" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="pl-10 p-2 bg-slate-700 border border-slate-600 rounded-md w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-200" style={{ colorScheme: 'dark' }} />
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <label htmlFor="dataFim" className="block text-sm font-medium text-slate-400 mb-1 invisible">Data Fim</label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input type="date" id="dataFim" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="pl-10 p-2 bg-slate-700 border border-slate-600 rounded-md w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-200" style={{ colorScheme: 'dark' }} />
          </div>
        </div>
        <button onClick={handleFiltrarClick} disabled={isLoading} className="w-full sm:w-auto mt-auto bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-500 flex items-center justify-center gap-2 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed">
          <Search className="h-5 w-5" />
          {isLoading ? "Buscando..." : "Filtrar"}
        </button>
      </div>
    </div>
  );
}