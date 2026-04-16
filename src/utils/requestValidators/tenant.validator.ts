import { z } from "zod";
import { PROFILE_STATUS_ARRAY } from "../shared-lib-imports";

// Tenant validation schemas for request validation
// Each schema validates specific request types with proper error messages

// Schema for creating a new tenant (school) record
export const createTenantSchema = z.object({
  body: z.object({
    schoolName: z
      .string()
      .min(1, "School name is required")
      .max(200, "School name cannot exceed 200 characters")
      .trim(),
    schoolAddress: z
      .string()
      .min(1, "School address is required")
      .max(500, "School address cannot exceed 500 characters")
      .trim(),
    city: z
      .string()
      .min(1, "City is required")
      .max(100, "City cannot exceed 100 characters")
      .trim(),
    state: z
      .string()
      .min(1, "State is required")
      .max(100, "State cannot exceed 100 characters")
      .trim(),
    countryCode: z
      .string()
      .min(1, "Country code is required")
      .max(10, "Country code cannot exceed 10 characters")
      .trim()
      .toUpperCase(),
    zipCode: z
      .string()
      .min(1, "Zip code is required")
      .max(20, "Zip code cannot exceed 20 characters")
      .trim(),
    schoolPhone: z
      .string()
      .min(1, "School phone is required")
      .regex(/^[\+]?[0-9\-\s]{10,20}$/, "Please enter a valid phone number")
      .trim(),
    adminEmail: z
      .string()
      .min(1, "Admin email is required")
      .email("Please enter a valid email address")
      .trim()
      .toLowerCase(),
    type: z
      .enum(["Academic", "Corporate"], {
        errorMap: () => ({
          message: "Type must be either Academic or Corporate",
        }),
      })
      .optional(),
    profilePicture: z.string().trim().optional(),
    topIcon: z.string().trim().optional(),
    timeZone: z.string().trim().optional(),
    schoolWebsite: z
      .string()
      .regex(/^https?:\/\/.+/, "Please enter a valid URL")
      .trim()
      .optional(),
    profileStatus: z
      .enum(PROFILE_STATUS_ARRAY as unknown as [string, ...string[]], {
        errorMap: () => ({
          message: "Profile status must be either active or inactive",
        }),
      })
      .default("active"),
    isTrial: z.boolean().optional(),
    trialEndDate: z.string().datetime().or(z.date()).optional(),
    demoPassword: z.string().min(1, "Demo password is required").trim(),
    colorTheme: z
      .array(
        z.object({
          key: z.string().min(1, "Color theme key is required").trim(),
          value: z.string().min(1, "Color theme value is required").trim(),
        })
      )
      .optional()
      .default([]),
    typography: z.string().trim().optional(),
    colors: z
      .record(
        z.string(),
        z
          .string()
          .regex(
            /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
            "Invalid hex color format. Use #RRGGBB or #RGB format"
          )
      )
      .optional(),
    permissions: z
      .array(
        z.object({
          type: z.number().int("Type must be an integer"),
          name: z.string().trim().optional(), // Optional - will be computed from type in responses
          displayName: z.string().min(1, "Display name is required").trim(),
          canView: z.boolean(),
          canEdit: z.boolean(),
          canDelete: z.boolean(),
          canCreate: z.boolean(),
          isAssigned: z.boolean().default(true),
          status: z
            .enum(["Active", "In Active"])
            .optional()
            .default("In Active"),
        })
      )
      .optional(),
    landingWelcome: z.string().trim().optional(),
    landingDescription: z.string().trim().optional(),
    studentportalDescription: z.string().trim().optional(),
    teacherPortalDescription: z.string().trim().optional(),
    parentPortalDescription: z.string().trim().optional(),
    partnerId: z.string().trim().optional(),
    seatsNlicense: z
      .object({
        startDate: z.string().datetime().or(z.date()),
        endDate: z.string().datetime().or(z.date()),
        teacherSeats: z.number().int().nonnegative().default(0),
        studentSeats: z.number().int().nonnegative().default(0),
        parentSeats: z.number().int().nonnegative().default(0),
        AiPracticeExamePerYear: z.number().int().nonnegative().default(0),
      })
      .optional(),
  }),
});

// Schema for updating existing tenant record (all fields optional)
export const updateTenantSchema = z.object({
  body: z.object({
    schoolName: z
      .string()
      .min(1, "School name is required")
      .max(200, "School name cannot exceed 200 characters")
      .trim()
      .optional(),
    schoolAddress: z
      .string()
      .min(1, "School address is required")
      .max(500, "School address cannot exceed 500 characters")
      .trim()
      .optional(),
    city: z
      .string()
      .min(1, "City is required")
      .max(100, "City cannot exceed 100 characters")
      .trim()
      .optional(),
    state: z
      .string()
      .min(1, "State is required")
      .max(100, "State cannot exceed 100 characters")
      .trim()
      .optional(),
    countryCode: z
      .string()
      .min(1, "Country code is required")
      .max(10, "Country code cannot exceed 10 characters")
      .trim()
      .toUpperCase()
      .optional(),
    zipCode: z
      .string()
      .min(1, "Zip code is required")
      .max(20, "Zip code cannot exceed 20 characters")
      .trim()
      .optional(),
    schoolPhone: z
      .string()
      .min(1, "School phone is required")
      .regex(/^[\+]?[0-9\-\s]{10,20}$/, "Please enter a valid phone number")
      .trim()
      .optional(),
    type: z
      .enum(["Academic", "Corporate"], {
        errorMap: () => ({
          message: "Type must be either Academic or Corporate",
        }),
      })
      .optional(),
    profilePicture: z.string().trim().optional(),
    topIcon: z.string().trim().optional(),
    timeZone: z.string().trim().optional(),
    schoolWebsite: z
      .string()
      .regex(/^https?:\/\/.+/, "Please enter a valid URL")
      .trim()
      .optional(),
    profileStatus: z
      .enum(PROFILE_STATUS_ARRAY as unknown as [string, ...string[]], {
        errorMap: () => ({
          message: "Profile status must be either active or inactive",
        }),
      })
      .optional(),
    isTrial: z.boolean().optional(),
    trialEndDate: z.string().datetime().or(z.date()).optional(),
    demoPassword: z
      .string()
      .min(1, "Demo password is required")
      .trim()
      .optional(),
    colorTheme: z
      .array(
        z.object({
          key: z.string().min(1, "Color theme key is required").trim(),
          value: z.string().min(1, "Color theme value is required").trim(),
        })
      )
      .optional(),
    typography: z.string().trim().optional(),
    colors: z
      .record(
        z.string(),
        z
          .string()
          .regex(
            /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
            "Invalid hex color format. Use #RRGGBB or #RGB format"
          )
      )
      .optional(),
    permissions: z
      .array(
        z.object({
          type: z.number().int("Type must be an integer"),
          name: z.string().trim().optional(), // Optional - will be computed from type in responses
          displayName: z.string().min(1, "Display name is required").trim(),
          canView: z.boolean(),
          canEdit: z.boolean(),
          canDelete: z.boolean(),
          canCreate: z.boolean(),
          isAssigned: z.boolean().default(true),
          status: z
            .enum(["Active", "In Active"])
            .optional()
            .default("In Active"),
        })
      )
      .optional(),
    isActive: z.boolean().optional(),
    landingWelcome: z.string().trim().optional(),
    landingDescription: z.string().trim().optional(),
    studentportalDescription: z.string().trim().optional(),
    teacherPortalDescription: z.string().trim().optional(),
    parentPortalDescription: z.string().trim().optional(),
    partnerId: z.string().trim().optional(),
    seatsNlicense: z
      .object({
        startDate: z.string().datetime().or(z.date()).optional(),
        endDate: z.string().datetime().or(z.date()).optional(),
        teacherSeats: z.number().int().nonnegative().optional(),
        studentSeats: z.number().int().nonnegative().optional(),
        parentSeats: z.number().int().nonnegative().optional(),
        AiPracticeExamePerYear: z.number().int().nonnegative().optional(),
      })
      .optional(),
  }),
});

// Schema for validating tenant ID parameter in GET requests
export const getTenantSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, "Tenant ID is required")
      .regex(/^[0-9a-fA-F]{24}$/, "Tenant ID must be a valid MongoDB ObjectId"),
  }),
});

// Schema for validating tenant ID parameter in DELETE requests
export const deleteTenantSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, "Tenant ID is required")
      .regex(/^[0-9a-fA-F]{24}$/, "Tenant ID must be a valid MongoDB ObjectId"),
  }),
});
