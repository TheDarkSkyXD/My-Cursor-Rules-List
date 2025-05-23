"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

interface NoDataMessageProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
}

export default function NoDataMessage({
  title = "Nenhum dado disponível",
  description = "Não foram encontrados dados para exibir.",
  actionLabel,
  actionHref,
  icon = <BarChart3 className="h-12 w-12 text-muted-foreground" />
}: NoDataMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-card">
      <div className="bg-muted/50 h-24 w-24 rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button>{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
} 