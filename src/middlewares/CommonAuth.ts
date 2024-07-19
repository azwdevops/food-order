import { AuthPayload } from "@/dto";
import { ValidateSignature } from "@/utils";
import { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const Authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const validate = await ValidateSignature(req);
  if (validate) {
    next();
  } else {
    return res.json({ message: "User not authorized" });
  }
};
