import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const group = await prisma.group.upsert({
    where: { slug: 'grupo-scout-dev' },
    update: {},
    create: {
      name: 'Grupo Scout Dev',
      number: '001',
      city: 'La Plata',
      slug: 'grupo-scout-dev',
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
      groupId: group.id,
    },
  });

  const superAdminPassword = await bcrypt.hash('superadmin123', 12);

  await prisma.user.upsert({
    where: { email: 'superadmin@scouts.dev' },
    update: {},
    create: {
      email: 'superadmin@scouts.dev',
      passwordHash: superAdminPassword,
      name: 'Super Admin',
      type: 'DIRIGENTE',
      role: 'SUPER_ADMIN',
      level: 'JEFE',
      groupId: null,
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
