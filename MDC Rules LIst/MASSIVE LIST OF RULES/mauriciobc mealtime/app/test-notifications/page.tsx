"use client";

import React from "react";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotifications } from "@/lib/context/NotificationContext";
import { createNotification, scheduleNotification } from "@/lib/services/notificationService";
import { useUserContext } from "@/lib/context/UserContext";
import { toast } from "sonner";
import { NotificationType, CreateNotificationPayload } from "@/lib/types/notification";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { resolveDateFnsLocale } from "@/lib/utils/dateFnsLocale";
import { useCats } from "@/lib/context/CatsContext";
// import { initializeCronJobs } from '../lib/services/cron-service.ts';

interface LogEntry {
  timestamp: Date;
  type: NotificationType;
  title: string;
  message: string;
  status: "success" | "error" | "info";
  details?: {
    payload?: any;
    response?: any;
    error?: any;
    context?: any;
    errorObject?: any;
  };
}

export default function TestNotificationsPage() {
  console.log("[TestNotificationsPage] Rendering...");
  const { 
    notifications, 
    isLoading: notificationsLoading, 
    error: notificationsError,
    refreshNotifications,
    unreadCount,
    isLoading: contextIsLoading,
    page,
    totalPages,
    hasMore
  } = useNotifications();
  const { state: userState } = useUserContext();
  const { state: catsState } = useCats();
  const { cats, isLoading: catsLoading, error: catsError } = catsState;
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const userLanguage = userState.currentUser?.preferences?.language;
  const userLocale = resolveDateFnsLocale(userLanguage);
  const [intervalMinutes, setIntervalMinutes] = useState(0);
  const [intervalSeconds, setIntervalSeconds] = useState(0);
  const [selectedCatId, setSelectedCatId] = useState<string>(cats[0]?.id || "");
  // State for scheduling form
  const [form, setForm] = useState({
    type: '',
    title: '',
    message: '',
    deliverAt: '',
    catId: '',
  });
  const [isScheduling, setIsScheduling] = useState(false);

  console.log("[TestNotificationsPage] Context State:", {
    notificationsCount: notifications.length,
    unreadCount,
    contextIsLoading,
    contextError: notificationsError,
    page,
    totalPages,
    hasMore,
    componentIsLoading: isLoading
  });
  console.log("[TestNotificationsPage] User State:", userState);

  const addLog = useCallback((log: LogEntry) => {
    console.log("[TestNotificationsPage] Adding log entry:", log);
    setLogs(prevLogs => [log, ...prevLogs]);
  }, []);

  const handleCreateNotification = useCallback(async (type: NotificationType, title: string, message: string) => {
    console.log(`[TestNotificationsPage] handleCreateNotification called with: type=${type}, title=${title}, message=${message}`);
    if (!type || !title || !message) {
      const errorMsg = "Todos os campos são obrigatórios";
      console.error(`[TestNotificationsPage] Validation failed: ${errorMsg}`);
      toast.error(errorMsg);
      addLog({
        timestamp: new Date(),
        type: type || 'info', // Use provided type or default
        title: title || 'Validation Error',
        message: message || 'Missing fields',
        status: "error",
        details: {
          error: errorMsg,
          context: { type, title, message }
        }
      });
      return;
    }

    if (!userState.currentUser?.id) {
      const errorMsg = "Usuário não autenticado";
      console.error(`[TestNotificationsPage] Auth failed: ${errorMsg}`);
      toast.error(errorMsg);
      addLog({
        timestamp: new Date(),
        type,
        title,
        message,
        status: "error",
        details: {
          error: errorMsg,
          context: { currentUser: userState.currentUser }
        }
      });
      return;
    }

    console.log("[TestNotificationsPage] Setting loading state to true");
    setIsLoading(true);

    try {
      const payload: Omit<CreateNotificationPayload, 'userId' | 'householdId'> = {
        type,
        title,
        message,
        metadata: { 
            // Include any relevant metadata if needed, e.g., action_url
            // icon: getIconForType(type) // Example if you have such a function
        }
      };
      console.log("[TestNotificationsPage] Calling createNotification service with simplified payload:", payload);

      const response = await createNotification(payload);
      console.log("[TestNotificationsPage] createNotification service responded:", response);
      
      addLog({
        timestamp: new Date(),
        type,
        title,
        message,
        status: "success",
        details: {
          payload,
          response
        }
      });

      console.log("[TestNotificationsPage] Notification created successfully. Calling refreshNotifications.");
      toast.success("Notificação criada com sucesso!");
      await refreshNotifications();
      console.log("[TestNotificationsPage] refreshNotifications completed.");
      
    } catch (error) {
      console.error("[TestNotificationsPage] Error creating notification:", error);
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido ao criar notificação";
      
      addLog({
        timestamp: new Date(),
        type,
        title,
        message,
        status: "error",
        details: {
          error: errorMsg,
          errorObject: error,
          context: {
            currentUser: userState.currentUser,
            payload: { type, title, message }
          }
        }
      });
      
      toast.error(errorMsg);
    } finally {
      console.log("[TestNotificationsPage] Setting loading state to false");
      setIsLoading(false);
    }
  }, [userState.currentUser, addLog, refreshNotifications]);

  const handleScheduleNotification = useCallback(async (type: NotificationType, title: string, message: string) => {
    console.log(`[TestNotificationsPage] handleScheduleNotification called with: type=${type}, title=${title}, message=${message}, minutes=${intervalMinutes}, seconds=${intervalSeconds}`);
    if (!type || !title || !message) {
      const errorMsg = "Todos os campos são obrigatórios";
      toast.error(errorMsg);
      addLog({
        timestamp: new Date(),
        type: type || 'info',
        title: title || 'Validation Error',
        message: message || 'Missing fields',
        status: "error",
        details: { error: errorMsg, context: { type, title, message } }
      });
      return;
    }
    if (!userState.currentUser?.id) {
      const errorMsg = "Usuário não autenticado";
      toast.error(errorMsg);
      addLog({
        timestamp: new Date(),
        type,
        title,
        message,
        status: "error",
        details: { error: errorMsg, context: { currentUser: userState.currentUser } }
      });
      return;
    }
    setIsLoading(true);
    try {
      // For demo: schedule an interval feeding with a short interval (e.g., 0.0083 hours ≈ 30 seconds)
      // In a real UI, let user select cat and type, and set interval/times accordingly
      const interval = (intervalMinutes * 60 + intervalSeconds) / 3600; // hours
      const payload: any = {
        catId: selectedCatId,
        type: "interval",
        interval: interval > 0 ? interval : 0.0083, // fallback to 30s if 0
        enabled: true,
      };
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'X-User-ID': userState.currentUser.id,
      };
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Falha ao criar agendamento");
      }
      const newSchedule = await response.json();
      addLog({
        timestamp: new Date(),
        type,
        title,
        message: `Agendamento criado para o catId ${selectedCatId} (${intervalMinutes}m ${intervalSeconds}s)`,
        status: "success",
        details: { payload, response: newSchedule }
      });
      toast.success("Agendamento criado com sucesso!");
      await refreshNotifications();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido ao agendar notificação";
      addLog({
        timestamp: new Date(),
        type,
        title,
        message,
        status: "error",
        details: { error: errorMsg, errorObject: error, context: { currentUser: userState.currentUser } }
      });
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [userState.currentUser, addLog, refreshNotifications, intervalMinutes, intervalSeconds, selectedCatId]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate deliverAt is in the future
    const deliverAtDate = new Date(form.deliverAt);
    if (isNaN(deliverAtDate.getTime()) || deliverAtDate <= new Date()) {
      toast.error('A data/hora de entrega deve ser no futuro.');
      return;
    }
    setIsScheduling(true);
    try {
      await scheduleNotification({
        type: form.type,
        title: form.title,
        message: form.message,
        deliverAt: deliverAtDate.toISOString(),
        catId: form.catId || undefined,
      });
      toast.success('Notificação agendada com sucesso!');
      setForm({ type: '', title: '', message: '', deliverAt: '', catId: '' });
    } catch (err: any) {
      toast.error('Falha ao agendar notificação: ' + (err?.message || 'Erro desconhecido'));
    } finally {
      setIsScheduling(false);
    }
  };

  const notificationTypes = [
    {
      type: "feeding" as NotificationType,
      title: "Hora de Alimentar",
      message: "É hora de alimentar o gato!",
      description: "Notificação de alimentação programada"
    },
    {
      type: "reminder" as NotificationType,
      title: "Lembrete de Alimentação",
      message: "Não se esqueça de alimentar o gato!",
      description: "Lembrete de alimentação pendente"
    },
    {
      type: "household" as NotificationType,
      title: "Atualização da Casa",
      message: "Novo membro adicionado à casa",
      description: "Notificação relacionada a membros da casa"
    },
    {
      type: "system" as NotificationType,
      title: "Atualização do Sistema",
      message: "Nova versão disponível",
      description: "Notificação do sistema"
    },
    {
      type: "info" as NotificationType,
      title: "Informação",
      message: "Informação importante sobre seu gato",
      description: "Notificação informativa"
    },
    {
      type: "warning" as NotificationType,
      title: "Aviso",
      message: "Atenção: Gato não alimentado",
      description: "Notificação de aviso"
    },
    {
      type: "error" as NotificationType,
      title: "Erro",
      message: "Erro ao processar alimentação",
      description: "Notificação de erro"
    }
  ];

  const getStatusColor = (status: LogEntry["status"]) => {
    switch (status) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-destructive";
      case "info":
        return "text-blue-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusText = (status: LogEntry["status"]) => {
    switch (status) {
      case "success":
        return "Sucesso";
      case "error":
        return "Erro";
      case "info":
        return "Info";
      default:
        return "Desconhecido";
    }
  };

  useEffect(() => {
    if (cats.length > 0 && !selectedCatId) {
      setSelectedCatId(cats[0].id);
    }
  }, [cats, selectedCatId]);

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Schedule Notification Form (for testing only) */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Agendar Notificação (Teste)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSchedule} className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-sm font-medium">Tipo</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleFormChange}
                  className="input input-bordered rounded px-2 py-1"
                  required
                >
                  <option value="">Selecione</option>
                  <option value="feeding">Alimentação</option>
                  <option value="reminder">Lembrete</option>
                  <option value="system">Sistema</option>
                  <option value="info">Informação</option>
                  <option value="warning">Aviso</option>
                  <option value="error">Erro</option>
                </select>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-sm font-medium">Título</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  className="input input-bordered rounded px-2 py-1"
                  required
                  maxLength={100}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Mensagem</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleFormChange}
                className="input input-bordered rounded px-2 py-1"
                required
                maxLength={500}
                rows={2}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-sm font-medium">Data/Hora de Entrega</label>
                <input
                  type="datetime-local"
                  name="deliverAt"
                  value={form.deliverAt}
                  onChange={handleFormChange}
                  className="input input-bordered rounded px-2 py-1"
                  required
                />
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-sm font-medium">Cat ID (opcional)</label>
                <input
                  name="catId"
                  value={form.catId}
                  onChange={handleFormChange}
                  className="input input-bordered rounded px-2 py-1"
                  placeholder="ID do gato (opcional)"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isScheduling} className="min-w-[140px]">
                {isScheduling ? "Agendando..." : "Agendar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Teste de Notificações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
            <label className="flex items-center gap-2">
              Gato:
              <select
                value={selectedCatId}
                onChange={e => setSelectedCatId(e.target.value)}
                className="w-48 border rounded px-2 py-1"
                disabled={catsLoading || cats.length === 0}
              >
                {cats.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              Minutos:
              <input
                type="number"
                min={0}
                value={intervalMinutes}
                onChange={e => setIntervalMinutes(Number(e.target.value))}
                className="w-16 border rounded px-2 py-1"
              />
            </label>
            <label className="flex items-center gap-2">
              Segundos:
              <input
                type="number"
                min={0}
                max={59}
                value={intervalSeconds}
                onChange={e => setIntervalSeconds(Number(e.target.value))}
                className="w-16 border rounded px-2 py-1"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notificationTypes.map((type) => (
              <div key={type.type} className="flex flex-col gap-2">
                <Button
                  onClick={() => handleCreateNotification(type.type, type.title, type.message)}
                  disabled={isLoading || notificationsLoading}
                  className="w-full"
                >
                  {isLoading ? "Criando..." : type.description}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleScheduleNotification(type.type, type.title, type.message)}
                  disabled={isLoading || notificationsLoading}
                  className="w-full"
                >
                  {isLoading ? "Agendando..." : `Agendar (${type.description})`}
                </Button>
              </div>
            ))}
          </div>
          {notificationsError && (
            <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
              {notificationsError}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-lg",
                    log.status === "error" && "bg-destructive/10",
                    log.status === "success" && "bg-emerald-500/10",
                    log.status === "info" && "bg-accent"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {format(log.timestamp, "dd/MM/yyyy HH:mm:ss")}
                    </span>
                    <span className={cn(
                      "text-xs font-medium",
                      log.status === "error" && "text-destructive",
                      log.status === "success" && "text-emerald-500",
                      log.status === "info" && "text-primary"
                    )}>
                      {log.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2">
                    <h4 className="text-sm font-medium">{log.title}</h4>
                    <p className="text-xs text-muted-foreground">{log.message}</p>
                    {log.details && (
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
} 