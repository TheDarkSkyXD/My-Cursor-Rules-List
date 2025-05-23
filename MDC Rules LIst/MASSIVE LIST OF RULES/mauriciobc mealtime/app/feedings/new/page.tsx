"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NewFeedingSheet } from "@/components/feeding/new-feeding-sheet";

export default function NewFeedingPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      router.push("/feedings");
    }
  };

  return (
    <NewFeedingSheet 
      isOpen={isOpen} 
      onOpenChange={handleOpenChange}
    />
  );
}