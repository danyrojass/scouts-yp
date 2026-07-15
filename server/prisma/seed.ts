import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const org = await prisma.organization.upsert({
    where: { slug: 'scout-group-dev' },
    update: {},
    create: {
      name: 'Scout Group Dev',
      slug: 'scout-group-dev',
    },
  });

  const adminPassword = await bcrypt.hash('admin123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@scouts.dev' },
    update: {},
    create: {
      email: 'admin@scouts.dev',
      passwordHash: adminPassword,
      name: 'Admin',
      type: 'DIRIGENTE',
      role: 'ADMIN',
      level: 'JEFE',
      organizationId: org.id,
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
