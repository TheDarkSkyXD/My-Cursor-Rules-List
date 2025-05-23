"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Edit, 
  Trash2, 
  Calendar,
  Weight,
} from "lucide-react";
import { CatType, FeedingLog } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getAgeString } from "@/lib/utils/dateUtils";
import { getFallbackImageUrl, isFallbackImage } from "@/lib/image-errors";
import { SafeImage } from "../safe-image";
import { cn } from "@/lib/utils";
import { GlobalLoading } from "@/components/ui/global-loading";
import { useUserContext } from "@/lib/context/UserContext";

interface CatCardProps {
  cat: CatType;
  latestFeedingLog?: FeedingLog | null;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CatCard({ cat, latestFeedingLog, onView, onEdit, onDelete }: CatCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const { state: userState } = useUserContext();
  const userTimezone = userState.currentUser?.preferences?.timezone;

  const ageString = cat.birthdate ? getAgeString(cat.birthdate, userTimezone) : "Idade desconhecida";

  const lastFed = latestFeedingLog
    ? formatDistanceToNow(new Date(latestFeedingLog.timestamp), {
        addSuffix: true,
        locale: ptBR,
      })
    : "Nunca alimentado";

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  const confirmDelete = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  const imageUrl = useMemo(() => {
    console.log('[CatCard] Processing image URL for cat:', cat.name);
    console.log('[CatCard] Raw photo_url:', cat.photo_url);
    
    if (!cat.photo_url || cat.photo_url.trim() === '') {
      console.log('[CatCard] Using fallback image URL');
      return getFallbackImageUrl('cat');
    }
    
    const finalUrl = cat.photo_url.trim();
    console.log('[CatCard] Final processed URL:', finalUrl);
    return finalUrl;
  }, [cat.photo_url, cat.name]);

  // Reset loading state when image URL changes
  useEffect(() => {
    console.log('[CatCard] Image URL changed, resetting loading state:', imageUrl);
    setIsImageLoading(true);
  }, [imageUrl]);

  // Add logging for image load events
  const handleImageLoad = () => {
    console.log('[CatCard] Image loaded successfully:', imageUrl);
    setIsImageLoading(false);
  };

  const handleImageError = () => {
    console.log('[CatCard] Image failed to load:', imageUrl);
    setIsImageLoading(false);
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className="h-full cursor-pointer"
        onClick={onView}
      >
        <Card className="h-full overflow-hidden flex flex-col">
           <div className="relative w-full aspect-[3/1] bg-muted overflow-hidden"> 
             <SafeImage 
               src={imageUrl}
               alt={`Photo of ${cat.name}`} 
               fill
               sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
               className={cn(
                 "absolute inset-0 object-cover transition-all duration-300",
                 isImageLoading ? "opacity-0" : "opacity-100"
               )}
               priority={true}
               onError={handleImageError}
               onLoad={handleImageLoad}
               fallback={
                 <div className="w-full h-full flex items-center justify-center bg-purple-100">
                   <span className="text-purple-500 text-4xl">
                     {cat.name.substring(0, 2).toUpperCase()}
                   </span>
                 </div>
               }
             />
             {isImageLoading && (
               <div className="absolute inset-0 flex items-center justify-center bg-purple-50">
                 <GlobalLoading mode="spinner" size="md" />
               </div>
             )}
           </div>

           <CardHeader className="pt-4 pb-2">
              <CardTitle className="text-lg font-semibold">{cat.name}</CardTitle>
           </CardHeader>
           <CardContent className="flex-grow space-y-1.5 text-sm text-muted-foreground">
              {cat.birthdate && (
                 <div className="flex items-center gap-1.5">
                   <Calendar className="h-4 w-4"/> 
                   <span>{ageString}</span>
                 </div>
              )}
              {cat.weight && (
                 <div className="flex items-center gap-1.5">
                   <Weight className="h-4 w-4"/> 
                   <span>{cat.weight} kg</span>
                 </div>
              )}
              {cat.breed && (
                 <p><span className="font-medium">Raça:</span> {cat.breed}</p>
              )}
              {cat.restrictions && (
                 <p><span className="font-medium">Restrições:</span> {cat.restrictions}</p>
              )}
              
              <div className="pt-1"> 
                 <Badge variant="outline">{lastFed}</Badge>
              </div>
           </CardContent>

           <CardFooter className="pt-3 pb-3 flex justify-end gap-2 border-t mt-auto">
              <Button variant="ghost" size="icon" onClick={handleEditClick} aria-label={`Editar ${cat.name}`}>
                 <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDeleteClick} aria-label={`Excluir ${cat.name}`}>
                 <Trash2 className="h-4 w-4" />
              </Button>
           </CardFooter>
        </Card>
      </motion.div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o gato {cat.name}
              e todos os seus registros de alimentação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 