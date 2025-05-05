'use client';
// app/baileys-test/page.tsx

import React, { useState } from 'react';
import axios from 'axios';

export default function BaileysTestPage() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [message, setMessage] = useState('');

    const testConnection = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/baileys/connection');
            setResult(response.data);
        } catch (error) {
            setResult({
                error: (error as Error).message,
                details: (error as any).response?.data
            });
        } finally {
            setLoading(false);
        }
    };

    const createSession = async () => {
        if (!sessionId) {
            alert('Por favor, insira um ID de sessão');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('/api/baileys/create-session', {
                sessionId
            });
            setResult(response.data);
        } catch (error) {
            setResult({
                success: false,
                error: (error as Error).message,
                details: (error as any).response?.data
            });
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!sessionId || !phoneNumber || !message) {
            alert('Por favor, preencha todos os campos');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('/api/baileys/send-message', {
                sessionId,
                to: phoneNumber,
                message
            });
            setResult(response.data);
        } catch (error) {
            setResult({
                success: false,
                error: (error as Error).message,
                details: (error as any).response?.data
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Teste de Integração com Baileys</h1>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Testar Conexão</h2>
                <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={testConnection}
                    disabled={loading}
                >
                    Testar Conexão com API Baileys
                </button>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Criar Sessão</h2>
                <div className="flex items-center space-x-2 mb-2">
                    <input
                        type="text"
                        placeholder="ID da Sessão"
                        className="border p-2 rounded"
                        value={sessionId}
                        onChange={(e) => setSessionId(e.target.value)}
                        spellCheck="false"
                    />
                    <button
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                        onClick={createSession}
                        disabled={loading}
                    >
                        Criar Sessão
                    </button>
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Enviar Mensagem</h2>
                <div className="flex flex-col space-y-2 mb-2">
                    <input
                        type="text"
                        placeholder="ID da Sessão"
                        className="border p-2 rounded"
                        value={sessionId}
                        onChange={(e) => setSessionId(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Número do Telefone (apenas dígitos)"
                        className="border p-2 rounded"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <textarea
                        placeholder="Mensagem"
                        className="border p-2 rounded"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                    />
                    <button
                        className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                        onClick={sendMessage}
                        disabled={loading}
                    >
                        Enviar Mensagem
                    </button>
                </div>
            </div>

            {loading && <div className="text-gray-500">Carregando...</div>}

            {result && (
                <div className="mt-4">
                    <h2 className="text-xl font-semibold mb-2">Resultado</h2>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}