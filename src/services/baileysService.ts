// services/baileysService.ts
import { fetchApi, connectToSSE } from '@/lib/baileys-api';
import {
    BaileysApiResponse,
    BaileysSession,
    CreateSessionRequest,
    SendMessageRequest,
    SSEEvent
} from '@/types/baileys';

const confirmModalInfo: {
    action: string;
    title: string;
    message: string;
    whatsAppId: string;
    open: boolean;
} = {
    action: '',
    title: '',
    message: '',
    whatsAppId: '',
    open: false
};

// Implementação do serviço Baileys
class BaileysService {
    // Sessões
    async listSessions(): Promise<BaileysApiResponse<BaileysSession[]>> {
        try {
            console.log('Buscando sessões no banco de dados e na API...');

            return {
                success: true,
            };
        } catch (error) {
            console.error('Erro ao listar sessões:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido ao listar sessões'
            };
        }
    }

    async createSession(request: CreateSessionRequest): Promise<BaileysApiResponse<BaileysSession>> {
        try {
            const response = await fetchApi(`sessions/add`, 'POST', request);

            // Se a resposta não incluir os dados da sessão, crie uma resposta padrão
            if (response.success && (!response.data || Object.keys(response.data).length === 0)) {
                return {
                    ...response,
                    data: {
                        id: request.sessionId,
                        sessionId: request.sessionId,
                        name: request.name || request.sessionId,
                        status: 'DISCONNECTED',
                        updatedAt: new Date().toISOString()
                    }
                };
            }

            return response;
        } catch (error) {
            console.error('Erro ao criar sessão:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido ao criar sessão'
            };
        }
    }

    async getSession(sessionId: string): Promise<BaileysApiResponse<BaileysSession>> {
        try {
            return await fetchApi(`sessions/${sessionId}`);
        } catch (error) {
            console.error(`Erro ao obter sessão ${sessionId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido ao obter sessão'
            };
        }
    }

    async updateSession(sessionId: string, data: Partial<BaileysSession>): Promise<BaileysApiResponse> {
        try {
            // Apenas envie campos que a API realmente aceita
            const updateData = {
                ...(data.name && { name: data.name }),
                ...(data.status && { status: data.status })
            };

            return await fetchApi(`sessions/${sessionId}`, 'POST', updateData);
        } catch (error) {
            console.error(`Erro ao atualizar sessão ${sessionId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido ao atualizar sessão'
            };
        }
    }

    // QR Code
    async getQrCode(sessionId: string): Promise<BaileysApiResponse> {
        try {
            // Tentativa 1: pelo status da sessão
            try {
                const sessionResponse = await this.checkConnection(sessionId);

                // Se a resposta incluir um QR code, retorne-o
                if (sessionResponse.success &&
                    (sessionResponse.qrcode ||
                        sessionResponse.data?.qrcode ||
                        sessionResponse.data?.base64)) {
                    return sessionResponse;
                }
            } catch (statusError) {
                console.log('Erro ao buscar QR code pelo status:', statusError);
                // Continua para a próxima tentativa
            }

            // Tentativa 2: usando generateQR
            return await this.requestNewQrCode(sessionId);
        } catch (error) {
            console.error('Erro ao obter ou gerar QR code:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Não foi possível obter ou gerar QR code'
            };
        }
    }

    async requestNewQrCode(sessionId: string): Promise<BaileysApiResponse> {
        try {
            console.log(`Solicitando novo QR Code para sessão: ${sessionId}`);

            // Opção 1: Tenta o endpoint status primeiro para obter qualquer QR code disponível
            try {
                console.log(`Verificando status para sessão: ${sessionId}`);
                const statusResponse = await fetchApi(`sessions/${sessionId}/status`);

                // Se a resposta de status incluir um QR code, retorna-o
                if (statusResponse.success &&
                    (statusResponse.qrcode ||
                        statusResponse.data?.qrcode ||
                        statusResponse.data?.base64)) {
                    return statusResponse;
                }
            } catch (statusError) {
                console.error('Erro ao verificar status:', statusError);
                // Continua para a próxima opção
            }

            // Opção 2: Tenta usar o endpoint restart que frequentemente gera um novo QR
            try {
                console.log(`Tentando restart para sessão: ${sessionId}`);
                return await fetchApi(`sessions/${sessionId}/restart`, 'POST');
            } catch (restartError) {
                console.error('Erro no restart:', restartError);
                // Continua para a próxima opção
            }

            // Opção 3: Tenta o endpoint start diretamente
            try {
                console.log(`Tentando start para sessão: ${sessionId}`);
                return await fetchApi(`sessions/${sessionId}/start`, 'POST');
            } catch (startError) {
                console.error('Erro no start:', startError);
                // Continua para a próxima opção
            }

            // Opção 4: Último recurso - tenta o endpoint qr para versões mais antigas da API Baileys
            try {
                console.log(`Tentando qr endpoint para sessão: ${sessionId}`);
                return await fetchApi(`sessions/${sessionId}/qr`, 'GET');
            } catch (qrError) {
                console.error('Erro no endpoint qr:', qrError);

                // Todas as opções falharam, retorna erro
                return {
                    success: false,
                    error: 'Não foi possível gerar novo QR code após várias tentativas'
                };
            }
        } catch (error) {
            console.error('Erro ao gerar novo QR code:', error);
            return {
                success: false,
                error: 'Erro ao solicitar novo QR code'
            };
        }
    }

    // Status e conexão
    async startSession(sessionId: string): Promise<BaileysApiResponse> {
        try {
            return await fetchApi(`sessions/${sessionId}/start`, 'POST');
        } catch (error) {
            console.error(`Erro ao iniciar sessão ${sessionId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido ao iniciar sessão'
            };
        }
    }

    async disconnectSession(sessionId: string): Promise<BaileysApiResponse> {
        try {
            return await fetchApi(`whatsapp/${confirmModalInfo.whatsAppId}`, 'DELETE');
        } catch (error) {
            console.error(`Erro ao desconectar sessão ${sessionId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido ao desconectar sessão'
            };
        }
    }

    async checkConnection(sessionId: string): Promise<BaileysApiResponse> {
        try {
            // Usando /status conforme o curl de exemplo
            return await fetchApi(`sessions/${sessionId}/status`);
        } catch (error) {
            console.error(`Erro ao verificar conexão da sessão ${sessionId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido ao verificar conexão'
            };
        }
    }

    // SSE
    connectToSSE(sessionId: string, onEvent: (event: SSEEvent) => void): EventSource {
        return connectToSSE(sessionId, onEvent);
    }

    // Mensagens
    async sendMessage(sessionId: string, request: SendMessageRequest): Promise<BaileysApiResponse> {
        try {
            return await fetchApi(`sessions/${sessionId}/send-message`, 'POST', {
                number: request.number,
                message: request.message
            });
        } catch (error) {
            console.error(`Erro ao enviar mensagem da sessão ${sessionId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido ao enviar mensagem'
            };
        }
    }

    async getMessages(sessionId: string, number: string): Promise<BaileysApiResponse> {
        try {
            // Formata o número conforme necessário
            const formattedNumber = number.replace(/\D/g, '');
            return await fetchApi(`sessions/${sessionId}/messages?number=${encodeURIComponent(formattedNumber)}`);
        } catch (error) {
            console.error(`Erro ao obter mensagens da sessão ${sessionId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido ao obter mensagens'
            };
        }
    }
}

// Exporta uma instância única do serviço
const baileysService = new BaileysService();
export default baileysService;