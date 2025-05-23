"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FeedingHistoryProps } from "@/lib/types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/lib/context/UserContext";
import { resolveDateFnsLocale } from "@/lib/utils/dateFnsLocale";

export function FeedingHistory({ logs, onMarkAsFed }: FeedingHistoryProps) {
  const { state: userState } = useUserContext();
  const userLanguage = userState.currentUser?.preferences?.language;
  const userLocale = resolveDateFnsLocale(userLanguage);

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">Nenhum registro de alimentação</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Comece a registrar alimentações para ver o histórico aqui
        </p>
        {onMarkAsFed && (
          <Button onClick={onMarkAsFed} className="gap-2">
            <Utensils className="h-4 w-4" />
            Registrar alimentação agora
          </Button>
        )}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-4">
        {logs.map((log) => {
          const feederName = "Usuário do Sistema";
          
          return (
            <div key={log.id} className="flex items-start gap-3 pb-3 border-b">
              <Clock className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  {format(new Date(log.timestamp), "PPp")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Alimentado por: {feederName}
                </p>
                {log.portionSize && (
                  <Badge variant="outline" className="mt-1">
                    {log.portionSize} porções
                  </Badge>
                )}
                {log.notes && (
                  <p className="text-xs mt-1">{log.notes}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar />
    </ScrollArea>
  );
} 