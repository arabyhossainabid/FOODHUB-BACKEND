import prisma from '../src/config/prisma';
import { hashPassword } from '../src/utils/hash';
import { Role } from '@prisma/client';

type DemoUserDef = {
  email: string;
  password: string;
  name: string;
  role: Role;
  provider?: { shopName: string; address: string; cuisine?: string };
};

/** Match `foodhub` demo logins; (re)run seed to fix wrong roles in User Management. */
const DEMO_USERS: DemoUserDef[] = [
  {
    email: 'customer@foodhub.com',
    password: 'customer123',
    name: 'Customer',
    role: Role.CUSTOMER,
  },
  {
    email: 'provider@foodhub.com',
    password: 'provider123',
    name: 'Provider',
    role: Role.PROVIDER,
    provider: {
      shopName: 'Demo Kitchen',
      address: '123 Demo Street',
      cuisine: 'Mixed',
    },
  },
  {
    email: 'manager@foodhub.com',
    password: 'manager123',
    name: 'Manager',
    role: Role.MANAGER,
  },
  {
    email: 'organizer@foodhub.com',
    password: 'organizer123',
    name: 'Organizer',
    role: Role.ORGANIZER,
  },
];

async function ensureDemoUsers() {
  for (const d of DEMO_USERS) {
    const existing = await prisma.user.findUnique({
      where: { email: d.email },
      include: { providerProfile: true },
    });
    const hashedPassword = await hashPassword(d.password);

    if (!existing) {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: d.name,
            email: d.email,
            password: hashedPassword,
            role: d.role,
          },
        });
        if (d.role === Role.PROVIDER && d.provider) {
          await tx.providerProfile.create({
            data: {
              userId: user.id,
              shopName: d.provider.shopName,
              address: d.provider.address,
              cuisine: d.provider.cuisine,
            },
          });
        }
      });
      console.log(`Demo user created: ${d.email} (${d.role})`);
      continue;
    }

    if (existing.role === d.role) {
      continue;
    }

    await prisma.$transaction(async (tx) => {
      if (existing.providerProfile && d.role !== Role.PROVIDER) {
        await tx.providerProfile.delete({
          where: { userId: existing.id },
        });
      }
      if (d.role === Role.PROVIDER && d.provider && !existing.providerProfile) {
        await tx.providerProfile.create({
          data: {
            userId: existing.id,
            shopName: d.provider.shopName,
            address: d.provider.address,
            cuisine: d.provider.cuisine,
          },
        });
      }
      await tx.user.update({
        where: { id: existing.id },
        data: {
          role: d.role,
          name: d.name,
          password: hashedPassword,
          isActive: true,
        },
      });
    });
    console.log(`Demo user role fixed: ${d.email} (${existing.role} -> ${d.role})`);
  }
}

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

  await ensureDemoUsers();

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
