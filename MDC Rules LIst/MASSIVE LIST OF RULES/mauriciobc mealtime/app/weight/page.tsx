"use client";

import React, { useState, useEffect, useMemo } from 'react';
import CurrentStatusCard from '@/components/weight/current-status-card';
import WeightTrendChart from '@/components/weight/weight-trend-chart';
import QuickLogPanel, { WeightLogFormValues } from '@/components/weight/quick-log-panel';
import RecentHistoryList from '@/components/weight/recent-history-list';
import { MilestoneProgress } from '@/components/weight/milestone-progress';
import CatAvatarStack from '@/components/weight/cat-avatar-stack';
import { OnboardingTour } from '@/components/weight/onboarding-tour';
import GoalFormSheet, { GoalFormData } from '@/components/weight/goal-form-sheet';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { Gauge, HelpCircle, Plus } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useUserContext } from "@/lib/context/UserContext";

// Interface for Cat - matches expected API structure from /api/cats
interface Cat {
  id: string;
  name: string;
  photo_url?: string | null; // This is the field for the avatar
  weight?: number; // Current weight, ideally from cats.weight updated by API
  targetWeight?: number; // Optional: User-defined target, might be part of goal
  healthTip?: string; // Optional: Could be from another source or generated
  activeGoalId?: string | null; // Optional: Link to an active WeightGoalWithMilestones
  // Add other fields like user_id if your API provides/requires them
}

// Interface for WeightGoalWithMilestones - matches expected API structure from /api/goals
interface WeightGoalWithMilestones {
  id: string;
  cat_id: string; // Foreign key to Cat
  goal_name: string;
  start_date: string; // ISO Date string
  target_date: string; // ISO Date string
  initial_weight: number;
  target_weight: number;
  unit: 'kg' | 'lbs';
  milestones: Milestone[]; // Define Milestone interface if complex
  description?: string;
  isArchived?: boolean;
  achieved_date?: string | null; // ISO Date string
  outcome_notes?: string;
}

// Interface for Milestone - adjust as per your data model
interface Milestone {
  id: string;
  name: string;
  target_weight: number;
  target_date: string; // ISO Date string
  description?: string;
  // status?: 'pending' | 'achieved' | 'missed'; // Optional
}

// Interface for WeightLog - matches API structure from /api/weight-logs
interface WeightLog {
  id: string;
  cat_id: string;
  date: string; // ISO Date string
  weight: number;
  notes?: string;
  measured_by?: string; // User ID of who measured
}

// Define a type for the data used specifically when editing a log
// It combines form values with a mandatory ID.
type LogForEditing = WeightLogFormValues & { id: string };

const WeightPage = () => {
  const [cats, setCats] = useState<Cat[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [goals, setGoals] = useState<WeightGoalWithMilestones[]>([]);
  
  const [isLoadingCats, setIsLoadingCats] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [showArchivedGoals, setShowArchivedGoals] = useState(false);

  // State for QuickLogPanel (edit/create modal)
  const [isQuickLogPanelOpen, setIsQuickLogPanelOpen] = useState(false);
  const [logToEditData, setLogToEditData] = useState<LogForEditing | null>(null);

  // New state to trigger updates in child components
  const [logChangeTimestamp, setLogChangeTimestamp] = useState<number>(Date.now());

  // State for goal form sheet
  const [isGoalFormSheetOpen, setIsGoalFormSheetOpen] = useState(false);

  const { state: userState } = useUserContext();
  const { currentUser, isLoading: isLoadingUser, error: errorUser } = userState;
  const userId = currentUser?.id;

  // --- Data Fetching Effects ---
  useEffect(() => {
    if (!userId) return;

    const fetchCats = async () => {
      setIsLoadingCats(true);
      try {
        const response = await fetch('/api/cats', { 
          headers: { 'X-User-ID': userId } 
        });
        if (!response.ok) throw new Error(`Failed to fetch cats: ${response.statusText}`);
        const rawData: any[] = await response.json(); // Fetch as any
        const parsedData: Cat[] = rawData.map(cat => ({
          ...cat,
          weight: typeof cat.weight === 'string' ? parseFloat(cat.weight) : (typeof cat.weight === 'number' ? cat.weight : undefined),
          targetWeight: typeof cat.targetWeight === 'string' ? parseFloat(cat.targetWeight) : (typeof cat.targetWeight === 'number' ? cat.targetWeight : undefined),
        }));
        setCats(parsedData);
        if (parsedData.length > 0 && !selectedCatId) {
          setSelectedCatId(parsedData[0].id); // Auto-select first cat
        }
      } catch (error) {
        console.error("Error fetching cats:", error);
        toast.error("Não foi possível carregar os dados dos seus gatos.");
      } finally {
        setIsLoadingCats(false);
      }
    };
    fetchCats();
  }, [userId]);

  useEffect(() => {
    if (!selectedCatId || !userId) {
      setWeightLogs([]);
      return;
    }
    const fetchWeightLogs = async () => {
      setIsLoadingLogs(true);
      try {
        const response = await fetch(`/api/weight-logs?catId=${selectedCatId}`, {
          headers: { 'X-User-ID': userId }
        });
        if (!response.ok) throw new Error(`Failed to fetch weight logs: ${response.statusText}`);
        const rawData: any[] = await response.json(); // Fetch as any
        const parsedData: WeightLog[] = rawData.map(log => ({
          ...log,
          weight: typeof log.weight === 'string' ? parseFloat(log.weight) : (typeof log.weight === 'number' ? log.weight : 0), // Default to 0 if unparsable
        }));
        setWeightLogs(parsedData); // API should return logs sorted by date desc
      } catch (error) {
        console.error("Error fetching weight logs:", error);
        toast.error("Não foi possível carregar o histórico de peso do gato selecionado.");
      } finally {
        setIsLoadingLogs(false);
      }
    };
    fetchWeightLogs();
  }, [selectedCatId, userId]);

  useEffect(() => {
    if (!userId) return;

    // Fetch goals relevant to the user. API might support filtering by cat_id or user_id implicitly.
    const fetchGoals = async () => {
      setIsLoadingGoals(true);
      try {
        // If goals are per cat, endpoint might be /api/goals?catId=${selectedCatId}
        // Or /api/goals could return all goals for the user, then filter client-side.
        const response = await fetch(`/api/goals`, { // Assuming /api/goals returns all user goals
          headers: { 'X-User-ID': userId }
        });
        if (!response.ok) throw new Error(`Failed to fetch goals: ${response.statusText}`);
        const data: WeightGoalWithMilestones[] = await response.json();
        setGoals(data);
      } catch (error) {
        console.error("Error fetching goals:", error);
        toast.error("Não foi possível carregar os dados das metas.");
      } finally {
        setIsLoadingGoals(false);
      }
    };
    fetchGoals();
  }, [userId]);

  // Onboarding persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenOnboarding = localStorage.getItem('hasSeenWeightOnboarding');
      if (!hasSeenOnboarding && cats.length > 0) { // Show onboarding if cats are loaded and not seen before
        setIsOnboardingOpen(true);
      }
    }
  }, [cats]); // Trigger when cats data is available

  const handleSelectCat = (catId: string) => {
    setSelectedCatId(catId);
    setLogToEditData(null); // Clear any edit state when changing cat
    setIsQuickLogPanelOpen(false); // Close panel when changing cat
  };

  const handleOnboardingComplete = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenWeightOnboarding', 'true');
    }
    setIsOnboardingOpen(false);
    toast("Tour de integração concluído!", {
      description: "Você sempre pode encontrar ajuda clicando no botão 'Ajuda / Tour'.",
    });
  };

  const selectedCat = useMemo(() => {
    return cats.find(cat => cat.id === selectedCatId) || null;
  }, [selectedCatId, cats]);

  const { activeGoalForSelectedCat, archivedGoalsForSelectedCat } = useMemo(() => {
    if (!selectedCat) return { activeGoalForSelectedCat: null, archivedGoalsForSelectedCat: [] };
    
    // Filter goals for the selected cat first
    const goalsForThisCat = goals.filter(goal => goal.cat_id === selectedCat.id);

    const active = goalsForThisCat.find(goal => !goal.isArchived && goal.id === selectedCat.activeGoalId) ||
                   goalsForThisCat.find(goal => !goal.isArchived); // Fallback to first non-archived for this cat
    const archived = goalsForThisCat.filter(goal => goal.isArchived);
    
    return { activeGoalForSelectedCat: active || null, archivedGoalsForSelectedCat: archived };
  }, [selectedCat, goals]);

  const { currentLog, previousLog } = useMemo(() => {
    if (weightLogs.length === 0) return { currentLog: null, previousLog: null };
    // Assuming API returns logs sorted: newest first OR we sort them after fetch/update
    const sortedLogs = [...weightLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return {
      currentLog: sortedLogs[0] || null,
      previousLog: sortedLogs[1] || null,
    };
  }, [weightLogs]);

  // Function to update cat's weight in the 'cats' state based on the latest log
  const updateCatWeightFromLogs = (catId: string, logs: WeightLog[]) => {
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestWeight = sortedLogs.length > 0 ? sortedLogs[0].weight : undefined; // Use undefined or a default
    
    setCats(prevCats => prevCats.map(cat =>
      cat.id === catId ? { ...cat, weight: latestWeight } : cat
    ));
  };

  const handleLogSubmit = async (formData: WeightLogFormValues, logIdToUpdate?: string) => {
    if (!selectedCatId || !userId) {
      toast.error("Nenhum gato selecionado ou usuário não identificado.");
      return;
    }

    const apiEndpoint = logIdToUpdate ? `/api/weight-logs?id=${logIdToUpdate}` : '/api/weight-logs';
    const method = logIdToUpdate ? 'PUT' : 'POST';

    try {
      const response = await fetch(apiEndpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
        body: JSON.stringify({
          // For PUT, API might expect full object or only changed fields.
          // For POST, catId is top-level; for PUT, it might be nested or immutable.
          // Assuming API expects full object for PUT, with catId correctly sourced.
          catId: formData.catId || selectedCatId, // Ensure catId is present, prefer form's if available (though likely same)
          weight: Number(formData.weight),
          date: formData.date, 
          notes: formData.notes,
          // logId is sent via query param for PUT, not in body traditionally
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido." }));
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      const resultLog: WeightLog = await response.json();
      
      let updatedLogs: WeightLog[];
      if (logIdToUpdate) { // Edit
        updatedLogs = weightLogs.map(log => (log.id === logIdToUpdate ? resultLog : log));
        toast.success('Registro de peso atualizado com sucesso!');
      } else { // Create
        updatedLogs = [resultLog, ...weightLogs];
        toast.success('Peso registrado com sucesso!');
      }
      
      // Sort logs by date descending after any update/create
      updatedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setWeightLogs(updatedLogs);
      
      // Update the cat's weight in the main cats list
      updateCatWeightFromLogs(resultLog.cat_id, updatedLogs);
      
      setLogChangeTimestamp(Date.now()); // Trigger update

      setIsQuickLogPanelOpen(false);
      setLogToEditData(null);

    } catch (error: any) {
      console.error(`Falha ao ${logIdToUpdate ? 'atualizar' : 'registrar'} o peso:`, error);
      toast.error(`Falha ao ${logIdToUpdate ? 'atualizar' : 'registrar'} o peso: ${error.message}`);
    }
  };

  const handleRequestEditLog = (log: WeightLog) => { // Log type from RecentHistoryList might be slightly different
    if (!selectedCat) return;
    // Map WeightLog to LogForEditing
    const formData: LogForEditing = {
      id: log.id, // log.id is string, matching LogForEditing
      catId: log.cat_id || selectedCat.id, // Ensure catId is present
      weight: log.weight,
      date: new Date(log.date).toISOString().split('T')[0], // Format for input type="date"
      notes: log.notes || '',
    };
    setLogToEditData(formData);
    setIsQuickLogPanelOpen(true);
    // Optionally, scroll to QuickLogPanel or focus its first field
  };

  const handleRequestDeleteLog = async (logIdToDelete: string): Promise<boolean> => {
    if (!selectedCatId || !userId) {
      toast.error("Nenhum gato selecionado ou usuário não identificado.");
      return false;
    }

    // Confirmation dialog
    const confirmed = window.confirm("Tem certeza que deseja excluir este registro de peso?");
    if (!confirmed) {
      return false;
    }

    try {
      const response = await fetch(`/api/weight-logs?id=${logIdToDelete}`, { // Placeholder, ensure API supports DELETE with id query param
        method: 'DELETE',
        headers: {
          'X-User-ID': userId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido ao excluir." }));
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }
      
      // const deletedLogData = await response.json(); // API might return deleted log or { success: true }
      
      const updatedLogs = weightLogs.filter(log => log.id !== logIdToDelete);
      setWeightLogs(updatedLogs);
      
      // Update the cat's weight in the main cats list
      // Ensure selectedCatId is used here as resultLog.cat_id won't be available from DELETE response
      updateCatWeightFromLogs(selectedCatId, updatedLogs); 
      
      setLogChangeTimestamp(Date.now()); // Trigger update
      
      toast.success("Registro de peso excluído com sucesso.");
      return true; // Indicate success to RecentHistoryList for re-fetch

    } catch (error: any) {
      console.error("Falha ao excluir o registro de peso:", error);
      toast.error(`Falha ao excluir o registro: ${error.message}`);
      return false; // Indicate failure
    }
  };

  const handleGoalSubmit = async (formData: GoalFormData) => {
    if (!userId || !selectedCatId) { // Ensure selectedCatId is also available if needed beyond formData.cat_id
      toast.error("Usuário ou gato não identificado. Não é possível criar a meta.");
      return;
    }
    
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
        body: JSON.stringify(formData), // formData already includes cat_id
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido ao criar meta." }));
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      const newGoal: WeightGoalWithMilestones = await response.json();

      setGoals(prevGoals => {
        // Add new goal and resort. Consider if activeGoalId on cat needs update.
        const updatedGoals = [newGoal, ...prevGoals].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
        return updatedGoals;
      });
      
      // If the newly created goal should become the active one for the cat, update the cat's state.
      // This depends on your application logic for how activeGoalId is managed.
      // For example, if any new non-archived goal for a cat becomes active:
      if (selectedCat && !newGoal.isArchived) {
        setCats(prevCats => prevCats.map(cat => 
          cat.id === selectedCat.id ? { ...cat, activeGoalId: newGoal.id } : cat
        ));
      }

      toast.success("Nova meta de peso criada com sucesso!");
      setIsGoalFormSheetOpen(false); // Close the sheet

    } catch (error: any) {
      console.error("Falha ao criar a meta de peso:", error);
      toast.error(`Falha ao criar a meta: ${error.message || 'Erro desconhecido'}`);
      // Do not close sheet on error, so user can retry or correct.
    }
  };

  // --- Render Logic ---
  if (isLoadingUser) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Painel de Acompanhamento de Peso</h1>
        <p>Carregando sessão do usuário...</p>
      </div>
    );
  }

  if (errorUser) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Painel de Acompanhamento de Peso</h1>
        <p className="text-red-500">Erro ao carregar a sessão do usuário: {typeof errorUser === 'string' ? errorUser : 'Por favor, tente novamente mais tarde.'}</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Painel de Acompanhamento de Peso</h1>
        <p>Por favor, faça login para ver esta página.</p>
      </div>
    );
  }

  if (isLoadingCats) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Painel de Acompanhamento de Peso</h1>
        <p>Carregando seus companheiros felinos...</p>
      </div>
    );
  }

  if (cats.length === 0) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-2xl font-bold text-center">Painel de Acompanhamento de Peso</h1>
        <p className="text-center text-muted-foreground">
          Nenhum gato encontrado. Adicione um gato para começar a acompanhar o peso dele.
        </p>
        <OnboardingTour isOpen={isOnboardingOpen} onOpenChange={setIsOnboardingOpen} onComplete={handleOnboardingComplete} />
        <div className="text-center mt-4">
          <Button variant="outline" onClick={() => setIsOnboardingOpen(true)}>Mostrar Tour Novamente</Button>
        </div>
      </div>
    );
  }

  if (!selectedCat && cats.length > 0) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-2xl font-bold">Painel de Acompanhamento de Peso</h1>
        <CatAvatarStack cats={cats} selectedCatId={null} onSelectCat={handleSelectCat} className="mb-6"/>
        <p className="text-center text-muted-foreground">Por favor, selecione um gato para ver os detalhes.</p>
        <OnboardingTour isOpen={isOnboardingOpen} onOpenChange={setIsOnboardingOpen} onComplete={handleOnboardingComplete} />
         <div className="text-center mt-4">
          <Button variant="outline" onClick={() => setIsOnboardingOpen(true)}>Mostrar Tour Novamente</Button>
        </div>
      </div>
    );
  }
  
  // Main content when a cat is selected
  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Gauge className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Painel de Peso</h1>
        </div>
        <p className="text-base text-muted-foreground ml-11">
          Acompanhe e gerencie o peso de {selectedCat?.name || 'seus gatos'}.
        </p>
      </div>

      <div className="flex justify-between items-center mb-6 gap-4">
        <CatAvatarStack className="flex-grow" cats={cats} selectedCatId={selectedCatId} onSelectCat={handleSelectCat} />
        <Button variant="ghost" size="icon" onClick={() => setIsOnboardingOpen(true)} aria-label="Ajuda / Tour">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </div>
      
      {isLoadingLogs && <p className="text-center text-muted-foreground">Carregando histórico de peso para {selectedCat?.name}...</p>}
      {isLoadingGoals && <p className="text-center text-muted-foreground">Carregando metas...</p>}

      {selectedCat && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column / Main Info */}
          <div className="lg:col-span-1 space-y-6">
            <CurrentStatusCard 
              currentWeight={currentLog?.weight ?? selectedCat.weight ?? 0} 
              currentWeightDate={currentLog?.date}
              targetWeight={activeGoalForSelectedCat?.target_weight ?? selectedCat.targetWeight}
              healthTip={selectedCat.healthTip}
              unit={activeGoalForSelectedCat?.unit || 'kg'}
              previousWeight={previousLog?.weight}
              previousWeightDate={previousLog?.date}
            />
            {/* QuickLogPanel is now controlled and its trigger might be elsewhere or used for programmatic opening */}
            {/* We can still render the FAB trigger from within QuickLogPanel, and open it programmatically */}
            <QuickLogPanel 
              catId={selectedCat.id} 
              onLogSubmit={handleLogSubmit}
              logToEdit={logToEditData}
              isPanelOpen={isQuickLogPanelOpen}
              onPanelOpenChange={(isOpen) => {
                setIsQuickLogPanelOpen(isOpen);
                if (!isOpen) { // If panel is closed, ensure edit mode is reset
                  setLogToEditData(null);
                }
              }}
            />
          </div>

          {/* Right Column / Charts and Details */}
          <div className="lg:col-span-2 space-y-6">
            {activeGoalForSelectedCat && (
              <MilestoneProgress 
                activeGoal={activeGoalForSelectedCat} 
                currentWeight={currentLog?.weight ?? selectedCat.weight ?? 0}
              />
            )}
            {!activeGoalForSelectedCat && !isLoadingGoals && selectedCat && (
              <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <p className="text-center text-muted-foreground">
                    Nenhuma meta ativa definida para {selectedCat.name}.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setIsGoalFormSheetOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Definir Nova Meta
                  </Button>
                </div>
              </div>
            )}

            <WeightTrendChart 
              catId={selectedCat.id}
              userId={userId}
              logChangeTimestamp={logChangeTimestamp} // Pass a trigger prop
            />
            <RecentHistoryList 
              catId={selectedCat.id}
              userId={userId}
              onEditRequest={handleRequestEditLog}
              onDeleteRequest={handleRequestDeleteLog}
              logChangeTimestamp={logChangeTimestamp} // Pass a trigger prop
            />
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="archived-goals">
                <AccordionTrigger>Metas Arquivadas</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="flex items-center justify-end space-x-2 mb-2">
                    <Label htmlFor="show-archived-goals" className="text-sm">Mostrar Arquivadas</Label>
                    <Switch 
                      id="show-archived-goals" 
                      checked={showArchivedGoals}
                      onCheckedChange={setShowArchivedGoals} 
                    />
                  </div>
                  {isLoadingGoals && <p className="text-sm text-muted-foreground">Carregando metas arquivadas...</p>}
                  {!isLoadingGoals && showArchivedGoals && archivedGoalsForSelectedCat.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma meta arquivada para {selectedCat.name}.</p>
                  )}
                  {showArchivedGoals && archivedGoalsForSelectedCat.map(goal => (
                    <div key={goal.id} className="p-3 border rounded-md bg-muted/50 opacity-80 hover:opacity-100 transition-opacity">
                      <h4 className="font-medium text-sm">{goal.goal_name} (Arquivada)</h4>
                      <p className="text-xs text-muted-foreground">
                        Alvo: {goal.target_weight}{goal.unit} (Inicial: {goal.initial_weight}{goal.unit})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Período: {new Date(goal.start_date).toLocaleDateString()} - {new Date(goal.target_date).toLocaleDateString()}
                      </p>
                      {goal.description && <p className="text-xs mt-1">{goal.description}</p>}
                      {goal.achieved_date && <p className="text-xs mt-1 text-green-600 dark:text-green-400">Alcançada: {new Date(goal.achieved_date).toLocaleDateString()}</p>}
                      {goal.outcome_notes && <p className="text-xs mt-1">Resultado: {goal.outcome_notes}</p>}
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      )}
      <OnboardingTour 
        isOpen={isOnboardingOpen} 
        onOpenChange={setIsOnboardingOpen} 
        onComplete={handleOnboardingComplete} 
      />
      {selectedCat && (
        <GoalFormSheet 
          isOpen={isGoalFormSheetOpen}
          onOpenChange={setIsGoalFormSheetOpen}
          onSubmit={handleGoalSubmit}
          catId={selectedCat.id}
          currentWeight={currentLog?.weight ?? selectedCat.weight}
          defaultUnit={activeGoalForSelectedCat?.unit || 'kg'} // Or a sensible default like 'kg'
        />
      )}
    </div>
  );
};

export default WeightPage;