/**
 * Date Timezone Helper
 * Utility functions for formatting dates in specific timezones
 */

/**
 * Format a date in the specified timezone
 * @param date - The date to format
 * @param timezone - IANA timezone string (e.g., "America/Los_Angeles", "Asia/Karachi", "UTC")
 * @returns Formatted date string in the specified timezone
 */
export const formatDateInTimezone = (date: Date, timezone?: string): string => {
  // If no timezone provided or invalid, use UTC
  if (!timezone || timezone.trim().length === 0) {
    return date.toLocaleString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    });
  }

  try {
    // Validate timezone by attempting to format with it
    // If timezone is invalid, Intl will throw or use UTC
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    });

    return formatter.format(date);
  } catch (error) {
    // If timezone is invalid, fallback to UTC
    console.warn(`Invalid timezone "${timezone}", falling back to UTC`);
    return date.toLocaleString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    });
  }
};
