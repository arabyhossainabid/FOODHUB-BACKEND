# FoodHub Backend

A food delivery platform backend built with Express.js, TypeScript, and Prisma ORM.

## Tech Stack

Express.js, TypeScript, PostgreSQL, Prisma, Passport JWT, Zod

## Setup

```bash
git clone https://github.com/arabyhossainabid/FOODHUB-BACKEND.git
cd FOODHUB-BACKEND
pnpm install
```

Create `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/foodhub"
JWT_SECRET="your-secret-key"
PORT=5000

## Admin Login

```

Email: admin@foodhub.com
Password: admin123

```

## 📚 API Docs

`http://localhost:5000/api-docs`

## Features

- JWT Authentication with role-based access (Customer, Provider, Admin)
- Customer: Browse meals, place orders, write reviews
- Provider: Manage meals, orders, and profile
- Admin: User management, dashboard statistics, category & review moderation
```
