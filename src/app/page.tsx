// src/app/page.tsx

"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4 font-sans text-center overflow-hidden">
      
      {/* Efeitos de Fundo */}
      <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-800/40 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
      
      <div className="relative z-10 flex flex-col items-center w-full">
        
        {/* SEÇÃO DAS LOGOS - AGORA ALINHADAS PELA BASE */}
        {/* Trocado 'items-center' por 'md:items-end' para alinhar pela base no desktop */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-4 mb-2 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <Image
            src="/logo-rioave.png"
            alt="Logo Rio Ave"
            width={240} 
            height={50}
            priority
            className="h-auto" // Garante que a proporção seja mantida
          />
          <Image
            src="/logo-hubplural.png"
            alt="Logo Hub Plural"
            width={230} 
            height={50}
            priority
            className="h-auto" // Garante que a proporção seja mantida
          />
        </div>

        {/* TÍTULO */}
        <h1 
          className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mt-2 mb-3 animate-fade-in-up"
          style={{ animationDelay: '400ms' }}
        >
          Gestão Inteligente de Contratos
        </h1>
        
        {/* PARÁGRAFO */}
        <p 
          className="text-base md:text-xl text-slate-400 max-w-2xl mx-auto animate-fade-in-up px-4"
          style={{ animationDelay: '600ms' }}
        >
          Plataforma de Análise de Despesas de TI para a Hub Plural.
        </p>

        {/* BOTÃO */}
        <div 
          className="mt-8 animate-fade-in-up"
          style={{ animationDelay: '800ms' }}
        >
          <Link 
            href="/dashboard"
            className="group inline-flex items-center justify-center gap-2 px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-semibold text-white bg-purple-600 rounded-lg shadow-lg transition-all duration-300 hover:bg-purple-700 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500/50 relative overflow-hidden"
          >
            <span className="absolute top-0 left-0 w-full h-full bg-white opacity-0 transition-opacity duration-300 group-hover:opacity-10 animate-shine"></span>
            Acessar o Dashboard
            <ArrowRight className="h-5 w-5 md:h-6 md:w-6 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      <footer 
        className="absolute bottom-4 text-slate-600 text-sm animate-fade-in w-full px-4"
        style={{ animationDelay: '1000ms' }}
      >
        Desenvolvido pela equipe de TI - Rio Ave © {new Date().getFullYear()}
      </footer>
    </main>
  );
}