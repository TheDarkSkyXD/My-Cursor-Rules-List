"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, ArrowUp, ArrowDown, Edit2, Trash2, FileDown } from 'lucide-react'; // Example icons
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner'; // Import toast from sonner
import { EmptyState } from "@/components/ui/empty-state"; // Import EmptyState
import { ClipboardList, AlertTriangle } from "lucide-react"; // Import icons for EmptyState
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// This type should match the structure returned by your API GET /api/weight-logs
interface WeightLogEntry {
  id: string;
  date: string; // ISO string date
  weight: number;
  notes?: string | null;
  measured_by?: string | null; // User ID or name
  cat_id?: string; // Ensure cat_id is part of the entry if needed for editing/context
}

interface RecentHistoryListProps {
  catId: string;
  userId: string;
  onEditRequest: (log: WeightLogEntry) => void; // Added prop
  onDeleteRequest: (logId: string) => Promise<boolean>; // Added prop, returns promise for success status
  logChangeTimestamp: number; // Added to trigger re-fetch
  // initialLogs?: WeightLogEntry[]; // Could pass initial logs to avoid loading flicker
}

const RecentHistoryList: React.FC<RecentHistoryListProps> = ({ catId, userId, onEditRequest, onDeleteRequest, logChangeTimestamp }) => {
  const [logs, setLogs] = useState<WeightLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768); // md breakpoint
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!catId || !userId) {
      setIsLoading(false);
      // setError(!catId ? 'No Cat ID provided to fetch history.' : 'User ID not provided.');
      // Avoid setting error here if props are not ready, parent should handle this.
      // Let it attempt to fetch if catId/userId become available.
      setLogs([]);
      return;
    }

    const fetchLogs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/weight-logs?catId=${catId}`, {
          headers: {
            'X-User-ID': userId
          }
        });
        if (!response.ok) {
          const errData = await response.json();
          const errorMessage = errData.error || 'Failed to fetch weight logs';
          throw new Error(errorMessage);
        }
        const data: any[] = await response.json(); // Temporarily use any[] for parsing
        
        // Parse weight from string to number
        const parsedData: WeightLogEntry[] = data.map(log => ({
          ...log,
          weight: typeof log.weight === 'string' ? parseFloat(log.weight) : (typeof log.weight === 'number' ? log.weight : 0), // Ensure it's a number, default to 0 if unparsable
          date: log.date // Assuming date is already correctly formatted string
        }));
        
        setLogs(parsedData);
        setError(null); // Clear any previous error on success
      } catch (err) {
        const errorMessage = (err as Error).message;
        setError(errorMessage); // Optionally keep for inline display
        setLogs([]); // Clear logs on error
        toast.error("Erro ao Buscar Histórico", { // Sonner error toast
          description: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [catId, userId, logChangeTimestamp]);

  const handleEdit = (log: WeightLogEntry) => {
    onEditRequest(log);
  };

  const handleDelete = async (logId: string) => {
    // Consider adding a confirmation dialog here using sonner or a custom modal
    // For example: if (!confirm('Are you sure you want to delete this log?')) return;
    try {
      const success = await onDeleteRequest(logId);
      if (success) {
        // toast.success("Registro excluído com sucesso."); // REMOVED: Parent will show the toast
        // The component will now re-fetch due to logChangeTimestamp prop changing in the parent
        // No need to manually call fetchLogs() or refetch() here.
      } else {
        // Deletion was not successful, onDeleteRequest in parent should handle toast for failure.
      }
    } catch (error) {
      console.error("Error during delete operation:", error);
      toast.error("Ocorreu um erro ao tentar excluir o registro.");
    }
  };

  const getTrendIcon = (currentLog: WeightLogEntry, previousLog?: WeightLogEntry) => {
    if (!previousLog) return null;
    if (currentLog.weight > previousLog.weight) return <ArrowUp className="h-4 w-4 text-green-500 ml-1" />;
    if (currentLog.weight < previousLog.weight) return <ArrowDown className="h-4 w-4 text-destructive ml-1" />;
    return null; // Or a neutral icon for no change
  };

  const formattedLogs = useMemo(() => {
    return logs.map((log, index) => {
      const previousLog = logs[index + 1]; // Logs are desc, so previous is next in array
      return {
        ...log,
        displayDate: new Date(log.date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' }),
        trendIcon: getTrendIcon(log, previousLog),
      };
    });
  }, [logs]);

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Histórico de Peso Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 pt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoading && error && logs.length === 0) {
    // Display error state using EmptyState if logs are empty due to an error
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Histórico de Peso Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState 
            IconComponent={AlertTriangle} 
            title="Erro ao Carregar Histórico"
            description={error || "Falha ao carregar o histórico de peso. Verifique as notificações ou tente novamente mais tarde."}
            className="mt-4"
          />
        </CardContent>
      </Card>
    );
  }

  if (!isLoading && !error && formattedLogs.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Histórico de Peso Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            IconComponent={ClipboardList}
            title="Nenhum Histórico de Peso"
            description="Nenhum registro de peso foi feito para este gato ainda. Adicione um novo registro para começar a acompanhar!"
            actionButton={ 
              <Button onClick={() => { /* TODO: Trigger QuickLogPanel or navigate to add log */ console.log('Add new log clicked'); }} >
                Registrar Primeiro Peso
              </Button>
            }
            className="mt-4"
          />
        </CardContent>
      </Card>
    );
  }

  const renderLogItemContent = (log: typeof formattedLogs[0]) => (
    <div className="grid grid-cols-3 gap-2 p-2 text-sm items-center">
      <div className="col-span-3 sm:col-span-1 font-medium flex items-center">
        {log.displayDate}
      </div>
      <div className="col-span-1 sm:col-span-1 flex items-center">
        {log.weight.toFixed(2)} kg {log.trendIcon}
      </div>
      <div className="col-span-2 sm:col-span-1 text-muted-foreground truncate">
        {log.notes || '-'}
      </div>
      {/* Actions will be on the row/accordion item level */}
    </div>
  );
  
  const renderLogItemActions = (log: WeightLogEntry) => (
    <div className="flex items-center justify-end space-x-1">
      <Button variant="ghost" size="icon" onClick={() => handleEdit(log)} aria-label="Editar registro">
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => handleDelete(log.id)} aria-label="Excluir registro" className="text-destructive hover:text-destructive/90">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Histórico de Peso Recente</CardTitle>
        {/* TODO: Add Export Dropdown here if desired when there IS data */}
      </CardHeader>
      <CardContent>
        {isMobile ? (
          <Accordion type="single" collapsible className="w-full">
            {formattedLogs.map((log, index) => (
              <AccordionItem value={`item-${index}`} key={log.id || index}>
                <AccordionTrigger>
                  <div className="flex justify-between items-center w-full pr-2">
                    <span>{log.displayDate}</span>
                    <div className="flex items-center">
                      <span>{log.weight.toFixed(2)} kg</span>
                      {getTrendIcon(log, formattedLogs[index + 1])}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {renderLogItemContent(log)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Peso</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formattedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.displayDate}</TableCell>
                  <TableCell className="flex items-center">{log.weight.toFixed(2)} kg {log.trendIcon}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">{log.notes || '-'}</TableCell>
                  <TableCell className="text-right">{renderLogItemActions(log)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentHistoryList; 