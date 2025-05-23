"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, PlusCircle, Users, AlertTriangle, Calendar } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/loading";
import { useScheduleContext } from "@/lib/context/ScheduleContext";
import { useCats } from "@/lib/context/CatsContext";
import { useUserContext } from "@/lib/context/UserContext";
import { useLoading } from "@/lib/context/LoadingContext";
import { Schedule } from "@/lib/types";
import { ScheduleItem } from "@/components/schedule/schedule-item";
import { Button } from "@/components/ui/button";
import { FeedingTimeline } from "@/components/feeding/feeding-timeline";
import Link from "next/link";
import { motion } from "framer-motion";
import { getNextScheduledTime } from "@/lib/utils/dateUtils";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import PageTransition from "@/components/page-transition";
import BottomNav from "@/components/bottom-nav";

export default function SchedulesPage() {
  const router = useRouter();
  const { state: scheduleState, dispatch: scheduleDispatch } = useScheduleContext();
  const { state: userState } = useUserContext();
  const { state: catsState } = useCats();
  const { addLoadingOperation, removeLoadingOperation } = useLoading();
  const { cats, isLoading: isLoadingCats, error: errorCats } = catsState;
  const { schedules, isLoading: isLoadingSchedules, error: errorSchedules } = scheduleState;
  const { currentUser, isLoading: isLoadingUser, error: errorUser } = userState;

  const handleDeleteSchedule = async (scheduleId: string) => {
    const previousSchedules = schedules;
    const opId = `delete-schedule-${scheduleId}`;
    addLoadingOperation({ id: opId, priority: 1, description: "Deleting schedule..." });
    
    scheduleDispatch({ type: "DELETE_SCHEDULE", payload: scheduleId }); 

    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Falha ao excluir agendamento: ${response.statusText}`);
      }
      toast.success("Agendamento excluído com sucesso!");
    } catch (error: any) { 
      console.error("Erro ao deletar agendamento:", error);
      toast.error(`Erro ao excluir: ${error.message}`);
      scheduleDispatch({ type: "SET_SCHEDULES", payload: previousSchedules });
    } finally {
      removeLoadingOperation(opId);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const isLoading = isLoadingUser || isLoadingCats || isLoadingSchedules;
  const combinedError = errorUser || errorCats || errorSchedules;

  if (isLoading) {
    return <Loading text="Carregando dados..." />;
  }

  if (combinedError) {
    return (
      <PageTransition>
        <div className="flex flex-col min-h-screen bg-background">
          <div className="p-4 pb-24 text-center">
            <PageHeader title="Agendamentos" description="Erro ao carregar dados" />
            <EmptyState 
              title="Erro"
              description={combinedError || "Ocorreu um erro inesperado."}
              IconComponent={AlertTriangle}
            />
            <Button onClick={() => router.back()} variant="outline" className="mt-4">Voltar</Button>
          </div>
          <BottomNav />
        </div>
      </PageTransition>
    );
  }

  if (!currentUser) {
    console.log("[SchedulesPage] No currentUser found. Redirecting...");
    useEffect(() => {
        toast.error("Autenticação necessária para ver agendamentos.");
        router.replace("/login?callbackUrl=/schedules");
    }, [router]);
    return <Loading text="Redirecionando para login..." />;
  }
  
  if (!currentUser.householdId) {
    return (
      <PageTransition>
        <div className="flex flex-col min-h-screen bg-background">
          <div className="p-4 pb-24">
            <PageHeader
              title="Agendamentos"
              description="Gerencie os horários de alimentação programados"
            />
            <EmptyState
              IconComponent={Users}
              title="Sem Residência Associada"
              description="Você precisa criar ou juntar-se a uma residência para ver e criar agendamentos."
              actionButton={
                <Button asChild variant="default" className="mt-4">
                  <Link href="/settings">Ir para Configurações</Link>
                </Button>
              }
            />
          </div>
          <BottomNav />
        </div>
      </PageTransition>
    );
  }

  const schedulesToDisplay = schedules;

  // Get the user's timezone from currentUser
  const userTimezone = currentUser.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const timelineEvents = schedulesToDisplay
    .filter(schedule => schedule.enabled)
    .map(schedule => {
      const nextTime = getNextScheduledTime(schedule, userTimezone);
      const cat = cats.find(c => c.id === schedule.catId);
      return {
        id: schedule.id,
        date: nextTime || new Date(),
        title: `Alimentação - ${cat?.name || 'Gato Desconhecido'}`,
        description: schedule.type === 'interval'
          ? `A cada ${schedule.interval} horas`
          : `Horário fixo: ${schedule.times}`,
        status: "Outro" as const
      };
    })
    .filter(event => event.date)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen bg-background">
        <div className="p-4 pb-24">
          <PageHeader
            title="Agendamentos"
            description="Gerencie os horários de alimentação programados"
            icon={<Calendar className="h-6 w-6 text-primary" />}
            actionIcon={<PlusCircle className="h-4 w-4" />}
            actionLabel="Novo Agendamento"
            actionHref="/schedules/new"
          />

          {isLoading && schedulesToDisplay.length === 0 && (
             <Loading text="Carregando agendamentos..." />
          )}

          {!isLoading && schedulesToDisplay.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                IconComponent={Clock}
                title="Sem agendamentos criados"
                description={
                  cats.length === 0
                    ? "Cadastre seus gatos primeiro para poder criar agendamentos."
                    : "Você ainda não criou nenhum agendamento para esta residência."
                }
                actionButton={
                  <Button asChild variant="default">
                    <Link href={cats.length === 0 ? "/cats/new" : "/schedules/new"}>
                      {cats.length === 0 ? "Cadastrar Gato" : "Criar Primeiro Agendamento"}
                    </Link>
                  </Button>
                }
              />
            </div>
          ) : (
             !isLoading && (
               <>
                 <h2 className="text-lg font-semibold mt-6 mb-3">Agendamentos Ativos</h2>
                 <motion.div
                   className="space-y-3"
                   variants={containerVariants}
                   initial="hidden"
                   animate="visible"
                 >
                   {schedulesToDisplay
                     .filter(schedule => schedule.enabled)
                     .sort((a, b) => {
                       const aTime = getNextScheduledTime(a, userTimezone);
                       const bTime = getNextScheduledTime(b, userTimezone);
                       return (aTime?.getTime() || Infinity) - (bTime?.getTime() || Infinity);
                     })
                     .map((schedule: Schedule) => (
                       <motion.div key={schedule.id} variants={itemVariants}>
                         <ScheduleItem
                           schedule={schedule}
                           onView={() => router.push(`/schedules/${schedule.id}`)}
                           onEdit={() => router.push(`/schedules/${schedule.id}/edit`)}
                           onDelete={() => handleDeleteSchedule(schedule.id)}
                         />
                       </motion.div>
                     ))}
                 </motion.div>

                 {timelineEvents.length > 0 && (
                   <div className="mt-8">
                     <h2 className="text-lg font-semibold mb-4">Próximas Alimentações Agendadas</h2>
                     <FeedingTimeline events={timelineEvents.slice(0, 5)} />
                   </div>
                 )}
               </>
             )
          )}
        </div>
        <BottomNav />
      </div>
    </PageTransition>
  );
} 