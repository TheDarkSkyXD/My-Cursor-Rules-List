"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subMonths, getHours } from "date-fns"
import { parseISO } from "date-fns/parseISO"
import { ptBR } from "date-fns/locale"
import { PageTransition } from "@/components/ui/page-transition"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, ChevronDown, TrendingUp, AlertTriangle, BarChart3, PieChart, Filter, Calendar, PlusCircle, Users, Utensils, Scale, CalendarCheck } from "lucide-react"
import { useUserContext } from "@/lib/context/UserContext"
import { useCats } from "@/lib/context/CatsContext"
import { useFeeding } from "@/lib/context/FeedingContext"
import { useSelectFeedingStatistics } from "@/lib/selectors/statisticsSelectors"
import { Button } from "@/components/ui/button"
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from "recharts"
import { EmptyState } from "@/components/ui/empty-state"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/page-header"
import { motion } from "framer-motion"
import Link from "next/link"
import { StatCard } from "@/components/ui/stat-card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { FeedingLog, CatType } from "@/lib/types"
import { getDateRange, StatisticsData, TimeSeriesDataPoint, CatPortion } from "@/lib/selectors/statisticsSelectors"
import { toast } from "sonner"
import { resolveDateFnsLocale } from "@/lib/utils/dateFnsLocale"

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042']

// Helper function for safe parsing
const safeParseISO = (timestamp: string | Date | unknown): Date | null => {
  try {
    const timestampStr = typeof timestamp === 'string'
      ? timestamp
      : timestamp instanceof Date
        ? timestamp.toISOString()
        : String(timestamp);

    if (!timestampStr) return null;
    const date = parseISO(timestampStr);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch (e) {
    console.error(`[safeParseISO] Error processing timestamp:`, timestamp, e);
    return null;
  }
};

const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile };
};

const LineChartComponent = ({ data }: { data: TimeSeriesDataPoint[] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="relative w-full aspect-[16/9] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Sem dados para exibir</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[16/9]">
      <ChartContainer
        config={{
          valor: {
            label: "Consumo (g)",
            color: "hsl(var(--primary))",
          }
        }}
        className="absolute inset-0 [&_.recharts-cartesian-grid-horizontal_line]:stroke-muted [&_.recharts-cartesian-grid-vertical_line]:stroke-muted"
      >
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart 
            data={data}
            margin={{ top: 16, right: 16, left: 0, bottom: 16 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              interval={data.length > 10 ? 'preserveStartEnd' : 0}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              domain={[0, 'auto']}
              allowDecimals={false}
              fontSize={12}
            />
            <ChartTooltip 
              cursor={{ stroke: 'hsl(var(--muted-foreground))', opacity: 0.1 }}
            />
            <Line 
              type="monotone" 
              dataKey="valor" 
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 1, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

const BarChartComponent = ({ data }: { data: any[] }) => {
  const { isMobile } = useResponsive();

  if (!data || data.length === 0) {
    return (
      <div className="relative w-full aspect-[16/9] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Sem dados para exibir</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[16/9]">
      <ChartContainer
        config={{
          valor: {
            label: "Quantidade",
            color: "hsl(var(--primary))",
          }
        }}
        className="absolute inset-0 [&_.recharts-cartesian-grid-horizontal_line]:stroke-muted [&_.recharts-cartesian-grid-vertical_line]:stroke-muted"
      >
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart 
            data={data}
            margin={{
              top: 16,
              right: isMobile ? 8 : 16,
              left: 0,
              bottom: isMobile ? 8 : 16
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 'auto']}
              allowDecimals={false}
            />
            <ChartTooltip 
              cursor={{ fill: 'hsl(var(--muted-foreground))', opacity: 0.1 }}
              content={<ChartTooltipContent formatter={(value) => `${value}x`} />}
            />
            <Bar 
              dataKey="valor" 
              radius={[4, 4, 0, 0]}
              fill="hsl(var(--primary))"
              maxBarSize={isMobile ? 24 : 32}
            />
          </RechartsBarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

const PieChartComponent = ({ data }: { data: any[] }) => {
  const { isMobile } = useResponsive();
  
  console.log('Debug - PieChart data:', data);
  
  if (!data || data.length === 0) {
    return (
      <div className="relative w-full aspect-[4/3] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Sem dados por gato</p>
      </div>
    );
  }

  const config = data.reduce((acc, item, index) => ({
    ...acc,
    [item.name]: {
      label: item.name,
      theme: {
        light: COLORS[index % COLORS.length],
        dark: COLORS[index % COLORS.length]
      },
      color: COLORS[index % COLORS.length]
    },
  }), {});

  const chartDimensions = {
    outerRadius: isMobile ? '30%' : '35%',
    innerRadius: data.length === 1 ? '0%' : (isMobile ? '20%' : '25%'),
    startAngle: 90,
    endAngle: -270,
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="relative w-full aspect-[4/3]">
      <ChartContainer config={config} className="absolute inset-0">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart 
            margin={{
              top: 16,
              right: isMobile ? 8 : 16,
              left: isMobile ? 8 : 16,
              bottom: isMobile ? 30 : 40
            }}
          >
            <ChartTooltip 
              content={<ChartTooltipContent 
                hideLabel 
                nameKey="name" 
                formatter={(value: number, name: string, entry: any) => {
                  const item = data.find(d => d.name === name);
                  return [`${value.toFixed(1)}g (${item?.percent || 0}%)`];
                }}
              />} 
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={chartDimensions.outerRadius}
              innerRadius={chartDimensions.innerRadius}
              startAngle={chartDimensions.startAngle}
              endAngle={chartDimensions.endAngle}
              paddingAngle={data.length === 1 ? 0 : 2}
              minAngle={data.length === 1 ? 360 : 10}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke="hsl(var(--background))"
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <ChartLegend 
              content={
                <ChartLegendContent 
                  nameKey="name"
                />
              }
              className="[&_.recharts-legend-item]:text-xs [&_.recharts-legend-item]:basis-[calc(50%_-_8px)]"
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

export default function StatisticsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isMobile } = useResponsive()

  // Move ALL hooks to the top, before any conditional logic
  const { state: userState } = useUserContext()
  const { currentUser, isLoading: isLoadingUser, error: errorUser } = userState
  const { 
    cats,
    feedingLogs,
    isLoading: isLoadingAggregated,
    error: errorAggregated,
  } = useSelectFeedingStatistics()

  const userLanguage = userState.currentUser?.preferences?.language;
  const userLocale = resolveDateFnsLocale(userLanguage);

  // Add debug logging
  console.log('Statistics Page - Raw Data:', {
    cats,
    feedingLogsCount: feedingLogs?.length,
    isLoading: isLoadingAggregated,
    error: errorAggregated
  });

  const [selectedPeriod, setSelectedPeriod] = useState(searchParams.get('period') || '7dias')
  const [selectedCatId, setSelectedCatId] = useState(searchParams.get('catId') || 'todos')

  // Fix property names and add error handling
  const dateRange = useMemo(() => getDateRange(selectedPeriod), [selectedPeriod])
  const startDate = dateRange.start
  const endDate = dateRange.end

  console.log('Date range:', { startDate, endDate, selectedPeriod })

  // Move useEffect for redirection here
  useEffect(() => {
    if (!isLoadingUser && !currentUser) {
      toast.error("Autenticação necessária para ver estatísticas.")
      router.replace("/login?callbackUrl=/statistics")
    }
  }, [isLoadingUser, currentUser, router])

  // Define callbacks before any conditional returns
  const handlePeriodChange = useCallback((value: string) => {
    setSelectedPeriod(value)
  }, [])

  const handleCatChange = useCallback((value: string) => {
    setSelectedCatId(value)
  }, [])

  // Filter logs
  const filteredLogs = useMemo(() => {
    if (!feedingLogs || feedingLogs.length === 0) {
      console.log('Debug - No feeding logs available');
      return [];
    }
    
    // Ensure we have valid dates
    if (!startDate || !endDate) {
      console.error('Invalid date range:', { startDate, endDate });
      return [];
    }

    console.log('Debug - Filtering logs:', {
      totalLogs: feedingLogs.length,
      selectedCatId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    const filtered = feedingLogs.filter(log => {
      // Fix cat filtering to handle both "todos" and "all"
      if (selectedCatId !== "todos" && selectedCatId !== "all" && String(log.catId) !== String(selectedCatId)) {
        console.log('Debug - Skipping log due to cat filter:', {
          logCatId: log.catId,
          selectedCatId
        });
        return false;
      }
      
      const logDate = safeParseISO(log.timestamp);
      if (!logDate) {
        console.log('Debug - Skipping log due to invalid date:', log.timestamp);
        return false;
      }
      
      const logStartOfDay = startOfDay(logDate);
      const filterStartOfDay = startOfDay(startDate);
      const filterEndOfDay = endOfDay(endDate);
      
      const isInRange = logStartOfDay >= filterStartOfDay && logStartOfDay <= filterEndOfDay;
      if (!isInRange) {
        console.log('Debug - Skipping log due to date range:', {
          logDate: logStartOfDay.toISOString(),
          startDate: filterStartOfDay.toISOString(),
          endDate: filterEndOfDay.toISOString()
        });
      }
      return isInRange;
    });

    console.log('Debug - Filtered logs result:', {
      filteredCount: filtered.length,
      firstLog: filtered[0],
      lastLog: filtered[filtered.length - 1]
    });

    return filtered;
  }, [feedingLogs, startDate, endDate, selectedCatId]);

  // Add debug logging for filtered data
  console.log('Statistics Page - Filtered Data:', {
    filteredLogsCount: filteredLogs.length,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    selectedCatId
  });

  // Calculate statistics
  const statistics = useMemo((): StatisticsData => {
    if (!filteredLogs || filteredLogs.length === 0) {
      return {
        totalFeedings: 0,
        averagePortionSize: 0,
        totalPortionSize: 0,
        timeSeriesData: [],
        catPortionData: [],
        timeDistributionData: [],
      };
    }

    // Calculate basic statistics
    const totalFeedings = filteredLogs.length;
    const validPortions = filteredLogs.filter(log => {
      const amount = typeof log.amount === 'number' ? log.amount : 0;
      return amount > 0;
    });
    const totalPortionSize = validPortions.reduce((sum, log) => sum + (log.amount || 0), 0);
    const averagePortionSize = validPortions.length > 0 
      ? Number((totalPortionSize / validPortions.length).toFixed(1))
      : 0;

    // Calculate time series data
    const timeSeriesMap = new Map<string, number>();
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayKey = format(currentDate, 'yyyy-MM-dd');
      timeSeriesMap.set(dayKey, 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    filteredLogs.forEach(log => {
      const logDate = safeParseISO(log.timestamp);
      if (!logDate) return;
      const dayKey = format(logDate, 'yyyy-MM-dd');
      const currentSum = timeSeriesMap.get(dayKey) || 0;
      const amount = typeof log.amount === 'number' ? log.amount : 0;
      if (amount > 0) {
        timeSeriesMap.set(dayKey, currentSum + amount);
      }
    });

    const timeSeriesData: TimeSeriesDataPoint[] = Array.from(timeSeriesMap.entries())
      .map(([fullDate, valor]) => ({
        name: format(parseISO(fullDate), 'dd/MM'),
        fullDate,
        valor: Number(valor.toFixed(1))
      }))
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate));

    // Calculate cat portion data
    const catPortionMap = new Map<string, number>();
    
    console.log('Debug - Processing cat portions:', {
      filteredLogsCount: filteredLogs.length,
      catsCount: cats.length,
      cats: cats.map(c => ({ id: c.id, name: c.name }))
    });

    // First ensure we have an entry for each cat, even if they have no feedings
    cats.forEach(cat => {
      catPortionMap.set(cat.name, 0);
    });

    // Then process the feeding logs
    filteredLogs.forEach(log => {
      const amount = typeof log.amount === 'number' ? log.amount : 1; // Default to 1 if no amount
      const cat = cats.find(c => String(c.id) === String(log.catId));
      if (!cat) {
        console.log('Debug - Skipping log due to cat not found:', { logId: log.id, catId: log.catId });
        return;
      }
      
      const currentSum = catPortionMap.get(cat.name) || 0;
      catPortionMap.set(cat.name, currentSum + amount);
    });

    console.log('Debug - Cat portion map:', Object.fromEntries(catPortionMap));

    const totalPortion = Array.from(catPortionMap.values()).reduce((sum, value) => sum + value, 0);
    const catPortionData: CatPortion[] = Array.from(catPortionMap.entries())
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(1)),
        percent: totalPortion > 0 ? Number((value / totalPortion * 100).toFixed(1)) : 0
      }))
      .filter(item => item.value > 0) // Only include cats with feedings
      .sort((a, b) => b.value - a.value);

    // Calculate time distribution data
    const timeDistributionMap = new Map<number, number>();
    for (let i = 0; i < 24; i++) {
      timeDistributionMap.set(i, 0);
    }

    filteredLogs.forEach(log => {
      const logDate = safeParseISO(log.timestamp);
      if (!logDate) return;
      const hour = getHours(logDate);
      timeDistributionMap.set(hour, (timeDistributionMap.get(hour) || 0) + 1);
    });

    const timeDistributionData: TimeSeriesDataPoint[] = Array.from(timeDistributionMap.entries())
      .map(([hour, count]) => ({
        name: `${hour.toString().padStart(2, '0')}:00`,
        valor: count
      }))
      .sort((a, b) => parseInt(a.name) - parseInt(b.name));

    return {
      totalFeedings,
      averagePortionSize,
      totalPortionSize,
      timeSeriesData,
      catPortionData,
      timeDistributionData,
    };
  }, [filteredLogs, cats, startDate, endDate, userLocale]);

  // Add debug logging for final statistics
  console.log('Statistics Page - Processed Data:', {
    totalFeedings: statistics.totalFeedings,
    averagePortionSize: statistics.averagePortionSize,
    timeSeriesDataPoints: statistics.timeSeriesData.length,
    catPortionDataPoints: statistics.catPortionData.length,
    timeDistributionDataPoints: statistics.timeDistributionData.length
  });

  const feedingsByDayOfWeek = useMemo(() => {
    // Implementation of feedingsByDayOfWeek
  }, [filteredLogs]);

  const feedingsByHourOfDay = useMemo(() => {
    // Implementation of feedingsByHourOfDay
  }, [filteredLogs]);

  // Now handle loading and error states
  if (isLoadingUser || isLoadingAggregated) {
    return <Loading text={isLoadingUser ? "Verificando usuário..." : "Carregando estatísticas..."} />
  }

  if (errorUser) {
    return (
      <PageTransition>
        <div className="p-4 text-center">
          <PageHeader title="Estatísticas" />
          <EmptyState 
            IconComponent={AlertTriangle}
            title="Erro ao Carregar Usuário"
            description={`Não foi possível carregar os dados do usuário: ${errorUser}`}
          />
          <Button variant="outline" onClick={() => router.back()} className="mt-4">Voltar</Button>
        </div>
      </PageTransition>
    )
  }

  if (!currentUser?.householdId) {
    return (
      <PageTransition>
        <div className="p-4">
          <PageHeader title="Estatísticas" />
          <EmptyState
            IconComponent={Users}
            title="Sem Residência Associada"
            description="Associe-se a uma residência para ver estatísticas."
            actionButton={
              <Link href="/settings" passHref legacyBehavior>
                <Button asChild variant="default" className="mt-4">
                  Ir para Configurações
                </Button>
              </Link>
            }
            className="mt-8"
          />
        </div>
      </PageTransition>
    )
  }

  if (errorAggregated) {
    return (
      <PageTransition>
        <div className="p-4 text-center">
          <PageHeader title="Estatísticas" />
          <EmptyState 
            IconComponent={AlertTriangle}
            title="Erro ao Carregar Estatísticas"
            description={`Não foi possível carregar os dados: ${errorAggregated}`}
          />
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">Tentar Novamente</Button>
        </div>
      </PageTransition>
    )
  }

  // --- Render Main Content --- 
  return (
    <PageTransition>
      <PageHeader 
        title="Estatísticas" 
        description="Análise detalhada dos padrões de alimentação." 
        icon={<BarChart3 />} 
      />
      <div className="container mx-auto p-4 pb-7 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-[180px]">
               <Calendar className="mr-2 h-4 w-4 opacity-50" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="7dias">Últimos 7 dias</SelectItem>
              <SelectItem value="30dias">Últimos 30 dias</SelectItem>
              <SelectItem value="mesAtual">Mês Atual</SelectItem>
              <SelectItem value="mesPassado">Mês Passado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedCatId} onValueChange={setSelectedCatId}>
            <SelectTrigger className="w-full sm:w-[180px]">
               <Filter className="mr-2 h-4 w-4 opacity-50" />
              <SelectValue placeholder="Gato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Gatos</SelectItem>
              {cats.map(cat => (
                <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <motion.div 
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
         >
          <StatCard 
            title="Total de Alimentações" 
            value={statistics.totalFeedings.toString()} 
            icon={<Utensils className="h-4 w-4" />} 
            description={`No período selecionado`}
          />
          <StatCard 
            title="Média por Alimentação" 
            value={`${statistics.averagePortionSize} g`} 
            icon={<Scale className="h-4 w-4" />} 
            description={`Média de ração por vez`}
          />
          <StatCard
            title="Gatos Ativos"
            value={selectedCatId === 'all' ? cats.length.toString() : '1'}
            icon={<Users className="h-4 w-4" />}
            description={selectedCatId === 'all' ? `Gatos na residência` : `Gato selecionado`}
          />
           <StatCard
            title="Período"
            value={selectedPeriod.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            icon={<Calendar className="h-4 w-4" />}
            description={`Dados referentes a este período`}
          />
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="grid gap-6 md:grid-cols-2"
         >
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>Consumo Total Diário (g)</CardTitle>
              <CardDescription>Total de ração consumida por dia no período.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex justify-center">
              <LineChartComponent data={statistics.timeSeriesData || []} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>Distribuição por Gato (%)</CardTitle>
              <CardDescription>Percentual do consumo total por gato.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex justify-center">
              <PieChartComponent data={statistics.catPortionData || []} />
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="space-y-1">
              <CardTitle>Distribuição por Horário</CardTitle>
              <CardDescription>Quantidade de alimentações por hora do dia.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="relative w-full aspect-[16/9]">
                <ChartContainer
                  config={{
                    valor: {
                      label: "Quantidade",
                      color: "hsl(var(--primary))",
                    }
                  }}
                  className="absolute inset-0 [&_.recharts-cartesian-grid-horizontal_line]:stroke-muted [&_.recharts-cartesian-grid-vertical_line]:stroke-muted"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={statistics.timeDistributionData || []}
                      margin={{ top: 16, right: 16, left: 0, bottom: 16 }}
                    >
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        tickMargin={12}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        tickFormatter={(value) => `${value}x`}
                        width={45}
                        tickMargin={8}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent hideLabel formatter={(value) => `${value} alimentações`}/>}
                        cursor={{ fill: 'hsl(var(--muted-foreground))', opacity: 0.1 }}
                      />
                      <Bar
                        dataKey="valor"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                        fill="hsl(var(--primary))"
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </PageTransition>
  )
}
