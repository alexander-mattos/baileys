// app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Importe o cliente Prisma

// Função auxiliar para atualizar ou criar a sessão no banco de dados
async function updateSessionInDatabase(sessionId: string, data: any) {
    try {
        // Verifica se a sessão já existe no BD (usando sessionId para busca)
        const existingSession = await prisma.session.findFirst({
            where: { sessionId: sessionId }
        });

        if (existingSession) {
            // Atualiza a sessão existente
            await prisma.session.update({
                where: { id: existingSession.id },
                data: {
                    ...data,
                    updatedAt: new Date()
                }
            });
            console.log(`Sessão ${sessionId} atualizada no banco de dados`);
        } else {
            // Cria uma nova sessão
            await prisma.session.create({
                data: {
                    sessionId: sessionId,
                    status: data.status || 'disconnected',
                    qrcode: data.qrcode || null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            console.log(`Sessão ${sessionId} criada no banco de dados`);
        }

        return true;
    } catch (error) {
        console.error('Erro ao atualizar/criar sessão no banco de dados:', error);
        return false;
    }
}

export async function POST(request: NextRequest) {
    try {
        // Processa o webhook recebido
        const data = await request.json();
        console.log('Webhook recebido:', JSON.stringify(data, null, 2));

        // Verifica se é um evento de QR code
        if (data.event === 'qrcode.updated' && data.data?.qr && data.sessionId) {
            console.log(`Recebido QR code para sessão ${data.sessionId}, encaminhando para armazenamento...`);

            // Salva o QR code no armazeIdnto local para o frontend
            try {
                const qrResponse = await fetch(`http://localhost:3000/api/qrcode/${data.sessionId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ qr: data.data.qr }),
                });

                if (!qrResponse.ok) {
                    const errorText = await qrResponse.text();
                    console.error(`Erro ao salvar QR code: ${qrResponse.status} ${qrResponse.statusText} - ${errorText}`);
                } else {
                    console.log(`QR code salvo com sucesso para sessão ${data.sessionId}`);
                }

                // Atualiza a sessão no banco de dados com o QR code e status
                await updateSessionInDatabase(data.sessionId, {
                    qrcode: data.data.qr,
                    status: 'qrcode'
                });

            } catch (qrError) {
                console.error('Erro ao enviar QR code para armazeIdnto:', qrError);
            }
        }

        // Verifica se é um evento de atualização de status
        if (data.event === 'connection.update' && data.sessionId) {
            const statusReceived = data.data?.status || 'Status desconhecido';

            // Mapear o status recebido para o formato usado no seu banco de dados
            let status = statusReceived;
            if (statusReceived === 'CONNECTED') status = 'connected';
            else if (statusReceived === 'DISCONNECTED') status = 'disconnected';
            else if (statusReceived === 'qrcode' || statusReceived === 'SCAN_QR_CODE') status = 'qrcode';
            else if (statusReceived === 'TIMEOUT' || statusReceived === 'PAIRING') status = 'conflict';

            console.log(`Atualização de status para sessão ${data.sessionId}: ${statusReceived} -> ${status}`);

            // Salva o status no banco de dados
            await updateSessionInDatabase(data.sessionId, {
                status: status
            });

            // Caso específico para status conectado
            if (status === 'connected') {
                console.log(`Sessão ${data.sessionId} está conectada!`);
                // Se necessário, salve dados de autenticação ou outras informações
            }

            // Se a sessão foi destruída ou desconectada, atualiza o status no armazeIdnto local
            if (statusReceived === 'destroyed' || statusReceived === 'disconnected' || statusReceived === 'logout') {
                try {
                    // Notificar o frontend que a sessão foi destruída
                    const statusResponse = await fetch(`http://localhost:3000/api/session-status/${data.sessionId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ status }),
                    });

                    if (!statusResponse.ok) {
                        console.error(`Erro ao atualizar status: ${statusResponse.status} ${statusResponse.statusText}`);
                    } else {
                        console.log(`Status da sessão ${data.sessionId} atualizado para ${status}`);
                    }
                } catch (statusError) {
                    console.error('Erro ao atualizar status da sessão:', statusError);
                }
            }
        }

        // Retorna sucesso para o webhook
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao processar webhook:', error);
        return NextResponse.json({ success: false, error: String(error) });
    }
}