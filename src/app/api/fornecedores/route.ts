// src/app/api/fornecedores/route.ts

import { NextResponse } from 'next/server';
// OmieService não é mais necessário aqui se a lista é fixa
// import * as OmieService from '@/lib/omie.service';

export const dynamic = 'force-dynamic';

// IDs e Nomes dos seus fornecedores de TI (incluindo Mundivox)
const IDS_FORNECEDORES_TI: { [key: number]: string } = {
    4807594928: "RIT SOLUCOES EM TECNOLOGIA DA INFORMACAO LTDA",
    4807594778: "BRFIBRA TELECOMUNICACOES LTDA",
    5202017644: "WORLDNET",
    4807594893: "MUNDIVOX COMMUNICATIONS LTDA" // <<< ADICIONADO AQUI (Ajuste o nome se necessário)
};

export async function GET() {
  try {
    // Cria a lista diretamente com os fornecedores definidos
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