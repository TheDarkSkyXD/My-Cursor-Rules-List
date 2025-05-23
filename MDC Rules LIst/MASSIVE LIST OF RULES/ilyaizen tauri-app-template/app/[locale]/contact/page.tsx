"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Contact component - Provides a contact form and contact information
 * Features:
 * - Contact form with name, email, and message fields
 * - Address information
 * - Email contact information
 * - Responsive layout
 */
export default function Contact() {
  // Initialize translations for the contact page namespace
  const t = useTranslations("contact");

  // Handle form submission (placeholder)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission would be handled here
    alert("Form submitted! This is a demo.");
  };

  return (
    <div className="container mx-auto flex flex-col items-center space-y-12 px-4 py-12 md:py-16">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="mb-4 text-3xl font-bold md:text-4xl">{t("title")}</h1>
        <p className="text-muted-foreground mx-auto max-w-[600px] md:text-lg">{t("subtitle")}</p>
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
        {/* Contact Form - Takes 2/3 of the grid on desktop */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl">{t("form.send")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t("form.name")} <span className="text-destructive">*</span>
                </Label>
                <Input id="name" placeholder={t("form.name")} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  {t("form.email")} <span className="text-destructive">*</span>
                </Label>
                <Input id="email" type="email" placeholder={t("form.email")} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">
                  {t("form.message")} <span className="text-destructive">*</span>
                </Label>
                <Textarea id="message" placeholder={t("form.message")} rows={4} required />
                <p className="text-muted-foreground text-xs">
                  <span className="text-destructive">*</span> {t("form.required")}
                </p>
              </div>
              <Button type="submit" className="w-full">{t("form.send")}</Button>
            </form>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <div className="space-y-6">
          {/* Address Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="mb-2">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">{t("address.title")}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>{t("address.line1")}</p>
              <p>{t("address.line2")}</p>
            </CardContent>
          </Card>

          {/* Email Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="mb-2">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">{t("support")}</CardTitle>
            </CardHeader>
            <CardContent>
              <a href={`mailto:${t("email")}`} className="text-primary hover:underline">
                {t("email")}
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}