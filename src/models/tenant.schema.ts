import mongoose, { Document, Schema } from "mongoose";
import { IBaseDocument, BaseDocumentSchema } from "../utils/shared-lib-imports";
import { PROFILE_STATUS_ARRAY } from "../utils/shared-lib-imports";

// Permission interface for tenant permissions
export interface ITenantPermission {
  type: number;
  name: string; // Fixed identifier (parents, teachers, students, school, staff) - never changes
  displayName: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
  isAssigned: boolean;
  status?: "Active" | "In Active";
}

// Tenant model interface - represents school/tenant information
export interface ITenant extends IBaseDocument {
  schoolName: string;
  tenantName: string;
  schoolAddress: string;
  city: string;
  state: string;
  countryCode: string;
  timeZone?: string;
  zipCode: string;
  schoolPhone: string;
  adminEmail: string;
  profilePicture?: string;
  topIcon?: string;
  schoolWebsite?: string;
  type?: "Academic" | "Corporate";
  profileStatus: "active" | "inactive";
  isTrial?: boolean;
  trialEndDate?: Date;
  demoPassword: string;
  colorTheme: { key: string; value: string }[];
  typography?: string;
  colors?: Record<string, string>;
  permissions?: ITenantPermission[];
  landingWelcome?: string;
  landingDescription?: string;
  studentportalDescription?: string;
  teacherPortalDescription?: string;
  parentPortalDescription?: string;
  partnerId?: string;
  seatsNlicense?: {
    startDate: Date;
    endDate: Date;
    teacherSeats: number;
    studentSeats: number;
    parentSeats: number;
    AiPracticeExamePerYear: number;
  };
}

const TenantSchema: Schema = new Schema(
  {
    ...BaseDocumentSchema.obj,
    schoolName: {
      type: String,
      required: [true, "School name is required"],
      trim: true,
      unique: true,
      maxlength: [200, "School name cannot exceed 200 characters"],
    },
    tenantName: {
      type: String,
      required: [true, "Tenant name is required"],
      trim: true,
      unique: true,
      maxlength: [30, "Tenant name cannot exceed 30 characters"],
      minlength: [3, "Tenant name must be at least 3 characters long"],
    },
    schoolAddress: {
      type: String,
      required: [true, "School address is required"],
      trim: true,
      maxlength: [500, "School address cannot exceed 500 characters"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxlength: [100, "City cannot exceed 100 characters"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      maxlength: [100, "State cannot exceed 100 characters"],
    },
    countryCode: {
      type: String,
      required: [true, "Country code is required"],
      trim: true,
      uppercase: true,
      maxlength: [10, "Country code cannot exceed 10 characters"],
    },
    timeZone: {
      type: String,
      trim: true,
    },
    zipCode: {
      type: String,
      required: [true, "Zip code is required"],
      trim: true,
      maxlength: [20, "Zip code cannot exceed 20 characters"],
    },
    schoolPhone: {
      type: String,
      required: [true, "School phone is required"],
      trim: true,
      match: [/^[\+]?[0-9\-\s]{10,20}$/, "Please enter a valid phone number"],
    },
    adminEmail: {
      type: String,
      required: [true, "Admin email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },
    type: {
      type: String,
      enum: ["Academic", "Corporate"],
      trim: true,
    },
    profilePicture: {
      type: String,
      trim: true,
    },
    topIcon: {
      type: String,
      trim: true,
    },
    schoolWebsite: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, "Please enter a valid URL"],
    },
    profileStatus: {
      type: String,
      enum: PROFILE_STATUS_ARRAY,
      default: "active",
      required: true,
    },
    isTrial: {
      type: Boolean,
      default: false,
    },
    trialEndDate: {
      type: Date,
    },
    demoPassword: {
      type: String,
      required: [true, "Demo password is required"],
      trim: true,
      select: false,
    },
    colorTheme: [
      {
        key: {
          type: String,
          required: true,
          trim: true,
        },
        value: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    typography: {
      type: String,
      trim: true,
    },
    colors: {
      type: Schema.Types.Mixed,
      default: {},
    },
    permissions: [
      {
        type: {
          type: Number,
          required: true,
        },
        name: {
          type: String,
          required: false, // Will be computed from type, not stored in DB
          trim: true,
        },
        displayName: {
          type: String,
          required: true,
          trim: true,
        },
        canView: {
          type: Boolean,
          required: true,
          default: false,
        },
        canEdit: {
          type: Boolean,
          required: true,
          default: false,
        },
        canDelete: {
          type: Boolean,
          required: true,
          default: false,
        },
        canCreate: {
          type: Boolean,
          required: true,
          default: false,
        },
        isAssigned: {
          type: Boolean,
          required: true,
          default: true,
        },
        status: {
          type: String,
          enum: ["Active", "In Active"],
          default: "In Active",
        },
      },
    ],
    landingWelcome: {
      type: String,
      trim: true,
    },
    landingDescription: {
      type: String,
      trim: true,
    },
    studentportalDescription: {
      type: String,
      trim: true,
    },
    teacherPortalDescription: {
      type: String,
      trim: true,
    },
    parentPortalDescription: {
      type: String,
      trim: true,
    },
    partnerId: {
      type: String,
      trim: true,
    },
    seatsNlicense: {
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      teacherSeats: {
        type: Number,
        default: 0,
      },
      studentSeats: {
        type: Number,
        default: 0,
      },
      parentSeats: {
        type: Number,
        default: 0,
      },
      AiPracticeExamePerYear: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        const { _id, __v, demoPassword, ...rest } = ret;
        // Ensure optional fields are always included (null if undefined or empty)
        const result = {
          id: (_id as any).toString(),
          ...rest,
          profilePicture: ret.profilePicture ?? null,
          topIcon: ret.topIcon ?? null,
          timeZone: ret.timeZone ?? null,
          schoolWebsite: ret.schoolWebsite ?? null,
          isTrial: ret.isTrial ?? false,
          trialEndDate: ret.trialEndDate ?? null,
          landingWelcome: ret.landingWelcome ?? null,
          landingDescription: ret.landingDescription ?? null,
          studentportalDescription: ret.studentportalDescription ?? null,
          teacherPortalDescription: ret.teacherPortalDescription ?? null,
          parentPortalDescription: ret.parentPortalDescription ?? null,
        };
        return result;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        const { _id, __v, demoPassword, ...rest } = ret;
        // Ensure optional fields are always included (null if undefined or empty)
        const result = {
          id: (_id as any).toString(),
          ...rest,
          profilePicture: ret.profilePicture ?? null,
          topIcon: ret.topIcon ?? null,
          timeZone: ret.timeZone ?? null,
          schoolWebsite: ret.schoolWebsite ?? null,
          isTrial: ret.isTrial ?? false,
          trialEndDate: ret.trialEndDate ?? null,
          landingWelcome: ret.landingWelcome ?? null,
          landingDescription: ret.landingDescription ?? null,
          studentportalDescription: ret.studentportalDescription ?? null,
          teacherPortalDescription: ret.teacherPortalDescription ?? null,
          parentPortalDescription: ret.parentPortalDescription ?? null,
        };
        return result;
      },
    },
  }
);

// Indexes for better performance
TenantSchema.index({ schoolName: 1 });
TenantSchema.index({ city: 1 });
TenantSchema.index({ state: 1 });
TenantSchema.index({ profileStatus: 1 });
TenantSchema.index({ isActive: 1 });
TenantSchema.index({ isDeleted: 1 });
TenantSchema.index({ partnerId: 1 });

export default mongoose.model<ITenant>("Tenant", TenantSchema);
