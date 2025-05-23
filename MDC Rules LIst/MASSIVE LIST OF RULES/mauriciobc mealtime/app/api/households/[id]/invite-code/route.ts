import { type NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// Helper function to check admin/owner status (can be shared if needed)
async function isUserAdmin(userId: string, householdId: string): Promise<boolean> {
  if (!userId || !householdId) {
    return false;
  }
  try {
    const membership = await prisma.household_members.findUnique({
      where: {
        household_id_user_id: {
          household_id: householdId,
          user_id: userId,
        },
      },
      select: { role: true },
    });
    return membership?.role?.toLowerCase() === 'admin' || membership?.role?.toLowerCase() === 'owner';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Helper to generate a unique invite code (simple UUID for now)
function generateInviteCode(): string {
  // Generate a full UUID and take the first 8 characters for a shorter code
  // Add collision check if necessary, but unlikely with UUID prefix
  return uuidv4().substring(0, 8);
}

export async function PATCH(
  request: NextRequest, // request is unused but required by the signature
  context: { params: { id: string } } // context instead of destructuring params
) {
  const headersList = await headers();
  const params = await context.params; // Await params as required by Next.js
  const authUserId = headersList.get('X-User-ID');
  const householdId = params.id;

  if (!authUserId) {
    return NextResponse.json({ error: 'Unauthorized: Missing user ID' }, { status: 401 });
  }

  // Verify requester is admin/owner of the target household
  const isAdmin = await isUserAdmin(authUserId, householdId);
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: User does not have permission to modify this household' },
      { status: 403 },
    );
  }

  try {
    const newInviteCode = generateInviteCode();

    // Update the household with the new invite code
    const updatedHousehold = await prisma.households.update({
      where: { id: householdId },
      data: { inviteCode: newInviteCode },
      select: { inviteCode: true }, // Only select the field we need to return
    });

    if (!updatedHousehold) {
        // Should not happen if admin check passed, but good practice
        return NextResponse.json({ error: 'Household not found' }, { status: 404 });
    }

    return NextResponse.json({ inviteCode: updatedHousehold.inviteCode }, { status: 200 });

  } catch (error) {
    console.error('Error regenerating invite code:', error);
    // Handle potential unique constraint violation if generateInviteCode is not unique enough
    // Although substring(0,8) of UUID v4 is highly unlikely to collide in practice for this scale
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 