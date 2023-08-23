import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { asyncHandler } from "../middleware/errorHandler";
import authService from "./authService";
import userService from "../user/userService";
import { oneHourInMillis } from "../utils/constants";
import { AuthPayloadType } from "./authTypes";

const handleLoginRequest = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Missing required fields: email and password are required",
    });
  }

  const user = await userService.queryUserByEmail(email);

  if (!user) {
    return res
      .status(401)
      .json({ error: "Invalid credentials - Auth Error Code 1" }); // Code 1 = User not found
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res
      .status(401)
      .json({ error: "Invalid credentials - Auth Error Code 2" }); // Code 2 = Password does not match
  }

  const userRoles = await authService.queryRolesByUserId(user.id);

  const accessToken = jwt.sign(
    {
      user: {
        id: user.id,
        roles: userRoles,
      },
    } satisfies AuthPayloadType,
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_TIME as string }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION_TIME as string }
  );

  await authService.saveRefreshToken(user.id, refreshToken);

  res.cookie("jwt", refreshToken, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    maxAge: oneHourInMillis,
  });
  res.json({ accessToken });
});

const handleRefreshTokenRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;

    const user = await authService.queryUserByRefreshToken(refreshToken);
    if (!user) return res.sendStatus(401);

    const userRoles = await authService.queryRolesByUserId(user.id);

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string,
      // TODO: identify according types for err and decoded
      (err: any, decoded: any) => {
        if (err || user.id !== decoded.id) return res.sendStatus(401);
        const accessToken = jwt.sign(
          {
            user: {
              id: user.id,
              roles: userRoles,
            },
          },
          process.env.ACCESS_TOKEN_SECRET as string,
          { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_TIME as string }
        );

        res.json({ accessToken });
      }
    );
  }
);

const handleLogoutRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204);
    const refreshToken = cookies.jwt; // TODO: check type of jwt

    const user = await authService.queryUserByRefreshToken(refreshToken);
    if (!user) {
      res.clearCookie("jwt", {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      return res.sendStatus(204);
    }
    await authService.deleteRefreshToken(refreshToken);
    res.clearCookie("jwt", { httpOnly: true, sameSite: "none", secure: true });
    res.sendStatus(204);
  }
);

export const authController = {
  handleLoginRequest,
  handleRefreshTokenRequest,
  handleLogoutRequest,
};

export default authController;
