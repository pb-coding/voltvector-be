import express, { Router, Request, Response } from "express";
import * as path from "path";
import userController from "../user/user.controller";
import verifyJWT from "../middleware/verifyJWT";

const userRouter = Router();

userRouter.get("/", verifyJWT, userController.getAllUsers);
userRouter.get("/:id", userController.getUserById);
userRouter.post("/", userController.createUser);
userRouter.put("/:id", userController.updateUser);
userRouter.delete("/:id", userController.deleteUser);

userRouter.get("/test", (req: Request, res: Response) => {
  res.send("test");
});

export default userRouter;
