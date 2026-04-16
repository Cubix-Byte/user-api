import axios from "axios";

/**
 * Academic Integration Service
 * Handles communication with academic-api for fetching tenant and other academic data
 */

// Academic API configuration
const ACADEMIC_BASE_URL = process.env.ACADEMIC_BASE_URL || "http://localhost:3003";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "your-internal-api-key-here";

console.log(`📡 [Academic Service] Initialized with URL: ${ACADEMIC_BASE_URL}`);

// Axios instance for academic-api communication
const academicApiClient = axios.create({
    baseURL: `${ACADEMIC_BASE_URL}/academy/internal`,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
        "x-api-key": INTERNAL_API_KEY,
    },
});

/**
 * Extract detailed error message from axios error
 */
const extractErrorMessage = (
    error: any,
    operation: string,
    url?: string
): string => {
    let errorMessage = "Unknown error";

    if (error.response) {
        const status = error.response.status;
        const statusText = error.response.statusText;
        const data = error.response.data;

        errorMessage = `HTTP ${status} ${statusText}`;
        if (data?.message) {
            errorMessage += `: ${data.message}`;
        } else if (data?.error) {
            errorMessage += `: ${data.error}`;
        }
    } else if (error.request) {
        errorMessage = `No response received from academic-api. URL: ${ACADEMIC_BASE_URL}/academy/internal${url}`;
    } else {
        errorMessage = error.message || "Unknown error";
    }

    console.error(`❌ [Academic Service] Detailed error for ${operation}:`, {
        message: errorMessage,
        operation,
        url: `${ACADEMIC_BASE_URL}/academy/internal${url}`,
        status: error.response?.status,
        responseData: error.response?.data,
        config: {
            method: error.config?.method,
            headers: {
                ...error.config?.headers,
                "x-api-key": INTERNAL_API_KEY ? "***configured***" : "missing"
            }
        }
    });

    return errorMessage;
};

/**
 * Get tenant data by name from Academic API
 */
export const getTenantByName = async (tenantName: string) => {
    try {
        const url = `/tenant/by-name/${tenantName}`;
        console.log(`🔄 [getTenantByName] Calling Academic API: ${ACADEMIC_BASE_URL}/academy/internal${url}`);

        const response = await academicApiClient.get(url);

        if (response.data && response.data.data) {
            console.log(`✅ [getTenantByName] Successfully fetched tenant data for: ${tenantName}`);
            return response.data.data;
        }

        console.warn(`⚠️ [getTenantByName] No data returned for tenant: ${tenantName}`);
        return null;
    } catch (error: any) {
        extractErrorMessage(error, "getTenantByName", `/tenant/by-name/${tenantName}`);
        return null;
    }
};

/**
 * Get tenant data by ID from Academic API
 */
export const getTenantById = async (tenantId: string) => {
    try {
        const url = `/tenant/${tenantId}`;
        console.log(`🔄 [getTenantById] Calling Academic API: ${ACADEMIC_BASE_URL}/academy/internal${url}`);

        const response = await academicApiClient.get(url);

        if (response.data && response.data.data) {
            console.log(`✅ [getTenantById] Successfully fetched tenant data for ID: ${tenantId}`);
            return response.data.data;
        }

        console.warn(`⚠️ [getTenantById] No data returned for tenant ID: ${tenantId}`);
        return null;
    } catch (error: any) {
        extractErrorMessage(error, "getTenantById", `/tenant/${tenantId}`);
        return null;
    }
};

/**
 * Get tenant context by admin ID from Academic API
 */
export const getTenantByAdminId = async (adminId: string) => {
    try {
        const url = `/admin/${adminId}/tenant-context`;
        console.log(`🔄 [getTenantByAdminId] Calling Academic API: ${ACADEMIC_BASE_URL}/academy/internal${url}`);

        const response = await academicApiClient.get(url);

        if (response.data && response.data.data) {
            console.log(`✅ [getTenantByAdminId] Successfully fetched tenant data for admin: ${adminId}`);
            console.log(`📄 [getTenantByAdminId] Data received:`, JSON.stringify(response.data.data).substring(0, 200) + "...");
            return response.data.data;
        }

        console.warn(`⚠️ [getTenantByAdminId] No data returned for admin: ${adminId}`);
        console.warn(`📄 [getTenantByAdminId] Full Response:`, JSON.stringify(response.data));
        return null;
    } catch (error: any) {
        extractErrorMessage(error, "getTenantByAdminId", `/admin/${adminId}/tenant-context`);
        return null;
    }
};
