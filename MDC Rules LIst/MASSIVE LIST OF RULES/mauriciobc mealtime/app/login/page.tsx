"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from '@/utils/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/ui/page-transition";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast } from "sonner";
import { useUserContext } from "@/lib/context/UserContext";
import { Eye, EyeOff } from "lucide-react";
import { Icons } from "@/components/icons";
import { logger } from "@/lib/monitoring/logger";
import { useLoadingState } from "@/lib/hooks/useLoadingState";
import { GlobalLoading } from "@/components/ui/global-loading";

console.log("[Login] Página de login sendo carregada");

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state: { currentUser, isLoading: profileLoading }, authLoading } = useUserContext();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Register loading state
  useLoadingState(authLoading || profileLoading, {
    description: 'Verificando autenticação...',
    priority: 1,
  });

  // Register form submission loading state
  useLoadingState(isLoading, {
    description: 'Entrando...',
    priority: 2,
  });

  // Handle redirect if user is already authenticated
  useEffect(() => {
    const isFullyLoaded = !authLoading && !profileLoading;
    if (isFullyLoaded && currentUser) {
      const redirectTo = searchParams.get("redirectTo") || "/";
      console.log("[Login] User fully loaded and authenticated, redirecting to:", redirectTo);
      router.replace(redirectTo);
    }
  }, [authLoading, profileLoading, currentUser, router, searchParams]);

  // Clear error when form values change
  const handleInputChange = () => {
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          setError('Please check your email to confirm your account before logging in.');
        } else if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else {
          setError(signInError.message);
        }
        logger.error('[LoginPage] Sign in error:', { error: signInError.message });
      } else {
        // Redirect immediately on successful sign-in
        const redirectTo = searchParams.get("redirectTo") || "/";
        console.log("[Login] Successful sign-in, redirecting to:", redirectTo);
        router.replace(redirectTo);
      }
    } catch (err) {
      logger.error('[LoginPage] Unexpected error during sign in:', { error: err instanceof Error ? err.message : String(err) });
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(searchParams.get("redirectTo") || "/")}`,
        },
      });

      if (signInError) {
        setError('Failed to sign in with Google. Please try again.');
        logger.error('[LoginPage] Google sign in error:', { error: signInError.message });
      }
    } catch (err) {
      logger.error('[LoginPage] Unexpected error during Google sign in:', { error: err instanceof Error ? err.message : String(err) });
      setError('An unexpected error occurred while signing in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking auth
  if (authLoading || profileLoading) {
    return <GlobalLoading mode="overlay" />;
  }

  return (
    <PageTransition>
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">MealTime</CardTitle>
            <CardDescription className="text-center">
              Entre com seu email e senha ou use o Google
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  placeholder="name@example.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isLoading}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    disabled={isLoading}
                    onChange={handleInputChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-500">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <GlobalLoading mode="spinner" size="sm" />
                ) : (
                  "Entrar com Email"
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
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <GlobalLoading mode="spinner" size="sm" />
              ) : (
                <>
                  <Icons.google className="mr-2 h-4 w-4" />
                  Entrar com Google
                </>
              )}
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-2 text-center text-sm text-muted-foreground">
            <div>
              Não tem uma conta?{' '}
              <Link href={`/signup${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} className="underline hover:text-primary">
                Registre-se
              </Link>
            </div>
            <div>
              Ao entrar, você concorda com nossos{" "}
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