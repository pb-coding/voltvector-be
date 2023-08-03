import express, { Router, Request, Response } from "express";
import * as path from "path";
import userController from "../user/userController";
import authorize from "../middleware/authorize";
import { Role } from "@prisma/client";

const userRouter = Router();

// TODO: implement authorization that users can only access and edit their own data

userRouter.get(
  "/",
  authorize([Role.ADMIN]),
  userController.handleAllUsersRequest
);
userRouter.get(
  "/:id",
  authorize([Role.USER]),
  userController.handleUserByIdRequest
);
userRouter.post(
  "/",
  authorize([Role.ADMIN]),
  userController.handleCreateUserRequest
);
userRouter.put(
  "/:id",
  authorize([Role.USER]),
  userController.handleUpdateUserRequest
);
userRouter.delete(
  "/",
  authorize([Role.ADMIN]),
  userController.handleDeleteUserRequest
);

export default userRouter;
