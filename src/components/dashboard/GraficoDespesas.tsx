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
        borderColor: '#1f2937', // Cor de fundo do card
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
          size: 16, // Tamanho do título um pouco menor
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        callbacks: {
          label: function (context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(2);
            return `${label}: ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${percentage}%)`;
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
          if (percentage < 5) return ''; // Esconde rótulos para fatias muito pequenas
          return `${percentage.toFixed(1)}%`;
        },
        textShadowBlur: 4,
        textShadowColor: 'rgba(0,0,0,0.7)',
      },
    },
  };

  return (
    // --- ALTURA RESPONSIVA APLICADA AQUI ---
    // h-[300px] para mobile, h-[450px] para telas sm (small) e maiores
    <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg ring-1 ring-white/10 h-[300px] sm:h-[450px] relative">
      <Pie options={options} data={data} />
    </div>
  );
}