"use client";

import { Search, ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

type Periodo = 'este-mes' | 'mes-passado' | 'este-ano' | null;

interface Fornecedor {
  id: number;
  nome: string;
}

interface FiltrosProps {
  dataInicio: string;
  setDataInicio: (value: string) => void;
  dataFim: string;
  setDataFim: (value: string) => void;
  activePreset: Periodo;
  handlePresetClick: (periodo: Periodo) => void;
  handleFiltrarClick: () => void;
  isLoading: boolean;
  fornecedores: Fornecedor[];
  fornecedoresSelecionados: number[];
  setFornecedoresSelecionados: (ids: number[]) => void;
}

// O componente interno FiltroFornecedores não precisa de alterações
function FiltroFornecedores({ fornecedores, selecionados, setSelecionados }: { fornecedores: Fornecedor[], selecionados: number[], setSelecionados: (ids: number[]) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref]);

  const toggleSelecao = (id: number) => {
    if (selecionados.includes(id)) {
      setSelecionados(selecionados.filter(item => item !== id));
    } else {
      setSelecionados([...selecionados, id]);
    }
  };

  const textoBotao = selecionados.length === 0
    ? "Todos Fornecedores"
    : selecionados.length === 1
    ? `${fornecedores.find(f => f.id === selecionados[0])?.nome}`
    : `${selecionados.length} fornecedores selecionados`;


  return (
    <div className="relative w-full md:w-auto md:min-w-[250px]" ref={ref}>
      <label htmlFor="fornecedores" className="block text-sm font-medium text-slate-400 mb-1">Fornecedores:</label>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2.5 flex items-center justify-between text-slate-200 text-left">
        <span className="truncate pr-2">{textoBotao}</span>
        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 top-full mt-2 w-full bg-slate-800 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {fornecedores.map(fornecedor => (
            <div key={fornecedor.id} onClick={() => toggleSelecao(fornecedor.id)} className="flex items-center p-2 hover:bg-slate-700 cursor-pointer text-slate-200">
              <div className={`w-4 h-4 mr-3 flex-shrink-0 flex items-center justify-center border rounded ${selecionados.includes(fornecedor.id) ? 'bg-purple-600 border-purple-600' : 'border-slate-500'}`}>
                {selecionados.includes(fornecedor.id) && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="truncate">{fornecedor.nome}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


export function FiltrosDashboard({
  dataInicio, setDataInicio, dataFim, setDataFim,
  activePreset, handlePresetClick, handleFiltrarClick, isLoading,
  fornecedores, fornecedoresSelecionados, setFornecedoresSelecionados,
}: FiltrosProps) {
  return (
    <div className="bg-slate-800/50 p-4 rounded-xl shadow-lg mb-8 flex flex-col gap-4 ring-1 ring-white/10">

      <div>
        <span className="block text-sm font-medium text-slate-400 mb-2">Períodos:</span>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button onClick={() => handlePresetClick('este-mes')} className={`px-3 py-1 text-sm rounded-full transition-colors flex-shrink-0 ${activePreset === 'este-mes' ? 'bg-purple-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>Este Mês</button>
            <button onClick={() => handlePresetClick('mes-passado')} className={`px-3 py-1 text-sm rounded-full transition-colors flex-shrink-0 ${activePreset === 'mes-passado' ? 'bg-purple-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>Mês Passado</button>
            <button onClick={() => handlePresetClick('este-ano')} className={`px-3 py-1 text-sm rounded-full transition-colors flex-shrink-0 ${activePreset === 'este-ano' ? 'bg-purple-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>Este Ano</button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-4 pt-4 border-t border-slate-700">

        {/* --- ALTERAÇÃO AQUI: de "flex-col sm:flex-row" para "flex-row" --- */}
        <div className="w-full flex flex-row gap-4">
          <div className="flex-1 min-w-0">
            <label htmlFor="dataInicio" className="block text-sm font-medium text-slate-400 mb-1">Data de Início:</label>
            <input type="date" id="dataInicio" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="p-2.5 bg-slate-700 border border-slate-600 rounded-md w-full focus:ring-2 focus:ring-purple-500 text-slate-200" style={{ colorScheme: 'dark' }} />
          </div>
          <div className="flex-1 min-w-0">
            <label htmlFor="dataFim" className="block text-sm font-medium text-slate-400 mb-1">Data Final:</label>
            <input type="date" id="dataFim" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="p-2.5 bg-slate-700 border border-slate-600 rounded-md w-full focus:ring-2 focus:ring-purple-500 text-slate-200" style={{ colorScheme: 'dark' }} />
          </div>
        </div>

        <FiltroFornecedores
          fornecedores={fornecedores}
          selecionados={fornecedoresSelecionados}
          setSelecionados={setFornecedoresSelecionados}
        />

        <button onClick={handleFiltrarClick} disabled={isLoading} className="w-full md:w-auto bg-purple-600 text-white font-bold py-2.5 px-6 rounded-md hover:bg-purple-700 flex items-center justify-center gap-2 transition-colors disabled:bg-purple-800 disabled:cursor-not-allowed">
          <Search className="h-5 w-5" />
          {isLoading ? "Buscando..." : "Filtrar"}
        </button>
      </div>
    </div>
  );
}