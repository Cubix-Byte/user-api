import axios from "axios";

/**
 * Student Data Service
 * Handles communication with academic-api for fetching student-related data
 */

// Academic API configuration
// ACADEMIC_API_URL should be the base root URL (e.g., http://localhost:3002 or https://api.domain.com)
const ACADEMIC_BASE_URL = process.env.ACADEMIC_BASE_URL;
// const BASE_URL = "http://localhost:3003";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

// Axios instance for academic-api communication
// Matches pattern from notification.service.ts
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
 * Copied pattern from notification.service.ts
 */
const extractErrorMessage = (
  error: any,
  operation: string,
  url?: string
): string => {
  let errorMessage = "Unknown error";

  if (error.response) {
    // The request was made and the server responded with a status code range of 2xx
    const status = error.response.status;
    const statusText = error.response.statusText;
    const data = error.response.data;

    errorMessage = `HTTP ${status} ${statusText}`;
    if (data?.message) {
      errorMessage += `: ${data.message}`;
    } else if (data?.error) {
      errorMessage += `: ${data.error}`;
    } else if (typeof data === "string") {
      errorMessage += `: ${data}`;
    } else if (data) {
      errorMessage += `: ${JSON.stringify(data)}`;
    }
  } else if (error.request) {
    // The request was made but no response was received
    const fullUrl = url || `${ACADEMIC_BASE_URL}/academy/internal`;
    errorMessage = `No response received from academic-api. URL: ${fullUrl}`;
    if (error.code === "ECONNREFUSED") {
      errorMessage = `Connection refused. Academic API might be down at ${ACADEMIC_BASE_URL}`;
    } else if (error.code === "ETIMEDOUT") {
      errorMessage = `Request timeout connecting to academic-api at ${ACADEMIC_BASE_URL}`;
    } else if (error.code) {
      errorMessage = `Network error (${error.code}): ${error.message}`;
    }
  } else {
    // Something happened in setting up the request that triggered an Error
    errorMessage = error.message || "Unknown error";
  }

  console.error(`Detailed error for ${operation}:`, {
    message: errorMessage,
    operation,
    url: url || `${ACADEMIC_BASE_URL}/academy/internal`,
    hasApiKey: !!INTERNAL_API_KEY,
    errorCode: error.code,
    status: error.response?.status,
    responseData: error.response?.data,
  });

  return errorMessage;
};

/**
 * Get student classes from Academic API
 */
export const getStudentClasses = async (userId: string, tenantId: string) => {
  try {
    console.log(
      `[getStudentClasses] 🔄 Fetching student classes from Academic API for user: ${userId}`
    );

    // Call academic-api internal endpoint
    // x-api-key is already in academicApiClient defaults
    // x-tenant-id must be passed specifically for this request
    const response = await academicApiClient.get(`/student/${userId}/classes`, {
      headers: {
        "x-tenant-id": tenantId.toString().trim(),
      },
    });

    if (
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data)
    ) {
      const classes = response.data.data;
      if (classes.length > 0) {
        const firstClass = classes[0];

        return {
          id: firstClass.id,
          name: firstClass.name,
          grade: firstClass.grade,
          section: firstClass.section,
          batchName: firstClass.batchName,
        };
      }
    }

    return null;
  } catch (error: any) {
    // Log detailed error but don't throw to avoid breaking user profile flow
    extractErrorMessage(
      error,
      "getStudentClasses",
      `/student/${userId}/classes`
    );
    return null;
  }
};
