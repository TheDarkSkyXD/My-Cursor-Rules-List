"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Menu, Target, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Start component - Onboarding page for new users
 * Features:
 * - Step-by-step guide for getting started
 * - Example habits
 * - CTA to create first habit
 * - Responsive layout
 */
export default function Start() {
  // Initialize translations for the start page namespace
  const t = useTranslations("start");

  // Steps for getting started
  const steps = [
    {
      id: "step1",
      icon: <Menu className="text-primary h-10 w-10" />,
      title: t("step1.title"),
      description: t("step1.description"),
    },
    {
      id: "step2",
      icon: <Target className="text-primary h-10 w-10" />,
      title: t("step2.title"),
      description: t("step2.description"),
    },
    {
      id: "step3",
      icon: <TrendingUp className="text-primary h-10 w-10" />,
      title: t("step3.title"),
      description: t("step3.description"),
    },
  ];

  return (
    <div className="container mx-auto flex flex-col items-center space-y-12 px-4 py-12 md:py-16">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="mb-4 text-3xl font-bold md:text-4xl">{t("title")}</h1>
        <p className="text-muted-foreground mx-auto max-w-[600px] md:text-lg">{t("subtitle")}</p>
      </div>

      {/* Steps Section */}
      <div className="grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
        {steps.map((step) => (
          <Card key={step.id} className="border-border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">{step.icon}</div>
              <CardTitle>{step.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA Button */}
      <div className="pt-4">
        <Button size="lg" className="px-8">
          <CheckSquare className="mr-2 h-5 w-5" />
          {t("cta")}
        </Button>
      </div>
    </div>
  );
}
