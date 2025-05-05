'use client';
// app/settings/connections/page.tsx

import React, { useCallback, useState } from 'react';
import axios from 'axios';
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";
import { useWhatsApps } from '@/hooks/useWhatsApps';
import MainContainer from '@/components/MainContainer';
import ConfirmationModal from '@/components/ConfirmationModal';
import { BaileysSession, SSEEvent } from "@/types/baileys";
import baileysService from '@/services/baileysService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TableRowSkeleton from '@/components/TableRowSkeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, Crop, Edit, RefreshCw, SignalMedium, SignalZero, Trash } from 'lucide-react';
import WhatsAppModal from '@/components/WhatsAppModal';
import QrcodeModal from '@/components/QrcodeModal';

interface CustomToolTipProps {
    title: string;
    content?: string;
    children: React.ReactNode;
}

const CustomToolTip: React.FC<CustomToolTipProps> = ({
    title,
    content,
    children
}) => {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                    <p className="font-medium mb-1">{title}</p>
                    {content && <p className="text-sm text-muted-foreground">{content}</p>}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default function ConnectionsPage() {
    const { whatsApps, loading } = useWhatsApps();
    const [selectedWhatsApp, setSelectedWhatsApp] = useState<BaileysSession | null>(null);
    const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [result, setResult] = useState(null);
    const [sessionId, setSessionId] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [message, setMessage] = useState('');
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    const confirmationModalInitialState = {
        action: "",
        title: "",
        message: "",
        whatsAppId: "",
        open: false,
    };
    const [confirmModalInfo, setConfirmModalInfo] = useState(
        confirmationModalInitialState
    );

    const handleSubmitConfirmationModal = async () => {
        if (confirmModalInfo.action === "disconnect") {
            try {
                const response = await baileysService.disconnectSession(confirmModalInfo.whatsAppId);
                if (response.success) {
                    toast.success("Sessão do WhatsApp desconectada!");
                    fetchWhatsApps();
                } else {
                    toast.error(`Erro ao desconectar: ${response.error || 'Falha na requisição'}`);
                }
            } catch (err) {
                console.error("Erro ao desconectar sessão:", err);
                toast.error("Ocorreu um erro ao desconectar a sessão.");
            }
        }

        if (confirmModalInfo.action === "delete") {
            try {
                const response = await baileysService.deleteSession(confirmModalInfo.whatsAppId);
                if (response.success) {
                    toast.success("Conexão com o WhatsApp excluída com sucesso!");
                    fetchWhatsApps();
                } else {
                    toast.error(`Erro ao excluir: ${response.error || 'Falha na requisição'}`);
                }
            } catch (err) {
                console.error("Erro ao excluir sessão:", err);
                toast.error("Ocorreu um erro ao excluir a sessão.");
            }
        }

        setConfirmModalInfo(confirmationModalInitialState);
        setConfirmModalOpen(false);
    };

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

    const handleOpenConfirmationModal = (action: string, whatsAppId: string) => {
        if (action === "disconnect") {
            setConfirmModalInfo({
                action: action,
                title: "Desconectar",
                message: "Tem certeza? Você precisará ler o QR Code novamente.",
                open: true,
                whatsAppId: whatsAppId,
            });
        }

        if (action === "delete") {
            setConfirmModalInfo({
                action: action,
                title: "Deletar",
                message: "Você tem certeza? Essa ação não pode ser revertida.",
                open: true,
                whatsAppId: whatsAppId,
            });
        }
        setConfirmModalOpen(true);
    };

    const handleStartWhatsAppSession = async (whatsAppId: string) => {
        try {
            const response = await baileysService.startSession(whatsAppId);
            if (response.success) {
                toast.info("Iniciando sessão de WhatsApp...");
                fetchWhatsApps();
            } else {
                toast.error(`Erro ao iniciar sessão: ${response.error || 'Falha na requisição'}`);
            }
        } catch (err) {
            console.error("Erro ao iniciar sessão:", err);
            toast.error("Ocorreu um erro ao iniciar a sessão.");
        }
    };

    const handleRequestNewQrCode = async (whatsAppId: string) => {
        try {
            const response = await baileysService.requestNewQrCode(whatsAppId);
            if (response.success) {
                toast.info("Gerando novo QR Code...");
                fetchWhatsApps();
            } else {
                toast.error(`Erro ao gerar QR code: ${response.error || 'Falha na requisição'}`);
            }
        } catch (err) {
            console.error("Erro ao gerar QR code:", err);
            toast.error("Ocorreu um erro ao gerar novo QR code.");
        }
    };

    const handleOpenWhatsAppModal = () => {
        setSelectedWhatsApp(null);
        setWhatsAppModalOpen(true);
    };

    const handleCloseWhatsAppModal = useCallback(() => {
        setWhatsAppModalOpen(false);
        setSelectedWhatsApp(null);
    }, []);

    const handleOpenQrModal = (whatsApp: BaileysSession) => {
        setSelectedWhatsApp(whatsApp);
        setQrModalOpen(true);
    };

    const handleCloseQrModal = useCallback(() => {
        setQrModalOpen(false);
        setSelectedWhatsApp(null);
    }, []);

    const handleEditWhatsApp = (whatsApp: BaileysSession) => {
        setSelectedWhatsApp(whatsApp);
        setWhatsAppModalOpen(true);
    };

    const renderActionButtons = (whatsApp: BaileysSession) => {
        const status = whatsApp.status;

        return (
            <>
                {(status === 'qrcode' || status === 'SCAN_QR_CODE' || status === 'wait_for_qrcode_auth') && (
                    <Button
                        size="sm"
                        variant="default"
                        onClick={() => {
                            console.log('Abrindo QR code para sessão:', whatsApp.id);
                            handleOpenQrModal(whatsApp);
                        }}
                    >
                        QR CODE
                    </Button>
                )}
                {status === 'DISCONNECTED' && (
                    <>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartWhatsAppSession(whatsApp.id)}
                        >
                            Tentar novamente
                        </Button>{" "}
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRequestNewQrCode(whatsApp.id)}
                        >
                            Novo QR CODE
                        </Button>
                    </>
                )}
                {(status === 'CONNECTED' ||
                    status === 'PAIRING' ||
                    status === 'TIMEOUT') && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                handleOpenConfirmationModal("disconnect", whatsApp.id);
                            }}
                        >
                            DESCONECTAR
                        </Button>
                    )}
                {status === 'OPENING' && (
                    <Button size="sm" variant="outline" disabled>
                        Conectando
                    </Button>
                )}
            </>
        );
    };

    const renderStatusToolTips = (whatsApp: BaileysSession) => {
        const status = whatsApp.status;

        return (
            <div className="flex items-center justify-center">
                {status === 'DISCONNECTED' && (
                    <CustomToolTip
                        title="Falha ao iniciar sessão do WhatsApp"
                        content="Certifique-se de que seu celular esteja conectado à internet e tente novamente, ou solicite um novo QR Code"
                    >
                        <SignalMedium className="text-red-500" />
                    </CustomToolTip>
                )}
                {status === 'OPENING' && (
                    <RefreshCw size={24} className="animate-spin text-yellow-500" />
                )}
                {status === 'qrcode' && (
                    <CustomToolTip
                        title="Esperando leitura do QR Code"
                        content="Clique no botão 'QR CODE' e leia o QR Code com o seu celular para iniciar a sessão"
                    >
                        <Crop className="text-blue-500" />
                    </CustomToolTip>
                )}
                {status === 'CONNECTED' && (
                    <CustomToolTip title="Conexão estabelecida!">
                        {/* Triângulo verde como na imagem da referência */}
                        <div className="w-0 h-0 
					 border-l-[8px] border-l-transparent 
					 border-r-[8px] border-r-transparent 
					 border-b-[16px] border-b-green-500"></div>
                    </CustomToolTip>
                )}
                {(status === 'TIMEOUT' || status === 'PAIRING') && (
                    <CustomToolTip
                        title="A conexão com o celular foi perdida"
                        content="Certifique-se de que seu celular esteja conectado à internet e o WhatsApp esteja aberto, ou clique no botão 'Desconectar' para obter um novo QR Code"
                    >
                        <SignalZero className="text-orange-500" />
                    </CustomToolTip>
                )}
            </div>
        );
    };

    return (
        <MainContainer>
            <ConfirmationModal
                title={confirmModalInfo.title}
                open={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleSubmitConfirmationModal}
            >
                {confirmModalInfo.message}
            </ConfirmationModal>

            {/* QR Code Modal */}
			<QrcodeModal
				open={qrModalOpen}
				onClose={handleCloseQrModal}
				whatsAppId={!whatsAppModalOpen ? Number(selectedWhatsApp?.id) || null : null}
			/>

            {/* WhatsApp Modal */}
            <WhatsAppModal
                open={whatsAppModalOpen}
                onClose={handleCloseWhatsAppModal}
                whatsAppId={selectedWhatsApp}
            />

            <div className="flex justify-between items-center mb-4">
                <h1 className="text-purple-600 text-2xl font-medium">Conexões WhatsApp</h1>
                <Button
                    variant="default"
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={handleOpenWhatsAppModal}
                >
                    ADICIONAR WHATSAPP
                </Button>
            </div>

            <Card className="w-full border border-gray-200 rounded-md shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-white border-b">
                            <TableHead className="py-3 text-center font-medium">
                                Nome
                            </TableHead>
                            <TableHead className="py-3 text-center font-medium">
                                Status
                            </TableHead>
                            <TableHead className="py-3 text-center font-medium">
                                Sessão
                            </TableHead>
                            <TableHead className="py-3 text-center font-medium">
                                Última atualização
                            </TableHead>
                            <TableHead className="py-3 text-center font-medium">
                                Padrão
                            </TableHead>
                            <TableHead className="py-3 text-center font-medium">
                                Ações
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRowSkeleton columns={6} />
                        ) : (
                            whatsApps.length > 0 ? (
                                whatsApps.map(whatsApp => (
                                    <TableRow key={whatsApp.id} className="border-b">
                                        <TableCell className="text-center py-4">
                                            {whatsApp.name || whatsApp.sessionName || "ConversaExpress"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {renderStatusToolTips(whatsApp)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {renderActionButtons(whatsApp)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {whatsApp.updatedAt ?
                                                format(parseISO(whatsApp.updatedAt), "dd/MM/yy HH:mm") :
                                                format(new Date(), "dd/MM/yy HH:mm")}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {whatsApp.isDefault && (
                                                <div className="flex justify-center">
                                                    <CheckCircle className="h-6 w-6 text-green-500" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditWhatsApp(whatsApp)}
                                                    className="text-gray-500 hover:text-gray-700"
                                                >
                                                    <Edit className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenConfirmationModal("delete", whatsApp.id)}
                                                    className="text-gray-500 hover:text-gray-700"
                                                >
                                                    <Trash className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <div className="flex flex-col items-center justify-center">
                                            <p className="text-gray-500 mb-2">Nenhuma conexão encontrada</p>
                                            <Button
                                                variant="default"
                                                className="bg-purple-600 hover:bg-purple-700"
                                                onClick={handleOpenWhatsAppModal}
                                            >
                                                Adicionar WhatsApp
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        )}
                    </TableBody>
                </Table>
            </Card>
        </MainContainer>
    );
}