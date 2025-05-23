'use client';

import { Drawer } from "vaul";
import { FeedingLogItem } from "./feeding-log-item";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { FeedingForm } from "./feeding-form";
import { BaseFeedingLog, BaseCat, BaseUser } from "@/lib/types/common";
import { FeedingLog } from "@/lib/types";
import { useState } from "react";

interface FeedingDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  feedingLog: FeedingLog;
}

export function FeedingDrawer({ isOpen, onOpenChange, feedingLog }: FeedingDrawerProps) {
  const router = useRouter();
  const [activeSnap, setActiveSnap] = useState<number>(0);

  const handleSnapChange = (snapPoint: string | number) => {
    setActiveSnap(typeof snapPoint === 'number' ? snapPoint : 0);
  };

  // Transform FeedingLog into BaseFeedingLog with optional cat and user
  const transformedLog: BaseFeedingLog & { cat?: BaseCat; user?: BaseUser } = {
    id: feedingLog.id,
    catId: feedingLog.catId,
    userId: feedingLog.userId,
    timestamp: new Date(feedingLog.timestamp),
    portionSize: feedingLog.portionSize,
    notes: feedingLog.notes,
    status: feedingLog.status,
    createdAt: new Date(feedingLog.createdAt),
    cat: feedingLog.cat ? {
      id: feedingLog.cat.id,
      name: feedingLog.cat.name,
      photoUrl: feedingLog.cat.photoUrl,
      birthdate: feedingLog.cat.birthdate ? new Date(feedingLog.cat.birthdate) : undefined,
      weight: feedingLog.cat.weight,
      restrictions: feedingLog.cat.restrictions,
      notes: feedingLog.cat.notes,
      householdId: feedingLog.cat.householdId,
      feedingInterval: feedingLog.cat.feedingInterval,
      portion_size: feedingLog.cat.portion_size
    } : undefined,
    user: feedingLog.user ? {
      id: feedingLog.user.id,
      name: feedingLog.user.name,
      email: feedingLog.user.email,
      avatar: feedingLog.user.avatar,
      householdId: feedingLog.user.householdId,
      preferences: feedingLog.user.preferences,
      role: feedingLog.user.role
    } : undefined
  };

  return (
    <Drawer.Root 
      open={isOpen} 
      onOpenChange={onOpenChange}
      dismissible
      modal={false}
      snapPoints={[0.9]}
      activeSnapPoint={activeSnap}
      setActiveSnapPoint={handleSnapChange}
    >
      <Drawer.Portal>
        <Drawer.Overlay 
          className="fixed inset-0 bg-black/40 z-40" 
        />
        <Drawer.Content 
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[1.25rem] bg-[#0A0A0B] border-t border-white/[0.08]"
        >
          <div className="mx-auto w-full max-w-md">
            <div className="flex flex-col px-6">
              <Drawer.Handle className="mx-auto my-3 h-1 w-8 rounded-full bg-white/20" />
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium text-white">
                  Registrar Nova Alimentação
                </h2>
                <button
                  onClick={() => onOpenChange(false)}
                  className="rounded-full p-2 hover:bg-white/10 transition-colors"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5 text-white/70" />
                </button>
              </div>
              <p className="text-[0.9375rem] text-white/60 mb-6">
                Selecione os gatos e informe a quantidade de ração.
              </p>
              <div className="overflow-y-auto overscroll-contain pb-6">
                {transformedLog && transformedLog.cat && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FeedingForm
                      catId={transformedLog.cat.id}
                      catPortionSize={transformedLog.cat.portion_size}
                      onSuccess={() => onOpenChange(false)}
                    />
                    <FeedingLogItem
                      log={transformedLog}
                      onView={() => {
                        onOpenChange(false);
                        router.push(`/feedings/${transformedLog.id}`);
                      }}
                      onEdit={() => {
                        onOpenChange(false);
                        router.push(`/feedings/${transformedLog.id}/edit`);
                      }}
                      onDelete={() => {
                        // Função para excluir o registro
                      }}
                    />
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
} 