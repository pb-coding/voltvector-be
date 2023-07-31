import { NextFunction, Request, Response } from "express";
import userService from "./userService";
import { CreateUserRequest, UpdateUserRequest, UserType } from "./userTypes";
import { asyncHandler } from "../middleware/errorHandler";

export const handleAllUsersRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const allUsers = await userService.queryAllUsers();
    res.json(allUsers);
  }
);

export const handleUserByIdRequest = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await userService.queryUserById(Number(id));
  res.json(user);
};

export const handleCreateUserRequest = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, name, password } = req.body as Partial<CreateUserRequest>;

    if (!email || !name || !password) {
      return res.status(400).json({
        error:
          "Missing required fields: email, name, and password are required",
      });
    }

    const user: CreateUserRequest = {
      email,
      name,
      password,
    };
    const newUser = await userService.createUser(user);
    res.json(newUser);
  }
);

export const handleUpdateUserRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email, name } = req.body as UpdateUserRequest;
    const user: UpdateUserRequest = {
      email,
      name,
    };
    const updatedUser = await userService.updateUser(Number(id), user);
    res.json(updatedUser);
  }
);

export const handleDeleteUserRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const deletedUser = await userService.deleteUser(Number(id));
    res.json(deletedUser);
  }
);

export const userController = {
  handleAllUsersRequest,
  handleUserByIdRequest,
  handleCreateUserRequest,
  handleUpdateUserRequest,
  handleDeleteUserRequest,
};

export default userController;
