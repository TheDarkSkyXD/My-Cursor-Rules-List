"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gauge, List, Plus, TrendingUp, History, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnboardingTourProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onComplete?: () => void;
}

const steps = [
  {
    id: 1,
    title: "Bem-vindo ao Rastreamento de Peso!",
    description: "Vamos passar rapidamente pelos principais recursos para ajudar você a monitorar o peso do seu gato.",
    icon: <Gauge className="h-10 w-10" />,
    color: "bg-blue-50 text-blue-500",
  },
  {
    id: 2,
    title: "Visão Geral do Painel",
    description: "No topo, selecione seu gato. Você verá o status atual, metas de peso e um gráfico de tendências.",
    icon: <List className="h-10 w-10" />,
    color: "bg-purple-50 text-purple-500",
  },
  {
    id: 3,
    title: "Registrando Novos Pesos",
    description: "Use o botão '+' no canto inferior direito para registrar rapidamente um novo peso para o gato selecionado.",
    icon: <Plus className="h-10 w-10" />,
    color: "bg-indigo-50 text-indigo-500",
  },
  {
    id: 4,
    title: "Acompanhando o Progresso",
    description: "O gráfico visualiza as tendências de peso ao longo do tempo. Marcos ajudam a acompanhar o progresso em direção a metas.",
    icon: <TrendingUp className="h-10 w-10" />,
    color: "bg-amber-50 text-amber-500",
  },
  {
    id: 5,
    title: "Visualizando o Histórico",
    description: "A lista de histórico mostra todos os pesos registrados, permitindo revisar entradas anteriores.",
    icon: <History className="h-10 w-10" />,
    color: "bg-emerald-50 text-emerald-500",
  },
  {
    id: 6,
    title: "Pronto para Começar!",
    description: "Tudo pronto para acompanhar o peso. Se precisar rever, você pode sempre acessar este tour novamente.",
    icon: <CheckCircle className="h-10 w-10" />,
    color: "bg-rose-50 text-rose-500",
  },
];

export function OnboardingTour({ isOpen, onOpenChange, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
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

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleComplete = () => {
    if (onComplete) onComplete();
    onOpenChange(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait" onExitComplete={() => {
      document.body.style.overflow = "auto";
    }}>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClose();
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
              onClick={handleClose}
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
                  <Button onClick={handleComplete}>
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

export default OnboardingTour; 