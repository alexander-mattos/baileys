// components/QrcodeModal.tsx
'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'react-toastify';
import { socketConnection } from '@/lib/socket';

// Importações do Shadcn UI
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

interface QrcodeModalProps {
  open: boolean;
  onClose: () => void;
  whatsAppId: number | null;
}

export default function QrcodeModal({ open, onClose, whatsAppId }: QrcodeModalProps) {
  const [qrCode, setQrCode] = useState("");

  // Efeito para buscar o QR code inicial
  useEffect(() => {
    const fetchQRCode = async () => {
      if (!whatsAppId) return;

      try {
        const response = await fetch(`/api/whatsapp/${whatsAppId}`);

        if (!response.ok) {
          throw new Error('Falha ao obter QR code');
        }

        const data = await response.json();
        setQrCode(data.qrcode);
      } catch (err) {
        console.error('Erro ao obter QR code:', err);
        toast.error('Erro ao carregar QR code. Tente novamente.');
      }
    };

    fetchQRCode();
  }, [whatsAppId]);

  // Efeito para configurar a conexão socket
  useEffect(() => {
    if (!whatsAppId) return;

    // Obter ID da empresa do armazenamento local ou contexto de autenticação
    const companyId = localStorage.getItem("companyId");
    if (!companyId) return;

    // Estabelecer conexão com o socket
    const socket = socketConnection({ companyId });

    // Escutar eventos de atualização de sessão WhatsApp
    socket.on(`company-${companyId}-whatsappSession`, (data) => {
      // Atualizar QR code quando houver uma atualização para o WhatsApp atual
      if (data.action === "update" && data.session.id === whatsAppId) {
        setQrCode(data.session.qrcode);
      }

      // Fechar o modal se o QR code estiver vazio (indica conexão bem-sucedida)
      if (data.action === "update" && data.session.qrcode === "") {
        onClose();
      }
    });

    // Limpar a conexão ao desmontar o componente
    return () => {
      socket.disconnect();
    };
  }, [whatsAppId, onClose]);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Conexão WhatsApp</DialogTitle>
        </DialogHeader>
        <Card className="border-0 shadow-none">
          <CardContent className="pt-4">
            <p className="text-primary mb-4 text-center">
              Escaneie o código QR abaixo com seu WhatsApp
            </p>
            {qrCode ? (
              <div className="flex justify-center">
                <QRCode value={qrCode} size={256} />
              </div>
            ) : (
              <div className="flex justify-center items-center h-64 w-full">
                <div className="text-center">Aguardando QR Code...</div>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}