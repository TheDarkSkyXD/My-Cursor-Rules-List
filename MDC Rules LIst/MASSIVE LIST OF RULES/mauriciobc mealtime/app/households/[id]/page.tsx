"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import BottomNav from "@/components/bottom-nav"
import PageTransition from "@/components/page-transition"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Users, 
  Cat, 
  Settings,
  Pencil,
  Trash2,
  LogOut,
  ShieldCheck,
  ShieldX,
  ChevronLeft,
  CopyCheck,
  UserMinus,
  UserPlus,
  AlertTriangle,
  Plus,
  Lock,
  MoreVertical,
  UserCheck,
  ShieldAlert
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useHousehold } from "@/lib/context/HouseholdContext"
import { useCats } from "@/lib/context/CatsContext"
import { useUserContext } from "@/lib/context/UserContext"
import { useLoading } from "@/lib/context/LoadingContext"
import { CatType, Household, HouseholdMember } from "@/lib/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import React from "react"
import { Loading } from "@/components/ui/loading"
import { EmptyState } from "@/components/ui/empty-state"
import { CatCard } from "@/components/cat/cat-card"
import { resolveDateFnsLocale } from "@/lib/utils/dateFnsLocale"

interface PageProps {
  params: Promise<{ id: string }>;
}

const formatMemberRole = (role?: string) => {
  if (!role) return 'Membro';
  return role.toLowerCase() === 'admin' ? 'Administrador' : 'Membro';
};

export default function HouseholdDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params) as { id: string };
  const router = useRouter();
  const { state: householdState, dispatch: householdDispatch } = useHousehold();
  const { state: userState } = useUserContext();
  const { state: catsState, dispatch: _catsDispatch } = useCats();
  const { addLoadingOperation, removeLoadingOperation } = useLoading();
  const { households, error: errorHousehold } = householdState;
  const { currentUser, isLoading: isLoadingUser, error: errorUser } = userState;
  const { cats: allCats, isLoading: isLoadingCats, error: errorCats } = catsState;
  
  const householdId = resolvedParams.id;
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [household, setHousehold] = useState<Household | null | undefined>(undefined);
  const [cats, setCats] = useState<CatType[]>([])
  const [activeTab, setActiveTab] = useState('members')
  
  const [memberToRemove, setMemberToRemove] = useState<HouseholdMember | null>(null)
  const [memberToPromote, setMemberToPromote] = useState<HouseholdMember | null>(null)
  const [memberToDemote, setMemberToDemote] = useState<HouseholdMember | null>(null)
  const [catToDelete, setCatToDelete] = useState<CatType | null>(null)
  const [_showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [_showDeleteHouseholdDialog, setShowDeleteHouseholdDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false);

  const userLanguage = userState.currentUser?.preferences?.language;
  const userLocale = resolveDateFnsLocale(userLanguage);

  // Handle authentication and redirection
  useEffect(() => {
    if (!isLoadingUser && !currentUser) {
      toast.error("Autenticação necessária para ver a residência.");
      router.replace(`/login?callbackUrl=/households/${householdId}`);
    }
  }, [isLoadingUser, currentUser, router, householdId]);

  const leaveHousehold = async () => {
    if (!household || !currentUser) return;
    const opId = "leave-household";
    addLoadingOperation({ id: opId, priority: 1, description: "Leaving household..." });
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/households/${household.id}/members/${currentUser.id}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         throw new Error(errorData.error || 'Falha ao sair da residência');
      }

      householdDispatch({ 
        type: "REMOVE_MEMBER", 
        payload: { 
          id: String(currentUser.id),
          name: currentUser.name || '',
          role: 'member'
        }
      });
      
      toast.success("Você saiu da residência.");
      router.push("/households");

    } catch (error: any) {
      console.error("Erro ao sair da residência:", error);
      toast.error(`Erro ao sair: ${error.message}`);
    } finally {
      setShowLeaveDialog(false);
      setIsProcessing(false);
      removeLoadingOperation(opId);
    }
  };

  const deleteHousehold = async () => {
    if (!household || !currentUser || !isCurrentUserAdmin()) return;
    const opId = "delete-household";
    addLoadingOperation({ id: opId, priority: 1, description: "Deleting household..." });
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/households/${household.id}`, {
        method: "DELETE",
        headers: {
          'X-User-ID': currentUser.id
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao excluir residência');
      }

      householdDispatch({ type: "SET_HOUSEHOLD", payload: null });
      toast.success("Residência excluída com sucesso.");
      router.push("/households");
    } catch (error: any) {
      console.error("Erro ao excluir residência:", error);
      toast.error(`Erro ao excluir: ${error.message}`);
    } finally {
      setShowDeleteHouseholdDialog(false);
      setIsProcessing(false);
      removeLoadingOperation(opId);
    }
  };

  const changeMemberRole = async (memberId: string, newRole: 'Admin' | 'Member') => {
    if (!household || !currentUser || !isCurrentUserAdmin()) return;
    const opId = `change-member-role-${memberId}`;
    addLoadingOperation({ id: opId, priority: 1, description: "Updating member role..." });
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/households/${household.id}/members/${memberId}`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': currentUser.id
        },
        body: JSON.stringify({ role: newRole.toLowerCase() })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao atualizar função do membro');
      }

      const updatedHousehold = await response.json();
      householdDispatch({ type: "SET_HOUSEHOLD", payload: updatedHousehold });
      toast.success(`Membro ${newRole === 'Admin' ? 'promovido' : 'rebaixado'} com sucesso.`);
    } catch (error: any) {
      console.error("Erro ao atualizar função do membro:", error);
      toast.error(`Erro ao atualizar: ${error.message}`);
    } finally {
      setMemberToPromote(null);
      setMemberToDemote(null);
      setIsProcessing(false);
      removeLoadingOperation(opId);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!household || !currentUser || !isCurrentUserAdmin()) return;
    const opId = `remove-member-${memberId}`;
    addLoadingOperation({ id: opId, priority: 1, description: "Removing member..." });
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/households/${household.id}/members/${memberId}`, {
        method: "DELETE",
        headers: {
          'X-User-ID': currentUser.id
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao remover membro');
      }

      const updatedHousehold = await response.json();
      householdDispatch({ type: "SET_HOUSEHOLD", payload: updatedHousehold });
      toast.success("Membro removido com sucesso.");
    } catch (error: any) {
      console.error("Erro ao remover membro:", error);
      toast.error(`Erro ao remover: ${error.message}`);
    } finally {
      setMemberToRemove(null);
      setIsProcessing(false);
      removeLoadingOperation(opId);
    }
  };

  const deleteCat = async (catId: string) => {
    if (!household || !currentUser || !isCurrentUserAdmin()) return;
    const opId = `delete-cat-${catId}`;
    addLoadingOperation({ id: opId, priority: 1, description: "Deleting cat..." });
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/cats/${catId}`, {
        method: "DELETE",
        headers: {
          'X-User-ID': currentUser.id
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao excluir gato');
      }

      // Update local state
      setCats(prevCats => prevCats.filter(cat => cat.id !== catId));
      toast.success("Gato removido com sucesso.");
    } catch (error: any) {
      console.error("Erro ao excluir gato:", error);
      toast.error(`Erro ao excluir: ${error.message}`);
    } finally {
      setCatToDelete(null);
      setIsProcessing(false);
      removeLoadingOperation(opId);
    }
  };

  // Load household data
  useEffect(() => {
    const loadHouseholdData = async () => {
      if (!currentUser?.id || !householdId) return;

      const opId = `load-household-${householdId}`;
      addLoadingOperation({ id: opId, priority: 1, description: "Loading household details..." });
      setIsLoadingData(true);
      setLoadError(null);
      setHousehold(undefined);

      try {
        const response = await fetch(`/api/households/${householdId}`, {
          headers: {
            'Accept': 'application/json',
            'X-User-ID': currentUser.id
          }
        });

        const data = await response.json();
        
        if (!response.ok) {
          let errorMessage = 'Failed to load household';
          
          if (response.status === 400 && data.error) {
            if (Array.isArray(data.error)) {
              errorMessage = data.error.map((err: any) => err.message).join(', ');
            } else if (typeof data.error === 'object') {
              errorMessage = Object.values(data.error).join(', ');
            } else {
              errorMessage = data.error;
            }
          } else {
            errorMessage = data.error || data.message || `Failed to load household (${response.status})`;
          }
          throw new Error(errorMessage);
        }

        setHousehold(data);
        householdDispatch({ type: 'SET_HOUSEHOLD', payload: data });
        
        const isOwner = String(data.owner?.id) === String(currentUser.id);
        const isMember = data.members?.some(m => String(m.userId) === String(currentUser.id));

        if (!isOwner && !isMember) {
          throw new Error('You do not have access to this household');
        }

        const householdCats = allCats.filter(cat => String(cat.householdId) === String(data.id));
        setCats(householdCats);
        
      } catch (error) {
        console.error('Error loading household:', error);
        const errorMessage = (error as Error).message || 'Failed to load household';
        setLoadError(errorMessage);
        setHousehold(null);
        setCats([]);
        toast.error(errorMessage);
        
        if (errorMessage.toLowerCase().includes('access') || errorMessage.toLowerCase().includes('permission')) {
          router.push('/households');
        }
      } finally {
        setIsLoadingData(false);
        removeLoadingOperation(opId);
      }
    };

    loadHouseholdData();
  }, [currentUser?.id, householdId, router, allCats, householdDispatch, addLoadingOperation, removeLoadingOperation]);

  const isCurrentUserAdmin = () => {
    if (!household || !currentUser) return false;
    
    // Check if user is the owner
    if (String(household.owner?.id) === String(currentUser.id)) return true;
    
    // Check if user is an admin member
    const currentUserMember = household.members?.find(
      member => String(member.userId) === String(currentUser.id)
    );
    return currentUserMember?.role?.toLowerCase() === 'admin';
  };

  const copyInviteCode = async () => {
    if (!household?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(household.inviteCode);
      toast.success("Código de convite copiado!");
    } catch (error) {
      console.error("Erro ao copiar código:", error);
      toast.error("Não foi possível copiar o código.");
    }
  };

  // Loading states
  if (isLoadingUser) {
    return <Loading text="Verificando usuário..." />;
  }

  // Error states
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
    return <Loading text="Redirecionando para login..." />;
  }

  if (isLoadingData) {
    return <Loading text="Carregando dados da residência..." />;
  }

  if (loadError) {
    return (
      <PageTransition>
        <div className="p-4 text-center">
          <EmptyState
            IconComponent={AlertTriangle}
            title="Erro ao Carregar Residência"
            description={loadError || "Não foi possível carregar os dados desta residência."}
            actionButton={
              <Button onClick={() => router.push("/households")}>Voltar para Residências</Button>
            }
          />
        </div>
      </PageTransition>
    );
  }

  if (household === null) {
    return (
      <PageTransition>
        <div className="p-4 text-center">
          <EmptyState
            IconComponent={ShieldAlert}
            title="Residência Não Encontrada"
            description="A residência que você está tentando acessar não foi encontrada ou você não tem permissão."
            actionButton={
              <Button onClick={() => router.push("/households")}>Voltar para Residências</Button>
            }
          />
        </div>
      </PageTransition>
    );
  }

  if (household === undefined) {
    return <Loading text="Inicializando..." />;
  }

  const isAdmin = isCurrentUserAdmin();

  if ((householdState.isLoading || catsState.isLoading) && !loadError) {
    return <Loading text="Carregando dados da residência..." />;
  }

  // Redirect if household not found or user is not authorized
  if (!household || !isAdmin) {
    // Added check for loading states to prevent premature redirect
    if (!householdState.isLoading && !userState.isLoading) {
        toast.error("Residência não encontrada ou acesso não autorizado.");
        router.push("/households");
        return <Loading text="Redirecionando..." />;
    }
    // If still loading, let the loading spinner show
    return <Loading text="Carregando dados..." />;
  }

  if (loadError && !household) {
    // This case handles errors specifically, maybe keep EmptyState?
    // For now, let the redirect above handle it if household is null.
    // If we want a specific error page/state here, we can adjust.
    return (
      <EmptyState
        IconComponent={AlertTriangle}
        title="Erro"
        description={loadError}
        actionButton={
          <Button onClick={() => router.push("/households")}>Voltar para Residências</Button>
        }
      />
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen bg-background">
        <main className="flex-1 p-4 pb-24">
          <div className="mb-6 flex items-center justify-between">
             <div className="flex items-center">
               <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => router.push('/households')} 
                  className="mr-2"
                  aria-label="Voltar para Residências"
               >
                  <ChevronLeft className="h-5 w-5" />
               </Button>
               <div>
                  <h1 className="text-xl font-bold truncate" title={household.name}>{household.name}</h1>
                   <p className="text-xs text-muted-foreground">
                      Criada em {format(new Date(household.createdAt || Date.now()), "dd/MM/yyyy")} por {household.owner?.name || 'Desconhecido'}
                   </p>
               </div>
             </div>
              <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="flex-shrink-0">
                         <Settings className="h-4 w-4" />
                         <span className="sr-only">Opções da Residência</span>
                      </Button>
                  </DropdownMenuTrigger>
                 <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Opções da Residência</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                        <DropdownMenuItem onClick={() => router.push(`/households/${householdId}/edit`)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar Nome
                        </DropdownMenuItem>
                    )}
                     <DropdownMenuItem onClick={() => router.push(`/households/${householdId}/members/invite`)} disabled={!isAdmin}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Convidar Membros
                        {!isAdmin && <Lock className="ml-auto h-3 w-3 text-muted-foreground" />} 
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                     <AlertDialog onOpenChange={setShowLeaveDialog}>
                       <AlertDialogTrigger asChild>
                          <DropdownMenuItem 
                             className="text-destructive focus:text-destructive focus:bg-destructive/10"
                             onSelect={(e) => e.preventDefault()}
                           >
                             <LogOut className="mr-2 h-4 w-4" />
                             Sair da Residência
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                           <AlertDialogHeader>
                             <AlertDialogTitle>Sair da Residência?</AlertDialogTitle>
                             <AlertDialogDescription>
                               Tem certeza que deseja sair de "{household.name}"? Você perderá o acesso aos gatos e dados associados.
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                             <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
                             <AlertDialogAction onClick={leaveHousehold} disabled={isProcessing}>
                               {isProcessing ? <Loading text="Saindo..." size="sm"/> : "Confirmar Saída"}
                             </AlertDialogAction>
                           </AlertDialogFooter>
                         </AlertDialogContent>
                      </AlertDialog>
                      
                     {isAdmin && (
                       <AlertDialog onOpenChange={setShowDeleteHouseholdDialog}>
                         <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                               className="text-destructive focus:text-destructive focus:bg-destructive/10 mt-1"
                               onSelect={(e) => e.preventDefault()}
                             >
                               <Trash2 className="mr-2 h-4 w-4" />
                               Excluir Residência
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>Excluir Residência?</AlertDialogTitle>
                               <AlertDialogDescription>
                                 Tem certeza que deseja excluir PERMANENTEMENTE "{household.name}"? Todos os membros, gatos e dados serão perdidos.
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
                               <AlertDialogAction onClick={deleteHousehold} disabled={isProcessing} className="bg-destructive hover:bg-destructive/90">
                                 {isProcessing ? <Loading text="Excluindo..." size="sm"/> : "Confirmar Exclusão"}
                               </AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                        </AlertDialog>
                     )}
                 </DropdownMenuContent>
             </DropdownMenu>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members" disabled={isProcessing}>
                 <Users className="mr-2 h-4 w-4" /> Membros ({household.members?.length || 0})
               </TabsTrigger>
              <TabsTrigger value="cats" disabled={isProcessing}>
                 <Cat className="mr-2 h-4 w-4" /> Gatos ({cats.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Membros da Residência</CardTitle>
                  {household.inviteCode && isAdmin && (
                      <CardDescription className="text-xs flex items-center gap-2 pt-1">
                         <span>Código de Convite: <code>{household.inviteCode}</code></span>
                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyInviteCode} title="Copiar código">
                            <CopyCheck className="h-3 w-3" />
                         </Button>
                      </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                   {household.members && household.members.length > 0 ? (
                      <ul className="space-y-3">
                        {[...(household.members || [])]
                          .sort((a, b) => {
                             const roleA = a.role?.toLowerCase();
                             const roleB = b.role?.toLowerCase();
                             if (roleA === 'admin' && roleB !== 'admin') return -1;
                             if (roleA !== 'admin' && roleB === 'admin') return 1;
                             return (a.name || '').localeCompare(b.name || '');
                          })
                          .map((member) => (
                           <li key={member.id || member.userId} className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-muted/50">
                             <div className="flex items-center gap-3 flex-grow min-w-0">
                               <Avatar className="h-9 w-9">
                                 <AvatarImage src={member.avatar || undefined} alt={member.name || 'User'} />
                                 <AvatarFallback>{member.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                               </Avatar>
                               <div className="min-w-0">
                                 <p className="text-sm font-medium truncate">{member.name || "Usuário Desconhecido"}</p>
                                 <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                               </div>
                             </div>
                              <div className="flex items-center flex-shrink-0 gap-1">
                                 <Badge variant={member.role?.toLowerCase() === 'admin' ? "default" : "secondary"} className="capitalize">
                                    {formatMemberRole(member.role)}
                                 </Badge>
                                 {isAdmin && String(member.userId) !== String(currentUser?.id) && (
                                     <DropdownMenu>
                                         <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                               <MoreVertical className="h-4 w-4" />
                                               <span className="sr-only">Ações para {member.name}</span>
                                            </Button>
                                         </DropdownMenuTrigger>
                                         <DropdownMenuContent align="end">
                                             <DropdownMenuLabel>Gerenciar {member.name}</DropdownMenuLabel>
                                             <DropdownMenuSeparator />
                                             {member.role?.toLowerCase() === 'member' ? (
                                                 <AlertDialog onOpenChange={(open) => !open && setMemberToPromote(null)}>
                                                     <AlertDialogTrigger asChild>
                                                         <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setMemberToPromote(member); }}>
                                                             <ShieldCheck className="mr-2 h-4 w-4" /> Promover a Admin
                                                         </DropdownMenuItem>
                                                     </AlertDialogTrigger>
                                                     {memberToPromote?.id === member.id && (
                                                         <AlertDialogContent>
                                                             <AlertDialogHeader><AlertDialogTitle>Promover a Admin?</AlertDialogTitle></AlertDialogHeader>
                                                             <AlertDialogDescription>Deseja conceder permissões de administrador para {member.name}?</AlertDialogDescription>
                                                             <AlertDialogFooter>
                                                                 <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
                                                                 <AlertDialogAction onClick={() => changeMemberRole(String(member.userId), 'Admin')} disabled={isProcessing}>
                                                                     {isProcessing ? <Loading text="Promovendo..." size="sm"/> : "Promover"}
                                                                 </AlertDialogAction>
                                                             </AlertDialogFooter>
                                                         </AlertDialogContent>
                                                     )}
                                                 </AlertDialog>
                                             ) : (
                                                 <AlertDialog onOpenChange={(open) => !open && setMemberToDemote(null)}>
                                                     <AlertDialogTrigger asChild>
                                                          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setMemberToDemote(member); }}>
                                                             <ShieldX className="mr-2 h-4 w-4" /> Rebaixar para Membro
                                                         </DropdownMenuItem>
                                                     </AlertDialogTrigger>
                                                     {memberToDemote?.id === member.id && (
                                                         <AlertDialogContent>
                                                             <AlertDialogHeader><AlertDialogTitle>Rebaixar para Membro?</AlertDialogTitle></AlertDialogHeader>
                                                             <AlertDialogDescription>Deseja remover as permissões de administrador de {member.name}?</AlertDialogDescription>
                                                             <AlertDialogFooter>
                                                                 <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
                                                                 <AlertDialogAction onClick={() => changeMemberRole(String(member.userId), 'Member')} disabled={isProcessing}>
                                                                     {isProcessing ? <Loading text="Rebaixando..." size="sm"/> : "Rebaixar"}
                                                                 </AlertDialogAction>
                                                             </AlertDialogFooter>
                                                         </AlertDialogContent>
                                                     )}
                                                 </AlertDialog>
                                             )}
                                            <DropdownMenuSeparator />
                                             <AlertDialog onOpenChange={(open) => !open && setMemberToRemove(null)}>
                                                 <AlertDialogTrigger asChild>
                                                      <DropdownMenuItem
                                                         className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                         onSelect={(e) => { e.preventDefault(); setMemberToRemove(member); }}
                                                      >
                                                         <UserMinus className="mr-2 h-4 w-4" /> Remover da Residência
                                                     </DropdownMenuItem>
                                                 </AlertDialogTrigger>
                                                 {memberToRemove?.id === member.id && (
                                                     <AlertDialogContent>
                                                         <AlertDialogHeader><AlertDialogTitle>Remover {member.name}?</AlertDialogTitle></AlertDialogHeader>
                                                         <AlertDialogDescription>Tem certeza que deseja remover {member.name} desta residência?</AlertDialogDescription>
                                                         <AlertDialogFooter>
                                                             <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
                                                             <AlertDialogAction onClick={() => removeMember(String(member.userId))} disabled={isProcessing} className="bg-destructive hover:bg-destructive/90">
                                                                 {isProcessing ? <Loading text="Removendo..." size="sm"/> : "Remover Membro"}
                                                             </AlertDialogAction>
                                                         </AlertDialogFooter>
                                                     </AlertDialogContent>
                                                 )}
                                             </AlertDialog>
                                         </DropdownMenuContent>
                                     </DropdownMenu>
                                 )}
                              </div>
                           </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum membro encontrado.</p>
                    )}
                </CardContent>
                 {isAdmin && (
                   <CardFooter className="border-t pt-4">
                       <Button variant="outline" className="w-full" onClick={() => router.push(`/households/${householdId}/members/invite`)}>
                         <UserPlus className="mr-2 h-4 w-4" /> Convidar Novo Membro
                       </Button>
                   </CardFooter>
                 )}
              </Card>
            </TabsContent>

            <TabsContent value="cats" className="mt-4">
               <Card>
                  <CardHeader>
                      <CardTitle className="text-lg">Gatos na Residência</CardTitle>
                      <CardDescription>Gatos gerenciados nesta residência.</CardDescription>
                  </CardHeader>
                  <CardContent>
                     {cats.length > 0 ? (
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           {cats.map((cat) => (
                             <CatCard 
                               key={cat.id} 
                               cat={cat} 
                               onView={() => router.push(`/cats/${cat.id}`)}
                               onEdit={() => router.push(`/cats/${cat.id}/edit`)}
                               onDelete={() => setCatToDelete(cat)} 
                             />
                           ))}
                         </div>
                     ) : (
                         <div className="pt-4">
                           <EmptyState
                             IconComponent={Cat}
                             title="Nenhum Gato Adicionado"
                             description="Adicione o primeiro gato desta residência."
                             actionButton={
                               <Button onClick={() => router.push(`/cats/new?householdId=${householdId}`)}>Adicionar Gato</Button>
                             }
                           />
                         </div>
                     )}
                  </CardContent>
                   {isAdmin && (
                     <CardFooter className="border-t pt-4">
                         <Button variant="outline" className="w-full" onClick={() => router.push(`/cats/new?householdId=${householdId}`)}>
                           <Plus className="mr-2 h-4 w-4" /> Adicionar Gato à Residência
                         </Button>
                     </CardFooter>
                   )}
               </Card>
            </TabsContent>
          </Tabs>
        </main>

        {catToDelete && (
           <AlertDialog open={!!catToDelete} onOpenChange={(open) => !open && setCatToDelete(null)}>
             <AlertDialogContent>
                <AlertDialogHeader>
                   <AlertDialogTitle>Remover {catToDelete.name}?</AlertDialogTitle>
                   <AlertDialogDescription>
                      Tem certeza que deseja remover {catToDelete.name} desta residência? Seus dados e agendamentos associados serão perdidos.
                   </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                   <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
                   <AlertDialogAction onClick={() => deleteCat(String(catToDelete.id))} disabled={isProcessing} className="bg-destructive hover:bg-destructive/90">
                     {isProcessing ? <Loading text="Removendo..." size="sm"/> : "Remover Gato"}
                   </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
           </AlertDialog>
        )}

        <BottomNav />
      </div>
    </PageTransition>
  )
}
