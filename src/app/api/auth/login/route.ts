// src/app/api/auth/login/route.ts

import { NextResponse } from 'next/server';

// 🚨 ATENÇÃO: EM PRODUÇÃO, USE VARIÁVEIS DE AMBIENTE E HASH DE SENHA!
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'Rioave@2025'; 

export async function POST(request: Request) {
    let username, password;
    try {
        const body = await request.json();
        username = body.username;
        password = body.password;
    } catch (e) {
        console.error('Falha ao processar JSON no /api/auth/login:', e);
        return NextResponse.json({ message: 'Requisição inválida (corpo não é JSON).' }, { status: 400 });
    }

    // --- INÍCIO DO DIAGNÓSTICO ---
    // Isto irá aparecer no seu console/terminal onde o servidor Next.js está rodando.
    console.log(`[LOGIN ATTEMPT] Received username: ${username}, Password length: ${password ? password.length : '0'}`);
    console.log(`[LOGIN ATTEMPT] Comparing U: ${username === VALID_USERNAME} | P: ${password === VALID_PASSWORD}`);
    // --- FIM DO DIAGNÓSTICO ---
    
    // 1. Validar se os campos foram preenchidos
    if (!username || !password) {
        console.log('[LOGIN ATTEMPT] Failed: Missing credentials.');
        return NextResponse.json({ success: false, message: 'Credenciais ausentes.' }, { status: 400 });
    }

    // 2. Tentar autenticar o usuário
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
        console.log('[LOGIN ATTEMPT] SUCCESS for user:', username);
        
        // Autenticação bem-sucedida
        return NextResponse.json({ success: true, user: username }, { status: 200 });

    } else {
        console.log(`[LOGIN ATTEMPT] FAILED for user: ${username}. Expected U: ${VALID_USERNAME}, Received U: ${username} | Expected P: ${VALID_PASSWORD}, Received P: ${password}`);

        // Falha na autenticação
        return NextResponse.json({ success: false, message: 'Usuário ou senha inválidos.' }, { status: 401 });
    }
}