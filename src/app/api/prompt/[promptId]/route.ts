// app/api/prompt/[promptId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { getIO } from '@/lib/socket';

// GET - Obter um prompt específico
export async function GET(
    request: NextRequest,
    { params }: { params: { promptId: string } }
) {
    return withAuth(async (req: NextRequest, session) => {
        try {
            const promptId = Number(params.promptId);
            const companyId = session.user.companyId;

            // Buscar prompt no banco de dados
            const prompt = await prisma.prompts.findFirst({
                where: {
                    id: promptId,
                    companyId: Number(companyId)
                }
            });

            if (!prompt) {
                return NextResponse.json(
                    { error: 'Prompt não encontrado' },
                    { status: 404 }
                );
            }

            return NextResponse.json(prompt);
        } catch (error) {
            console.error('Erro ao buscar prompt:', error);
            return NextResponse.json(
                { error: 'Erro interno do servidor' },
                { status: 500 }
            );
        }
    })(request);
}

// PUT - Atualizar um prompt existente
export async function PUT(
    request: NextRequest,
    { params }: { params: { promptId: string } }
) {
    return withAuth(async (req: NextRequest, session) => {
        try {
            const promptId = Number(params.promptId);
            const companyId = session.user.companyId;

            // Extrair dados do corpo da requisição
            const promptData = await req.json();

            // Verificar se o prompt existe e pertence à empresa
            const existingPrompt = await prisma.prompts.findFirst({
                where: {
                    id: promptId,
                    companyId: Number(companyId)
                }
            });

            if (!existingPrompt) {
                return NextResponse.json(
                    { error: 'Prompt não encontrado' },
                    { status: 404 }
                );
            }

            // Atualizar prompt no banco de dados
            const updatedPrompt = await prisma.prompts.update({
                where: { id: promptId },
                data: {
                    name: promptData.name,
                    apiKey: promptData.apiKey,
                    prompt: promptData.prompt,
                    maxTokens: Number(promptData.maxTokens),
                    temperature: Number(promptData.temperature),
                    promptTokens: Number(promptData.promptTokens || 0),
                    completionTokens: Number(promptData.completionTokens || 0),
                    totalTokens: Number(promptData.totalTokens || 0),
                    queueId: promptData.queueId ? Number(promptData.queueId) : null,
                    maxMessages: Number(promptData.maxMessages || 0),
                    voice: promptData.voice || null,
                    voiceKey: promptData.voiceKey || null,
                    voiceRegion: promptData.voiceRegion || null
                }
            });

            // Emitir evento via socket
            const io = getIO();
            io.emit("prompt", {
                action: "update",
                prompt: updatedPrompt
            });

            return NextResponse.json(updatedPrompt);
        } catch (error) {
            console.error('Erro ao atualizar prompt:', error);
            return NextResponse.json(
                { error: 'Erro interno do servidor' },
                { status: 500 }
            );
        }
    })(request);
}

// DELETE - Remover um prompt
export async function DELETE(
    request: NextRequest,
    { params }: { params: { promptId: string } }
) {
    return withAuth(async (req: NextRequest, session) => {
        try {
            const promptId = Number(params.promptId);
            const companyId = session.user.companyId;

            // Verificar se o prompt está sendo usado em algum whatsapp
            const whatsappCount = await prisma.whatsapps.count({
                where: {
                    promptId,
                    companyId: Number(companyId)
                }
            });

            if (whatsappCount > 0) {
                return NextResponse.json(
                    { message: "Não foi possível excluir! Verifique se este prompt está sendo usado nas conexões Whatsapp!" },
                    { status: 400 }
                );
            }

            // Remover prompt do banco de dados
            await prisma.prompts.delete({
                where: { id: promptId }
            });

            // Emitir evento via socket
            const io = getIO();
            io.emit("prompt", {
                action: "delete",
                intelligenceId: promptId
            });

            return NextResponse.json({ message: "Prompt deleted" });
        } catch (error) {
            console.error('Erro ao excluir prompt:', error);
            return NextResponse.json(
                { message: "Não foi possível excluir! Verifique se este prompt está sendo usado!" },
                { status: 500 }
            );
        }
    })(request);
}