"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Cat, Clock, Utensils, BarChart3, Calendar, Users, PlusCircle, Gauge, ArrowRight, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUserContext } from "@/lib/context/UserContext";
import { useCats } from "@/lib/context/CatsContext";
import {
  useFeeding,
  useSelectTodayFeedingCount,
  useSelectLastFeedingLog,
  useSelectRecentFeedingsChartData,
  useSelectAveragePortionSize
} from "@/lib/context/FeedingContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeedingLogItem } from "@/components/feeding/feeding-log-item";
import { GlobalLoading } from "@/components/ui/global-loading";
import { EmptyState } from "@/components/ui/empty-state";
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { FeedingLog, CatType } from "@/lib/types";
import { NewFeedingSheet } from "@/components/feeding/new-feeding-sheet";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import EventsList from "@/components/events-list";

export default function Home() {
  const { state: userState } = useUserContext();
  const { state: catsState } = useCats();
  const { state: feedingState } = useFeeding();
  const { currentUser, isLoading: isLoadingUser, error: errorUser } = userState;
  const { cats, isLoading: isLoadingCats, error: errorCats } = catsState;
  const { isLoading: isLoadingFeedings, error: errorFeedings } = feedingState;

  const todayFeedingCount = useSelectTodayFeedingCount();
  const recentFeedingsData = useSelectRecentFeedingsChartData();
  const lastFeedingLog = useSelectLastFeedingLog();
  const averagePortionSize = useSelectAveragePortionSize();

  const [isNewFeedingSheetOpen, setIsNewFeedingSheetOpen] = useState(false);

  const isDataLoading = isLoadingUser || isLoadingCats || isLoadingFeedings;
  const isNewUserFlow = !isDataLoading && !!currentUser && cats && cats.length === 0 && !!currentUser?.householdId;

  const colorPalette = [
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "hsl(221 83% 53%)",
    "hsl(142 76% 36%)",
    "hsl(334 86% 48%)",
    "hsl(288 95.8% 60.6%)",
    "hsl(31 97.8% 58.8%)",
    "hsl(266, 100%, 60%)",
  ];

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

  const router = useRouter();

  // --- Refined Loading and State Checks --- 

  // 1. Handle User Context Loading FIRST - this covers initial load AND refetches
  if (isLoadingUser) {
    return <GlobalLoading text="Carregando dados do usuário..." />;
  }

  // 2. Handle User Context Errors (if not loading)
  if (errorUser) {
    return (
      <div className="container px-4 py-8 text-center">
        <p className="text-destructive">Erro ao carregar dados do usuário: {errorUser}</p>
      </div>
    );
  }

  // 3. Handle No Authenticated User Found (if not loading and no error)
  useEffect(() => {
    if (!isLoadingUser && !currentUser) {
      router.replace("/login?callbackUrl=/");
    }
  }, [isLoadingUser, currentUser, router]);

  if (!currentUser && !isLoadingUser) {
    return <GlobalLoading text="Redirecionando para login..." />;
  }
  
  // 4. Handle User Found, But No Household Associated (if user loaded and exists)
  // This check now ONLY runs if isLoadingUser is false and currentUser is valid.
  if (!currentUser.householdId) { 
    return (
       <div className="container px-4 py-8">
         <EmptyState
           IconComponent={Users}
           title="Associe uma Residência"
           description="Você precisa criar ou juntar-se a uma residência para usar o painel."
           actionButton={
             <Button asChild>
               <Link href="/households">Ir para Configurações de Residência</Link>
             </Button>
           }
           className="max-w-xl mx-auto my-12"
         />
       </div>
     );
  }

  // --- User and Household Confirmed: Proceed with Dashboard --- 

  // 5. Handle Loading States for Other Contexts (Cats, Feedings)
  const isDashboardDataLoading = isLoadingCats || isLoadingFeedings;
  if (isDashboardDataLoading) {
     // Use a more specific loading message if desired
     return <GlobalLoading text="Carregando dados do painel..." />;
  }

  // 6. Handle Errors from Other Contexts
  const dashboardDataError = errorCats || errorFeedings;
  if (dashboardDataError) {
     return (
       <div className="container px-4 py-8 text-center">
         <p className="text-destructive">Erro ao carregar dados do painel: {dashboardDataError}</p>
       </div>
     );
  }
  
  // 7. Handle New User Flow (Household exists, but no cats)
  const isNewUserWithHouseholdFlow = cats && cats.length === 0;
  if (isNewUserWithHouseholdFlow) {
    return (
      <div className="container px-4 py-8">
        <EmptyState
          IconComponent={Cat}
          title="Bem-vindo ao MealTime!"
          description="Sua residência está configurada! Cadastre seu primeiro gato para começar."
          actionButton={
            <Button asChild>
              <Link href="/cats/new">Cadastrar Meu Primeiro Gato</Link>
            </Button>
          }
          className="max-w-xl mx-auto my-12"
        />
      </div>
    );
  }

  const chartCats = cats || [];

  // 8. Render the Main Dashboard Content
  return (
    <motion.div
      className="container px-4 py-6 md:py-8 pb-28"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-sm text-center p-3 hover:shadow-md transition-shadow">
            <CardHeader className="p-0 mb-1">
              <CardDescription className="text-xs flex items-center justify-center">
                <Cat className="mr-1 h-3 w-3" />
                Total de Gatos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-lg font-semibold">{cats?.length || 0}</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm text-center p-3 hover:shadow-md transition-shadow">
            <CardHeader className="p-0 mb-1">
              <CardDescription className="text-xs flex items-center justify-center">
                <Utensils className="mr-1 h-3 w-3" />
                Alimentações Hoje
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-lg font-semibold">{todayFeedingCount}</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm text-center p-3 hover:shadow-md transition-shadow">
            <CardHeader className="p-0 mb-1">
              <CardDescription className="text-xs flex items-center justify-center">
                <Gauge className="mr-1 h-3 w-3" />
                Porção Média
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-lg font-semibold">
                {averagePortionSize !== null
                  ? `${averagePortionSize.toFixed(1)}g`
                  : "N/A"}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm text-center p-3 hover:shadow-md transition-shadow">
            <CardHeader className="p-0 mb-1">
              <CardDescription className="text-xs flex items-center justify-center">
                <Clock className="mr-1 h-3 w-3" />
                Última Vez
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-lg font-semibold">
                {lastFeedingLog
                  ? format(new Date(lastFeedingLog.timestamp), "HH:mm")
                  : "N/A"}
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="shadow-sm hover:shadow-md transition-shadow" data-tour="last-feeding">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-primary" />
                  Última Alimentação
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lastFeedingLog ? (
                  <FeedingLogItem log={lastFeedingLog} />
                ) : (
                  <EmptyState
                    title="Nenhuma alimentação encontrada"
                    description="Registre a primeira alimentação do seu pet para começar."
                    IconComponent={Utensils}
                    actionButton={
                      <Button onClick={() => setIsNewFeedingSheetOpen(true)} size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" /> Registrar Nova
                      </Button>
                    }
                  />
                )}
              </CardContent>
              <CardFooter className="flex justify-between sm:justify-end items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
                  <Link href="/feedings" className="flex items-center">
                    Ver todas
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="shadow-sm hover:shadow-md transition-shadow" data-tour="feeding-chart">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                  Alimentações (Últimos 7 dias)
                </CardTitle>
                <CardDescription>Total de ração (gramas) por gato por dia</CardDescription>
              </CardHeader>
              <CardContent>
                {recentFeedingsData.length > 0 && chartCats.length > 0 ? (
                  <ChartContainer config={{}} className="h-[250px] w-full">
                    <RechartsBarChart data={recentFeedingsData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}g`} />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                      {chartCats.map((cat, index) => (
                        <Bar
                          key={cat.id}
                          dataKey={cat.id}
                          fill={colorPalette[index % colorPalette.length]}
                          radius={4}
                          name={cat.name}
                        />
                      ))}
                    </RechartsBarChart>
                  </ChartContainer>
                ) : (
                  <EmptyState
                    title="Dados insuficientes para o gráfico"
                    description="Registre algumas alimentações com porção para ver o gráfico."
                    IconComponent={BarChart3}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} data-tour="recent-logs">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-primary" />
                  Registros Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EventsList />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm hover:shadow-md transition-shadow" data-tour="my-cats">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cat className="mr-2 h-5 w-5 text-primary" />
                Meus Gatos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cats && cats.length > 0 ? (
                <ul className="space-y-3">
                  {cats.slice(0, 5).map((cat: CatType) => (
                    <li key={cat.id}>
                      <Link href={`/cats/${cat.id}`} className="flex items-center gap-3 hover:bg-muted/50 p-2 rounded-md transition-colors">
                        <Avatar className="h-10 w-10 mr-2">
                          <AvatarImage src={cat.photo_url || ''} alt={cat.name} />
                          <AvatarFallback>{cat.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow min-w-0">
                          <p className="font-medium truncate">{cat.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {cat.weight ? `${cat.weight} kg` : "- kg"}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                 <EmptyState
                  title="Nenhum gato cadastrado"
                  description="Cadastre seus gatos para começar."
                  IconComponent={Cat}
                />
              )}
            </CardContent>
             <CardFooter className="justify-end">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/cats" className="flex items-center">
                   Ver todos os gatos
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

        </motion.div>
      </div>

      {/* FAB to open NewFeedingSheet */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg flex items-center justify-center text-2xl z-20" 
              variant="default" 
              size="icon"
              aria-label="Registrar nova alimentação"
              onClick={() => setIsNewFeedingSheetOpen(true)}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Registrar Nova Alimentação</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <NewFeedingSheet
        isOpen={isNewFeedingSheetOpen}
        onOpenChange={setIsNewFeedingSheetOpen}
        // Assuming you have a function to handle the submission of the new feeding log
        // and the list of cats to pass as props.
        // Adjust props as necessary based on your NewFeedingSheet component's requirements.
        // e.g., onLogSubmit={handleNewFeedingSubmit} cats={cats}
      />
    </motion.div>
  );
}