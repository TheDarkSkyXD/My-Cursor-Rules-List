"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Filter, Calendar, ArrowDown, ArrowUp } from "lucide-react"
import Link from "next/link"
import PageTransition from "@/components/page-transition"
import { AppHeader } from "@/components/app-header"
import BottomNav from "@/components/bottom-nav"
import { motion } from "framer-motion"
import { getFeedingLogs } from "@/lib/data"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getCats } from "@/lib/data"
import { useUserContext } from "@/lib/context/UserContext"
import { resolveDateFnsLocale } from "@/lib/utils/dateFnsLocale"

// Definindo a interface para o registro de alimentação
interface FeedingLogType {
  id: number
  catId: number
  userId: number
  timestamp: Date
  portionSize: number | null
  notes: string | null
  createdAt: Date
  cat: {
    id: number
    name: string
    photoUrl: string | null
  }
  user: {
    id: number
    name: string
  }
}

// Definindo a interface para o gato
interface CatType {
  id: number
  name: string
  photoUrl: string | null
}

export default function HistoryPage() {
  const router = useRouter()
  const [feedingLogs, setFeedingLogs] = useState<FeedingLogType[]>([])
  const [filteredLogs, setFilteredLogs] = useState<FeedingLogType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCat, setSelectedCat] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [cats, setCats] = useState<CatType[]>([])
  const { state: userState } = useUserContext();
  const userLanguage = userState.currentUser?.preferences?.language;
  const userLocale = resolveDateFnsLocale(userLanguage);
  
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        
        // Carregar registros de alimentação
        const logs = await getFeedingLogs()
        setFeedingLogs(logs)
        setFilteredLogs(logs)
        
        // Carregar gatos
        const catsData = await getCats()
        setCats(catsData)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [])
  
  // Filtrar e ordenar os registros
  useEffect(() => {
    let filtered = [...feedingLogs]
    
    // Filtrar por gato
    if (selectedCat !== "all") {
      filtered = filtered.filter(log => log.catId === parseInt(selectedCat))
    }
    
    // Filtrar por termo de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(log => 
        log.cat.name.toLowerCase().includes(query) ||
        log.notes?.toLowerCase().includes(query) ||
        log.user.name.toLowerCase().includes(query)
      )
    }
    
    // Ordenar por data
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime()
      const dateB = new Date(b.timestamp).getTime()
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA
    })
    
    setFilteredLogs(filtered)
  }, [feedingLogs, searchQuery, selectedCat, sortOrder])
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }
  
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  }

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader title="Histórico" />
        
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Histórico de Alimentações</h1>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar registros..."
                  className="w-full rounded-md border border-input pl-10 py-2 text-sm"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={toggleSortOrder}
              >
                {sortOrder === "desc" ? (
                  <ArrowDown size={18} />
                ) : (
                  <ArrowUp size={18} />
                )}
              </Button>
            </div>
            
            <Select
              value={selectedCat}
              onValueChange={setSelectedCat}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrar por gato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os gatos</SelectItem>
                {cats.map(cat => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-muted"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-1/3 bg-muted rounded"></div>
                        <div className="h-3 w-1/2 bg-muted rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-6">
                Nenhum registro de alimentação encontrado.
              </p>
              <Link href="/feedings/new">
                <Button>Registrar alimentação</Button>
              </Link>
            </div>
          ) : (
            <motion.div 
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredLogs.map((log) => (
                <motion.div key={log.id} variants={itemVariants}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={log.cat.photoUrl || ""} alt={log.cat.name} />
                          <AvatarFallback>
                            {log.cat.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{log.cat.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Alimentado por {log.user.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {format(new Date(log.timestamp), "HH:mm")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(log.timestamp), "dd/MM/yyyy")}
                              </p>
                            </div>
                          </div>
                          {log.portionSize && (
                            <p className="text-sm mt-2">
                              <span className="font-medium">Quantidade:</span> {log.portionSize}
                            </p>
                          )}
                          {log.notes && (
                            <p className="text-sm mt-1">
                              <span className="font-medium">Observações:</span> {log.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
        
        <BottomNav />
      </div>
    </PageTransition>
  )
} 