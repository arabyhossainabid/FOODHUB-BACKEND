import prisma from '../src/config/prisma';
import { hashPassword } from '../src/utils/hash';
import { Role } from '@prisma/client';

async function main() {
  console.log('Starting database seed...');

  // Seed Admin User
  const adminEmail = 'admin@foodhub.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await hashPassword('admin123');
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });
    console.log('Admin user created successfully (Email: admin@foodhub.com, Password: admin123)');
  } else {
    console.log('Admin user already exists');
  }

  // Seed Categories
  const categories = [
    'Fast Food',
    'Chinese',
    'Italian',
    'Indian',
    'Thai',
    'Mexican',
    'Japanese',
    'Desserts',
    'Beverages',
    'Healthy'
  ];

  for (const categoryName of categories) {
    const existing = await prisma.category.findUnique({
      where: { name: categoryName }
    });

    if (!existing) {
      await prisma.category.create({
        data: { name: categoryName }
      });
      console.log(`Category "${categoryName}" created`);
    }
  }

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
