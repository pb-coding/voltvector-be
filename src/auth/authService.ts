import { prisma } from "../lib/prisma";
import { UserType } from "../user/userTypes";
import { RefreshTokenType, RoleType } from "./authTypes";

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
  return user;
};

const deleteRefreshToken = async (refreshToken: string) => {
  const deletedRefreshToken = await prisma.refreshToken.delete({
    where: {
      token: refreshToken,
    },
  });
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

  return userRoles;
};

export const authService = {
  saveRefreshToken,
  queryUserByRefreshToken,
  deleteRefreshToken,
  queryRolesByUserId,
};

export default authService;
