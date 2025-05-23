import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';

// PATCH /api/notifications/[id]/read - Marcar notificação como lida
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`\n--- [PATCH /api/notifications/${params.id}/read] Start ---`);
  try {
    const supabase = createClient(cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log(`[PATCH /${params.id}/read] User:`, user ? { id: user.id } : "null");
    
    if (!user || authError) {
      console.error(`[PATCH /${params.id}/read] Unauthorized: No user or auth error`);
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const notificationId = parseInt(params.id);
    console.log(`[PATCH /${params.id}/read] User ID: ${user.id}, Notification ID: ${notificationId}`);
    
    if (isNaN(notificationId)) {
      console.error(`[PATCH /${params.id}/read] Invalid Notification ID format:`, params.id);
      return NextResponse.json(
        { error: 'Formato de ID de notificação inválido' },
        { status: 400 }
      );
    }
    
    // Buscar notificação para verificar propriedade
    console.log(`[PATCH /${params.id}/read] Fetching notification to verify ownership`);
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: { user: true }
    });
    
    if (!notification) {
      console.error(`[PATCH /${params.id}/read] Notification not found: ${notificationId}`);
      return NextResponse.json(
        { error: 'Notificação não encontrada' },
        { status: 404 }
      );
    }
    
    if (notification.user.authId !== user.id) {
      console.error(`[PATCH /${params.id}/read] Forbidden: User ${user.id} does not own notification ${notificationId}`);
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }
    
    // Mark notification as read
    console.log(`[PATCH /${params.id}/read] Updating notification to isRead: true`);
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
    console.log(`[PATCH /${params.id}/read] Notification updated successfully`);

    // --- Add Cache Invalidation --- 
    console.log(`[PATCH /${params.id}/read] Revalidating cache tag: 'notifications'`);
    revalidateTag('notifications');
    console.log(`[PATCH /${params.id}/read] Revalidating cache tag: 'unread-count'`);
    revalidateTag('unread-count');
    // ------------------------------

    console.log(`[PATCH /${params.id}/read] Sending response:`, updatedNotification);
    console.log(`--- [PATCH /api/notifications/${params.id}/read] End ---`);
    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error(`[PATCH /api/notifications/${params.id}/read] Error:`, error);
    console.log(`--- [PATCH /api/notifications/${params.id}/read] End with Error ---`);
    return NextResponse.json(
      { error: 'Erro ao marcar notificação como lida' },
      { status: 500 }
    );
  }
} 