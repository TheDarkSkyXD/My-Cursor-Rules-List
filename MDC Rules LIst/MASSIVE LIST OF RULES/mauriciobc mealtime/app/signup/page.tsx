"use client";

import { useState } from "react";
import { createClient } from '@/utils/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/ui/page-transition";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast } from "sonner";
import { GlobalLoading } from "@/components/ui/global-loading";
import { Icons } from "@/components/icons";
import { useSearchParams } from "next/navigation";

export default function SignupPage() {
  console.log("[Signup] Componente SignupPage renderizando");
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsLoadingCredentials(true);
    console.log("[Signup] Tentando criar conta com credenciais via Supabase:", email);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?redirectTo=${encodeURIComponent(searchParams.get("redirectTo") || "/")}`,
        data: {
          full_name: name,
        }
      },
    });

    setIsLoadingCredentials(false);

    if (signUpError) {
      console.error("[Signup] Supabase credentials signup error:", signUpError);
      toast.error(signUpError.message || "Erro ao criar conta.");
    } else {
      console.log("[Signup] Supabase credentials signup successful");
      toast.success("Conta criada com sucesso! Por favor, verifique seu email para confirmar sua conta.");
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoadingGoogle(true);
    console.log("[Signup] Iniciando signup com Google via Supabase");

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?redirectTo=${encodeURIComponent(searchParams.get("redirectTo") || "/")}`,
      },
    });

    setIsLoadingGoogle(false);

    if (oauthError) {
      console.error("[Signup] Supabase Google OAuth error:", oauthError);
      toast.error(oauthError.message || "Erro ao iniciar signup com Google.");
    }
  };

  const isProcessing = isLoadingCredentials || isLoadingGoogle;

  return (
    <PageTransition>
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">MealTime</CardTitle>
            <CardDescription className="text-center">
              Crie sua conta para começar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isProcessing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isProcessing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isProcessing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirme sua senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isProcessing}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isProcessing}>
                {isLoadingCredentials ? (
                  <>
                    <GlobalLoading mode="spinner" size="sm" /> 
                    Carregando...
                  </>
                ) : (
                  "Criar conta com Email"
                )}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou continue com
                </span>
              </div>
            </div>

            <Button
              onClick={handleGoogleSignup}
              disabled={isProcessing}
              className="w-full"
              variant="outline"
            >
              {isLoadingGoogle ? (
                <>
                  <GlobalLoading mode="spinner" size="sm" /> 
                  Carregando...
                </>
              ) : (
                <>
                  <Icons.google className="mr-2 h-4 w-4" />
                  Criar conta com Google
                </>
              )}
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-2 text-center text-sm text-muted-foreground">
            <div>
              Já tem uma conta?{' '}
              <Link href="/login" className="underline hover:text-primary">
                Entre aqui
              </Link>
            </div>
            <div>
              Ao criar uma conta, você concorda com nossos{" "}
              <Link href="/terms" className="underline hover:text-primary">
                Termos de Serviço
              </Link>{" "}
              e{" "}
              <Link href="/privacy" className="underline hover:text-primary">
                Política de Privacidade
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </PageTransition>
  );
} 