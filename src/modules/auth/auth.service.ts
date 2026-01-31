import prisma from '../../config/prisma';
import { hashPassword, comparePassword } from '../../utils/hash';
import { generateToken } from '../../utils/jwt';
import { RegisterInput, LoginInput } from './auth.validation';
import { Role, User } from '@prisma/client';

const register = async (data: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email
    }
  });

  if (existingUser) {
    throw { statusCode: 400, message: 'User already exists' };
  }

  const hashedPassword = await hashPassword(data.password);

  const role = data.role as Role || Role.CUSTOMER;

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: role,
      }
    });

    if (role === Role.PROVIDER) {
      await tx.providerProfile.create({
        data: {
          userId: user.id,
          shopName: data.shopName!,
          address: data.address!,
        }
      });
    }

    return user;
  });

  const token = generateToken({ id: result.id, email: result.email, role: result.role });

  const { password, ...userWithoutPassword } = result as any;

  return {
    user: userWithoutPassword,
    token
  };
};

const login = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: {
      email: data.email
    },
    include: {
      providerProfile: true
    }
  });

  if (!user) {
    throw { statusCode: 400, message: 'Invalid credentials' };
  }

  const isPasswordValid = await comparePassword(data.password, user.password);

  if (!isPasswordValid) {
    throw { statusCode: 400, message: 'Invalid credentials' };
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  const { password, ...userWithoutPassword } = user as any;

  return {
    user: userWithoutPassword,
    token
  };
};

const googleAuthCallback = async (user: User) => {
  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  const { password, ...userWithoutPassword } = user as any;

  return {
    user: userWithoutPassword,
    token
  };
};

export const AuthService = {
  register,
  login,
  googleAuthCallback
};
