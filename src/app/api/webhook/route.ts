// app/api/webhook/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIO } from '@/lib/socket';

export async function POST(request: Request) {
    try {
        const webhook = await request.json();
        console.log("Webhook recebido:", webhook);

        // Processar diferentes tipos de webhook
        if (webhook.type === "message") {
            // Processar mensagem do WhatsApp
            // Implementação futura...
        } else if (webhook.type === "status") {
            await handleStatusWebhook(webhook);
        } else if (webhook.type === "qrcode") {
            await handleQRCodeWebhook(webhook);
        }

        return NextResponse.json({
            success: true,
            message: "Webhook recebido com sucesso"
        });
    } catch (error) {
        console.error("Erro ao processar webhook:", error);
        return NextResponse.json({
            success: false,
            error: "Erro ao processar webhook"
        }, { status: 500 });
    }
}

/**
 * Processa webhook de status da conexão
 */
async function handleStatusWebhook(webhook: any) {
    const { sessionId, status } = webhook;

    if (!sessionId || !status) {
        console.error("Dados de status inválidos");
        return;
    }

    try {
        // Buscar WhatsApp pelo sessionId
        const whatsapp = await prisma.whatsapp.findFirst({
            where: { session: sessionId }
        });

        if (!whatsapp) {
            console.error(`WhatsApp com sessão ${sessionId} não encontrado`);
            return;
        }

        // Atualizar status
        await prisma.whatsapp.update({
            where: { id: whatsapp.id },
            data: { status }
        });

        // Emitir evento
        const io = getIO();
        io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
            action: "update",
            session: {
                ...whatsapp,
                status
            }
        });
    } catch (error) {
        console.error('Erro ao processar status:', error);
    }
}

/**
 * Processa webhook de QR Code
 */
async function handleQRCodeWebhook(webhook: any) {
    const { sessionId, qrcode } = webhook;

    if (!sessionId || !qrcode) {
        console.error("Dados de QR Code inválidos");
        return;
    }

    try {
        // Buscar WhatsApp pelo sessionId
        const whatsapp = await prisma.whatsapp.findFirst({
            where: { session: sessionId }
        });

        if (!whatsapp) {
            console.error(`WhatsApp com sessão ${sessionId} não encontrado`);
            return;
        }

        // Atualizar QR Code e status
        await prisma.whatsapp.update({
            where: { id: whatsapp.id },
            data: {
                qrcode,
                status: "qrcode"
            }
        });

        // Emitir evento
        const io = getIO();
        io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
            action: "update",
            session: {
                ...whatsapp,
                qrcode,
                status: "qrcode"
            }
        });
    } catch (error) {
        console.error('Erro ao processar QR Code:', error);
    }
}