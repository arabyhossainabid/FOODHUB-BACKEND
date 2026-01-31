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

## Login Credentials

**Admin:**
- Email: admin@foodhub.com
- Password: admin123

**Provider:**
- Email: mdmd73170@gmail.com
- Password: mdmd73170

## 📚 API Docs

`http://localhost:5000/api-docs`

## Features

- JWT Authentication with role-based access (Customer, Provider, Admin)
- Customer: Browse meals, place orders, write reviews
- Provider: Manage meals, orders, and profile
- Admin: User management, dashboard statistics, category & review moderation
```

আমার কম্পিউটার নষ্ট হয়ে যাওয়ার কারণে আমি আমার শেষ দিকের কোডগুলো নিজের পিসি থেকে করতে পারিনি। তাই অন্য একজনের ল্যাপটপ ব্যবহার করে কাজ করতে হয়েছে। এই কারণে আমি একসাথে সব কোড GitHub-এ push দিতে পারিনি।

ফলে আমাকে GitHub-এর web version ব্যবহার করে একেকটা ফাইল আলাদা আলাদা করে আপলোড করতে হয়েছে। এর জন্য আমার frontend কোডে commit সংখ্যা একটু বেশি হয়ে গেছে এবং শেষ দিকের commit গুলো আগের মতো সুন্দরভাবে করা সম্ভব হয়নি।

তবে শুরুতে প্রায় ৩০টির মতো commit আমি আমার নিজের পিসি থেকেই করেছি, সেগুলো যথাযথ ও গুছানোভাবে করা হয়েছে। আশা করি আমার এই পরিস্থিতিটা বুঝে অ্যাসাইনমেন্টের commit গুলো একটু বিবেচনা করে দেখবেন।
