import React, { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import { Card, CardContent } from "./ui/card";
import { Loader2 } from "lucide-react";
import QueueSelect from "./QueueSelect";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";

interface WhatsAppModalProps {
  open: boolean;
  onClose: () => void;
  whatsAppId?: string;
}

const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  open,
  onClose,
  whatsAppId
}) => {
  // Estado inicial com os campos adicionais conforme o código compartilhado
  const initialState = {
    name: "",
    isDefault: false,
    id: "",
    status: "DISCONNECTED",
    updatedAt: new Date().toISOString()
  };
  const [selectedQueueIds, setSelectedQueueIds] = useState([]);
  const [selectedQueueId, setSelectedQueueId] = useState(null)
  const [queues, setQueues] = useState([]);
  const [whatsApp, setWhatsApp] = useState(initialState);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [prompts, setPrompts] = useState([]);

  useEffect(() => {
    const fetchWhatsAppDetails = async () => {
      if (!whatsAppId) return;

      try {
        // Usando fetch em vez de axios
        const response = await fetch(`/api/whatsapp/${whatsAppId}?session=0`);

        if (!response.ok) {
          throw new Error(`Erro ao buscar WhatsApp: ${response.status}`);
        }

        const data = await response.json();

        // Atualizar estado do WhatsApp
        setWhatsApp(data);

        // Extrair IDs das filas relacionadas
        const whatsQueueIds = data.queues?.map((queue) => queue.id) || [];
        setSelectedQueueIds(whatsQueueIds);

        // Configurar fila de transferência
        setSelectedQueueId(data.transferQueueId);
      } catch (err) {
        // Usando o toast padrão em vez do toastError customizado
        console.error("Erro ao buscar detalhes do WhatsApp:", err);
        toast.error(err instanceof Error ? err.message : "Erro ao carregar detalhes do WhatsApp");
      }
    };

    fetchWhatsAppDetails();
  }, [whatsAppId]);

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await fetch('/api/prompt');

        if (!response.ok) {
          throw new Error(`Erro ao buscar prompts: ${response.status}`);
        }

        const data = await response.json();
        setPrompts(data.prompts);
      } catch (err) {
        console.error("Erro ao buscar prompts:", err);
        toast.error(err instanceof Error ? err.message : "Erro ao carregar prompts");
      }
    };

    fetchPrompts();
  }, [whatsAppId]);

  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const response = await fetch('/api/queue');

        if (!response.ok) {
          throw new Error(`Erro ao buscar filas: ${response.status}`);
        }

        const data = await response.json();
        setQueues(data);
      } catch (err) {
        console.error("Erro ao buscar filas:", err);
        toast.error(err instanceof Error ? err.message : "Erro ao carregar filas");
      }
    };

    fetchQueues();
  }, []);

  const handleSaveWhatsApp = async (values) => {
    try {
      const { id, ...valuesWithoutId } = values;

      // Preparar os dados para envio
      const whatsappData = {
        ...valuesWithoutId,
        queueIds: selectedQueueIds,
        transferQueueId: selectedQueueId || 0,
        promptId: selectedPrompt ? selectedPrompt : null,
        status: whatsApp.status,
        battery: "",
        plugged: values.plugged === true || values.plugged === "true",
        retries: 2,
        greetingMessage: values.greetingMessage,
        farewellMessage: values.farewellMessage,
        completionMessage: values.completionMessage,
        outOfHoursMessage: values.outOfHoursMessage,
        ratingMessage: values.ratingMessage,
        complationMessage: values.complationMessage,
        provider: "stable",
        isDefault: false,
        createdAt: new Date().toISOString(),
        expiresTicket: 0,
        expiresInactiveMessage: values.expiresInactiveMessage,
        timeToTransfer: values.timeToTransfer,
        qrcode: "",
        session: values.session || "",
        companyId: "",
        token: values.token,
        integrationId: values.integrationId || 0,
        maxUseBotQueues: 3,
        timeUseBotQueues: "",
        updatedAt: whatsApp.updatedAt
      };

      // Remover campos desnecessários
      delete whatsappData["queues"];
      delete whatsappData["session"];

      // Definir opções para a requisição fetch
      const fetchOptions = {
        method: whatsAppId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(whatsappData),
      };

      // Definir a URL de destino
      const url = whatsAppId
        ? `/api/whatsapp/${whatsAppId}`
        : '/api/whatsapp';

      // Executar a requisição
      const response = await fetch(url, fetchOptions);

      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      // Processar resposta bem-sucedida
      const result = await response.json();

      toast.success("WhatsApp salvo com sucesso!");

      // Fechar o modal
      handleClose();

      return result;
    } catch (error) {
      // Melhor tratamento de erros
      console.error('Erro ao salvar WhatsApp:', error);

      // Usar toast.error em vez de toastError
      toast.error(error instanceof Error ? error.message : "Erro ao salvar WhatsApp");

      return null;
    }
  };

  const handleChangeQueue = (e) => {
    setSelectedQueueIds(e);
    setSelectedPrompt(null);
  };

  const handleChangePrompt = (e) => {
    setSelectedPrompt(e.target.value);
    setSelectedQueueIds([]);
  };

  // Função para fechar o modal
  const handleClose = () => {
    onClose();
    setWhatsApp(initialState);
    setSelectedQueueId(null);
    setSelectedQueueIds([]);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden flex flex-col h-[90vh]">
        <DialogHeader className="px-6 pt-6 sticky top-0 bg-background z-10">
          <DialogTitle>
            {whatsAppId ? "Editar WhatsApp" : "Adicionar WhatsApp"}
          </DialogTitle>
        </DialogHeader>

        {/* Conteúdo do formulário com rolagem nativa */}
        <div className="flex-grow overflow-y-auto px-6 py-4">
          <Formik
            initialValues={whatsApp}
            enableReinitialize={true}
            onSubmit={(values, actions) => {
              setTimeout(() => {
                handleSaveWhatsApp(values);
                actions.setSubmitting(false);
              }, 400);
            }}
          >
            {({ values, touched, errors, isSubmitting, handleSubmit }) => (
              <Form id="whatsapp-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Field
                      as={Input}
                      id="name"
                      name="name"
                      className={errors.name && touched.name ? "border-red-500" : ""}
                    />
                    {errors.name && touched.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Field name="isDefault">
                      {({ field }) => (
                        <Switch
                          id="isDefault"
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange({
                              target: { name: "isDefault", value: checked }
                            });
                          }}
                        />
                      )}
                    </Field>
                    <Label htmlFor="isDefault">Padrão</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="greetingMessage">Mensagem de saudação</Label>
                  <Field
                    as={Textarea}
                    id="greetingMessage"
                    name="greetingMessage"
                    rows={4}
                    className={errors.greetingMessage && touched.greetingMessage ? "border-red-500" : ""}
                  />
                  {errors.greetingMessage && touched.greetingMessage && (
                    <p className="text-red-500 text-sm mt-1">{errors.greetingMessage}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="complationMessage">Mensagem de conclusão</Label>
                  <Field
                    as={Textarea}
                    id="complationMessage"
                    name="complationMessage"
                    rows={4}
                    className={errors.complationMessage && touched.complationMessage ? "border-red-500" : ""}
                  />
                  {errors.complationMessage && touched.complationMessage && (
                    <p className="text-red-500 text-sm mt-1">{errors.complationMessage}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="outOfHoursMessage">Mensagem de fora de expediente</Label>
                  <Field
                    as={Textarea}
                    id="outOfHoursMessage"
                    name="outOfHoursMessage"
                    rows={4}
                    className={errors.outOfHoursMessage && touched.outOfHoursMessage ? "border-red-500" : ""}
                  />
                  {errors.outOfHoursMessage && touched.outOfHoursMessage && (
                    <p className="text-red-500 text-sm mt-1">{errors.outOfHoursMessage}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="ratingMessage">Mensagem de avaliação</Label>
                  <Field
                    as={Textarea}
                    id="ratingMessage"
                    name="ratingMessage"
                    rows={4}
                    className={errors.ratingMessage && touched.ratingMessage ? "border-red-500" : ""}
                  />
                  {errors.ratingMessage && touched.ratingMessage && (
                    <p className="text-red-500 text-sm mt-1">{errors.ratingMessage}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="token">Token</Label>
                  <Field
                    as={Input}
                    id="token"
                    name="token"
                  />
                </div>

                <QueueSelect
                  selectedQueueIds={selectedQueueIds}
                  onChange={(selectedIds) => handleChangeQueue(selectedIds)}
                />

                <div>
                  <Label htmlFor="promptId">Prompt</Label>
                  <Select
                    onValueChange={handleChangePrompt}
                    value={selectedPrompt || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um prompt" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">Nenhum</SelectItem>
                      {prompts.map((prompt) => (
                        <SelectItem key={prompt.id} value={prompt.id.toString()}>
                          {prompt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-2">Redirecionamento de Fila</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Selecione uma fila para os contatos que não possuem fila serem redirecionados
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="timeToTransfer">Transferir após x (minutos)</Label>
                        <Field
                          as={Input}
                          type="number"
                          id="timeToTransfer"
                          name="timeToTransfer"
                          className={errors.timeToTransfer && touched.timeToTransfer ? "border-red-500" : ""}
                        />
                        {errors.timeToTransfer && touched.timeToTransfer && (
                          <p className="text-red-500 text-sm mt-1">{errors.timeToTransfer}</p>
                        )}
                      </div>

                      <div>
                        <QueueSelect
                          selectedQueueIds={selectedQueueId}
                          onChange={(selectedId) => setSelectedQueueId(selectedId)}
                          multiple={false}
                          title="Fila de Transferência"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="expiresTicket">Encerrar chats abertos após x minutos</Label>
                      <Field
                        as={Input}
                        id="expiresTicket"
                        name="expiresTicket"
                        className={errors.expiresTicket && touched.expiresTicket ? "border-red-500" : ""}
                      />
                      {errors.expiresTicket && touched.expiresTicket && (
                        <p className="text-red-500 text-sm mt-1">{errors.expiresTicket}</p>
                      )}
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="expiresInactiveMessage">Mensagem de encerramento por inatividade</Label>
                      <Field
                        as={Textarea}
                        id="expiresInactiveMessage"
                        name="expiresInactiveMessage"
                        rows={4}
                        className={errors.expiresInactiveMessage && touched.expiresInactiveMessage ? "border-red-500" : ""}
                      />
                      {errors.expiresInactiveMessage && touched.expiresInactiveMessage && (
                        <p className="text-red-500 text-sm mt-1">{errors.expiresInactiveMessage}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Form>
            )}
          </Formik>
        </div>

        {/* Rodapé fixo */}
        <DialogFooter className="px-6 py-4 border-t bg-background sticky bottom-0">
        <Formik
          initialValues={whatsApp}
          enableReinitialize={true}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              handleSaveWhatsApp(values);
              actions.setSubmitting(false);
            }, 400);
          }}
        >
            {({ isSubmitting }) => (
              <div className="flex justify-end gap-2 w-full">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  form="whatsapp-form"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    whatsAppId ? "Salvar" : "Adicionar"
                  )}
                </Button>
              </div>
            )}
          </Formik>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default WhatsAppModal;