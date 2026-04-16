/**
 * Permission type to name mapping
 * This is a FIXED mapping that NEVER changes, even if displayName is modified
 * The name is always based on the type number, not the displayName
 *
 * IMPORTANT: This order and mapping must NEVER change:
 * - Type 1 → "Admin"
 * - Type 2 → "Teacher"
 * - Type 3 → "Student"
 * - Type 4 → "Parent"
 * - Type 5 → "Staff"
 */
export const PERMISSION_TYPE_TO_NAME: Record<number, string> = {
  1: "Admin",
  2: "Teacher",
  3: "Student",
  4: "Parent"
} as const;

/**
 * Default permission types for tenant permissions
 * These are the standard 5 module types that should always be present
 *
 * IMPORTANT: The order must ALWAYS be: type 1, 2, 3, 4, 5 (in that exact order)
 * The name field is FIXED and based on type, never changes even if displayName is updated
 */
export const DEFAULT_PERMISSION_TYPES = [
  {
    type: 1,
    name: "Admin",
    displayName: "Admin Module",
  },
  {
    type: 2,
    name: "Teacher",
    displayName: "Teacher Module",
  },
  {
    type: 3,
    name: "Student",
    displayName: "Student Module",
  },
  {
    type: 4,
    name: "Parent",
    displayName: "Parent Module",
  }
] as const;

/**
 * Get default permission object for a given type
 */
export const getDefaultPermission = (type: number) => {
  const defaultType = DEFAULT_PERMISSION_TYPES.find((pt) => pt.type === type);
  const displayName = defaultType?.displayName || `Module ${type}`;
  return {
    type,
    name: PERMISSION_TYPE_TO_NAME[type] || `module-${type}`, // Always use fixed type mapping
    displayName: displayName,
    canView: false,
    canEdit: false,
    canDelete: false,
    canCreate: false,
    isAssigned: true,
    status: "In Active" as const,
  };
};

/**
 * Merge saved permissions with defaults to ensure all 5 types are present
 */
export const mergePermissionsWithDefaults = (savedPermissions: any[] = []) => {
  const permissionsMap = new Map();

  // Add all saved permissions to map
  savedPermissions.forEach((perm) => {
    permissionsMap.set(perm.type, perm);
  });

  // Ensure all 5 default types are present
  const mergedPermissions = DEFAULT_PERMISSION_TYPES.map((defaultType) => {
    const saved = permissionsMap.get(defaultType.type);
    if (saved) {
      // Ensure isAssigned exists (for backward compatibility)
      // IMPORTANT: name is ALWAYS based on type number, never changes even if displayName is updated
      return {
        ...saved,
        name:
          PERMISSION_TYPE_TO_NAME[defaultType.type] ||
          `module-${defaultType.type}`, // Fixed based on type
        isAssigned: saved.isAssigned !== undefined ? saved.isAssigned : true,
      };
    }
    // Return default permission if not saved
    return getDefaultPermission(defaultType.type);
  });

  return mergedPermissions;
};
