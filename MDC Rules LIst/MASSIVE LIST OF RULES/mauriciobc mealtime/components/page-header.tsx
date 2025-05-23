"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button, ButtonProps } from "@/components/ui/button";
import { PlusCircle, ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
  actionVariant?: ButtonProps['variant'];
  actionIcon?: React.ReactNode;
  icon?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  actionLabel,
  actionHref,
  actionOnClick,
  actionVariant = "default",
  actionIcon = <PlusCircle className="h-4 w-4" />,
  icon,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b"
    >
      <div className="flex items-center gap-3 flex-1">
        {icon && <div className="text-primary">{icon}</div>}
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>

      {actionLabel && (
        <div className="flex-shrink-0">
          {actionHref ? (
            <Link href={actionHref} passHref>
              <Button variant={actionVariant} size="sm">
                {actionIcon && <span className="mr-2">{actionIcon}</span>}
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button variant={actionVariant} size="sm" onClick={actionOnClick}>
              {actionIcon && <span className="mr-2">{actionIcon}</span>}
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
} 