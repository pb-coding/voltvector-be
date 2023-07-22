import { User } from "@prisma/client";

export type UserType = User;
export type CreateUserRequest = Pick<UserType, "email" | "name" | "password">;
export type UpdateUserRequest = Partial<UserType>;
