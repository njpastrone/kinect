/**
 * Helper functions for reminder testing
 */

/**
 * Calculate reminder threshold based on contact and list settings
 */
function getReminderThreshold(contact, list = null) {
  // Check custom reminder days (must be positive)
  if (contact.customReminderDays && contact.customReminderDays > 0) {
    return contact.customReminderDays;
  }

  // Check list reminder days (must be positive)
  if (contact.listId && list && list.reminderDays && list.reminderDays > 0) {
    return list.reminderDays;
  }

  return 90; // Default
}

/**
 * Calculate days overdue for a contact
 */
function calculateDaysOverdue(contact, currentDate = new Date(), list = null) {
  const lastContact = contact.lastContactDate || contact.createdAt;
  if (!lastContact) {
    return 0;
  }

  const lastContactDate = new Date(lastContact);
  if (isNaN(lastContactDate.getTime())) {
    return 0; // Invalid date
  }

  const daysSinceContact = Math.floor(
    (currentDate.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const reminderThreshold = getReminderThreshold(contact, list);
  const daysOverdue = daysSinceContact - reminderThreshold;
  
  return Math.max(0, daysOverdue);
}

/**
 * Check if current time is within quiet hours
 */
function isWithinQuietHours(date, quietHours) {
  const hour = date.getHours();
  
  if (quietHours.start === quietHours.end) {
    return false; // No quiet hours
  }
  
  if (quietHours.start < quietHours.end) {
    // Same day (e.g., 9 to 17)
    return hour >= quietHours.start && hour < quietHours.end;
  } else {
    // Spans midnight (e.g., 22 to 8)
    return hour >= quietHours.start || hour < quietHours.end;
  }
}

/**
 * Convert date to user timezone (simplified for testing)
 */
function convertToUserTimezone(utcDate, timezone) {
  // Simplified timezone conversion for testing
  // In production, use libraries like date-fns-tz or moment-timezone
  const utcTime = utcDate.getTime();
  const timezoneOffset = getTimezoneOffset(timezone);
  // UTC offset is negative for western timezones
  return new Date(utcTime + (timezoneOffset * 60 * 60 * 1000));
}

function getTimezoneOffset(timezone) {
  // Simplified mapping for common timezones
  const offsets = {
    'America/New_York': -5, // EST (simplified)
    'America/Los_Angeles': -8, // PST (simplified)
    'Europe/London': 0, // GMT
    'UTC': 0
  };
  return offsets[timezone] || 0;
}

/**
 * Calculate next reminder date
 */
function calculateNextReminderDate(contact) {
  const lastContact = contact.lastContactDate || contact.createdAt || new Date();
  const reminderDays = getReminderThreshold(contact);
  
  const nextReminder = new Date(lastContact);
  // Use setTime to avoid month rollover issues
  nextReminder.setTime(nextReminder.getTime() + (reminderDays * 24 * 60 * 60 * 1000));
  
  return nextReminder;
}

/**
 * Sort contacts by most overdue first
 */
function sortContactsByOverdue(contacts) {
  return [...contacts].sort((a, b) => b.daysOverdue - a.daysOverdue);
}

/**
 * Batch contacts for email with limit
 */
function batchContactsForEmail(contacts, preferences) {
  const sorted = sortContactsByOverdue(contacts);
  return sorted.slice(0, preferences.maxContactsPerEmail);
}

/**
 * Process users with delay between operations
 */
async function processUsersWithDelay(users, processor, delayMs = 1000) {
  const results = [];
  
  for (let i = 0; i < users.length; i++) {
    const result = await processor(users[i]);
    results.push(result);
    
    // Add delay between users (except for the last one)
    if (i < users.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

module.exports = {
  getReminderThreshold,
  calculateDaysOverdue,
  isWithinQuietHours,
  convertToUserTimezone,
  calculateNextReminderDate,
  sortContactsByOverdue,
  batchContactsForEmail,
  processUsersWithDelay
};