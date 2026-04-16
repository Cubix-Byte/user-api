import mongoose, { Document, Schema } from "mongoose";
import { IBaseDocument, BaseDocumentSchema } from "../utils/shared-lib-imports";
import { PERMISSION_RESOURCE_ARRAY, PERMISSION_ACTION_ARRAY } from '../utils/shared-lib-imports';

export interface IPermission extends IBaseDocument {
  name: string;
  displayName: string;
  resource: string;
  action: string;
  conditions?: any;
}

const PermissionSchema: Schema = new Schema(
  {
    ...BaseDocumentSchema.obj,
    name: {
      type: String,
      required: [true, "Permission name is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [100, "Permission name cannot exceed 100 characters"],
    },
    displayName: {
      type: String,
      required: [true, "Display name is required"],
      trim: true,
      maxlength: [200, "Display name cannot exceed 200 characters"],
    },
    resource: {
      type: String,
      required: [true, "Resource is required"],
      uppercase: true,
      trim: true,
      enum: PERMISSION_RESOURCE_ARRAY,
      maxlength: [50, "Resource cannot exceed 50 characters"],
    },
    action: {
      type: String,
      required: [true, "Action is required"],
      uppercase: true,
      trim: true,
      enum: PERMISSION_ACTION_ARRAY,
      maxlength: [50, "Action cannot exceed 50 characters"],
    },
    conditions: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        const { _id, __v, ...rest } = ret;
        return { id: (_id as any).toString(), ...rest };
      },
    },
    toObject: {
      transform: function (doc, ret) {
        const { _id, __v, ...rest } = ret;
        return { id: (_id as any).toString(), ...rest };
      },
    },
  }
);

// Indexes for better performance
PermissionSchema.index({ resource: 1, action: 1 });
PermissionSchema.index({ isActive: 1 });
PermissionSchema.index({ isDeleted: 1 });

export default mongoose.model<IPermission>("Permission", PermissionSchema);

