// lib/baileys-api.ts
import { BaileysApiResponse, SSEEvent } from '@/types/baileys';

// API constants 
const API_BASE_URL = process.env.NEXT_PUBLIC_BAILEYS_API_URL || '';
const API_KEY = process.env.NEXT_PUBLIC_BAILEYS_API_KEY || '';

export async function fetchApi(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
): Promise<BaileysApiResponse> {
    // Certifique-se de que endpoint começa sem barra
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;

    // Verifique se API_BASE_URL está definido
    if (!API_BASE_URL) {
        console.error('API_BASE_URL não está definido no .env.local');
        return {
            success: false,
            error: 'URL da API não configurada'
        };
    }

    try {
        // Construa a URL base manualmente para evitar problemas
        const url = API_BASE_URL.endsWith('/')
            ? `${API_BASE_URL}${formattedEndpoint}`
            : `${API_BASE_URL}/${formattedEndpoint}`;

        console.log('Requesting:', url, 'Method:', method, 'Body:', body); // Debug

        // Opções de requisição com a API key no header
        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: body ? JSON.stringify(body) : undefined,
        };

        console.log('Request options:', options); // Debug

        const response = await fetch(url, options);

        if (!response.ok) {
            console.error('API error:', response.status, response.statusText);
            let errorText = '';
            try {
                errorText = await response.text();
            } catch (textError) {
                errorText = 'Failed to get error details';
                console.error('Failed to get error details:', textError);
            }
            console.error('Error response body:', errorText);
            return {
                success: false,
                error: `API returned ${response.status}: ${response.statusText}${errorText ? ' - ' + errorText : ''}`
            };
        }

        // Tenta processar a resposta como JSON
        try {
            const data = await response.json();
            return data;
        } catch (parseError) {
            // Se não conseguir processar como JSON, retorna o texto da resposta
            let text = '';
            try {
                text = await response.text();
            } catch (textError) {
                console.error('Failed to get text response:', textError);
                return {
                    success: false,
                    error: 'Failed to parse response as JSON and failed to get text response'
                };
            }

            console.warn('Failed to parse response as JSON:', text);

            // Verifica se parece ser uma resposta SSE
            if (text.startsWith('data:')) {
                return {
                    success: true,
                    data: { message: 'SSE connection established', raw: text }
                };
            }

            return {
                success: false,
                error: `Failed to parse response: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
                rawResponse: text.substring(0, 1000) // Limita para não sobrecarregar
            };
        }
    } catch (error) {
        // Melhor tratamento para erro de rede
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('API request failed:', errorMessage);
        return {
            success: false,
            error: errorMessage
        };
    }
}

// Função para criar sessão (ajustada para usar o formato correto)
export async function createSession(sessionId: string): Promise<BaileysApiResponse> {
    return fetchApi(`sessions/add`, 'POST', { sessionId });
}

// Função para criar conexão SSE com a API Baileys
export function connectToSSE(sessionId: string, onEvent: (event: SSEEvent) => void): EventSource {
    if (!sessionId) {
        console.error('sessionId não pode estar vazio');
        throw new Error('sessionId é obrigatório para SSE');
    }

    if (!API_BASE_URL) {
        console.error('API_BASE_URL não está definido no .env.local');
        throw new Error('URL da API não configurada');
    }

    console.log(`Criando SSE para sessão: ${sessionId}`);

    // Criar um EventSource dummy para casos de erro
    const createDummyEventSource = () => {
        const dummyEventSource = new EventSource('data:,');
        dummyEventSource.close();
        return dummyEventSource;
    };

    // Para SSE, usamos api_key como parâmetro de URL
    const sseUrl = `${API_BASE_URL.endsWith('/') ? API_BASE_URL : API_BASE_URL + '/'}sessions/${sessionId}/add-sse?api_key=${encodeURIComponent(API_KEY)}`;

    console.log('SSE URL:', sseUrl.replace(API_KEY, '***API_KEY***'));

    // Verificar status da sessão antes de iniciar SSE (sem await/async)
    fetch(`${API_BASE_URL}/sessions/${sessionId}/status`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
        }
    }).then(response => {
        if (response.status === 404) {
            // Sessão não existe, fechar conexão SSE
            console.log(`Sessão ${sessionId} não existe. Fechando SSE.`);
            if (eventSource && eventSource.readyState !== 2) { // 2 = CLOSED
                eventSource.close();
            }
            return;
        }

        if (response.ok) {
            response.json().then(data => {
                if (data.success && data.data?.status === 'CONNECTED') {
                    // Sessão já conectada, fechar SSE
                    console.log(`Sessão ${sessionId} já está conectada. Fechando SSE.`);
                    onEvent({ type: 'status', data: { status: 'CONNECTED' } });
                    if (eventSource && eventSource.readyState !== 2) {
                        eventSource.close();
                    }
                }
            }).catch(err => {
                console.error('Erro ao processar resposta JSON:', err);
            });
        }
    }).catch(err => {
        console.error('Erro ao verificar status da sessão:', err);
    });

    // Criar nova conexão SSE com número limitado de tentativas
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 2;

    // Criar a conexão SSE
    let eventSource: EventSource;
    try {
        eventSource = new EventSource(sseUrl);

        // Configuração dos event listeners
        eventSource.onopen = () => {
            console.log(`SSE conexão aberta para sessão: ${sessionId}`);
            reconnectAttempts = 0; // Resetar tentativas de reconexão quando bem-sucedido
        };

        // Listener para eventos gerais
        eventSource.onmessage = (event) => {
            console.log(`SSE mensagem recebida para sessão: ${sessionId}`);

            // Tenta analisar a mensagem como JSON
            try {
                // Verifica se a mensagem começa com "data: " (formato SSE)
                let data = event.data;
                if (typeof data === 'string' && data.startsWith('data: ')) {
                    data = data.substring(6); // Remove o prefixo "data: "
                }

                const parsedData = JSON.parse(data);

                // Verificar status conectado para fechar SSE
                if (parsedData.status === 'CONNECTED') {
                    console.log(`Sessão ${sessionId} conectada, fechando SSE`);
                    setTimeout(() => {
                        eventSource.close();
                    }, 1000);
                }

                onEvent({ type: 'message', data: parsedData });
            } catch (error) {
                console.error('Erro ao analisar mensagem SSE:', error);
            }
        };

        // Listeners para eventos específicos
        eventSource.addEventListener('status', (event) => {
            console.log(`SSE status atualizado para sessão: ${sessionId}`);
            try {
                // Verifica se a mensagem começa com "data: " (formato SSE)
                let data = event.data;
                if (typeof data === 'string' && data.startsWith('data: ')) {
                    data = data.substring(6); // Remove o prefixo "data: "
                }

                const parsedData = JSON.parse(data);

                // Verificar status conectado
                if (parsedData.status === 'CONNECTED') {
                    console.log(`Sessão ${sessionId} conectada, fechando SSE`);
                    setTimeout(() => {
                        eventSource.close();
                    }, 1000);
                }

                onEvent({ type: 'status', data: parsedData });
            } catch (error) {
                console.error('Erro ao analisar evento de status SSE:', error);
            }
        });

        eventSource.addEventListener('qrcode', (event) => {
            console.log(`SSE QR code recebido para sessão: ${sessionId}`);
            try {
                // Verifica se a mensagem começa com "data: " (formato SSE)
                let data = event.data;
                if (typeof data === 'string' && data.startsWith('data: ')) {
                    data = data.substring(6); // Remove o prefixo "data: "
                }

                const parsedData = JSON.parse(data);
                onEvent({ type: 'qrcode', data: parsedData });
            } catch (error) {
                console.error('Erro ao analisar evento de QR code SSE:', error);
            }
        });

        // Tratamento de erros com limite de reconexão
        eventSource.onerror = (error) => {
            console.error(`SSE erro de conexão para sessão: ${sessionId}`, error);
            eventSource.close();

            // Verificar novamente o status da sessão antes de tentar reconectar
            fetch(`${API_BASE_URL}/sessions/${sessionId}/status`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': API_KEY
                }
            }).then(response => {
                // Se a sessão não existe (404) ou está conectada, não reconectar
                if (response.status === 404) {
                    console.log(`Sessão ${sessionId} não existe. Não reconectando SSE.`);
                    return;
                }

                // Verificar status
                if (response.ok) {
                    response.json().then(data => {
                        if (data.success && data.data?.status === 'CONNECTED') {
                            console.log(`Sessão ${sessionId} já conectada. Não reconectando SSE.`);
                            onEvent({ type: 'status', data: { status: 'CONNECTED' } });
                            return;
                        }

                        // Limitar tentativas de reconexão
                        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                            reconnectAttempts++;
                            const delay = 5000 * Math.pow(2, reconnectAttempts);
                            console.log(`Tentativa de reconexão SSE ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} para sessão: ${sessionId}`);

                            // Tentar reconectar após o delay
                            setTimeout(() => {
                                // Criar nova instância de EventSource
                                const newEventSource = connectToSSE(sessionId, onEvent);
                                eventSource = newEventSource;
                            }, delay);
                        } else {
                            console.log(`Máximo de tentativas de reconexão SSE atingido para sessão: ${sessionId}`);
                        }
                    }).catch(err => {
                        console.error('Erro ao analisar resposta de status:', err);
                    });
                }
            }).catch(err => {
                console.error('Erro ao verificar status antes de reconectar:', err);
            });
        };

        return eventSource;
    } catch (error) {
        console.error(`Erro ao criar EventSource para ${sessionId}:`, error);
        return createDummyEventSource();
    }
}