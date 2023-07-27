import { prisma } from "../lib/prisma";
import { UserType } from "../user/user.types";
import { RefreshTokenType, RoleType } from "./auth.types";

const saveRefreshToken = async (
  userId: number,
  refreshToken: string
): Promise<RefreshTokenType> => {
  const newRefreshToken = await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshToken,
    },
  });
  console.log(`Created Refresh Token in Database: ${newRefreshToken}`);
  return newRefreshToken;
};

const queryUserByRefreshToken = async (
  refreshToken: string
): Promise<UserType | undefined> => {
  const refreshTokenWithUser = await prisma.refreshToken.findUnique({
    where: {
      token: refreshToken,
    },
    select: {
      user: true,
    },
  });
  const user = refreshTokenWithUser?.user;
  console.log(user);
  return user;
};

const deleteRefreshToken = async (refreshToken: string) => {
  const deletedRefreshToken = await prisma.refreshToken.delete({
    where: {
      token: refreshToken,
    },
  });
  console.log(`Deleted Refresh Token in Database: ${deletedRefreshToken}`);
  return deletedRefreshToken;
};

const queryRolesByUserId = async (id: number): Promise<RoleType[]> => {
  const userRolesObject = await prisma.user.findUnique({
    where: {
      id: id,
    },
    select: {
      roles: true,
    },
  });

  const userRoles: RoleType[] = [];
  userRolesObject?.roles.forEach((roleObject) =>
    userRoles.push(roleObject.role)
  );

  console.log(userRoles);
  return userRoles;
};

export const authService = {
  saveRefreshToken,
  queryUserByRefreshToken,
  deleteRefreshToken,
  queryRolesByUserId,
};

export default authService;
