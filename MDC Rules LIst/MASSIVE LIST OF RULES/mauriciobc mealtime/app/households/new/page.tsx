"use client";

import { useState, useEffect } from "react";
import { flushSync } from 'react-dom';
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useUserContext } from "@/lib/context/UserContext";
import { Loading } from "@/components/ui/loading";

// Schema para validação do formulário
const formSchema = z.object({
  name: z.string()
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres" })
    .max(50, { message: "O nome não pode ter mais de 50 caracteres" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewHouseholdPage() {
  const router = useRouter();
  const { state: userState, refreshUser } = useUserContext();
  const { currentUser, isLoading: isUserLoading, error: errorUser } = userState;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Configurar o formulário com validação
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });
  
  // --- Refined Loading and State Checks ---

  // 1. Handle User Context Loading FIRST
  if (isUserLoading) {
    return <Loading text="Verificando usuário..." />;
  }

  // 2. Handle User Context Errors
  if (errorUser) {
    return (
        <div className="container max-w-md mx-auto p-4 text-center">
           <h1 className="text-2xl font-bold mb-4">Erro</h1>
           <p className="text-destructive">Erro ao carregar dados do usuário: {errorUser}.</p>
           <Button variant="outline" onClick={() => router.back()} className="mt-4">Voltar</Button>
        </div>
     );
  }
  
  // 3. Handle No Authenticated User Found (Redirect)
  if (!currentUser) {
     // Redirect immediately if no user after loading/error checks
     useEffect(() => {
        console.log("[NewHouseholdPage] No currentUser found. Redirecting to login.");
        toast.error('Você precisa estar logado para criar um domicílio.');
        router.replace('/login?callbackUrl=/households/new');
     }, [router]);
     return <Loading text="Redirecionando para login..." />;
  }

  // Função para criar um novo domicílio
  const onSubmit = async (values: FormValues) => {
    if (!currentUser) {
      toast.error('Você precisa estar logado para criar um domicílio');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage("");
    
    try {
      const response = await fetch('/api/households', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      // Check if the response status is OK before attempting to parse JSON
      if (!response.ok) {
        let errorText = 'Erro ao criar domicílio';
        try {
          // Try to get a more specific error message from the response body
          const errorData = await response.json(); // Try parsing as JSON first
          errorText = errorData.error || errorText;
        } catch (jsonError) {
          // If JSON parsing fails, try reading as text
          try {
            errorText = await response.text();
          } catch (textError) {
            // If text reading also fails, stick to the generic error
            console.error('Failed to read error response body:', textError);
          }
        }
        console.error(`[NewHouseholdPage] API Error Status: ${response.status}, Message: ${errorText}`);
        setErrorMessage(errorText);
        throw new Error(errorText); // Throw to be caught by the outer catch block
      }
      
      // If response is OK, proceed to parse JSON
      const responseData = await response.json();
      
      toast.success(`Domicílio ${responseData.name} criado com sucesso!`);
      
      // --- Trigger UserContext refetch --- 
      console.log("[NewHouseholdPage] Household creation successful. Triggering user context refetch.");
      refreshUser(); // Call the correctly named refresh function from context
      // --------------------------------------
      
      // Navigate to the newly created household's detail page
      if (responseData?.id) {
          router.push(`/households/${responseData.id}`);
      } else {
          // Fallback to dashboard if ID is missing for some reason
          console.warn("[NewHouseholdPage] Household ID missing in response, redirecting to dashboard.");
          router.push('/'); 
      }

    } catch (error) {
      console.error('Erro detalhado ao criar domicílio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Falha ao criar o domicílio';
      setErrorMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container max-w-md mx-auto p-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="mb-4 pl-0"
          onClick={() => router.back()}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Novo Domicílio</h1>
        <p className="text-muted-foreground mt-1">
          Crie um novo domicílio para gerenciar seus gatos com sua família ou amigos.
        </p>
      </div>
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Domicílio</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: Minha Casa, Apartamento da Família" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Criando...' : 'Criar Domicílio'}
          </Button>
        </form>
      </Form>
    </div>
  );
} 