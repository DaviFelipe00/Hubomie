// src/app/api/fornecedores/route.ts

import { NextResponse } from 'next/server';
import * as OmieService from '@/lib/omie.service';

export const dynamic = 'force-dynamic';

// IDs dos seus fornecedores de TI
const IDS_FORNECEDORES_TI = {
    4807594928: "RIT SOLUCOES EM TECNOLOGIA DA INFORMACAO LTDA",
    4807594778: "BRFIBRA TELECOMUNICACOES LTDA",
    5202017644: "WORLDNET"
};

export async function GET() {
  try {
    // Em vez de buscar todos, criamos a lista diretamente com os fornecedores que queremos
    const listaDeFornecedores = Object.entries(IDS_FORNECEDORES_TI).map(([id, nome]) => ({
      id: Number(id),
      nome: nome,
    }));

    return NextResponse.json(listaDeFornecedores);

  } catch (error) {
    console.error("Erro no endpoint de fornecedores:", error);
    return NextResponse.json(
        { 
          title: "Erro ao montar lista de fornecedores",
          message: "Ocorreu um erro interno."
        }, 
        { status: 500 }
    );
  }
}