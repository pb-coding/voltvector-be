import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../middleware/errorHandler";
import authService from "./auth.service";
import userService from "../user/user.service";
import { oneDayinMillis } from "../utils/constants";

const handleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Missing required fields: email and password are required",
    });
  }

  const user = await userService.queryUserByEmail(email);
  console.log(user);

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

  const accessToken = jwt.sign(
    { email: user.email },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: "1m" }
  );

  const refreshToken = jwt.sign(
    { email: user.email },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: "1d" }
  );

  await authService.saveRefreshToken(user.id, refreshToken);

  // TODO: set secure true when using https in production
  res.cookie("jwt", refreshToken, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    maxAge: oneDayinMillis,
  });
  res.json({ accessToken });
});

const handleRefreshToken = asyncHandler(async (req: Request, res: Response) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;

  const user = await authService.queryUserByRefreshToken(refreshToken);
  if (!user) return res.sendStatus(403);

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET as string,
    // TODO: identify according types for err and decoded
    (err: any, decoded: any) => {
      if (err || user.email !== decoded.email) return res.sendStatus(403);
      const accessToken = jwt.sign(
        { email: user.email }, // TODO: Again, this should be a user id or username
        process.env.ACCESS_TOKEN_SECRET as string,
        { expiresIn: "1m" }
      );
      res.json({ accessToken });
    }
  );
});

const handleLogout = asyncHandler(async (req: Request, res: Response) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204);
  const refreshToken = cookies.jwt; // TODO: check type of jwt

  const user = await authService.queryUserByRefreshToken(refreshToken);
  if (!user) {
    res.clearCookie("jwt", { httpOnly: true, sameSite: "none", secure: true });
    return res.sendStatus(204);
  }
  await authService.deleteRefreshToken(refreshToken);
  res.clearCookie("jwt", { httpOnly: true, sameSite: "none", secure: true });
  res.sendStatus(204);
});

export const authController = {
  handleLogin,
  handleRefreshToken,
  handleLogout,
};

export default authController;
