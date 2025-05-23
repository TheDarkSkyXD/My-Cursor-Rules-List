"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * About component - Provides information about the app, team, and mission
 * Features:
 * - Company story section
 * - Mission statement
 * - Team information
 * - Responsive layout
 */
export default function About() {
  // Initialize translations for the about page namespace
  const t = useTranslations("about");

  return (
    <div className="container mx-auto flex flex-col items-center space-y-12 px-4 py-12 md:py-16">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="mb-4 text-3xl font-bold md:text-4xl">{t("title")}</h1>
        <p className="text-muted-foreground mx-auto max-w-[800px] md:text-lg">{t("subtitle")}</p>
      </div>

      {/* About Content Cards */}
      <div className="grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
        {/* Our Story */}
        <Card className="border-border">
          <CardHeader>
            <div className="mb-2">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>{t("story.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">{t("story.content")}</CardDescription>
          </CardContent>
        </Card>

        {/* Our Mission */}
        <Card className="border-border">
          <CardHeader>
            <div className="mb-2">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>{t("mission.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">{t("mission.content")}</CardDescription>
          </CardContent>
        </Card>

        {/* Our Team */}
        <Card className="border-border">
          <CardHeader>
            <div className="mb-2">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>{t("team.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">{t("team.content")}</CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}