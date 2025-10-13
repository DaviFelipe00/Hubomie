"use client";

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4 font-sans text-center">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-800/40 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"></div>
      
      <div className="relative z-10">
        <h1 className="text-6xl md:text-7xl font-bold text-white mb-4">
          <span className="text-blue-400">Rio Ave</span>
          <span className="text-slate-500 mx-2">+</span>
          <span className="text-purple-400">Hub Plural</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto">
          Plataforma de Gestão e Análise de Contratos de TI.
        </p>

        <div className="mt-12">
          <Link 
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-purple-600 rounded-lg shadow-lg transition-all duration-300 hover:bg-purple-700 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500/50"
          >
            Acessar o Dashboard
            <ArrowRight className="h-6 w-6" />
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-8 text-slate-600 text-sm">
        Desenvolvido pela equipe de TI - Rio Ave © {new Date().getFullYear()}
      </footer>
    </main>
  );
}