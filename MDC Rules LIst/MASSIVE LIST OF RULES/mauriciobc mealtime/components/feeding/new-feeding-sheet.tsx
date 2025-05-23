"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, addHours, isToday, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { formatInTimeZone } from 'date-fns-tz';
import { getUserTimezone, calculateNextFeeding, formatDateTimeForDisplay } from '@/lib/utils/dateUtils';
import { CatType, FeedingLog } from "@/lib/types";
import { useUserContext } from "@/lib/context/UserContext";
import { useLoading } from "@/lib/context/LoadingContext";
import { useCats } from "@/lib/context/CatsContext";
import { useFeeding } from "@/lib/context/FeedingContext";
import Link from "next/link";
import { 
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loading } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Clock, Bell, Cat as CatIcon, Utensils, X, CheckCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface NewFeedingSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialCatId?: number;
}

export function NewFeedingSheet({ 
    isOpen, 
    onOpenChange, 
    initialCatId 
}: NewFeedingSheetProps) {
  const router = useRouter();
  const { state: userState } = useUserContext();
  const { state: catsState } = useCats();
  const { state: feedingState, dispatch: feedingDispatch } = useFeeding();
  const { addLoadingOperation, removeLoadingOperation } = useLoading();
  const { currentUser } = userState;
  const { cats, isLoading: isLoadingCats } = catsState;
  const { feedingLogs, isLoading: isLoadingFeedings } = feedingState;

  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [portions, setPortions] = useState<{ [key: string]: string }>({});
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [feedingStatus, setFeedingStatus] = useState<{ [key: string]: "Normal" | "Comeu Pouco" | "Recusou" | "Vomitou" | "Outro" }>({});
  const [mealTypes, setMealTypes] = useState<{ [key: string]: "dry" | "wet" | "treat" | "medicine" | "water" }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmDialogContent, setConfirmDialogContent] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const statusOptions = [
    { value: "Normal", label: "Normal" },
    { value: "Comeu Pouco", label: "Comeu Pouco" },
    { value: "Recusou", label: "Recusou" },
    { value: "Vomitou", label: "Vomitou" },
    { value: "Outro", label: "Outro (ver notas)" },
  ];

  const mealTypeOptions = [
    { value: "dry", label: "Ração Seca" },
    { value: "wet", label: "Ração Úmida" },
    { value: "treat", label: "Petisco" },
    { value: "medicine", label: "Medicamento" },
    { value: "water", label: "Água" },
  ];

  const householdCats = useMemo(() => {
    if (isLoadingCats || !cats || !currentUser?.householdId) {
      // --- DEBUG --- 
      console.log('[NewFeedingSheet useMemo] Guard clause triggered:', { isLoadingCats, hasCats: !!cats, currentUserHouseholdId: currentUser?.householdId });
      // --- END DEBUG ---
      return [];
    }

    const userHouseholdIdStr = String(currentUser.householdId);

    // --- DEBUG ---
    console.log(`[NewFeedingSheet useMemo] User Household ID: '${userHouseholdIdStr}'`);
    console.log('[NewFeedingSheet useMemo] Cats from context:', cats);
    // --- END DEBUG ---

    const filteredCats = cats.filter(cat => {
      const catHouseholdIdStr = String(cat.householdId);
      const match = catHouseholdIdStr === userHouseholdIdStr;
      // --- DEBUG ---
      if (!match) {
        console.warn(`[NewFeedingSheet useMemo] Mismatch: Cat ID '${cat.id}' Household '${catHouseholdIdStr}' !== User Household '${userHouseholdIdStr}'`);
      }
      // --- END DEBUG ---
      return match;
    });

    // --- DEBUG ---
    console.log('[NewFeedingSheet useMemo] Filtered cats:', filteredCats);
    // --- END DEBUG ---

    return filteredCats;
  }, [cats, isLoadingCats, currentUser]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      const initialPortions: { [key: string]: string } = {};
      householdCats.forEach((cat: CatType) => {
        initialPortions[cat.id] = cat.portion_size?.toString() || "";
      });
      setPortions(initialPortions);
      setNotes({});
      
      const initialCatIdStr = initialCatId?.toString();
      if (initialCatIdStr && householdCats.some(cat => cat.id === initialCatIdStr)) {
          setSelectedCats([initialCatIdStr]);
          setFeedingStatus({ [initialCatIdStr]: "Normal" });
          setMealTypes({ [initialCatIdStr]: "dry" }); // Default to dry food
      } else {
          setSelectedCats([]);
          setFeedingStatus({});
          setMealTypes({});
      }
      
    } else {
      setSelectedCats([]);
      setPortions({});
      setNotes({});
      setFeedingStatus({});
      setMealTypes({});
      setIsSubmitting(false);
      setError(null);
    }
  }, [isOpen, householdCats, initialCatId, cats]);

  const formatRelativeTime = useCallback((utcDateTime: Date | string | null | undefined) => {
    if (!utcDateTime) return "Nunca";
    try {
      const date = typeof utcDateTime === 'string' ? new Date(utcDateTime) : utcDateTime;
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar tempo relativo:', error);
      return "Data inválida";
    }
  }, []);

  const getLastFeedingLog = useCallback((catId: string): FeedingLog | undefined => {
    if (isLoadingFeedings || !feedingLogs) return undefined;
    return feedingLogs
        .filter(log => log.catId === catId)
        [0];
  }, [feedingLogs, isLoadingFeedings]);

  const toggleCatSelection = useCallback((catId: string) => {
    setSelectedCats(prev => {
      const isCurrentlySelected = prev.includes(catId);
      if (isCurrentlySelected) {
        setFeedingStatus(currentStatus => {
          const { [catId]: _, ...rest } = currentStatus;
          return rest;
        });
        return prev.filter(id => id !== catId);
      } else {
        setFeedingStatus(currentStatus => ({
          ...currentStatus,
          [catId]: "Normal"
        }));
        return [...prev, catId];
      }
    });
  }, []);

  const handleSelectAll = useCallback(() => {
     const allCatIds = householdCats.map(cat => cat.id);
     setSelectedCats(allCatIds);
     const newStatus = allCatIds.reduce((acc, id) => ({ ...acc, [id]: "Normal" }), {});
     setFeedingStatus(newStatus);
  }, [householdCats]);

  const handleDeselectAll = useCallback(() => {
     setSelectedCats([]);
     setFeedingStatus({});
  }, []);

  const handlePortionChange = useCallback((catId: string, value: string) => {
    setPortions(prev => ({ ...prev, [catId]: value }));
  }, []);

  const handleNotesChange = useCallback((catId: string, value: string) => {
    setNotes(prev => ({ ...prev, [catId]: value }));
  }, []);

  const handleStatusChange = useCallback((catId: string, value: string) => {
    setFeedingStatus(prev => ({ ...prev, [catId]: value as "Normal" | "Comeu Pouco" | "Recusou" | "Vomitou" | "Outro" }));
  }, []);

  const handleMealTypeChange = (catId: string, value: "dry" | "wet" | "treat" | "medicine" | "water") => {
    setMealTypes(prev => ({ ...prev, [catId]: value }));
  };

  const handleSubmit = async () => {
    if (selectedCats.length === 0) {
      toast.error("Selecione pelo menos um gato");
      return;
    }

    const opId = "submit-feeding-logs";
    setIsSubmitting(true);
    setError(null);
    addLoadingOperation({ id: opId, description: "Registrando alimentações..." });

    const timestamp = new Date();
    const logsToCreate = [];
    let validationError = null;

    for (const catId of selectedCats) {
      const portion = portions[catId];
      const note = notes[catId] || "";
      const status = feedingStatus[catId] || "Normal";
      const mealType = mealTypes[catId] || "dry";
      
      // Validate portion size
      let portionNum = null;
      if (portion) {
        portionNum = parseFloat(portion);
        if (isNaN(portionNum) || portionNum < 0) {
          validationError = `Porção inválida para ${householdCats.find(c => c.id === catId)?.name}`;
          break;
        }
      }

      // Create payload matching FeedingBatchSchema
      logsToCreate.push({
        catId,
        portionSize: portionNum || 0,
        timestamp: timestamp.toISOString(),
        notes: note,
        status,
        mealType,
        unit: 'g'
      });
    }

    if (validationError) {
      toast.error("Erro de Validação", { description: validationError });
      setError(validationError);
      setIsSubmitting(false);
      removeLoadingOperation(opId);
      return;
    }

    try {
      const response = await fetch("/api/feedings/batch", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ logs: logsToCreate }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Falha ao registrar (${response.status})`);
      }

      const result = await response.json();
      
      // Trigger a refetch since we only get a count back
      if (userState.refetchUser) {
        await userState.refetchUser();
      }

      toast.success(`${result.count} ${result.count === 1 ? 'alimentação registrada' : 'alimentações registradas'} com sucesso!`);
      onOpenChange(false);

    } catch (err: any) {
      console.error("Error submitting feeding logs:", err);
      setError(err.message || "Ocorreu um erro desconhecido.");
      toast.error("Erro ao Registrar", { description: err.message || "Ocorreu um erro desconhecido." });
    } finally {
      setIsSubmitting(false);
      removeLoadingOperation(opId);
    }
  };

  const catListItems = useMemo(() => {
    if (isLoadingCats || !householdCats) {
      return <Loading />;
    }

    if (householdCats.length === 0) {
      return (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="Nenhum gato encontrado"
          description="Você ainda não tem gatos cadastrados."
          action={
            <Button asChild>
              <Link href="/cats">Cadastrar Gato</Link>
            </Button>
          }
        />
      );
    }

    return householdCats.map((cat) => {
      const isSelected = selectedCats.includes(cat.id);
      const lastFeeding = getLastFeedingLog(cat.id);
      const portion = portions[cat.id] || "";
      const status = feedingStatus[cat.id] || "Normal";
      const mealType = mealTypes[cat.id] || "dry";
      const note = notes[cat.id] || "";

      return (
        <motion.div
          key={cat.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className={cn(
            "relative overflow-hidden transition-colors",
            isSelected ? "border-primary" : "hover:border-muted-foreground/50"
          )}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Checkbox
                  id={`cat-${cat.id}`}
                  checked={isSelected}
                  onCheckedChange={() => toggleCatSelection(cat.id)}
                  className="mt-1"
                />
                <div className="flex-grow space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={cat.photoUrl || ""} alt={cat.name} />
                        <AvatarFallback>
                          <CatIcon className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium leading-none">{cat.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Última refeição: {formatRelativeTime(lastFeeding?.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <Label htmlFor={`portion-${cat.id}`}>Porção (g)</Label>
                          <Input
                            id={`portion-${cat.id}`}
                            type="number"
                            min="0"
                            step="0.1"
                            value={portion}
                            onChange={(e) => handlePortionChange(cat.id, e.target.value)}
                            placeholder={cat.portion_size?.toString() || "0"}
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor={`status-${cat.id}`}>Status</Label>
                          <Select value={status} onValueChange={(value) => handleStatusChange(cat.id, value as any)}>
                            <SelectTrigger id={`status-${cat.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <Label htmlFor={`meal-type-${cat.id}`}>Tipo de Refeição</Label>
                          <Select value={mealType} onValueChange={(value) => handleMealTypeChange(cat.id, value as any)}>
                            <SelectTrigger id={`meal-type-${cat.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {mealTypeOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`notes-${cat.id}`}>Observações</Label>
                        <Input
                          id={`notes-${cat.id}`}
                          value={note}
                          onChange={(e) => handleNotesChange(cat.id, e.target.value)}
                          placeholder="Opcional"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    });
  }, [householdCats, isLoadingCats, getLastFeedingLog, selectedCats, portions, feedingStatus, mealTypes, notes, toggleCatSelection, handlePortionChange, handleStatusChange, handleMealTypeChange, handleNotesChange, formatRelativeTime]);

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader className="text-left px-6 pt-4 pb-2">
          <DrawerTitle>Registrar Nova Alimentação</DrawerTitle>
          <DrawerDescription>
            Selecione os gatos e informe os detalhes da refeição.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex justify-between items-center px-6 pb-3">
           <p className="text-sm text-muted-foreground">
             {selectedCats.length} de {householdCats.length} gatos selecionados
           </p>
           <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={selectedCats.length === householdCats.length || householdCats.length === 0}>
                 Selecionar Todos
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeselectAll} disabled={selectedCats.length === 0}>
                 Limpar Seleção
              </Button>
           </div>
        </div>
        <ScrollArea className="flex-grow overflow-y-auto px-6">
          <div className="space-y-2 pb-4">
            <AnimatePresence>
              {catListItems}
            </AnimatePresence>
          </div>
        </ScrollArea>
         {error && (
            <p className="px-6 py-2 text-sm text-destructive text-center">Erro: {error}</p>
         )}
        <DrawerFooter className="pt-4 border-t">
          <Button 
            onClick={handleSubmit}
            disabled={selectedCats.length === 0 || isSubmitting}
          >
            {isSubmitting ? <Loading size="sm" className="mr-2"/> : <Check className="mr-2 h-4 w-4" />} 
            Confirmar Alimentação ({selectedCats.length})
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
} 