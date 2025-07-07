// helpers.js
// Utility functions used throughout the app

/**
 * Format a date string (YYYY-MM-DD) to a consistent display format.
 * Returns '-' if invalid or empty.
 */
export function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d)) return "-";
  return d.toISOString().slice(0, 10);
}

/**
 * Normalize a date string to YYYY-MM-DD or null if invalid.
 */
export function normalizeDateStr(dateStr) {
  if (!dateStr) return null;
  return dateStr.trim().slice(0, 10);
}

/**
 * Check if a date string is overdue compared to today.
 * Returns true if date < today.
 */
export function isOverdue(dateStr) {
  const normalized = normalizeDateStr(dateStr);
  if (!normalized) return false;

  const dueDate = new Date(normalized);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return dueDate < now;
}

/**
 * Returns a pastel color hex code based on a string seed.
 */
export function getRandomPastelColor(seed) {
  const pastelColors = [
    "#d1fae5",
    "#fecaca",
    "#e0f2fe",
    "#fef9c3",
    "#ede9fe",
    "#fcd5ce",
    "#e7e5e4",
  ];
  const hash = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return pastelColors[hash % pastelColors.length];
}

/**
 * Groups tasks from the global state by their due dates into categories:
 * today, scheduled, overdue, and all.
 * @param {object} state - categories and items
 * @param {object} dueDates - due dates per item
 * @param {object} checkedItems - checked status per item
 * @returns {object} groups with arrays of tasks
 */
export function groupTasksByDueDate(state, dueDates, checkedItems) {
  const groups = { today: [], scheduled: [], overdue: [], all: [] };
  const todayDate = new Date().toISOString().slice(0, 10);

  for (const cat in state) {
    for (const item of state[cat]) {
      const rawDue = dueDates[item] || null;
      const due = normalizeDateStr(rawDue);

      const task = { item, cat, due, checked: !!checkedItems[item] };
      groups.all.push(task);

      if (due) {
        if (isOverdue(due)) groups.overdue.push(task);
        else if (due === todayDate) groups.today.push(task);
        else if (due > todayDate) groups.scheduled.push(task);
      }
    }
  }
  return groups;
}
