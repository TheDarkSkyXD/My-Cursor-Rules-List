"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
// import { BarChart2, Calendar, CheckCircle, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Home component - Landing page of the application
 * Features:
 * - Responsive hero section with title and subtitle
 * - Feature grid showcasing key functionalities
 * - CTA buttons for getting started
 * - Responsive for desktop and mobile
 */
export default function Home() {
  // Initialize translations for the home page namespace
  const t = useTranslations("home");

  // Feature icons mapping
  // const featureIcons = {
  //   visualTracking: <CheckCircle className="text-primary h-8 w-8" />,
  //   multiHabit: <Calendar className="text-primary h-8 w-8" />,
  //   yearlyGrid: <BarChart2 className="text-primary h-8 w-8" />,
  //   timedTasks: <Clock className="text-primary h-8 w-8" />,
  // };

  return (
    <div className="flex flex-col items-center justify-center space-y-16 px-4 py-8 md:py-16">
      {/* Hero Section */}
      <div className="max-w-2xl text-center">
        <h1 className="mb-4 text-2xl font-bold md:text-4xl">{t("hero.title")}</h1>
        <p className="text-muted-foreground mx-auto max-w-[600px] md:text-lg">{t("hero.subtitle")}</p>
      </div>

      {/* Features Section */}
      {/* <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries({
          visualTracking: { 
            title: t("hero.features.visualTracking.title"),
            description: `${t("hero.features.visualTracking.description.part1")} ✓ ${t("hero.features.visualTracking.description.part2")}`
          },
          multiHabit: {
            title: t("hero.features.multiHabit.title"),
            description: t("hero.features.multiHabit.description")
          },
          yearlyGrid: {
            title: t("hero.features.yearlyGrid.title"),
            description: t("hero.features.yearlyGrid.description")
          },
          timedTasks: {
            title: t("hero.features.timedTasks.title"),
            description: t("hero.features.timedTasks.description")
          }
        }).map(([key, feature]) => (
          <Card key={key} className="border-border">
            <CardHeader className="pb-2">
              <div className="mb-2">{featureIcons[key as keyof typeof featureIcons]}</div>
              <CardTitle className="text-md">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div> */}

      {/* Motivation Quote */}
      {/* <div className="border-primary/20 bg-primary/5 max-w-2xl rounded-lg border p-6 text-center italic">
        {t("hero.motivation")}
      </div> */}

      {/* CTA Section */}
      <div className="space-y-4">
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/start">{t("goToStart")}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/about">{t("learnMore")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
