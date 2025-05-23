"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/bottom-nav";
import PageTransition from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Copy, Check, Share2, ChevronLeft, Mail, AlertTriangle, RefreshCw } from "lucide-react";
import { useHousehold } from "@/lib/context/HouseholdContext";
import { useUserContext } from "@/lib/context/UserContext";
import { toast } from "sonner";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Household as HouseholdType } from "@/lib/types";
import { Loading } from "@/components/ui/loading";
import { useLoading } from "@/lib/context/LoadingContext";

const emailSchema = z.object({
  email: z.string().email("Digite um endereço de e-mail válido"),
});

type EmailFormValues = z.infer<typeof emailSchema>;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function HouseholdInvitePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const householdId = resolvedParams.id;
  const router = useRouter();
  const { state: householdState, dispatch: householdDispatch } = useHousehold();
  const { state: userState } = useUserContext();
  const { addLoadingOperation, removeLoadingOperation } = useLoading();
  
  const { currentUser, isLoading: isLoadingUser, error: errorUser } = userState;
  const { households, isLoading: isLoadingHouseholds, error: errorHousehold } = householdState;
  
  const [household, setHousehold] = useState<HouseholdType | null | undefined>(undefined);
  const [isAuthorized, setIsAuthorized] = useState<boolean | undefined>(undefined);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [isSending, setIsSending] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  if (isLoadingUser) {
    return <Loading text="Verificando usuário..." />;
  }

  if (errorUser) {
    return (
      <PageTransition>
        <div className="p-4 text-center">
          <p className="text-destructive">Erro ao carregar dados do usuário: {errorUser}. Tente recarregar a página.</p>
          <Button onClick={() => router.back()} className="mt-4">Voltar</Button>
        </div>
      </PageTransition>
    );
  }

  if (!currentUser) {
    console.log("[HouseholdInvitePage] No currentUser found. Redirecting to login.");
    useEffect(() => {
        toast.error("Autenticação necessária para convidar.");
        router.replace(`/login?callbackUrl=/households/${householdId}/members/invite`);
    }, [router, householdId]);
    return <Loading text="Redirecionando para login..." />;
  }
  
  if (errorHousehold) {
     return (
       <PageTransition>
         <div className="p-4 text-center">
            <p className="text-destructive">Erro ao carregar lista de residências: {errorHousehold}. Tente recarregar a página.</p>
            <Button onClick={() => router.back()} className="mt-4">Voltar</Button>
         </div>
       </PageTransition>
     );
  }

  useEffect(() => {
    const opId = "household-invite-load";
    addLoadingOperation({ id: opId, priority: 1, description: "Loading household data..."});
    setIsLoadingData(true);

    if (isLoadingHouseholds) {
        console.log("HouseholdInvitePage useEffect: HouseholdContext still loading, waiting...");
        return;
    }

    console.log(`HouseholdInvitePage useEffect: Attempting to find household ${householdId}`);
    const foundHousehold = households.find(h => String(h.id) === String(householdId));
    setHousehold(foundHousehold || null);

    if (foundHousehold) {
      console.log(`HouseholdInvitePage useEffect: Found household ${foundHousehold.id}. Checking authorization...`);
      console.log("Household details:", JSON.stringify({
        household_id: foundHousehold.id,
        name: foundHousehold.name,
        owner: foundHousehold.owner,
        owner_id: foundHousehold.owner_id, // Log both to help debugging
        members: foundHousehold.members,
        current_user: currentUser.id
      }, null, 2));
      
      // Check if owner is properly set, fallback to owner_id for backwards compatibility
      if (!foundHousehold.owner && foundHousehold.owner_id) {
        console.warn(`Owner object missing but owner_id exists: ${foundHousehold.owner_id}. Using as fallback.`);
        // Create a temporary owner object from owner_id for the check
        foundHousehold.owner = { 
          id: foundHousehold.owner_id, 
          name: 'Unknown Owner', 
          email: 'unknown@example.com'
        };
      }
      
      const isOwner = String(foundHousehold.owner?.id) === String(currentUser.id);
      console.log(`IsOwner check: ${isOwner} (User: ${currentUser.id}, Owner: ${foundHousehold.owner?.id})`);
      
      const relevantMember = foundHousehold.members?.find(
        member => String(member.userId) === String(currentUser.id)
      );
      console.log(`Found user as member: ${relevantMember ? 'Yes' : 'No'}`, relevantMember);
      
      const isAdmin = isOwner || foundHousehold.members?.some(
        member => String(member.userId) === String(currentUser.id) && 
                 member.role?.toLowerCase() === 'admin'
      );
      
      console.log(`Final isAdmin determination: ${isAdmin}`);
      setIsAuthorized(isAdmin);
      if (!isAdmin) {
         console.warn(`HouseholdInvitePage useEffect: User ${currentUser.id} is not admin for household ${householdId}. Redirecting.`);
         toast.error("Apenas administradores podem convidar membros.");
         router.replace(`/households/${householdId}`); 
      }
    } else {
      console.warn(`HouseholdInvitePage useEffect: Household ${householdId} not found in context. Redirecting.`);
      setIsAuthorized(false);
      if (!isLoadingHouseholds) {
          toast.error("Residência não encontrada.");
          router.replace('/households');
      }
    }
    setIsLoadingData(false);
    removeLoadingOperation(opId);
  }, [currentUser, households, householdId, router, addLoadingOperation, removeLoadingOperation, isLoadingHouseholds]);
  
  const handleSendInvite = async (data: EmailFormValues) => {
    if (!isAuthorized || !household) return;
    const opId = "send-invite";
    addLoadingOperation({ id: opId, priority: 1, description: "Sending invite..." });
    setIsSending(true);
    try {
      console.log("Sending invitation with headers:", {
        userId: currentUser.id,
        householdId: householdId
      });
      
      const response = await fetch(`/api/households/${householdId}/invite`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-ID": currentUser.id
        },
        body: JSON.stringify({ email: data.email }),
      });

      console.log("Invitation response status:", response.status);
      const result = await response.json();
      console.log("Invitation response body:", result);

      if (!response.ok) {
         throw new Error(result.error || "Falha ao enviar convite por e-mail.");
      }
      
      // Detailed handling of API responses
      console.log("DEBUG CLIENT: Invitation response details:", {
        status: response.status,
        message: result.message,
        details: result.details,
        profile: result.profile
      });
      
      // Check for specific messages in the result
      if (result.message && result.message.includes("already a member")) {
        // Provide clear information about the existing membership
        if (result.profile && result.profile.email) {
          if (result.profile.email !== data.email) {
            // Email mismatch case - provide clear explanation
            toast.info(
              `Este e-mail (${data.email}) não pode ser adicionado porque o usuário com e-mail ${result.profile.email} já é membro desta residência.`
            );
          } else {
            // Same email case - already a member
            toast.info(`${data.email} já é um membro desta residência.`);
          }
        } else {
          // Fallback if profile info is missing
          toast.info(`${data.email} já está associado a um membro desta residência.`);
        }
      } else if (result.message && result.message.includes("similar email")) {
        // Clear information about similar email cases
        toast.info(result.details || `Encontramos uma variação deste e-mail já cadastrada. Por favor, tente com o email exato.`);
      } else {
        // Success case
        toast.success(`Convite enviado para ${data.email}`);
      }
      form.reset();

    } catch (error: any) {
      console.error("Erro ao enviar convite:", error);
      toast.error(`Erro ao enviar: ${error.message}`);
    } finally {
      setIsSending(false);
      removeLoadingOperation(opId);
    }
  };

  const copyInviteLink = async () => {
    if (!household?.inviteCode) {
       toast.error("Código de convite não disponível.");
       return;
    }
    const inviteUrl = `${window.location.origin}/join?code=${household.inviteCode}`;
    
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setIsCopied(true);
      toast.success("Link de convite copiado!");
      setTimeout(() => setIsCopied(false), 3000);
    } catch (error) {
      console.error("Erro ao copiar link:", error);
      toast.error("Não foi possível copiar o link.");
    }
  };

  const shareInvite = async () => {
     if (!household?.inviteCode || !household?.name) return;
     
    const inviteUrl = `${window.location.origin}/join?code=${household.inviteCode}`;
    const text = `Olá! Gostaria de te convidar para participar da minha residência "${household.name}" no MealTime. Use este link para entrar:`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Convite para ${household.name} - MealTime`,
          text: text,
          url: inviteUrl,
        });
      } else {
         copyInviteLink();
         toast.info("API de compartilhamento não suportada. Link copiado!");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
         console.error("Erro ao compartilhar:", error);
         toast.error("Não foi possível compartilhar o convite.");
      }
    }
  };

   const regenerateInviteCode = async () => {
     if (!isAuthorized || !household) return;
     const opId = "regenerate-code";
     addLoadingOperation({ id: opId, priority: 1, description: "Generating new code..." });
     setIsGenerating(true);
     try {
       const response = await fetch(`/api/households/${householdId}/invite-code`, {
          method: "PATCH",
          headers: {
            "X-User-ID": currentUser.id,
            "Content-Type": "application/json"
          }
        });

        const result = await response.json();

        if (!response.ok) {
           throw new Error(result.error || "Falha ao gerar novo código de convite.");
        }
       
       const newCode = result.inviteCode; 
       const updatedHousehold = { ...household, inviteCode: newCode };
       setHousehold(updatedHousehold);

       householdDispatch({ type: "SET_HOUSEHOLD", payload: updatedHousehold });

       toast.success("Novo código de convite gerado!");

     } catch (error: any) {
       console.error("Erro ao gerar novo código:", error);
       toast.error(`Erro: ${error.message}`);
     } finally {
       setIsGenerating(false);
       removeLoadingOperation(opId);
     }
   };

  if (isLoadingData) {
    return (
      <PageTransition>
        <div className="flex min-h-screen flex-col bg-background">
           <main className="flex-1 pb-20 pt-4">
             <div className="container max-w-md">
                <div className="mb-6 flex items-center">
                 <Skeleton className="h-9 w-9 mr-2 rounded-full" />
                 <Skeleton className="h-7 w-48" />
               </div>
               
               <Card>
                 <CardHeader>
                   <Skeleton className="h-6 w-3/4 mb-2" />
                   <Skeleton className="h-4 w-full" />
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <Skeleton className="h-10 w-full" />
                   <Skeleton className="h-10 w-full" />
                 </CardContent>
                  <CardFooter>
                     <Skeleton className="h-10 w-24" />
                  </CardFooter>
               </Card>
             </div>
           </main>
           <BottomNav />
        </div>
      </PageTransition>
    );
  }

   if (!household || isAuthorized === false) {
      const message = !household ? "Residência não encontrada." : "Acesso negado.";
      console.log(`[HouseholdInvitePage] Render condition met: ${message}`);
      return (
         <PageTransition>
           <div className="flex min-h-screen flex-col bg-background">
             <main className="flex-1 flex items-center justify-center p-4">
                <Loading text={!household ? "Redirecionando... Residência não encontrada." : "Redirecionando... Acesso negado."} />
             </main>
             <BottomNav />
           </div>
         </PageTransition>
      );
   }

  return (
    <PageTransition>
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex-1 pb-24 pt-4">
          <div className="container max-w-md">
            <div className="mb-6 flex items-center">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => router.push(`/households/${householdId}`)}
                className="mr-2"
                aria-label="Voltar"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                 <h1 className="text-xl font-bold leading-tight">Convidar Membros</h1>
                 <p className="text-sm text-muted-foreground">Convide pessoas para {household?.name || "sua residência"}</p>
               </div>
            </div>

            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Via E-mail</TabsTrigger>
                <TabsTrigger value="link">Via Link</TabsTrigger>
              </TabsList>
              
              <TabsContent value="email">
                <Card>
                  <CardHeader>
                    <CardTitle>Convidar por E-mail</CardTitle>
                    <CardDescription>
                      Digite o e-mail da pessoa que você deseja convidar. Ela receberá um link para entrar na residência.
                    </CardDescription>
                  </CardHeader>
                  <Form {...form}>
                     <form onSubmit={form.handleSubmit(handleSendInvite)} className="space-y-0"> 
                       <CardContent>
                         <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel htmlFor="email">E-mail</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                     <Mail className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                     <Input 
                                       id="email"
                                       type="email"
                                       placeholder="nome@exemplo.com"
                                       {...field}
                                       className="pl-8"
                                       disabled={isSending}
                                     />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                       </CardContent>
                       <CardFooter>
                         <Button type="submit" disabled={isSending}>
                           {isSending ? <Loading text="Enviando..." size="sm" /> : <><UserPlus className="mr-2 h-4 w-4" /> Enviar Convite</>}
                         </Button>
                       </CardFooter>
                     </form>
                   </Form>
                </Card>
              </TabsContent>

              <TabsContent value="link">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                       <span>Compartilhar Link</span>
                       <Button 
                         variant="outline"
                         size="sm"
                         onClick={regenerateInviteCode}
                         disabled={isGenerating}
                         title="Gerar novo código de convite (invalida o anterior)"
                       >
                         {isGenerating ? <Loading text="Gerando..." size="sm" /> : <RefreshCw className="h-4 w-4" />}
                         <span className="sr-only">Gerar Novo Código</span>
                       </Button>
                     </CardTitle>
                    <CardDescription>
                      Qualquer pessoa com este link poderá entrar na residência. Compartilhe com cuidado.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {household?.inviteCode ? (
                      <div className="flex items-center space-x-2 rounded-md border bg-muted px-3 py-2">
                        <Label htmlFor="invite-link" className="sr-only">
                          Link de Convite
                        </Label>
                        <Input
                          id="invite-link"
                          value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join?code=${household.inviteCode}`}
                          readOnly
                          className="flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={copyInviteLink}
                          disabled={isCopied}
                          title="Copiar link"
                          className="h-7 w-7"
                         >
                           {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                           <span className="sr-only">{isCopied ? "Copiado" : "Copiar"}</span>
                         </Button>
                      </div>
                    ) : (
                       <div className="flex items-center justify-center rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                         <AlertTriangle className="mr-2 h-4 w-4" /> Nenhum código de convite ativo.
                       </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                       onClick={shareInvite} 
                       disabled={!household?.inviteCode} 
                       className="w-full sm:w-auto"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Compartilhar
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <BottomNav />
      </div>
    </PageTransition>
  );
}