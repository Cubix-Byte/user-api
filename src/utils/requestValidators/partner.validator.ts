import { z } from "zod";

// Partner validation schemas for request validation

export const createPartnerSchema = z.object({
  body: z.object({
    partnersField: z.string().min(1, "Partners field is required").trim(),
    partnerLogo: z.string().trim().optional(),
    companyName: z.string().min(1, "Company name is required").trim(),
    supportEmail: z
      .string()
      .min(1, "Support email is required")
      .email("Please enter a valid email address")
      .trim()
      .toLowerCase(),
    colourTheme: z
      .array(
        z.object({
          key: z.string().min(1, "Color theme key is required").trim(),
          value: z.string().min(1, "Color theme value is required").trim(),
        })
      )
      .optional()
      .default([]),
    sidebarGradient: z.string().trim().optional(),
  }),
});

export const updatePartnerSchema = z.object({
  body: z.object({
    partnersField: z.string().trim().optional(),
    partnerLogo: z.string().trim().optional(),
    companyName: z.string().trim().optional(),
    supportEmail: z
      .string()
      .email("Please enter a valid email address")
      .trim()
      .toLowerCase()
      .optional(),
    colourTheme: z
      .array(
        z.object({
          key: z.string().min(1, "Color theme key is required").trim(),
          value: z.string().min(1, "Color theme value is required").trim(),
        })
      )
      .optional(),
    sidebarGradient: z.string().trim().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getPartnerSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, "Partner ID is required")
      .regex(
        /^[0-9a-fA-F]{24}$/,
        "Partner ID must be a valid MongoDB ObjectId"
      ),
  }),
});

export const deletePartnerSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, "Partner ID is required")
      .regex(
        /^[0-9a-fA-F]{24}$/,
        "Partner ID must be a valid MongoDB ObjectId"
      ),
  }),
});

export const setDefaultPartnerSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, "Partner ID is required")
      .regex(
        /^[0-9a-fA-F]{24}$/,
        "Partner ID must be a valid MongoDB ObjectId"
      ),
  }),
});
