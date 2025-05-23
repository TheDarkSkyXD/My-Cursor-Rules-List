"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useCats } from "@/lib/context/CatsContext";
import { useUserContext } from "@/lib/context/UserContext";
import { useLoading } from "@/lib/context/LoadingContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/ui/image-upload";
import { Loading } from "@/components/ui/loading";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DateTimePicker } from "@/components/ui/datetime-picker";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "O nome do gato deve ter pelo menos 2 caracteres.",
  }),
  photoUrl: z.string().optional(),
  birthdate: z.date().optional(),
  weight: z.string().optional().refine((val) => !val || !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Peso deve ser um número positivo.",
  }),
  portion_size: z.string().optional().refine((val) => !val || !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Porção deve ser um número positivo.",
  }),
  restrictions: z.string().optional(),
  notes: z.string().optional(),
  feedingInterval: z.string().min(1, {
    message: "O intervalo de alimentação é obrigatório.",
  }).refine((val) => {
    const num = parseInt(val);
    return !isNaN(num) && num >= 1 && num <= 24;
  }, {
    message: "O intervalo deve estar entre 1 e 24 horas.",
  }),
});

export default function NewCatPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { dispatch: catsDispatch, forceRefresh } = useCats();
  const { state: userState } = useUserContext();
  const { addLoadingOperation, removeLoadingOperation } = useLoading();
  const { currentUser, isLoading: isLoadingUser, error: errorUser } = userState;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      photoUrl: "",
      birthdate: undefined,
      weight: "",
      portion_size: "",
      restrictions: "",
      notes: "",
      feedingInterval: "8",
    },
  });

  useEffect(() => {
    if (currentUser === null && !isLoadingUser) {
      toast.error("Você precisa estar conectado para adicionar um gato");
      router.replace("/login?callbackUrl=/cats/new");
    }
  }, [currentUser, isLoadingUser, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUser?.householdId) {
       toast.error("Você precisa pertencer a um domicílio para adicionar um gato.");
       return;
    }

    const currentHouseholdId = currentUser.householdId;
    const opId = "create-cat";
    addLoadingOperation({ id: opId, priority: 1, description: "Criando perfil do gato..." });
    setIsSubmitting(true);
    const finalPhotoUrl: string | null = values.photoUrl || null;

    try {
      // Log the raw form values first
      console.log('Raw form values:', values);

      const payload = {
        name: values.name.trim(),
        photoUrl: finalPhotoUrl,
        birthdate: values.birthdate ? values.birthdate.toISOString() : null,
        weight: values.weight || null,
        portion_size: values.portion_size || null,
        feeding_interval: values.feedingInterval ? parseInt(values.feedingInterval) : null,
        householdId: currentHouseholdId,
        restrictions: values.restrictions?.trim() || null,
        notes: values.notes?.trim() || null
      };

      console.log('Sending payload to /api/cats:', payload);
      console.log('Current user:', currentUser);
      console.log('Headers:', {
        "Content-Type": "application/json",
        "X-User-ID": currentUser?.id
      });

      // Add X-User-ID header from currentUser context
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (currentUser?.id) {
        headers["X-User-ID"] = currentUser.id;
      } else {
         console.error('No user ID found in currentUser:', currentUser);
         toast.error("Erro de autenticação. Tente fazer login novamente.");
         throw new Error("User ID not found for API request");
      }

      const response = await fetch("/api/cats", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      console.log('Response from server:', {
        status: response.status,
        ok: response.ok,
        data: responseData
      });

      if (!response.ok) {
        console.error("Server error response:", responseData);
        throw new Error(responseData.error || "Falha ao adicionar gato");
      }

      console.log('Successfully created cat:', responseData);
      
      // Force a refresh of the cats data
      forceRefresh();

      // Wait a moment for the refresh to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      toast.success("Gato adicionado com sucesso!");
      
      // Use replace instead of push to avoid back navigation issues
      router.replace("/cats");
    } catch (error) {
      console.error("Error creating cat profile:", {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro ao criar o perfil do gato");
    } finally {
      setIsSubmitting(false);
      removeLoadingOperation(opId);
    }
  }

  if (isLoadingUser) {
     return (
        <div className="container max-w-md py-6 pb-28 flex justify-center items-center min-h-[300px]">
          <Loading text="Carregando dados do usuário..." />
        </div>
     );
  }

  if (errorUser) {
    return (
      <div className="container max-w-md py-6 pb-28">
        <PageHeader title="Adicionar Novo Gato" />
        <div className="mt-6 text-center">
          <p className="text-destructive">Erro ao carregar dados do usuário: {errorUser}. Tente recarregar a página.</p>
          <Button onClick={() => router.back()} className="mt-4">Voltar</Button>
        </div>
      </div>
    );
  }

  if (currentUser === null) {
      return (
        <div className="container max-w-md py-6 pb-28 flex justify-center items-center min-h-[300px]">
            <Loading text="Redirecionando para login..." />
        </div>
      );
  }

   if (!currentUser.householdId) {
     return (
        <div className="container max-w-md py-6 pb-28">
          <PageHeader title="Adicionar Novo Gato" />
          <div className="mt-6">
            <EmptyState 
              IconComponent={Users}
              title="Nenhum domicílio encontrado"
              description="Você precisa pertencer a um domicílio para adicionar um gato. Crie ou junte-se a um domicílio nas configurações."
              actionButton={<Button asChild><a href="/settings">Ir para Configurações</a></Button>}
             />
          </div>
        </div>
     );
   }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container max-w-md py-6 pb-28"
    >
      <PageHeader title="Adicionar Novo Gato" />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do gato" {...field} id="name" required disabled={isSubmitting}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          <FormField
            control={form.control}
            name="photoUrl"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Foto</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value || ""}
                      onChange={(url: string) => field.onChange(url)}
                      type="cat"
                      userId={currentUser.id}
                      maxSizeMB={50}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )
            }}
            />

          <FormField
            control={form.control}
            name="birthdate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Nascimento</FormLabel>
                <FormControl>
                  <DateTimePicker
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    locale={ptBR}
                    yearRange={35}
                    granularity="day"
                    placeholder="Selecione uma data"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peso (kg)</FormLabel>
                <FormControl>
                  <Input 
                      type="number" 
                      step="0.1" 
                      placeholder="Ex: 4.5" 
                      {...field} 
                      id="weight"
                      disabled={isSubmitting}
                   />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="feedingInterval"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Intervalo Ideal Entre Refeições (horas) *</FormLabel>
                <FormControl>
                   <Input 
                      type="number" 
                      min="1" 
                      max="24" 
                      placeholder="Ex: 8" 
                      {...field} 
                      id="feedingInterval"
                      required 
                      disabled={isSubmitting}
                   />
                </FormControl>
                 <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="portion_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Porção Recomendada (gramas)</FormLabel>
                <FormControl>
                  <Input 
                      type="number" 
                      step="1" 
                      placeholder="Ex: 50" 
                      {...field} 
                      id="portion_size"
                      disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="restrictions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Restrições Alimentares</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ex: Alergia a frango, sensível a grãos"
                    className="resize-none"
                    {...field}
                    id="restrictions"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações Adicionais</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ex: Prefere comer no quarto, só come ração úmida"
                    className="resize-none"
                    {...field}
                    id="notes"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loading text="Adicionando..." size="sm" /> : "Adicionar Gato"}
          </Button>
        </form>
      </Form>
    </motion.div>
  );
}