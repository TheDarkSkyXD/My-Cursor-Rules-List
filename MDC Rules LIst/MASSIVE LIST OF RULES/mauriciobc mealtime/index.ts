import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Query the cats table
  const cats = await prisma.cats.findMany({
    take: 10,
    include: {
      owner: true,
      household: true
    }
  });
  
  console.log('Found cats:', JSON.stringify(cats, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 