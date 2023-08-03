import { NextFunction, Request, Response } from "express";
import userService from "./userService";
import { CreateUserRequest, UpdateUserRequest, UserType } from "./userTypes";
import { asyncHandler } from "../middleware/errorHandler";
import { validateRequestParams } from "../utils/helpers";
import { AuthenticatedRequest } from "../auth/authTypes";

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
  // const roles = req.roles;

  validateRequestParams(
    [
      { name: "provided user id", param: providedId, expectedType: "numeric" },
      { name: "decoded user id", param: decodedId, expectedType: "numeric" },
    ],
    res
  );

  const providedUserId = Number(providedId);
  const decodedUserId = decodedId as number;

  console.log(`pathUserId: ${providedUserId}`);
  console.log(`decodedUserId: ${decodedUserId}`);

  if (providedUserId !== 0 && providedUserId !== decodedUserId) {
    // TODO: admins should be able to view other users' information
    res
      .status(403)
      .json({
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
    res.json(newUser);
  }
);

export const handleUpdateUserRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { email, name } = req.body as UpdateUserRequest;

    validateRequestParams(
      [
        { name: "user id", param: id, expectedType: "numeric" },
        { name: "email", param: email, expectedType: "string" },
        { name: "name", param: name, expectedType: "string" },
      ],
      res
    );

    const user: UpdateUserRequest = {
      email,
      name,
    };
    const updatedUser = await userService.updateUser(Number(id), user);
    res.json(updatedUser);
  }
);

export const handleDeleteUserRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    console.log(req.body);
    const userIds = req.body.userIds as number[];

    userIds.forEach((id) => {
      console.log(`id: ${id}`);
    });

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
    userIds.forEach((id) => {
      console.log(`id: ${id}`);
    });

    const dbInteraction = await userService.deleteUsers(userIds);
    if (!dbInteraction.success) {
      res.status(500).send(dbInteraction.error);
      return;
    }
    res
      .status(200)
      .send("Deleted user(s) successfully with id(s): " + userIds.join(", "));
  }
);

export const handleUserInfoRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    let userId = req.id;
    console.log(`userId: ${userId}`);

    console.log("validating request params");

    validateRequestParams(
      [
        {
          name: "user id",
          param: userId,
          expectedType: "numeric",
        },
      ],
      res
    );

    console.log("successfull validation");

    userId = userId as number;

    // Query the user information using userId
    /* const user = await userService.queryUserById(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Build the response object with the required user information
    const userAuthData = {
      id: user.id,
      name: user.name,
      email: user.email,
      // Add any other necessary user information
    };

    res.json(userAuthData);*/
    res.send("success");
  }
);

export const userController = {
  handleAllUsersRequest,
  handleUserByIdRequest,
  handleCreateUserRequest,
  handleUpdateUserRequest,
  handleDeleteUserRequest,
  handleUserInfoRequest,
};

export default userController;
