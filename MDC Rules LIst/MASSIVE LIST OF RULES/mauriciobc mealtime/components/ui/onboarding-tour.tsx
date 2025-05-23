"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Cat, Home, Calendar, BarChart3, Bell, PawPrint, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";

type OnboardingStep = {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  color: string;
};

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: "Bem-vindo ao MealTime",
    description: "Seu aplicativo para gerenciar a alimentação dos seus gatos. Vamos configurar tudo para você começar.",
    icon: <PawPrint className="h-10 w-10" />,
    route: "/",
    color: "bg-blue-50 text-blue-500",
  },
  {
    id: 2,
    title: "Cadastre seus gatos",
    description: "Adicione informações sobre seus gatos, como nome, idade, peso e restrições alimentares.",
    icon: <Cat className="h-10 w-10" />,
    route: "/cats",
    color: "bg-purple-50 text-purple-500",
  },
  {
    id: 3,
    title: "Adicione sua residência",
    description: "Configure uma residência para gerenciar os gatos e convidar outros membros para participar.",
    icon: <Home className="h-10 w-10" />,
    route: "/households",
    color: "bg-indigo-50 text-indigo-500",
  },
  {
    id: 4,
    title: "Crie agendamentos",
    description: "Configure lembretes e agendamentos para não esquecer de alimentar seus gatos.",
    icon: <Calendar className="h-10 w-10" />,
    route: "/schedules",
    color: "bg-amber-50 text-amber-500",
  },
  {
    id: 5,
    title: "Acompanhe as estatísticas",
    description: "Visualize gráficos e dados sobre a alimentação dos seus gatos para garantir a saúde deles.",
    icon: <BarChart3 className="h-10 w-10" />,
    route: "/statistics",
    color: "bg-emerald-50 text-emerald-500",
  },
  {
    id: 6,
    title: "Fique atento às notificações",
    description: "Receba lembretes e alertas sobre a alimentação dos seus gatos.",
    icon: <Bell className="h-10 w-10" />,
    route: "/notifications",
    color: "bg-rose-50 text-rose-500",
  },
];

export function OnboardingTour() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useLocalStorage("onboarding-completed", true);
  const [isFirstVisit, setIsFirstVisit] = useLocalStorage("first-visit", true);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const navigateToRoute = (route: string) => {
    router.push(route);
  };

  const completeTour = () => {
    setShowTour(false);
    document.body.classList.remove("overflow-hidden");
  };

  useEffect(() => {
    if (isFirstVisit) {
      setShowTour(true);
      setIsFirstVisit(false);
    }

    const storedShowTour = localStorage.getItem("onboarding-completed");
    if (storedShowTour !== null) {
      setShowTour(storedShowTour === 'true');
    } else if (!isFirstVisit) {
      setShowTour(false);
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isFirstVisit, setIsFirstVisit, setShowTour]);

  const shouldDisplayTour = showTour && !JSON.parse(localStorage.getItem("onboarding-completed") || "true");
  if (!shouldDisplayTour) return null;

  return (
    <AnimatePresence mode="wait" onExitComplete={() => {
      document.body.style.overflow = "auto";
    }}>
      {showTour && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              completeTour();
            }
          }}
        >
          <motion.div
            className="relative w-full max-w-lg rounded-xl bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={completeTour}
              aria-label="Fechar tour"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="mb-6">
              <div className={cn("rounded-full p-4 inline-flex mb-4", steps[currentStep].color)}>
                {steps[currentStep].icon}
              </div>
              <h2 className="text-xl font-semibold mb-2">{steps[currentStep].title}</h2>
              <p className="text-muted-foreground">{steps[currentStep].description}</p>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex space-x-1">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    className={cn(
                      "h-2 w-2 rounded-full transition-all duration-300",
                      index === currentStep ? "bg-primary w-4" : "bg-muted"
                    )}
                    onClick={() => goToStep(index)}
                  />
                ))}
              </div>
              <div className="flex space-x-2">
                {currentStep > 0 && (
                  <Button variant="outline" onClick={prevStep}>
                    Anterior
                  </Button>
                )}
                {currentStep < steps.length - 1 ? (
                  <Button onClick={nextStep}>Próximo</Button>
                ) : (
                  <Button onClick={() => {
                    completeTour();
                    setTimeout(() => {
                      navigateToRoute(steps[currentStep].route);
                    }, 300);
                  }}>
                    Começar
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 