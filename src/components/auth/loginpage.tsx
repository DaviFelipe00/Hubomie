// src/components/auth/LoginPage.tsx
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth'; 

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor, preencha o usuário e a senha.');
      return;
    }

    setIsAuthenticating(true);
    
    // Removida a linha de simulação de latência de rede.
    // O await agora é no 'login' de verdade.

    // Tenta fazer o login chamando a API de verdade via hook
    const success = await login(username, password); 

    if (!success) {
      setError('Usuário ou senha inválidos. Tente novamente.');
      setIsAuthenticating(false);
    }
    // Se for sucesso, o hook já redireciona para /dashboard
  };

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4 font-sans text-center overflow-hidden">
        {/* Efeitos de Fundo (mantidos do LoginPage original) */}
        <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-800/40 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>

        <div className="relative z-10 w-full max-w-md p-8 bg-slate-800 rounded-xl shadow-2xl ring-2 ring-purple-500/50">
            
            <div className="flex flex-col items-center gap-2 mb-8">
                <div className="flex items-end justify-center gap-3">
                    <Image
                        src="/logo-rioave.png"
                        alt="Logo Rio Ave"
                        width={120}
                        height={25}
                        priority
                        className="h-auto"
                    />
                    <Image
                        src="/logo-hubplural.png"
                        alt="Logo Hub Plural"
                        width={115}
                        height={25}
                        priority
                        className="h-auto"
                    />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-left text-sm font-medium text-slate-400 mb-1" htmlFor="username">Usuário</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Digite seu usuário"
                        disabled={isAuthenticating}
                    />
                </div>
                <div>
                    <label className="block text-left text-sm font-medium text-slate-400 mb-1" htmlFor="password">Senha</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Digite sua senha"
                        disabled={isAuthenticating}
                    />
                </div>

                {error && (
                    <p className="text-sm text-red-400 bg-red-900/30 p-2 rounded-md">{error}</p>
                )}

                <button
                    type="submit"
                    className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-purple-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:bg-purple-800 disabled:cursor-not-allowed"
                    disabled={isAuthenticating}
                >
                    {isAuthenticating ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Autenticando...
                        </>
                    ) : (
                        <>
                            <LogIn className="h-5 w-5" />
                            Entrar
                        </>
                    )}
                </button>
            </form>
        </div>
    </main>
  );
}