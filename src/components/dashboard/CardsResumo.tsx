"use client";
import { ListChecks, Wallet, BarChart2 } from 'lucide-react';

interface CardProps {
  dados: {
    totalLancamentos: number;
    valorTotal: number;
  }
}

export function CardsResumo({ dados }: CardProps) {
  const valorMedio = dados.totalLancamentos > 0 ? dados.valorTotal / dados.totalLancamentos : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <p className="text-3xl font-bold text-white">{valorMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
      </div>
    </div>
  );
}