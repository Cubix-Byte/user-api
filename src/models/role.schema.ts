import mongoose, { Document, Schema } from 'mongoose';
import { IBaseDocument, BaseDocumentSchema } from '../utils/shared-lib-imports';

export interface IRole extends IBaseDocument {
  name: string;
  displayName: string;
  permissions: mongoose.Types.ObjectId[];
  level: number;
  tenantId?: mongoose.Types.ObjectId;
}



const RoleSchema: Schema = new Schema(
  {
    ...BaseDocumentSchema.obj,
    name: {
      type: String,
      required: [true, 'Role name is required'],
      uppercase: true,
      trim: true,
      maxlength: [50, 'Role name cannot exceed 50 characters']
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      maxlength: [100, 'Display name cannot exceed 100 characters']
    },
    permissions: [{
      type: Schema.Types.ObjectId,
      ref: 'Permission'
    }],
    level: {
      type: Number,
      required: [true, 'Role level is required'],
      min: [1, 'Role level must be at least 1'],
      max: [5, 'Role level cannot exceed 5']
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: false,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        const { _id, __v, ...rest } = ret;
        return { id: (_id as any).toString(), ...rest };
      }
    },
    toObject: {
      transform: function(doc, ret) {
        const { _id, __v, ...rest } = ret;
        return { id: (_id as any).toString(), ...rest };
      }
    }
  }
);

// Indexes for better performance
// Compound index for role name uniqueness per tenant
RoleSchema.index({ name: 1, tenantId: 1 }, { unique: true, sparse: true });
// SUPERADMIN role is globally unique (no tenantId)
RoleSchema.index({ name: 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { name: 'SUPERADMIN', tenantId: { $exists: false } }
});
RoleSchema.index({ tenantId: 1 });
RoleSchema.index({ level: 1 });
RoleSchema.index({ isActive: 1 });
RoleSchema.index({ isDeleted: 1 });

export default mongoose.model<IRole>('Role', RoleSchema);

