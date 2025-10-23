// src/hooks/useAuth.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const AUTH_KEY = 'isAuthenticated';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Roda apenas no cliente. Verifica o estado inicial de login.
    const authStatus = localStorage.getItem(AUTH_KEY) === 'true';
    setIsAuthenticated(authStatus);
    setIsReady(true);
  }, []);

  // 🚨 FUNÇÃO DE LOGIN ATUALIZADA PARA CHAMAR A API DE VERDADE
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        // Autenticação bem-sucedida via API
        localStorage.setItem(AUTH_KEY, 'true');
        setIsAuthenticated(true);
        router.push('/dashboard');
        return true;
      } else {
        // Falha de autenticação (401) ou erro de cliente (400)
        return false;
      }
    } catch (error) {
      console.error('Falha na requisição de login (rede/servidor):', error);
      // Retorna false em caso de falha de rede/servidor
      return false;
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    router.push('/');
  }, [router]);
  
  const requireAuth = useCallback(() => {
    if (isReady && !isAuthenticated) {
        // Redireciona para a página de login se não estiver autenticado.
        router.replace('/');
    }
  }, [isReady, isAuthenticated, router]);

  return { isAuthenticated, isReady, login, logout, requireAuth };
}