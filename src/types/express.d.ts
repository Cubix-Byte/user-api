// Extend Express Request interface to include user property
import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        userType: "superadmin" | "admin" | "teacher" | "student" | "parent";
        tenantId?: string;
        tenantName?: string;
      };
    }
  }
}
