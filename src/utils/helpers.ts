import { Response } from "express";
import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  scryptSync,
} from "crypto";

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

export const isNotExpired = (date: Date, timeframeInMillis: number) => {
  if (date == null) {
    return false;
  }
  const lastUpdatedDate = new Date(date);
  const diff = Math.abs(new Date().getTime() - lastUpdatedDate.getTime());

  if (diff < timeframeInMillis) {
    return true;
  }

  return false;
};

const algorithm = "aes-256-gcm";

export const encrypt = async (text: string, secret: string) => {
  const iv = randomBytes(16);
  const salt = randomBytes(16);
  const key = scryptSync(secret, salt, 32);

  const cipher = createCipheriv(algorithm, key, iv);
  const encryptedBuffer = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const encrypted = encryptedBuffer.toString("hex");

  const tag = cipher.getAuthTag();
  return `${salt.toString("hex")}.${iv.toString(
    "hex"
  )}.${encrypted}.${tag.toString("hex")}`;
};

export const decrypt = async (encryptedText: string, secret: string) => {
  const [salt, iv, encryptedHex, tag] = encryptedText
    .split(".")
    .map((part) => Buffer.from(part, "hex"));
  const key = scryptSync(secret, salt, 32);

  const decipher = createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(tag);

  const decryptedBuffer = Buffer.concat([
    decipher.update(encryptedHex),
    decipher.final(),
  ]);
  const decrypted = decryptedBuffer.toString("utf8");

  return decrypted;
};
