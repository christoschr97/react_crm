import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Seed categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Technology' },
      update: {},
      create: { name: 'Technology' },
    }),
    prisma.category.upsert({
      where: { name: 'Business' },
      update: {},
      create: { name: 'Business' },
    }),
    prisma.category.upsert({
      where: { name: 'Design' },
      update: {},
      create: { name: 'Design' },
    }),
  ]);

  console.log(`Seeded ${categories.length} categories`);

  // Seed admin user
  const passwordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: {},
    create: {
      email: 'admin@crm.com',
      passwordHash,
      name: 'Admin User',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`Seeded admin user: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
