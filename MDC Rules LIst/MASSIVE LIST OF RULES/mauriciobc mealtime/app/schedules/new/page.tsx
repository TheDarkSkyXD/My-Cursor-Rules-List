"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Cat as CatIcon, AlertTriangle, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CatType } from "@/lib/types";
import { PageTransition } from "@/components/ui/page-transition";
import { SimpleTimePicker } from "@/components/ui/simple-time-picker";
import { toast } from "sonner";
import { format } from "date-fns";
import { useScheduleContext } from "@/lib/context/ScheduleContext";
import { useCats } from "@/lib/context/CatsContext";
import { useUserContext } from "@/lib/context/UserContext";
import { useLoading } from "@/lib/context/LoadingContext";
import { Loading } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/page-header";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const formSchema = z.object({
  catId: z.string({ required_error: "Selecione um gato." }).uuid({ message: "ID do gato inválido." }),
  type: z.enum(["interval", "fixedTime"], { required_error: "Selecione um tipo." }),
  interval: z.string().optional(),
  times: z.string().optional(),
  enabled: z.boolean().default(true),
}).refine(data => {
    if (data.type === 'interval') {
        const intervalNum = parseInt(data.interval || "0");
        return data.interval && !isNaN(intervalNum) && intervalNum >= 1 && intervalNum <= 48;
    }
    return true;
}, {
    message: "Intervalo deve ser entre 1 e 48 horas.",
    path: ["interval"],
}).refine(data => {
    if (data.type === 'fixedTime') {
        return data.times && data.times.split(',').every(t => /^([01]\d|2[0-3]):([0-5]\d)$/.test(t.trim()));
    }
    return true;
}, {
    message: "Pelo menos um horário fixo no formato HH:mm é necessário.",
    path: ["times"],
});

export default function NewSchedulePage() {
  const router = useRouter();
  const { state: userState } = useUserContext();
  const { state: catsState } = useCats();
  const { dispatch: scheduleDispatch, state: scheduleState } = useScheduleContext();
  const { addLoadingOperation, removeLoadingOperation } = useLoading();
  const { cats, isLoading: isLoadingCats, error: errorCats } = catsState;
  const { currentUser, isLoading: isLoadingUser, error: errorUser } = userState;
  const { error: errorSchedules } = scheduleState;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState<(Date | undefined)[]>([undefined]);

  const isLoading = isLoadingCats || isLoadingUser;
  const combinedError = errorCats || errorUser || errorSchedules;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      catId: undefined,
      type: "interval",
      interval: "8",
      times: "",
      enabled: true,
    },
  });

  const watchType = form.watch("type");

  // Effect 1: Reset selectedTimes when type changes to 'interval'
  useEffect(() => {
    if (watchType !== 'fixedTime') {
      // Only reset if not already [undefined]
      if (selectedTimes.length !== 1 || selectedTimes[0] !== undefined) {
        setSelectedTimes([undefined]);
      }
      // Also clear the times field if not already empty
      if (form.getValues('times') !== '') {
        form.setValue('times', '', { shouldValidate: false });
      }
    }
  }, [watchType]);

  // Effect 2: Update form 'times' when selectedTimes changes and type is 'fixedTime'
  useEffect(() => {
    if (watchType === 'fixedTime') {
      const timesString = selectedTimes
        .filter((d): d is Date => d instanceof Date)
        .map(d => format(d, "HH:mm"))
        .sort()
        .join(", ");
      if (form.getValues('times') !== timesString) {
        form.setValue('times', timesString, { shouldValidate: true });
      }
    }
  }, [selectedTimes, watchType]);

  const addTimeField = useCallback(() => {
    if (selectedTimes.length < 5) {
        setSelectedTimes(prev => [...prev, undefined]);
    } else {
        toast.warning("Limite de 5 horários por agendamento.");
    }
  }, [selectedTimes.length]);

  const removeTimeField = useCallback((index: number) => {
    setSelectedTimes(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateTime = useCallback((index: number, date: Date | undefined) => {
    setSelectedTimes(prev => {
        const newTimes = [...prev];
        newTimes[index] = date;
        return newTimes;
    });
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUser?.id || !currentUser?.householdId) {
      toast.error("Erro: Usuário ou residência não identificados.");
      return;
    }

    const selectedCat = cats.find(cat => cat.id === values.catId);
    if (!selectedCat || selectedCat.householdId !== currentUser.householdId) {
        toast.error("Erro: Gato selecionado inválido ou não pertence à sua residência.");
        return;
    }

    const opId = "create-schedule";
    addLoadingOperation({ id: opId, priority: 1, description: "Criando agendamento..." });
    setIsSubmitting(true);
    
    const currentUserId = currentUser.id;
    const currentHouseholdId = currentUser.householdId;

    const payload = {
      catId: values.catId,
      type: values.type,
      interval: values.type === "interval" ? parseInt(values.interval!) : null,
      times: values.type === "fixedTime" ? values.times?.split(',').map(t => t.trim()).filter(t => t) : [],
      enabled: values.enabled,
    };

    if (payload.type === 'interval' && (payload.interval === null || isNaN(payload.interval) || payload.interval < 1 || payload.interval > 48)) {
        toast.error("Intervalo deve ser entre 1 e 48 horas.");
        setIsSubmitting(false);
        removeLoadingOperation(opId);
        return;
    }
     if (payload.type === 'fixedTime' && (!payload.times || payload.times.length === 0)) {
        toast.error("Pelo menos um horário fixo é necessário.");
        setIsSubmitting(false);
        removeLoadingOperation(opId);
        return;
    }

    try {
      const headers: HeadersInit = {
          'Content-Type': 'application/json'
      };
      if (currentUser?.id) {
          headers['X-User-ID'] = currentUser.id;
      } else {
          toast.error("Erro de autenticação. Tente novamente.");
          throw new Error("User ID missing for create schedule request");
      }

      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Falha ao criar agendamento");
      }

      const newSchedule = await response.json();

      scheduleDispatch({ type: "ADD_SCHEDULE", payload: newSchedule });

      toast.success("Agendamento criado com sucesso!");
      router.push("/schedules");

    } catch (error: any) {
      console.error("Erro ao criar agendamento:", error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      removeLoadingOperation(opId);
    }
  }

  if (isLoading) {
    return <Loading text="Carregando dados..." />;
  }

  if (combinedError) {
     return (
       <PageTransition>
         <div className="container max-w-md mx-auto py-6 pb-28 text-center">
           <div className="flex items-center gap-2 mb-4">
             <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
             <PageHeader title="Novo Agendamento" />
           </div>
            <p className="text-destructive mt-6">Erro ao carregar dados necessários: {combinedError}</p>
         </div>
       </PageTransition>
     );
  }

  if (!currentUser) {
    console.log("[NewSchedulePage] No currentUser found. Redirecting...");
    useEffect(() => {
        toast.error("Autenticação necessária para criar agendamentos.");
        router.replace("/login?callbackUrl=/schedules/new");
    }, [router]);
    return <Loading text="Redirecionando para login..." />;
  }

  if (!currentUser.householdId) {
     return (
       <PageTransition>
         <div className="container max-w-md mx-auto py-6 pb-28">
             <div className="flex items-center gap-2 mb-4">
               <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
               <PageHeader title="Novo Agendamento" />
             </div>
             <div className="mt-6">
                <EmptyState
                    IconComponent={Users}
                    title="Sem Residência Associada"
                    description="Associe-se a uma residência para criar agendamentos."
                    actionButton={
                      <Button asChild>
                        <Link href="/settings">Ir para Configurações</Link>
                      </Button>
                    }
                 />
             </div>
         </div>
       </PageTransition>
     );
  }

  const householdCats = cats.filter(cat => String(cat.householdId) === String(currentUser.householdId));

   if (householdCats.length === 0) {
        return (
           <PageTransition>
             <div className="container max-w-md mx-auto py-6 pb-28">
                 <div className="flex items-center gap-2 mb-4">
                   <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
                   <PageHeader title="Novo Agendamento" />
                 </div>
                 <div className="mt-6">
                    <EmptyState
                        IconComponent={CatIcon}
                        title="Nenhum Gato Cadastrado"
                        description="Cadastre pelo menos um gato antes de criar agendamentos."
                        actionButton={
                          <Button asChild>
                            <Link href="/cats/new">Cadastrar Gato</Link>
                          </Button>
                        }
                     />
                 </div>
             </div>
           </PageTransition>
        );
    }

  const selectedCatId = form.watch("catId");
  const selectedCat = householdCats.find(cat => String(cat.id) === String(selectedCatId));

  return (
    <PageTransition>
        <div className="container max-w-md mx-auto py-6 pb-28">
           <div className="flex items-center gap-2 mb-4">
             <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
             <PageHeader title="Novo Agendamento" />
           </div>

           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="mt-6"
           >
             {/* Show selected cat avatar if a cat is selected */}
             {selectedCat && (
               <div className="flex justify-center mb-4">
                 <Avatar className="h-20 w-20">
                   <AvatarImage src={selectedCat.photo_url || ""} alt={selectedCat.name} />
                   <AvatarFallback>{selectedCat.name?.substring(0, 2) || "?"}</AvatarFallback>
                 </Avatar>
               </div>
             )}
             <Form {...form}>
               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <FormField
                   control={form.control}
                   name="catId"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Gato *</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                         <FormControl>
                           <SelectTrigger>
                             <SelectValue placeholder="Selecione o gato" />
                           </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                           {householdCats.map((cat: CatType) => (
                             <SelectItem key={cat.id} value={String(cat.id)}>
                               {cat.name}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 <Separator />

                 <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                       <FormItem className="space-y-3">
                          <FormLabel>Tipo de Agendamento *</FormLabel>
                          <FormControl>
                             <Tabs
                                value={field.value}
                                onValueChange={(value) => {
                                   field.onChange(value as "interval" | "fixedTime");
                                }}
                                className="w-full"
                             >
                                <TabsList className="grid w-full grid-cols-2">
                                   <TabsTrigger value="interval">Intervalo</TabsTrigger>
                                   <TabsTrigger value="fixedTime">Horário Fixo</TabsTrigger>
                                </TabsList>
                                <TabsContent value="interval" className="pt-4">
                                   <FormField
                                      control={form.control}
                                      name="interval"
                                      render={({ field: intervalField }) => (
                                         <FormItem>
                                            <FormLabel>Intervalo (em horas) *</FormLabel>
                                            <FormControl>
                                               <Input 
                                                 type="number" 
                                                 placeholder="Ex: 8" 
                                                 min="1" 
                                                 max="48" 
                                                 {...intervalField} 
                                                 value={intervalField.value || ''}
                                                 disabled={isSubmitting}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                               O gato será alimentado a cada X horas após a última refeição registrada.
                                            </FormDescription>
                                            <FormMessage />
                                         </FormItem>
                                      )}
                                    />
                                </TabsContent>
                                <TabsContent value="fixedTime" className="pt-4 space-y-4">
                                   <FormLabel>Horários Fixos *</FormLabel>
                                   {selectedTimes.map((time, index) => (
                                      <div key={index} className="flex items-center gap-2">
                                         <SimpleTimePicker 
                                            value={time || new Date()} 
                                            onChange={(date) => updateTime(index, date)} 
                                            disabled={isSubmitting}
                                          />
                                         {selectedTimes.length > 1 && (
                                            <Button 
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeTimeField(index)}
                                                disabled={isSubmitting}
                                                className="text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                          )}
                                      </div>
                                    ))}
                                    {selectedTimes.length < 5 && (
                                       <Button 
                                          type="button" 
                                          variant="outline" 
                                          size="sm" 
                                          onClick={addTimeField}
                                          disabled={isSubmitting}
                                        >
                                          Adicionar Horário
                                        </Button>
                                    )}
                                     <FormField
                                        control={form.control}
                                        name="times"
                                        render={({ field: timesField }) => (
                                           <FormItem className="hidden">
                                              <FormControl>
                                                 <Input {...timesField} />
                                              </FormControl>
                                              <FormMessage /> 
                                           </FormItem>
                                        )}
                                      />
                                      <FormDescription>
                                         Defina os horários específicos em que o gato deve ser alimentado.
                                      </FormDescription>
                                </TabsContent>
                             </Tabs>
                          </FormControl>
                          <FormMessage />
                       </FormItem>
                    )}
                 />

                 <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Ativado</FormLabel>
                          <FormDescription>
                             Se desativado, este agendamento não gerará próximas refeições.
                          </FormDescription>
                        </div>
                        <FormControl>
                           <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isSubmitting}
                           />
                        </FormControl>
                      </FormItem>
                    )}
                 />

                 <div className="pt-4">
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Criando..." : "Criar Agendamento"}
                    </Button>
                 </div>
               </form>
             </Form>
           </motion.div>
        </div>
    </PageTransition>
  );
} 