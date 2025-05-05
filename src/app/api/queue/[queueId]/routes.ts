// app/api/queue/[queueId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { getIO } from '@/lib/socket';

// GET - Obter uma fila específica
export async function GET(
  request: NextRequest,
  { params }: { params: { queueId: string } }
) {
  return withAuth(async (req: NextRequest, session) => {
    try {
      const queueId = Number(params.queueId);
      const companyId = session.user.companyId;
      
      // Buscar fila no banco de dados
      const queue = await prisma.queues.findFirst({
        where: {
          id: queueId,
          companyId: Number(companyId)
        },
        include: {
          queue_options: true
        }
      });
      
      if (!queue) {
        return NextResponse.json(
          { error: 'Fila não encontrada' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(queue);
    } catch (error) {
      console.error('Erro ao buscar fila:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  })(request);
}

// PUT - Atualizar uma fila existente
export async function PUT(
  request: NextRequest,
  { params }: { params: { queueId: string } }
) {
  return withAuth(async (req: NextRequest, session) => {
    try {
      const queueId = Number(params.queueId);
      const companyId = session.user.companyId;
      
      // Extrair dados do corpo da requisição
      const queueData = await req.json();
      const { 
        name, 
        color, 
        greetingMessage, 
        outOfHoursMessage, 
        schedules, 
        orderQueue, 
        integrationId, 
        promptId 
      } = queueData;
      
      // Verificar se a fila existe
      const existingQueue = await prisma.queues.findFirst({
        where: {
          id: queueId,
          companyId: Number(companyId)
        }
      });
      
      if (!existingQueue) {
        return NextResponse.json(
          { error: 'Fila não encontrada' },
          { status: 404 }
        );
      }
      
      // Atualizar fila no banco de dados
      const queue = await prisma.queues.update({
        where: { id: queueId },
        data: {
          name,
          color,
          greetingMessage,
          outOfHoursMessage,
          // Armazenar schedules diretamente como JSON
          schedules: schedules ? JSON.stringify(schedules) as any : existingQueue.schedules,
          orderQueue: orderQueue === "" ? undefined : Number(orderQueue),
          integrationId: integrationId === "" ? undefined : Number(integrationId),
          promptId: promptId === "" ? undefined : Number(promptId)
        },
        include: {
          queue_options: true // Incluir as opções da fila
        }
      });
      
      // Atualizar horários programados - primeiro deletar os existentes
      await prisma.queues.deleteMany({
        where: { promptId }
      });
      
      // Depois criar os novos
      if (schedules && schedules.length > 0) {
        await prisma.queues.createMany({
          data: schedules.map(schedules => ({
            queueId,
            weekday: schedules.weekday,
            startTime: schedules.startTime,
            endTime: schedules.endTime
          }))
        });
      }
      
      // Buscar a fila atualizada com os horários
      const updatedQueue = await prisma.queues.findUnique({
        where: { id: queueId },
        include: {
          queue_options: true
        }
      });
      
      // Emitir evento via socket
      const io = getIO();
      io.emit(`company-${companyId}-queue`, {
        action: "update",
        queue: updatedQueue
      });
      
      return NextResponse.json(updatedQueue);
    } catch (error) {
      console.error('Erro ao atualizar fila:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  })(request);
}

// DELETE - Remover uma fila
export async function DELETE(
  request: NextRequest,
  { params }: { params: { queueId: string } }
) {
  return withAuth(async (req: NextRequest, session) => {
    try {
      const queueId = Number(params.queueId);
      const companyId = session.user.companyId;
      
      // Verificar se a fila existe
      const existingQueue = await prisma.queues.findFirst({
        where: {
          id: queueId,
          companyId: Number(companyId)
        }
      });
      
      if (!existingQueue) {
        return NextResponse.json(
          { error: 'Fila não encontrada' },
          { status: 404 }
        );
      }
      
      // Remover associações - primeiro os horários
      await prisma.queues.deleteMany({
        where: { id: queueId }
      });
      
      // Remover opções da fila
      await prisma.queues.deleteMany({
        where: { id: queueId }
      });
      
      // Remover a fila
      await prisma.queues.delete({
        where: { id: queueId }
      });
      
      // Emitir evento via socket
      const io = getIO();
      io.emit(`company-${companyId}-queue`, {
        action: "delete",
        queueId
      });
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Erro ao excluir fila:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  })(request);
}