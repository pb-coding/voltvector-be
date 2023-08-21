const errorMessages: Record<number, string> = {
  500: "The selected timezone is not supported",
  1001: "Wrong or missing password",
  1002: "Account does not exist",
  1003: "This account has been disabled or deleted",
  1004: "Wrong email or password",
  1005: "Invalid email address",
  1006: "Bad password format",
  1008: "This email is not registered",
  1019: "Token expired",
  1200: "Token has expired",
  1255: "The number of remote control boards exceeded the limit",
  1301: "Too many tokens have been issued",
  5000: "Unknown or generic error",
  5001: "Unknown or generic error",
  5002: "Unknown or generic error",
  5003: "Unknown or generic error",
  5004: "Unknown or generic error",
  5020: "Infrared Remote device is busy",
  5021: "Infrared record timeout",
  5022: "Infrared record invalid",
};

export const getErrorMessage = (code: number) => {
  return errorMessages[code] || "Unknown error";
};
