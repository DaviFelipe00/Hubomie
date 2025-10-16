"use client";

interface Lancamento {
  fornecedor: string;
  valor: number;
  vencimento: string;
}

interface TabelaProps {
  lancamentos: Lancamento[];
}

export function TabelaLancamentos({ lancamentos }: TabelaProps) {
  return (
    <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg overflow-x-auto ring-1 ring-white/10">
      <h2 className="text-xl font-bold mb-4 text-white">Lançamentos no Período</h2>
      <div className="min-w-full">
        <table className="w-full text-left">
          <thead>
            <tr>
              {/* --- FONTES E PADDINGS AJUSTADOS --- */}
              <th className="py-3 px-2 sm:px-4 text-[11px] sm:text-xs uppercase tracking-wider font-bold text-slate-400">Fornecedor</th>
              <th className="py-3 px-2 sm:px-4 text-[11px] sm:text-xs uppercase tracking-wider font-bold text-slate-400">Vencimento</th>
              <th className="py-3 px-2 sm:px-4 text-[11px] sm:text-xs uppercase tracking-wider font-bold text-slate-400 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {lancamentos.map((lanc, index) => (
              <tr key={index} className="hover:bg-slate-700/50">
                {/* --- FONTES E PADDINGS AJUSTADOS --- */}
                <td className="py-4 px-2 sm:px-4 text-sm font-medium text-slate-200">{lanc.fornecedor}</td>
                <td className="py-4 px-2 sm:px-4 text-sm text-slate-400">{lanc.vencimento}</td>
                <td className="py-4 px-2 sm:px-4 text-sm text-slate-200 font-semibold text-right">{lanc.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}