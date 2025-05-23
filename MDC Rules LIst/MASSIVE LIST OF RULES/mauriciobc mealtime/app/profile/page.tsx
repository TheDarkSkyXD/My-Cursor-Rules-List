"use client";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useUserContext } from "@/lib/context/UserContext";
import { AnimatePresence, motion } from "framer-motion";

interface ProfileData {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  email?: string;
  timezone?: string;
  createdAt?: string;
  household_members?: Array<{
    role: string;
    household: {
      id: string;
      name: string;
      description?: string;
      cats: Array<{ id: string; name: string }>;
      household_members: Array<{
        user: {
          id: string;
          full_name?: string;
          avatar_url?: string;
          email?: string;
        };
        role: string;
      }>;
    };
  }>;
  owned_cats?: Array<{
    id: string;
    name: string;
    photo_url?: string;
    weight?: number;
    weight_logs?: Array<{ weight: number; date: string }>;
    feeding_logs?: Array<{ fed_at: string }>;
  }>;
}

const tabMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 16 },
  transition: { duration: 0.25, ease: "easeOut" },
};

export default function ProfilePage() {
  const { state: { currentUser }, authLoading } = useUserContext();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    if (!currentUser || !currentUser.id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/profile/${currentUser.id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Erro ao buscar perfil");
        return res.json();
      })
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Erro ao carregar perfil");
        setLoading(false);
      });
  }, [currentUser]);

  if (authLoading || loading) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-2 animate-pulse">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b pb-4 mb-4 flex flex-col items-center gap-2">
          <div className="w-24 h-24 rounded-full bg-muted" />
          <div className="h-6 w-40 bg-muted rounded mt-2" />
          <div className="h-8 w-32 bg-muted rounded mt-2" />
        </div>
        <div className="h-12 w-full bg-muted rounded mb-2" />
        <div className="h-32 w-full bg-muted rounded mb-2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-2 text-center text-destructive">
        <p>Erro: {error}</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto py-6 px-2">
      {/* Seção fixa do topo */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b pb-4 mb-4 flex flex-col items-center gap-2">
        <Avatar className="w-24 h-24 border-2 border-primary">
          <AvatarImage src={profile.avatar_url || "/placeholder-avatar.png"} alt="Avatar do usuário" />
          <AvatarFallback>{profile.full_name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-bold text-center break-words">{profile.full_name || "Usuário"}</h2>
        <Button asChild variant="outline" size="sm" className="mt-2">
          <Link href="/profile/edit">Editar perfil</Link>
        </Button>
      </div>

      {/* Abas */}
      <Tabs defaultValue="info" className="w-full mt-4" onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="homes">Lares</TabsTrigger>
          <TabsTrigger value="cats">Meus Gatos</TabsTrigger>
        </TabsList>
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === "info" && (
            <TabsContent value="info" forceMount>
              <motion.div key="info" {...tabMotion}>
                <Card className="mt-4">
                  <CardContent className="space-y-2 py-6">
                    <div><span className="font-medium">Username:</span> <span className="text-muted-foreground">@{profile.username || "-"}</span></div>
                    <div><span className="font-medium">E-mail:</span> <span className="text-muted-foreground">{profile.email || "-"}</span></div>
                    <div><span className="font-medium">Data de cadastro:</span> <span className="text-muted-foreground">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "-"}</span></div>
                    <div><span className="font-medium">Fuso horário:</span> <span className="text-muted-foreground">{profile.timezone || "-"}</span></div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}
          {activeTab === "homes" && (
            <TabsContent value="homes" forceMount>
              <motion.div key="homes" {...tabMotion}>
                <Card className="mt-4">
                  <CardContent className="space-y-4 py-6">
                    {profile.household_members && profile.household_members.length > 0 ? (
                      profile.household_members.map((hm) => (
                        <div key={hm.household.id} className="border-b pb-2 mb-2">
                          <div className="font-semibold">{hm.household.name}</div>
                          <div className="text-sm text-muted-foreground">{hm.household.description}</div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs">Gatos: {hm.household.cats.length}</span>
                            <span className="text-xs">Membros: {hm.household.household_members.length}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {hm.household.household_members.map((m) => (
                              <span key={m.user.id} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                                <Avatar className="w-5 h-5">
                                  <AvatarImage src={m.user.avatar_url || "/placeholder-avatar.png"} />
                                  <AvatarFallback>{m.user.full_name?.[0] || "U"}</AvatarFallback>
                                </Avatar>
                                {m.user.full_name || m.user.email}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground">Nenhum lar encontrado.</div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}
          {activeTab === "cats" && (
            <TabsContent value="cats" forceMount>
              <motion.div key="cats" {...tabMotion}>
                <Card className="mt-4">
                  <CardContent className="space-y-4 py-6">
                    {profile.owned_cats && profile.owned_cats.length > 0 ? (
                      profile.owned_cats.map((cat) => (
                        <div key={cat.id} className="flex items-center gap-4 border-b pb-2 mb-2">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={cat.photo_url || "/placeholder-cat.png"} />
                            <AvatarFallback>{cat.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-semibold">{cat.name}</div>
                            <div className="text-xs text-muted-foreground">Peso atual: {cat.weight ?? (cat.weight_logs?.[0]?.weight ?? "-")} kg</div>
                            <div className="text-xs text-muted-foreground">Última alimentação: {cat.feeding_logs?.[0]?.fed_at ? new Date(cat.feeding_logs[0].fed_at).toLocaleString() : "-"}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground">Nenhum gato encontrado.</div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
} 