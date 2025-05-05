'use client';

import { useState, useEffect, useReducer } from "react";
import { toast } from "react-toastify";
import { socketConnection } from "@/lib/socket";

// Definição de tipos para TypeScript
interface WhatsApp {
    id: number;
    name: string;
    status: string;
    qrcode: string;
    retries: number;
    updatedAt: string;
    [key: string]: any;
}

type WhatsAppAction =
    | { type: "LOAD_WHATSAPPS"; payload: WhatsApp[] }
    | { type: "UPDATE_WHATSAPPS"; payload: WhatsApp }
    | { type: "UPDATE_SESSION"; payload: WhatsApp }
    | { type: "DELETE_WHATSAPPS"; payload: number }
    | { type: "RESET" };

// Função reducer para gerenciar o estado dos WhatsApps
const reducer = (state: WhatsApp[], action: WhatsAppAction): WhatsApp[] => {
    switch (action.type) {
        case "LOAD_WHATSAPPS":
            return [...action.payload];

        case "UPDATE_WHATSAPPS": {
            const whatsApp = action.payload;
            const whatsAppIndex = state.findIndex((s) => s.id === whatsApp.id);

            if (whatsAppIndex !== -1) {
                const newState = [...state];
                newState[whatsAppIndex] = whatsApp;
                return newState;
            } else {
                return [whatsApp, ...state];
            }
        }

        case "UPDATE_SESSION": {
            const whatsApp = action.payload;
            const whatsAppIndex = state.findIndex((s) => s.id === whatsApp.id);

            if (whatsAppIndex !== -1) {
                const newState = [...state];
                newState[whatsAppIndex] = {
                    ...newState[whatsAppIndex],
                    status: whatsApp.status,
                    updatedAt: whatsApp.updatedAt,
                    qrcode: whatsApp.qrcode,
                    retries: whatsApp.retries
                };
                return newState;
            }
            return state;
        }

        case "DELETE_WHATSAPPS": {
            const whatsAppId = action.payload;
            return state.filter(whatsApp => whatsApp.id !== whatsAppId);
        }

        case "RESET":
            return [];

        default:
            return state;
    }
};

/**
 * Hook personalizado para gerenciar WhatsApps com atualizações em tempo real
 */
export const useWhatsApps = () => {
    const [whatsApps, dispatch] = useReducer(reducer, []);
    const [loading, setLoading] = useState(true);

    // Efeito para carregar WhatsApps iniciais
    useEffect(() => {
        const fetchWhatsApps = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/whatsapp?session=0');

                if (!response.ok) {
                    throw new Error(`Erro ao carregar WhatsApps: ${response.status}`);
                }

                const data = await response.json();
                dispatch({ type: "LOAD_WHATSAPPS", payload: data });
            } catch (err) {
                console.error("Erro ao buscar WhatsApps:", err);
                toast.error(err instanceof Error ? err.message : "Erro ao carregar WhatsApps");
            } finally {
                setLoading(false);
            }
        };

        fetchWhatsApps();
    }, []);

    // Efeito para configurar conexões de socket em tempo real
    useEffect(() => {
        // Obter ID da empresa do armazenamento local
        const companyId = localStorage.getItem("companyId");
        if (!companyId) {
            console.warn("ID da empresa não encontrado no localStorage");
            return;
        }

        // Estabelecer conexão socket
        const socket = socketConnection({ companyId });

        // Escutar eventos de atualização de WhatsApp
        socket.on(`company-${companyId}-whatsapp`, (data) => {
            if (data.action === "update") {
                dispatch({ type: "UPDATE_WHATSAPPS", payload: data.whatsapp });
            } else if (data.action === "delete") {
                dispatch({ type: "DELETE_WHATSAPPS", payload: data.whatsappId });
            }
        });

        // Escutar eventos de atualização de sessão
        socket.on(`company-${companyId}-whatsappSession`, (data) => {
            if (data.action === "update") {
                dispatch({ type: "UPDATE_SESSION", payload: data.session });
            }
        });

        // Limpeza ao desmontar o componente
        return () => {
            socket.disconnect();
        };
    }, []);

    return { whatsApps, loading };
};

export default useWhatsApps;