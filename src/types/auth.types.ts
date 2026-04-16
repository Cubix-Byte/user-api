// Authentication type definitions for request/response interfaces

// Unified login request interface for both SuperAdmin and tenant users
export interface LoginRequest {
  email: string;
  password: string;
  tenantName?: string; // Optional - required for tenant users, not needed for SuperAdmin
}

// Legacy interface for backward compatibility (will be removed)
export interface SuperadminLoginRequest {
  username: string;
  password: string;
}

// User registration request interface
export interface RegisterRequest {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  roleName: string;
  tenantId?: string;
  tenantName?: string;
  userType: "superadmin" | "admin" | "teacher" | "student" | "parent";
  description?: string;
  isActive?: boolean;
}

// Refresh token request interface
export interface RefreshTokenRequest {
  refreshToken: string;
}

// Change password request interface
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Update profile request interface
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePicture?: string;
}

// Forgot password request interface
export interface ForgotPasswordRequest {
  email: string;
}

// Reset password request interface
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Login response interface
export interface LoginResponse {
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    userType: "superadmin" | "admin" | "teacher" | "student" | "parent";
    tenantId?: any;
    tenantName?: string;
    role: {
      id: string;
      name: string;
      displayName: string;
    };
    lastLogin: Date;
    class?: any;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

// Refresh token response interface
export interface RefreshTokenResponse {
  accessToken: string;
}
