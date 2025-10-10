"use client";

import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // Importa o plugin

// Registra os componentes e o plugin necessários do Chart.js
ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels // Registra o plugin de datalabels
);

interface GraficoProps {
    dadosDoGrafico: {
        labels: string[];
        valores: number[];
    }
}

export function GraficoDespesas({ dadosDoGrafico }: GraficoProps) {
    const data = {
        labels: dadosDoGrafico.labels,
        datasets: [
            {
                label: 'Valor Gasto (R$)',
                data: dadosDoGrafico.valores,
                backgroundColor: [
                    'rgba(167, 139, 250, 0.9)', // Roxo 1 (mais opaco)
                    'rgba(59, 130, 246, 0.9)',  // Azul 1
                    'rgba(16, 185, 129, 0.9)', // Verde 1
                    'rgba(239, 68, 68, 0.9)',   // Vermelho 1
                    'rgba(245, 158, 11, 0.9)',  // Ambar 1
                    'rgba(99, 102, 241, 0.9)',  // Indigo 1
                    'rgba(129, 140, 248, 0.9)', // Roxo claro (para mais itens)
                    'rgba(139, 92, 246, 0.9)',  // Roxo mais escuro
                    'rgba(74, 222, 128, 0.9)',  // Verde claro
                    'rgba(251, 191, 36, 0.9)',  // Amarelo
                ],
                borderColor: '#1e293b', // Cor de fundo do card (slate-800)
                borderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const, // Posiciona a legenda na direita
                labels: {
                    color: '#a7a3b3', // Cor do texto da legenda
                    boxWidth: 20,
                    padding: 20,
                    font: {
                        size: 14 // Tamanho da fonte da legenda
                    }
                }
            },
            title: {
                display: true,
                text: 'Distribuição de Despesas por Fornecedor',
                color: '#e2e8f0', // slate-200
                font: {
                    size: 18,
                    weight: 'bold' as 'bold',
                },
                padding: {
                    bottom: 20
                }
            },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#e2e8f0',
                bodyColor: '#cbd5e1',
                padding: 10,
                cornerRadius: 4,
                callbacks: {
                    label: function(context: any) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
                        const percentage = ((value / total) * 100).toFixed(2);
                        return `${label}: ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${percentage}%)`;
                    }
                }
            },
            datalabels: { // Configuração do plugin datalabels
                color: '#fff', // Cor do texto dos labels
                font: {
                    weight: 'bold' as 'bold',
                    size: 14,
                },
                formatter: (value: number, context: any) => {
                    const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
                    const percentage = (value / total) * 100;
                    // Exibe apenas as porcentagens maiores que 5% para evitar sobreposição
                    if (percentage > 5) {
                        return percentage.toFixed(1) + '%';
                    }
                    return ''; // Não mostra label para fatias muito pequenas
                },
                textShadowBlur: 4, // Sombra para melhorar a legibilidade
                textShadowColor: 'rgba(0,0,0,0.6)',
            }
        },
    };

    return (
        <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg ring-1 ring-white/10" style={{ position: 'relative', height: '450px' }}> {/* Aumentado um pouco a altura */}
            <Pie options={options} data={data} />
        </div>
    );
}