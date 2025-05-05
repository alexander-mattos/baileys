// types/baileys.ts
import { Whatsapp } from './index';

// Tipos específicos para a API Baileys baseada no seu schema Prisma
export interface BaileysSession {
    id: string;
    sessionId: string;
    name?: string; // Alias para compatibilidade
    status: 'disconnected' | 'connected' | 'qrcode' | 'conflict' | 'CONNECTED' | 'DISCONNECTED' | 'SCAN_QR_CODE' | 'TIMEOUT' | 'PAIRING' | 'CONNECTING' | string;
    qrcode?: string;
    authData?: string;
    createdAt?: string;
    updatedAt?: string;
    isDefault?: boolean;
    [key: string]: any; // Para campos adicionais
}

// Mapeia BaileysSession para o tipo WhatsAppSession usado na aplicação
export function mapToWhatsAppSession(baileysSession: BaileysSession): Whatsapp {
    return {
        id: baileysSession.id,
        sessionName: baileysSession.sessionId,
        status: mapBaileysStatus(baileysSession.status),
        qrcode: baileysSession.qrcode,
        createdAt: baileysSession.createdAt ? new Date(baileysSession.createdAt) : undefined,
        updatedAt: baileysSession.updatedAt ? new Date(baileysSession.updatedAt) : undefined
    };
}

// Mapeia status do Baileys para o status padronizado na aplicação
export function mapBaileysStatus(status: string): 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'SCAN_QR_CODE' {
    switch (status.toLowerCase()) {
        case 'connected':
            return 'CONNECTED';
        case 'disconnected':
            return 'DISCONNECTED';
        case 'qrcode':
            return 'SCAN_QR_CODE';
        case 'conflict':
        case 'pairing':
        case 'connecting':
            return 'CONNECTING';
        default:
            return 'DISCONNECTED';
    }
}

// Interface para eventos SSE
export interface SSEEvent {
    type: string;
    data: any;
}

// Respostas específicas da API Baileys
export interface BaileysApiResponse<T = any> {
    success: boolean;
    error?: string;
    data?: T;
    qrcode?: string;  // Alguns endpoints retornam QR code diretamente
    rawResponse?: string; // Para respostas não-JSON
    [key: string]: any; // Para outros campos que possam vir na resposta
}

// Requisição para criar sessão (adaptada ao Prisma)
export interface CreateSessionRequest {
    sessionId: string; // Será mapeado para sessionName no backend
    name?: string;     // Campo adicional para UI
    isDefault?: boolean;
}

// Requisição para enviar mensagem (adaptada ao Prisma)
export interface SendMessageRequest {
    number: string; // Será convertido para formato JID (ex: 1234567890@s.whatsapp.net)
    message: string;
}

// Interface para mensagem recebida/enviada
export interface BaileysMessage {
    id: string;
    sessionId: string;
    remoteJid: string;
    message: string;
    messageType: string;
    status: string;
    createdAt: string;
}

// Interface para as funções da API Baileys
export interface BaileysApiService {
    // Funções de sessão
    listSessions: () => Promise<BaileysApiResponse<BaileysSession[]>>;
    createSession: (request: CreateSessionRequest) => Promise<BaileysApiResponse>;
    getSession: (sessionId: string) => Promise<BaileysApiResponse<BaileysSession>>;
    updateSession: (sessionId: string, data: Partial<BaileysSession>) => Promise<BaileysApiResponse>;
    deleteSession: (sessionId: string) => Promise<BaileysApiResponse>;

    // QR Code
    getQrCode: (sessionId: string) => Promise<BaileysApiResponse>;
    requestNewQrCode: (sessionId: string) => Promise<BaileysApiResponse>;

    // Status e conexão
    startSession: (sessionId: string) => Promise<BaileysApiResponse>;
    disconnectSession: (sessionId: string) => Promise<BaileysApiResponse>;
    checkConnection: (sessionId: string) => Promise<BaileysApiResponse>;

    // SSE
    connectToSSE: (sessionId: string, onEvent: (event: SSEEvent) => void) => EventSource;

    // Mensagens
    sendMessage: (sessionId: string, request: SendMessageRequest) => Promise<BaileysApiResponse>;
    getMessages: (sessionId: string, number: string) => Promise<BaileysApiResponse>;
}