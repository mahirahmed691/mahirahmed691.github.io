import { load } from "./components/storage.js";
import { render } from "./components/render.js";
import { applyDarkMode } from "./components/darkmode.js";
import {
  toggleFabMenu,
  openCategoryPrompt,
  openTaskPrompt,
} from "./components/fab.js";
import { openCategoryModal, openTaskModal } from "./components/modals.js";

/**
 * Sets up dark mode state from saved preference or system setting.
 */
function setupDarkMode() {
  const darkModeSwitch = document.getElementById("darkModeSwitch");
  const savedDark = localStorage.getItem("darkMode");

  let isDark;
  if (savedDark === "true") isDark = true;
  else if (savedDark === "false") isDark = false;
  else isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  applyDarkMode(isDark);
  if (darkModeSwitch) darkModeSwitch.checked = isDark;

  if (darkModeSwitch) {
    darkModeSwitch.addEventListener("change", () => {
      applyDarkMode(darkModeSwitch.checked);
    });
  }
}

/**
 * Initialize the app on window load.
 */
window.onload = async () => {
  setupDarkMode();
  await load();
  render();
};

// Expose FAB and modal actions globally
window.toggleFabMenu = toggleFabMenu;
window.openCategoryModal = openCategoryModal;
window.openTaskModal = openTaskModal;
