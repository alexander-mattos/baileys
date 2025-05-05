// app/api/baileys-test/create-session/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

// URL base da API Baileys
const BAILEYS_API_URL = process.env.BAILEYS_API_URL || 'http://localhost:3001';
const API_KEY = process.env.BAILEYS_API_KEY || '';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId } = body;
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        message: 'Parâmetro sessionId é obrigatório'
      }, { status: 400 });
    }
    
    // Tenta criar uma nova sessão
    const response = await axios.post(
      `${BAILEYS_API_URL}/sessions/add`,
      { sessionId, readIncomingMessages: true },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        }
      }
    );
    
    console.log(`Sessão de teste ${sessionId} criada no Baileys`);
    
    return NextResponse.json({
      success: true,
      message: 'Sessão de teste criada com sucesso',
      data: {
        sessionId,
        response: response.data
      }
    });
  } catch (error) {
    console.error('Erro ao criar sessão de teste:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Falha ao criar sessão de teste',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: (error as any).response?.data ?? 'Sem detalhes disponíveis'
      }
    }, { status: 500 });
  }
}