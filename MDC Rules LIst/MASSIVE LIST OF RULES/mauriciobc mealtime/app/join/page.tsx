"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNav from "@/components/bottom-nav";
import PageTransition from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHousehold } from "@/lib/context/HouseholdContext";
import { useUserContext } from "@/lib/context/UserContext";
import { useLoading } from "@/lib/context/LoadingContext";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Loading } from "@/components/ui/loading";
import { Loader2 } from "lucide-react";
import { GlobalLoading } from "@/components/ui/global-loading";

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state: householdState, dispatch: householdDispatch } = useHousehold();
  const { state: userState, refreshUser } = useUserContext();
  const { addLoadingOperation, removeLoadingOperation } = useLoading();
  const { currentUser, isLoading: isLoadingUser, error: errorUser } = userState;

  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setInviteCode(code);
    }
  }, [searchParams]);

  const handleJoinHousehold = async () => {
    if (!inviteCode.trim()) {
      toast.error("Por favor, insira um código de convite");
      return;
    }
    
    if (!currentUser) {
        toast.error("Você precisa estar autenticado para entrar em um domicílio.");
        return;
    }

    const opId = "join-household";
    addLoadingOperation({ id: opId, description: "Entrando no domicílio...", priority: 1 });
    setIsLoading(true);

    try {
      const response = await fetch("/api/households/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao entrar no domicílio");
      }

      const joinedHousehold = data.household;
      const updatedUser = data.user;

      if (!joinedHousehold || !updatedUser) {
          console.error("API response missing household or user data:", data);
          throw new Error("Resposta inválida do servidor após entrar no domicílio.");
      }

      householdDispatch({ type: "SET_HOUSEHOLD", payload: joinedHousehold });
      
      // Refresh user context after joining household
      await refreshUser();

      toast.success("Você entrou no domicílio com sucesso!");
      router.push(`/households`); 
    } catch (error: any) {
      console.error("Erro ao entrar no domicílio:", error);
      toast.error(error.message || "Ocorreu um erro ao tentar entrar no domicílio.");
    } finally {
      setIsLoading(false);
      removeLoadingOperation(opId);
    }
  };

  if (isLoadingUser) {
      return (
         <PageTransition>
            <div className="flex flex-col min-h-screen bg-background">
               <div className="p-4 pb-24">
                 <Loading text="Carregando..." />
               </div>
               <BottomNav />
            </div>
         </PageTransition>
      );
  }

  if (errorUser) {
     return (
       <PageTransition>
         <div className="flex flex-col min-h-screen bg-background">
            <div className="p-4 pb-24 text-center">
               <PageHeader 
                 title="Entrar em um Domicílio" 
                 description="Erro ao carregar dados do usuário"
               />
               <p className="text-destructive mt-6">Erro: {errorUser}</p>
               <Button onClick={() => router.back()} variant="outline" className="mt-4">Voltar</Button>
            </div>
            <BottomNav />
         </div>
       </PageTransition>
     );
  }

  if (!currentUser) {
    console.log("[JoinPage] No currentUser found. Redirecting...");
    useEffect(() => {
        toast.error("Autenticação necessária para entrar em um domicílio.");
        router.replace("/login?callbackUrl=/join");
    }, [router]);
    return <Loading text="Redirecionando para login..." />;
  }
  
  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen bg-background">
         <div className="p-4 pb-24">
           <PageHeader 
             title="Entrar em um Domicílio" 
             description="Use um código de convite para entrar em um domicílio existente"
           />
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Código de Convite</CardTitle>
              <CardDescription>
                Insira o código de convite que você recebeu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Código de Convite</Label>
                  <Input
                    id="inviteCode"
                    placeholder="Digite o código de convite"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="font-mono"
                    disabled={isLoading}
                  />
                </div>
                
                <Button
                  className="w-full"
                  onClick={handleJoinHousehold}
                  disabled={isLoading || !inviteCode.trim()}
                >
                  {isLoading ? (
                    <>
                      <GlobalLoading mode="spinner" size="sm" /> 
                      Entrando...
                    </>
                  ) : "Entrar no Domicílio"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <BottomNav />
      </div>
    </PageTransition>
  );
} 