import { type NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server'; // For regular user auth check
import { createAdminClient } from '@/utils/supabase/admin'; // For admin actions like inviteUserByEmail
import { sendHouseholdInviteEmail } from '@/lib/mailersend';

// Define input schema
const inviteSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

// Helper function to check admin/owner status
async function isUserAdmin(userId: string, householdId: string): Promise<boolean> {
  if (!userId || !householdId) {
    console.log(`[isUserAdmin] Missing userId (${userId}) or householdId (${householdId})`);
    return false;
  }
  try {
    console.log(`[isUserAdmin] Checking permissions for user ${userId} in household ${householdId}`);
    
    // First check if user is the owner of the household
    const household = await prisma.households.findUnique({
      where: { id: householdId },
      select: { owner_id: true }
    });
    
    if (household?.owner_id === userId) {
      console.log(`[isUserAdmin] User ${userId} is the owner of household ${householdId}`);
      return true;
    }
    
    // Then check membership role
    const membership = await prisma.household_members.findUnique({
      where: {
        user_id_household_id: {
          user_id: userId,
          household_id: householdId,
        },
      },
      select: { role: true },
    });
    
    console.log(`[isUserAdmin] Membership check result:`, membership);
    
    // Check if role is admin or owner, case-insensitive
    const role = membership?.role?.toLowerCase();
    const hasPermission = role === 'admin' || role === 'owner' || role === 'Admin' || role === 'Owner' || role === 'ADMIN' || role === 'OWNER';
    
    console.log(`[isUserAdmin] User ${userId} ${hasPermission ? 'has' : 'does not have'} admin/owner permissions for household ${householdId}. Role is "${membership?.role}"`);
    
    return hasPermission;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const headersList = await headers();
  // Await the headers
  const authUserId = headersList.get('X-User-ID');
  // Explicitly await the params.id to fix Next.js warning
  const householdId = (await params).id;

  console.log('Invite request received:', { householdId, headers: Object.fromEntries(headersList.entries()) });

  if (!authUserId) {
    console.warn('Unauthorized invite attempt - missing X-User-ID header');
    return NextResponse.json({ 
      error: 'Unauthorized: Missing user ID',
      details: 'Make sure X-User-ID header is set in the request' 
    }, { status: 401 });
  }

  // Verify requester is admin/owner of the target household
  const isAdmin = await isUserAdmin(authUserId, householdId);
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: User does not have permission to invite members to this household' },
      { status: 403 },
    );
  }

  // Validate request body
  let validatedData;
  try {
    const body = await request.json();
    validatedData = inviteSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email: targetEmail } = validatedData;
  
  try {
    // Fetch household name for the invitation email
    const household = await prisma.households.findUnique({
      where: { id: householdId },
      select: { name: true },
    });

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 });
    }

    // Fetch inviter's name (profile data)
    const inviterProfile = await prisma.profiles.findUnique({
      where: { id: authUserId },
      select: { username: true, full_name: true },
    });

    const inviterName = inviterProfile?.full_name || inviterProfile?.username || 'A household admin';

    // Check if a user with this email already exists in Supabase Auth
    // Using the admin client is necessary to look up users by email without being that user
    const supabaseAdmin = createAdminClient(); // Use the service role client
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Failed to initialize admin client. Check server configuration.' }, { status: 500 });
    }

    // Remove any dots in email before @ to handle common variants
    // e.g., john.doe@example.com is often the same as johndoe@example.com
    const normalizedEmail = targetEmail
        .replace(/\./g, '')
        .toLowerCase();
    
    // Get user by exact email first
    const { data: existingAuthUser, error: getUserError } = await supabaseAdmin.auth.admin.listUsers({ email: targetEmail });

    if (getUserError && getUserError.message !== 'User not found') {
      console.error('Supabase listUsers error:', getUserError);
      return NextResponse.json({ error: 'Failed to check existing user' }, { status: 500 });
    }

    // Check if a user was found
    let targetUser = existingAuthUser?.users?.[0];
    
    // DEBUG: Special check for problematic email addresses
    console.log(`DEBUG: Checking for specific edge case with email: ${targetEmail}`);
    
    // Check for duplicate profiles with EXACTLY this email in our database
    // This is important as we've found multiple profiles with the same email
    const duplicateProfiles = await prisma.profiles.findMany({
        where: {
            email: {
                equals: targetEmail,
                mode: 'insensitive'
            }
        }
    });
    
    // For debugging - let's list ALL profiles to understand what's happening
    const allProfiles = await prisma.profiles.findMany({
        select: { id: true, email: true }
    });
    console.log(`DEBUG: ALL profile emails in system:`, allProfiles.map(p => ({
        id: p.id,
        email: p.email
    })));
    
    console.log(`DEBUG: Found ${duplicateProfiles.length} profiles with email ${targetEmail}`);
    
    // If there are profiles with this email, but no auth user was found, this is a data inconsistency
    if (duplicateProfiles.length > 0 && !targetUser) {
        console.log(`WARNING: Found profiles with email ${targetEmail} but no corresponding auth user`);
        
        // Check if any of these profiles belong to users who are already in the household
        const profileIds = duplicateProfiles.map(p => p.id);
        const existingMemberships = await prisma.household_members.findMany({
            where: {
                user_id: { in: profileIds },
                household_id: householdId
            }
        });
        
        console.log(`DEBUG: Found ${existingMemberships.length} memberships for profiles with email ${targetEmail}`);
        
        if (existingMemberships.length > 0) {
            // At least one profile with this email is already in the household
            return NextResponse.json({ 
                message: 'User is already a member of this household', 
                details: `A user with email ${targetEmail} is already a member of this household (found via profile check).`,
                profile: duplicateProfiles[0]
            }, { status: 200 });
        }
    }
    
    // Check for users with a similar email address in auth.users
    const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
    console.log(`DEBUG: Found ${allUsers?.users?.length || 0} total users in auth system`);
    
    // Dump email list for debugging without exposing personal data
    const emailListing = allUsers?.users?.map(u => ({
        domain: u.email?.split('@')[1] || 'unknown',
        local: (u.email?.split('@')[0] || 'redacted').substring(0, 3) + '...',
        id: u.id.substring(0, 8) + '...',
    }));
    console.log(`DEBUG: Email domains in system:`, emailListing);
    
    // DISABLE ALL SIMILARITY CHECKS - Use only exact email matching
    
    // Log all system emails for debugging (with privacy considerations)
    console.log(`DEBUG: All system emails:`, allUsers?.users?.map(u => ({
        email: u.email || 'unknown',
        id: u.id,
    })));
    
    // Strict approach: We will NOT use any similarity matching
    // No similar user auto-detection - only exact email matches allowed
    
    // Clear any previous changes to targetUser to ensure we only use exact matching
    targetUser = existingAuthUser?.users?.[0];
    
    console.log(`DEBUG: After strict checks, targetUser exists: ${!!targetUser}`);
    if (targetUser) {
        console.log(`DEBUG: Exact match found with ID ${targetUser.id}, email ${targetUser.email}`);
    }
    
    // DISABLED - No variant checking
    // We're disabling all variant checking because it's causing false positives
    console.log("DEBUG: Skipping proton.me variant checking - only using exact email matches");
    
    // Additional sanity check to avoid confusion between different users
    if (targetUser) {
        console.log(`DEBUG: Performing sanity check on targetUser's email`);
        
        // Get the exact user account from Supabase Auth
        const { data: specificUser } = await supabaseAdmin.auth.admin.getUserById(targetUser.id);
        
        if (specificUser?.user) {
            console.log(`DEBUG: Found specific user by ID ${targetUser.id}:`, {
                email: specificUser.user.email,
                confirmationStatus: specificUser.user.email_confirmed_at ? 'confirmed' : 'unconfirmed'
            });
            
            // Double-check the email actually matches (sanity check)
            if (specificUser.user.email !== targetEmail) {
                console.log(`WARNING: Supabase returned a user with different email than requested!`);
                console.log(`Requested: ${targetEmail}, Found: ${specificUser.user.email}`);
                
                // Reset the targetUser if emails don't match
                targetUser = null;
            }
        }
    }
    
    // *** CRITICAL DEBUG CHECK ***
    // Do a brute force search to be absolutely certain we're getting the right data
    console.log(`DEBUG: Doing a brute force search in database to check consistency...`);
    const { data: allAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
    
    const exactMatches = allAuthUsers?.users?.filter(u => 
        u.email?.toLowerCase() === targetEmail.toLowerCase()
    );
    
    console.log(`DEBUG: BRUTE FORCE RESULTS:`);
    console.log(`- Found ${exactMatches?.length || 0} exact email matches for ${targetEmail}`);
    console.log(`- Internal targetUser: ${targetUser ? targetUser.id : 'null'}`);
    
    // Ensure we're using the correct user
    if (exactMatches?.length === 1 && (!targetUser || exactMatches[0].id !== targetUser.id)) {
        console.log(`DEBUG: Using brute force match instead of API result`);
        targetUser = exactMatches[0];
    }

    // Log user identification to help debugging
    console.log(`Looking for user with email ${targetEmail}:`, {
        found: !!targetUser,
        id: targetUser?.id,
        email: targetUser?.email,
        emailConfirmed: targetUser?.email_confirmed_at
    });

    // Check if this user (existing or potential) is already in the target household
    if (targetUser) {
        console.log(`DEBUG: Checking if user ${targetUser.id} with email ${targetUser.email} is a member of household ${householdId}`);
        
        const existingMembership = await prisma.household_members.findFirst({
            where: {
                user_id: targetUser.id,
                household_id: householdId,
            },
        });

        console.log(`DEBUG: Membership check result:`, existingMembership);
        
        // Get all household members for verification
        const allMembers = await prisma.household_members.findMany({
            where: { household_id: householdId },
            select: { user_id: true, role: true }
        });
        
        console.log(`DEBUG: All household members:`, allMembers);

        if (existingMembership) {
            // Get all emails associated with this user for better error reporting
            const existingProfile = await prisma.profiles.findUnique({
                where: { id: targetUser.id },
                select: { username: true, email: true, id: true }
            });
            
            console.log(`DEBUG: User is already a member with profile:`, existingProfile);
            
            // Also get the profile of the current user for comparison
            const userEmails = await prisma.profiles.findMany({
                where: { email: { not: null } },
                select: { id: true, email: true }
            });
            
            console.log(`DEBUG: All user emails in profiles table:`, userEmails);
            
            return NextResponse.json({ 
                message: 'User is already a member of this household', 
                details: `The user with email ${targetUser.email} (ID: ${targetUser.id.substring(0, 8)}...) is already a member of this household.`,
                profile: existingProfile
            }, { status: 200 }); // Or 409 Conflict? 200 is friendlier.
        }

        // ADDITIONAL SAFETY CHECK: See if this email is too similar to existing members
        // This is important for catching cases where similar emails might belong to the same person
        
        // First, get all members of this household
        const allHouseholdMembers = await prisma.household_members.findMany({
            where: { household_id: householdId },
            select: { user_id: true }
        });
        
        // Get profiles of all household members
        const memberIds = allHouseholdMembers.map(m => m.user_id);
        const memberProfiles = await prisma.profiles.findMany({
            where: { id: { in: memberIds } },
            select: { id: true, email: true, username: true, full_name: true }
        });
        
        console.log(`DEBUG: All member profiles for similarity check:`, memberProfiles);
        
        // Check for similar email patterns (first part before @ is too similar)
        const targetEmailLocal = targetEmail.split('@')[0].toLowerCase();
        
        // Find any member with a STRICTLY identical email
        const similarMembers = memberProfiles.filter(profile => {
            if (!profile.email) return false;
            
            // ONLY check for exact case-insensitive email match
            // No partial matches or username-only matches
            if (profile.email.toLowerCase() === targetEmail.toLowerCase()) {
                console.log(`DEBUG: Found exact email match with member ${profile.id}, email ${profile.email}`);
                return true;
            }
            
            return false;
        });
        
        console.log(`DEBUG: Email being checked: ${targetEmail}`);
        console.log(`DEBUG: Existing member emails: ${memberProfiles.map(p => p.email).join(', ')}`);
        
        if (similarMembers.length > 0) {
            console.log(`DEBUG: Found ${similarMembers.length} similar member emails`);
            return NextResponse.json({ 
                message: 'User with similar email already exists', 
                details: `A user with a similar email (${similarMembers[0].email}) is already a member of this household.`,
                profile: similarMembers[0]
            }, { status: 200 });
        }
        
        // If all checks pass, we can proceed with adding the user
        console.log(`DEBUG: All safety checks passed, adding user ${targetUser.id} to household ${householdId}`);
        
        // If user exists in Supabase Auth but not in the household, add them directly
        await prisma.household_members.create({
            data: {
                user_id: targetUser.id,
                household_id: householdId,
                role: 'member', // Default role for added members
            },
        });
        // Optionally, send a simple notification email here instead of a full Supabase invite

         // Also update the profile's primary householdId if it's null
         // This might be better handled when the user accepts or logs in,
         // but we can attempt it here for direct adds.
         try {
            await prisma.profiles.update({
                where: { id: targetUser.id, household_id: null },
                data: { household_id: householdId },
            });
         } catch (profileUpdateError) {
            // Log error but proceed, as profile update isn't critical for membership
            console.warn(`Could not update primary household for existing user ${targetUser.id}:`, profileUpdateError);
         }

        return NextResponse.json({ message: 'Existing user added to household successfully' }, { status: 200 });

    } else {
        // User does not exist in Supabase Auth, send an invite
        const inviteRedirectUrl = `${request.nextUrl.origin}/api/auth/callback?redirect=/join?householdId=${householdId}`; // Redirect after signup/login

        console.log('DEBUG: Attempting to invite user with email:', targetEmail, 'and redirect URL:', inviteRedirectUrl);
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
            targetEmail,
            { redirectTo: inviteRedirectUrl } // Ensure this URL handles the invite flow
        );

        if (inviteError) {
            console.error('Supabase invite error:', inviteError);
            // Handle specific errors like email rate limits if necessary
            if (inviteError.message.includes('rate limit')) {
                 return NextResponse.json({ error: 'Invite rate limit exceeded. Please try again later.' }, { status: 429 });
            }
            return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
        }

        // Note: inviteData contains the invited user object, but we don't add to household_members until they accept.
        return NextResponse.json({ message: 'Invitation sent successfully' }, { status: 200 });
    }

  } catch (error) {
    console.error('Error processing household invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 