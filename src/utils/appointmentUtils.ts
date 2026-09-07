import { parseLocalDateString, getTodayLocalMidnight } from "@/utils/dateUtils";

export interface AppointmentLike {
  status: string;
  appointment_date: string;
  appointment_time?: string | null;
}

/**
 * Combines an appointment date string (YYYY-MM-DD) and optional time string
 * (e.g. "10:00", "10:00:00", "10:00 AM", "02:30 PM") into a local Date object.
 * Reuses parseLocalDateString to ensure consistent timezone handling without UTC shifts.
 */
export const getAppointmentDateTime = (
  dateStr: string,
  timeStr?: string | null
): Date => {
  const date = parseLocalDateString(dateStr);
  if (!timeStr) {
    return date;
  }

  const trimmed = timeStr.trim();
  const isPM = /pm$/i.test(trimmed);
  const isAM = /am$/i.test(trimmed);
  const cleaned = trimmed.replace(/\s*(am|pm)$/i, "");
  const [hStr, mStr, sStr] = cleaned.split(":");
  let hours = parseInt(hStr, 10) || 0;
  const minutes = parseInt(mStr, 10) || 0;
  const seconds = parseInt(sStr, 10) || 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  date.setHours(hours, minutes, seconds, 0);
  return date;
};

/**
 * Returns true if the appointment's scheduled date and time has passed.
 * If no appointment_time is provided, checks whether the date is strictly before today's local midnight.
 */
export const isAppointmentPast = (
  dateStr: string,
  timeStr?: string | null
): boolean => {
  if (!dateStr) return false;
  if (!timeStr) {
    const aptDate = parseLocalDateString(dateStr);
    return aptDate < getTodayLocalMidnight();
  }
  const aptDateTime = getAppointmentDateTime(dateStr, timeStr);
  return aptDateTime.getTime() < Date.now();
};

/**
 * Computes the effective UI status for an appointment.
 * Rules:
 * - "completed" -> "completed"
 * - "cancelled" -> "cancelled"
 * - if appointment date/time is past AND status is "confirmed" or "scheduled" -> "missed"
 * - otherwise return original status
 */
export const getEffectiveAppointmentStatus = (
  appointment?: AppointmentLike | null
): string => {
  if (!appointment || !appointment.status) return "";

  const status = appointment.status.toLowerCase();
  if (status === "completed" || status === "cancelled") {
    return status;
  }

  if (
    (status === "confirmed" || status === "scheduled") &&
    isAppointmentPast(appointment.appointment_date, appointment.appointment_time)
  ) {
    return "missed";
  }

  return appointment.status;
};
