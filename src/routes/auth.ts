import express, { Router, Request, Response } from "express";
import * as path from "path";
import authController from "../auth/auth.controller";

const authRouter = Router();

authRouter.post("/login", authController.handleLogin);
authRouter.get("/refresh", authController.handleRefreshToken);
authRouter.get("/logout", authController.handleLogout);

// TODO: implement registration
// authRouter.post("/register", authController.handleRegister);

export default authRouter;
