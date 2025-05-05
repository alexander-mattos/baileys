import { NextResponse } from 'next/server';
import axios from 'axios';

// URL base da API Baileys
const BAILEYS_API_URL = process.env.BAILEYS_API_URL || 'http://localhost:3001';
const API_KEY = process.env.BAILEYS_API_KEY || '';

export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    const { sessionId, to, message } = requestBody;
    
    // Validação básica
    if (!sessionId || !to || !message) {
      return NextResponse.json({
        success: false,
        message: 'Parâmetros incompletos. Necessário: sessionId, to, message'
      }, { status: 400 });
    }
    
    console.log(`Tentando enviar mensagem para ${to} via sessão ${sessionId}`);
    
    // Garantir que o número está no formato correto para o JID
    const jid = to.includes('@c.us') ? to : `${to}@c.us`;
    
    // Formato correto do payload conforme a rota do Baileys
    const messagePayload = {
      jid: jid,
      type: 'number', // Hardcoded como 'number' para chats individuais
      message: {
        text: message // A mensagem precisa estar dentro de um objeto
      },
      options: {} // Campo opcional
    };
    
    console.log('Payload da mensagem:', messagePayload);
    
    // URL correta baseada na definição da rota que você compartilhou
    const url = `${BAILEYS_API_URL}/${sessionId}/messages/send`;
    console.log('URL:', url);
    
    // Tenta enviar a mensagem
    const response = await axios.post(
      url,
      messagePayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        }
      }
    );
    
    console.log(`Mensagem enviada com sucesso para ${jid}`);
    console.log('Resposta:', response.data);
    
    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: response.data
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    
    // Extrair detalhes do erro para depuração
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      status: (error as any).response?.status,
      statusText: (error as any).response?.statusText,
      data: (error as any).response?.data
    };
    
    console.error('Detalhes do erro:', errorDetails);
    
    return NextResponse.json({
      success: false,
      message: 'Falha ao enviar mensagem',
      error: errorDetails
    }, { status: 500 });
  }
}