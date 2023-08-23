import { NextFunction, Request, Response } from "express";

import userService from "./userService";
import { CreateUserRequest, UpdateUserRequest, UserType } from "./userTypes";
import { asyncHandler } from "../middleware/errorHandler";
import { validateRequestParams } from "../utils/helpers";
import { AuthenticatedRequest } from "../auth/authTypes";
import { isAdmin } from "../middleware/authorize";

export const handleAllUsersRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const allUsers = await userService.queryAllUsers();
    res.json(allUsers);
  }
);

// TODO: add some further error handling when users are not found

export const handleUserByIdRequest = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const providedId = req.params.id;
  const decodedId = req.id;
  const roles = req.roles;

  validateRequestParams(
    [
      { name: "provided user id", param: providedId, expectedType: "numeric" },
      { name: "decoded user id", param: decodedId, expectedType: "numeric" },
    ],
    res
  );

  const providedUserId = Number(providedId);
  const decodedUserId = decodedId as number;

  if (
    !isAdmin(roles) &&
    providedUserId !== 0 &&
    providedUserId !== decodedUserId
  ) {
    // TODO: admins should be able to view other users' information
    res.status(403).json({
      error: "You are not authorized to view this user's information",
    });
    return;
  }

  // if providedUserId is 0, then we are querying the user's own information
  const userId = providedUserId === 0 ? decodedUserId : providedUserId;

  const user = await userService.queryUserById(Number(userId));
  res.json(user);
};

export const handleCreateUserRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let { email, name, password } = req.body as Partial<CreateUserRequest>;

    validateRequestParams(
      [
        { name: "email", param: email, expectedType: "string" },
        { name: "name", param: name, expectedType: "string" },
        { name: "password", param: password, expectedType: "string" },
      ],
      res
    );

    email = email as string;
    name = name as string;
    password = password as string;

    const user: CreateUserRequest = {
      email,
      name,
      password,
    };
    const newUser = await userService.createUser(user);
    const message = `Successfully created user ${newUser.name} with id: ${newUser.id}`;
    console.log(message);
    res.json({ message });
  }
);

export const handleUpdateUserRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const providedId = req.params.id;
    const decodedId = req.id;
    const roles = req.roles;
    const { email, name, password } = req.body as UpdateUserRequest;

    validateRequestParams(
      [
        {
          name: "provided user id",
          param: providedId,
          expectedType: "numeric",
        },
        { name: "email", param: email, expectedType: "string" },
        { name: "name", param: name, expectedType: "string" },
      ],
      res
    );

    const providedUserId = Number(providedId);
    const decodedUserId = decodedId as number;

    if (
      !isAdmin(roles) &&
      providedUserId !== 0 &&
      providedUserId !== decodedUserId
    ) {
      // TODO: admins should be able to edit other users' information
      res.status(403).json({
        error: "You are not authorized to edit this user's information",
      });
      return;
    }

    const user: UpdateUserRequest = {
      email,
      name,
      password,
    };
    const updatedUser = await userService.updateUser(Number(providedId), user);
    const message = `Successfully updated user ${updatedUser.name} with id: ${updatedUser.id}`;
    console.log(message);
    res.json({ message });
  }
);

export const handleDeleteUserRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userIds = req.body.userIds as number[];

    // TODO: add validation for multiple ids
    validateRequestParams(
      [
        {
          name: "array of user ids",
          param: userIds,
          expectedType: "numeric[]",
        },
      ],
      res
    );

    const deletedUsers = await userService.deleteUsers(userIds);
    res.json(deletedUsers);
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
