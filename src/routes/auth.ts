import express, { Router, Request, Response } from "express";
import * as path from "path";
import authController from "../auth/auth.controller";

const authRouter = Router();

authRouter.post("/login", authController.handleLoginRequest);
authRouter.get("/refresh", authController.handleRefreshTokenRequest);
authRouter.get("/logout", authController.handleLogoutRequest);

// TODO: implement registration
// authRouter.post("/register", authController.handleRegister);

export default authRouter;
