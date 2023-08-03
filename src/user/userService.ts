import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { CreateUserRequest, UpdateUserRequest } from "./userTypes";
import { Role } from "@prisma/client";

const queryAllUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      roles: true,
      password: false,
    },
  });
  return users;
};

const queryUserById = async (id: number) => {
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      roles: true,
      password: false,
    },
  });
  console.log(user);
  return user;
};

/**
 * Function to query a user by email address. CAUTION: This function returns the password hash!
 * @param email
 * @returns user
 */
const queryUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  console.log(user);
  return user;
};

const createUser = async (user: CreateUserRequest) => {
  const hashedPassword = await bcrypt.hash(user.password, 10);

  const newUser = await prisma.user.create({
    data: {
      ...user,
      password: hashedPassword,
      roles: {
        create: {
          role: Role.USER,
        },
      },
    },
    include: {
      roles: true,
    },
  });
  console.log(`Created User in Database: ${newUser}`);
  return newUser;
};

const updateUser = async (id: number, user: UpdateUserRequest) => {
  let dataToUpdate = user;

  if (user.password) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    dataToUpdate = {
      ...user,
      password: hashedPassword,
    };
  }
  const updatedUser = await prisma.user.update({
    where: {
      id: id,
    },
    data: dataToUpdate,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      roles: true,
      password: false,
    },
  });
  console.log(`Updated User in Database: ${updatedUser}`);
  return updatedUser;
};

const deleteUsers = async (ids: number[]) => {
  try {
    const deletedUser = await prisma.user.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
    console.log(`Deleted User(s) in Database: ${deletedUser}`);
    return { success: true };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error: `Something went wrong when deleting user(s): ${error}`,
    };
  }
};

export const userService = {
  queryAllUsers,
  queryUserById,
  queryUserByEmail,
  createUser,
  updateUser,
  deleteUsers,
};

export default userService;
