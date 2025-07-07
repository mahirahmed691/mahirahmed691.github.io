// darkmode.js

/**
 * Toggles dark mode on/off and saves preference.
 */
export function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", isDark ? "true" : "false");
}

/**
 * Apply dark mode state explicitly.
 * @param {boolean} dark - true to enable dark mode, false to disable.
 */
export function applyDarkMode(dark) {
  if (dark) document.body.classList.add("dark");
  else document.body.classList.remove("dark");
  localStorage.setItem("darkMode", dark ? "true" : "false");
}
