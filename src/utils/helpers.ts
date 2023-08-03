import { Response } from "express";

export const isNullOrBlank = (value: string | null | undefined) => {
  return !value || value.trim() === "";
};

type ExpectedParameterTypeObject = {
  name: string;
  param: any; // We validate the type of this parameter using the validateRequestParams function
  expectedType: string;
};

/**
 * This function validates if the expected parameters are provided and if they are of the expected type.
 * @param requestParameter object containing the parameter name, the parameter itself and the expected type.
 * @param res provide the response object so that we can return an error if the validation fails
 */
export const validateRequestParams = (
  requestParameter: ExpectedParameterTypeObject[],
  res: Response
) => {
  requestParameter.forEach((paramObject) => {
    let success = false;
    if (paramObject.expectedType === "numeric") {
      if (!paramObject.param || paramObject.param == "")
        return res
          .status(400)
          .json({ error: `No ${paramObject.name} provided.` });

      if (isNaN(Number(paramObject.param)))
        return res
          .status(400)
          .json({ error: `Invalid ${paramObject.name} provided.` });
    } else if (paramObject.expectedType === "string") {
      if (!paramObject.param || paramObject.param == "")
        return res
          .status(400)
          .json({ error: `No ${paramObject.name} provided.` });

      if (typeof paramObject.param !== "string")
        return res
          .status(400)
          .json({ error: `Invalid ${paramObject.name} provided.` });
    } else if (paramObject.expectedType === "numeric[]") {
      if (!paramObject.param || paramObject.param == "")
        return res
          .status(400)
          .json({ error: `No ${paramObject.name} provided.` });

      if (!Array.isArray(paramObject.param))
        return res
          .status(400)
          .json({ error: `Invalid ${paramObject.name} provided.` });

      if (paramObject.param.some((value) => isNaN(Number(value))))
        return res
          .status(400)
          .json({ error: `Invalid ${paramObject.name} provided.` });
    } else success = true;

    return success;
  });
};
