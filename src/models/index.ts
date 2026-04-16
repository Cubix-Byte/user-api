// Import all models to ensure they are registered with Mongoose
import "./user.schema";
import "./role.schema";
import "./permission.schema";
import "./tenant.schema";
import "./verification-code.schema";

// Re-export all models for convenience
export { default as User } from "./user.schema";
export { default as Role } from "./role.schema";
export { default as Permission } from "./permission.schema";
export { default as Tenant } from "./tenant.schema";
export { default as VerificationCode } from "./verification-code.schema";
export { VerificationCodeType, VerificationCodeStatus } from "./verification-code.schema";
export { IBaseDocument, BaseDocumentSchema } from "../utils/shared-lib-imports";

