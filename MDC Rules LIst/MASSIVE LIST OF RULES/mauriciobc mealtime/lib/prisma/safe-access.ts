import 'dotenv/config';
import prisma from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';

// Model name mapping based on the actual Prisma schema
const modelMapping: Record<string, string> = {
  'cat': 'cats',             // 'cat' in code maps to 'cats' in Prisma schema
  'household': 'households', // 'household' in code maps to 'households' in Prisma schema
  'householdMember': 'household_members', // 'householdMember' in code maps to 'household_members' in Prisma schema
  'profile': 'profiles',     // 'profile' in code maps to 'profiles' in Prisma schema
  'schedule': 'schedules',   // 'schedule' in code maps to 'schedules' in Prisma schema
  'notification': 'notifications' // 'notification' in code maps to 'notifications' in Prisma schema
};

// Log real model names for diagnosis - execute once on module load
console.log('[Prisma Models] Available in schema:', Object.keys(prisma).filter(
  key => !key.startsWith('_') && !key.startsWith('$')
).join(', '));

/**
 * Safely access a Prisma model and perform an operation, falling back to a local client if needed.
 * 
 * @param modelName Name of the model as used in code
 * @param accessor Function that extracts the model from a client
 * @param operation Function that performs the database operation using the model
 * @returns Result of the operation
 */
export async function withModel<T, R>(
  modelName: string,
  accessor: (client: any) => any,
  operation: (model: any) => Promise<R>
): Promise<R> {
  // Check if we have a mapping for this model name
  const mappedModelName = modelMapping[modelName];
  
  if (mappedModelName) {
    console.log(`[Prisma] Using mapped model: '${modelName}' → '${mappedModelName}'`);
    
    // Try to access the model using the mapped name
    if (prisma[mappedModelName]) {
      console.log(`[Prisma] Accessing mapped model '${mappedModelName}' from shared client`);
      try {
        return await operation(prisma[mappedModelName]);
      } catch (error) {
        console.warn(`[Prisma] Error using mapped model '${mappedModelName}': ${error.message}`);
        throw error; // Rethrow since this is our best mapping
      }
    }
  }
  
  // Try with shared client using original accessor as fallback
  const model = accessor(prisma);
  
  if (model && typeof model === 'object') {
    try {
      console.log(`[Prisma] Using original accessor for model ${modelName}`);
      return await operation(model);
    } catch (error) {
      console.warn(`[Prisma] Error using original accessor for ${modelName}: ${error.message}`);
      throw error; // Rethrow the error since we've tried all options
    }
  } else {
    console.warn(`[Prisma] Neither mapped model '${mappedModelName}' nor original model '${modelName}' is available`);
    throw new Error(`Model '${modelName}' (mapped to '${mappedModelName || 'none'}') not available in Prisma client`);
  }
} 