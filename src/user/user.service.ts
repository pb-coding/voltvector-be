import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { CreateUserRequest, UpdateUserRequest } from "./user.types";

const queryAllUsers = async () => {
  const users = await prisma.user.findMany();
  return users;
};

const queryUserById = async (id: number) => {
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });
  console.log(user);
  return user;
};

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
    },
  });
  console.log(`Created User in Database: ${newUser}`);
  return newUser;
};

const updateUser = async (id: number, user: UpdateUserRequest) => {
  const updatedUser = await prisma.user.update({
    where: {
      id: id,
    },
    data: {
      email: user.email,
      name: user.name,
      password: user.password,
    },
  });
  console.log(`Updated User in Database: ${updatedUser}`);
  return updatedUser;
};

const deleteUser = async (id: number) => {
  const deletedUser = await prisma.user.delete({
    where: {
      id: id,
    },
  });
  console.log(`Deleted User in Database: ${deletedUser}`);
  return deletedUser;
};

export const userService = {
  queryAllUsers,
  queryUserById,
  queryUserByEmail,
  createUser,
  updateUser,
  deleteUser,
};

export default userService;
