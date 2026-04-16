// Tenant type definitions for request/response interfaces

// Permission interface for tenant permissions
export interface TenantPermission {
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

// Seats and License interface
export interface SeatsNLicense {
  startDate: Date;
  endDate: Date;
  teacherSeats: number;
  studentSeats: number;
  parentSeats: number;
  AiPracticeExamePerYear: number;
}

// Create tenant request interface
export interface CreateTenantRequest {
  schoolName: string;
  schoolAddress: string;
  city: string;
  state: string;
  countryCode: string;
  zipCode: string;
  schoolPhone: string;
  adminEmail: string;
  profilePicture?: string;
  topIcon?: string;
  schoolWebsite?: string;
  profileStatus?: "active" | "inactive";
  isTrial?: boolean;
  trialEndDate?: Date;
  demoPassword: string;
  colorTheme?: Array<{
    key: string;
    value: string;
  }>;
  typography?: string;
  colors?: Record<string, string>;
  permissions?: TenantPermission[];
  landingWelcome?: string;
  landingDescription?: string;
  studentportalDescription?: string;
  teacherPortalDescription?: string;
  parentPortalDescription?: string;
}

// Update tenant request interface
export interface UpdateTenantRequest {
  schoolName?: string;
  schoolAddress?: string;
  city?: string;
  state?: string;
  countryCode?: string;
  zipCode?: string;
  schoolPhone?: string;
  adminEmail?: string;
  profilePicture?: string;
  topIcon?: string;
  schoolWebsite?: string;
  profileStatus?: "active" | "inactive";
  isTrial?: boolean;
  trialEndDate?: Date;
  demoPassword?: string;
  colorTheme?: Array<{
    key: string;
    value: string;
  }>;
  typography?: string;
  colors?: Record<string, string>;
  permissions?: TenantPermission[];
  landingWelcome?: string;
  landingDescription?: string;
  studentportalDescription?: string;
  teacherPortalDescription?: string;
  parentPortalDescription?: string;
}

// Tenant response interface
export interface TenantResponse {
  id: string;
  schoolName: string;
  schoolAddress: string;
  city: string;
  state: string;
  countryCode: string;
  zipCode: string;
  schoolPhone: string;
  adminEmail: string;
  profilePicture?: string;
  topIcon?: string;
  schoolWebsite?: string;
  profileStatus: "active" | "inactive";
  isTrial?: boolean;
  trialEndDate?: Date;
  demoPassword: string;
  colorTheme: Array<{
    key: string;
    value: string;
  }>;
  typography?: string;
  colors?: Record<string, string>;
  permissions?: TenantPermission[];
  landingWelcome?: string;
  landingDescription?: string;
  studentportalDescription?: string;
  teacherPortalDescription?: string;
  parentPortalDescription?: string;
  partnerId?: string;
  seatsNlicense?: SeatsNLicense;
  createdAt: Date;
  updatedAt: Date;
}
