import prisma from '../../config/prisma';

const createCategory = async (name: string) => {
  const category = await prisma.category.create({
    data: { name }
  });
  return category;
};

const getAllCategories = async () => {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { meals: true }
      }
    }
  });
  return categories;
};

const updateCategory = async (id: string, name: string) => {
  const category = await prisma.category.update({
    where: { id },
    data: { name }
  });
  return category;
};

const deleteCategory = async (id: string) => {
  const mealCount = await prisma.meal.count({
    where: { categoryId: id }
  });

  if (mealCount > 0) {
    throw {
      statusCode: 400,
      message: 'Cannot delete category as it has associated meals. Please delete or reassign the meals first.'
    };
  }

  await prisma.category.delete({
    where: { id }
  });
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory
};
