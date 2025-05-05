'use client';

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, X, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

interface QueueSelectProps {
    selectedQueueIds: number | number[] | null;
    onChange: (selectedIds: any) => void;
    multiple?: boolean;
    title?: string;
}

interface Queue {
    id: number;
    name: string;
    color: string;
}

export default function QueueSelect({
    selectedQueueIds,
    onChange,
    multiple = true,
    title = "Filas"
}: QueueSelectProps) {
    const [queues, setQueues] = useState<Queue[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Buscar filas da API
    useEffect(() => {
        const fetchQueues = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/queue');
                if (!response.ok) {
                    throw new Error('Erro ao buscar filas');
                }
                const data = await response.json();
                setQueues(data);
            } catch (error) {
                console.error("Falha ao carregar filas:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchQueues();
    }, []);

    // Normalizar selectedQueueIds para array
    const selectedIds = Array.isArray(selectedQueueIds)
        ? selectedQueueIds
        : (selectedQueueIds !== null ? [selectedQueueIds] : []);

    // Implementação para seleção múltipla
    if (multiple) {
        return (
            <div className="space-y-2">
                <Label>{title}</Label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                        >
                            {selectedIds.length > 0 ? (
                                <div className="flex flex-wrap gap-1 max-w-[90%] overflow-hidden">
                                    {selectedIds.map(id => {
                                        const queue = queues.find(q => q.id === id);
                                        return queue ? (
                                            <Badge
                                                key={id}
                                                style={{ backgroundColor: queue.color }}
                                                className="px-2 py-0.5 text-white"
                                            >
                                                {queue.name}
                                            </Badge>
                                        ) : null;
                                    })}
                                </div>
                            ) : (
                                <span className="text-muted-foreground">Selecione as filas</span>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Buscar fila..." />
                            <CommandEmpty>Nenhuma fila encontrada.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-y-auto">
                                {queues.map((queue) => {
                                    const isSelected = selectedIds.includes(queue.id);
                                    return (
                                        <CommandItem
                                            key={queue.id}
                                            value={queue.name}
                                            onSelect={() => {
                                                let newSelectedIds: number[];

                                                if (isSelected) {
                                                    // Remover se já estiver selecionado
                                                    newSelectedIds = selectedIds.filter(
                                                        (id) => id !== queue.id
                                                    );
                                                } else {
                                                    // Adicionar se não estiver selecionado
                                                    newSelectedIds = [...selectedIds, queue.id];
                                                }

                                                onChange(newSelectedIds);
                                            }}
                                        >
                                            <div className="flex items-center gap-2 w-full">
                                                <div
                                                    className="h-3 w-3 rounded-full shrink-0"
                                                    style={{ backgroundColor: queue.color }}
                                                />
                                                <span className="truncate">{queue.name}</span>
                                                <Check
                                                    className={cn(
                                                        "ml-auto h-4 w-4 shrink-0",
                                                        isSelected ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                            </div>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                            {selectedIds.length > 0 && (
                                <div className="border-t p-2">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-center text-sm"
                                        onClick={() => {
                                            onChange([]);
                                            setOpen(false);
                                        }}
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Limpar seleção
                                    </Button>
                                </div>
                            )}
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
        );
    }
}