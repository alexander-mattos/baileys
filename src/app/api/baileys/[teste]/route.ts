// app/api/baileys-test/connection/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

// URL base da API Baileys
const BAILEYS_API_URL = process.env.BAILEYS_API_URL || 'http://localhost:3001';
const API_KEY = process.env.BAILEYS_API_KEY || '8af4e00c12ce8b20eabb10c52a00671f2a987fdc0162ce707082e7be2d01bcbfb7b5657deac5523b1c0fc5fdacffd6b59102de86a49300d937f867b083ac11ce10982056ddd295b131b783d3bd55e92ea3d683043af6ee0ff26b07aee7f14eb175e36e52fbeb6732ba7341b678ac6ae2eac08577374aed50407c3cd4d6395324e56a9c43e1d323ad461d179a7d534ce2d7f7e1653b6c07783ddf2be4b805a4574f3bfcfa2406324ffaf5e485636ea17045a5b8f72b94e35cdd84d3442799ab196c6eb16c2a7f365f943da94ca7618e1cdd83cd4ec4a0808d17fc0688f7c0bd5ff42ef79a82f7eae84327de28af29aa075d51ef96e9537e5f9484dfa8ecf905978af4e00c12ce8b20eabb10c52a00671f2a987fdc0162ce707082e7be2d01bcbfb7b5657deac5523b1c0fc5fdacffd6b59102de86a49300d937f867b083ac11ce10982056ddd295b131b783d3bd55e92ea3d683043af6ee0ff26b07aee7f14eb175e36e52fbeb6732ba7341b678ac6ae2eac08577374aed50407c3cd4d6395324e56a9c43e1d323ad461d179a7d534ce2d7f7e1653b6c07783ddf2be4b805a4574f3bfcfa2406324ffaf5e485636ea17045a5b8f72b94e35cdd84d3442799ab196c6eb16c2a7f365f943da94ca7618e1cdd83cd4ec4a0808d17fc0688f7c0bd5ff42ef79a82f7eae84327de28af29aa075d51ef96e9537e5f9484dfa8ecf90597';

export async function GET() {
  try {
    // Tenta fazer uma requisição simples para a API
    const response = await axios.get(`${BAILEYS_API_URL}/sessions`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Conexão com API Baileys estabelecida com sucesso',
      data: {
        apiUrl: BAILEYS_API_URL,
        statusCode: response.status,
        sessions: response.data
      }
    });
  } catch (error) {
    console.error('Erro ao testar conexão com Baileys API:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Falha ao conectar com API Baileys',
      error: {
        message: error,
        url: `${BAILEYS_API_URL}/sessions`,
        details: error instanceof Error && 'response' in error && (error.response as any)?.data ? (error.response as any).data : 'Sem detalhes disponíveis'
      }
    }, { status: 500 });
  }
}