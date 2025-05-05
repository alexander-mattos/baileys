// app/api/prompt/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { getIO } from '@/lib/socket';

// GET - Listar todos os prompts
export const GET = withAuth(async (request: NextRequest, session) => {
  try {
    const { searchParams } = new URL(request.url);
    const searchParam = searchParams.get('searchParam') || '';
    const pageNumber = Number(searchParams.get('pageNumber') || 1);
    const companyId = session.user.companyId;
    
    // Configuração da paginação
    const limit = 10;
    const offset = (pageNumber - 1) * limit;
    
    // Consulta dos prompts com filtros
    const prompts = await prisma.prompts.findMany({
      where: {
        companyId: Number(companyId),
        name: { contains: searchParam }
      },
      take: limit,
      skip: offset,
      orderBy: { name: 'asc' }
    });
    
    // Contagem total para paginação
    const count = await prisma.prompts.count({
      where: {
        companyId: Number(companyId),
        name: { contains: searchParam }
      }
    });
    
    // Verificar se tem mais páginas
    const hasMore = count > offset + prompts.length;
    
    return NextResponse.json({ prompts, count, hasMore });
  } catch (error) {
    console.error('Erro ao listar prompts:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// POST - Criar um novo prompt
export const POST = withAuth(async (request: NextRequest, session) => {
  try {
    const companyId = session.user.companyId;
    
    // Extrair dados do corpo da requisição
    const promptData = await request.json();
    const { 
      name, 
      apiKey, 
      prompt, 
      maxTokens, 
      temperature, 
      promptTokens, 
      completionTokens, 
      totalTokens, 
      queueId, 
      maxMessages,
      voice,
      voiceKey,
      voiceRegion 
    } = promptData;
    
    // Criar prompt no banco de dados
    const promptRecord = await prisma.prompts.create({
      data: {
        name,
        apiKey,
        prompt,
        maxTokens: Number(maxTokens),
        temperature: Number(temperature),
        promptTokens: Number(promptTokens || 0),
        completionTokens: Number(completionTokens || 0),
        totalTokens: Number(totalTokens || 0),
        queueId: queueId ? Number(queueId) : null,
        maxMessages: Number(maxMessages || 0),
        companyId: Number(companyId),
        voice: voice || null,
        voiceKey: voiceKey || null,
        voiceRegion: voiceRegion || null
      }
    });
    
    // Emitir evento via socket
    const io = getIO();
    io.emit("prompt", {
      action: "update",
      prompt: promptRecord
    });
    
    return NextResponse.json(promptRecord);
  } catch (error) {
    console.error('Erro ao criar prompt:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});