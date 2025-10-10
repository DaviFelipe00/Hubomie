"use client";

import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface GraficoProps {
  dadosDoGrafico: {
    labels: string[];
    valores: number[];
  };
}

export function GraficoDespesas({ dadosDoGrafico }: GraficoProps) {
  const data = {
    labels: dadosDoGrafico.labels,
    datasets: [
      {
        label: 'Valor Gasto (R$)',
        data: dadosDoGrafico.valores,
        backgroundColor: [
          'rgba(167, 139, 250, 0.9)', // Roxo
          'rgba(59, 130, 246, 0.9)',  // Azul
          'rgba(16, 185, 129, 0.9)',  // Verde
          'rgba(239, 68, 68, 0.9)',   // Vermelho
          'rgba(245, 158, 11, 0.9)',  // Âmbar
          'rgba(99, 102, 241, 0.9)',  // Indigo
        ],
        borderColor: '#1e293b',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Distribuição de Despesas por Fornecedor',
        color: '#e2e8f0',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#e2e8f0',
        bodyColor: '#cbd5e1',
        padding: 10,
        cornerRadius: 4,
        callbacks: {
          label: function (context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(2);
            return `${label}: ${value.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })} (${percentage}%)`;
          },
        },
      },
      datalabels: {
        color: '#FFFFFF',
        font: {
          weight: 'bold' as const,
          size: 14,
        },
        formatter: (value: number, context: any) => {
          const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
          const percentage = (value / total) * 100;

          return `${percentage.toFixed(1)}%`; // SEM O IF — mostra todas as porcentagens
        },
        textShadowBlur: 4,
        textShadowColor: 'rgba(0,0,0,0.7)',
      },
    },
  };

  return (
    <div
      className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg ring-1 ring-white/10"
      style={{ position: 'relative', height: '450px' }}
    >
      <Pie options={options} data={data} />
    </div>
  );
}
