"use client";

interface Gastos {
    nome: string;
    valor: number;
}

interface ResumoProps {
  gastosPorFornecedor: Gastos[];
}

export function ResumoPorFornecedor({ gastosPorFornecedor }: ResumoProps) {
  // Calcula o valor total para usar no cálculo da porcentagem
  const valorTotal = gastosPorFornecedor.reduce((acc, item) => acc + item.valor, 0);

  return (
    <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg ring-1 ring-white/10">
      <h2 className="text-xl font-bold mb-4 text-white">Total por Fornecedor</h2>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {gastosPorFornecedor.map((item, index) => {
          const percentage = valorTotal > 0 ? (item.valor / valorTotal) * 100 : 0;
          return (
            <div key={index}>
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium text-slate-200 truncate">{item.nome}</p>
                <p className="text-sm font-semibold text-slate-200">
                  {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}