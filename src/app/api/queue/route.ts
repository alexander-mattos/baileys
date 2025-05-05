// app/api/queue/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { getIO } from '@/lib/socket';

// GET - Listar todas as filas
export const GET = withAuth(async (request: NextRequest, session) => {
  try {
    const { searchParams } = new URL(request.url);
    let companyId = session.user.companyId;
    
    // Verificar se há um companyId específico na query
    const queryCompanyId = searchParams.get('companyId');
    if (queryCompanyId) {
      companyId = Number(queryCompanyId);
    }
    
    // Buscar filas no banco de dados
    const queues = await prisma.queues.findMany({
      where: { companyId: Number(companyId) },
      include: {
        queue_options: true // Inclui as opções da fila
      },
      orderBy: { orderQueue: 'asc' }
    });
    
    return NextResponse.json(queues);
  } catch (error) {
    console.error('Erro ao listar filas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// POST - Criar uma nova fila
export const POST = withAuth(async (request: NextRequest, session) => {
  try {
    const companyId = session.user.companyId;
    
    // Extrair dados do corpo da requisição
    const queueData = await request.json();
    const { 
      name, 
      color, 
      greetingMessage, 
      outOfHoursMessage, 
      schedules, 
      orderQueue, 
      integrationId, 
      promptId,
    } = queueData;
    
    // Criar fila no banco de dados
    const queue = await prisma.queues.create({
      data: {
        name,
        color,
        greetingMessage,
        outOfHoursMessage,
        schedules: schedules ? JSON.stringify(schedules) : '[]',
        orderQueue: orderQueue === "" ? null : orderQueue,
        integrationId: integrationId === "" ? null : integrationId,
        promptId: promptId === "" ? null : promptId,
        companyId,
      }
    });
    
    // Criar entradas para os horários programados
    if (schedules && schedules.length > 0) {
      await prisma.queues.createMany({
        data: schedules.map(schedules => ({
          queueId: queue.id,
          weekday: schedules.weekday,
          startTime: schedules.startTime,
          endTime: schedules.endTime
        }))
      });
    }
    
    // Buscar a fila completa com os horários
    const createdQueue = await prisma.queues.findUnique({
      where: { id: queue.id },
      include: {
        queue_options: true
      }
    });
    
    // Emitir evento via socket
    const io = getIO();
    io.emit(`company-${companyId}-queue`, {
      action: "update",
      queue: createdQueue
    });
    
    return NextResponse.json(createdQueue);
  } catch (error) {
    console.error('Erro ao criar fila:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});