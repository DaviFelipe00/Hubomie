"use client";

import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement, // Elemento para gráficos de pizza/rosca
  Tooltip,
  Legend,
  Title,
} from 'chart.js';

// Registra os componentes necessários do Chart.js para o gráfico de Pizza
ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend
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
                // Um gráfico de pizza precisa de uma cor para cada fatia
                backgroundColor: [
                    'rgba(167, 139, 250, 0.8)', // Roxo
                    'rgba(59, 130, 246, 0.8)',  // Azul
                    'rgba(16, 185, 129, 0.8)', // Verde
                    'rgba(239, 68, 68, 0.8)',   // Vermelho
                    'rgba(245, 158, 11, 0.8)',  // Ambar
                    'rgba(99, 102, 241, 0.8)',  // Indigo
                ],
                borderColor: '#1f2937', // Cor de fundo do card (slate-800)
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
                    color: '#a7a3b3',
                    boxWidth: 20,
                    padding: 20,
                }
            },
            title: {
                display: true,
                text: 'Distribuição de Despesas por Fornecedor',
                color: '#e2e8f0', // slate-200
                font: {
                    size: 18,
                    weight: 'bold' as 'bold',
                }
            },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#e2e8f0',
                bodyColor: '#cbd5e1',
                padding: 10,
                cornerRadius: 4,
            }
        },
        // Gráficos de pizza não usam escalas (scales)
    };

    return (
        <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg ring-1 ring-white/10" style={{ position: 'relative', height: '400px' }}>
            <Pie options={options} data={data} />
        </div>
    );
}