"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Trash, Save, AlertTriangle } from "lucide-react";

type FeedbackType = "success" | "error" | "delete" | "save" | "warning";

interface FeedbackAnimationProps {
  type: FeedbackType;
  message: string;
  duration?: number;
  onComplete?: () => void;
}

export function FeedbackAnimation({
  type,
  message,
  duration = 2000,
  onComplete
}: FeedbackAnimationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration - 300); // Inicia a animação de saída um pouco antes

    return () => clearTimeout(timer);
  }, [duration]);

  useEffect(() => {
    if (!visible && onComplete) {
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 300);
      return () => clearTimeout(completeTimer);
    }
  }, [visible, onComplete]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <Check className="h-5 w-5" />;
      case "error":
        return <X className="h-5 w-5" />;
      case "delete":
        return <Trash className="h-5 w-5" />;
      case "save":
        return <Save className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getColor = () => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "delete":
        return "bg-destructive";
      case "save":
        return "bg-blue-500";
      case "warning":
        return "bg-amber-500";
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      } 
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.9,
      transition: { 
        duration: 0.2 
      } 
    }
  };

  const iconVariants = {
    hidden: { scale: 0 },
    visible: { 
      scale: 1,
      transition: { 
        delay: 0.1, 
        type: "spring", 
        stiffness: 500, 
        damping: 15 
      } 
    }
  };

  const textVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        delay: 0.2, 
        duration: 0.3 
      } 
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-4 right-4 z-50 flex items-center justify-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${getColor()} text-white max-w-sm`}>
            <motion.div
              variants={iconVariants}
              className="flex items-center justify-center rounded-full bg-white/20 p-1.5"
            >
              {getIcon()}
            </motion.div>
            <motion.span variants={textVariants} className="font-medium">
              {message}
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useFeedback() {
  const [feedback, setFeedback] = useState<{
    visible: boolean;
    type: FeedbackType;
    message: string;
    duration: number;
  } | null>(null);

  const showFeedback = (type: FeedbackType, message: string, duration = 2000) => {
    setFeedback({
      visible: true,
      type,
      message,
      duration
    });
  };

  const hideFeedback = () => {
    setFeedback(null);
  };

  const FeedbackComponent = () => {
    if (!feedback || !feedback.visible) return null;
    
    return (
      <FeedbackAnimation
        type={feedback.type}
        message={feedback.message}
        duration={feedback.duration}
        onComplete={hideFeedback}
      />
    );
  };

  return {
    showFeedback,
    FeedbackComponent
  };
} 