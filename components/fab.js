// fab.js
import { state } from "./state.js";
import { save } from "./storage.js";
import { render } from "./render.js";
import { openCategoryModal, openTaskModal } from "./modals.js";

/**
 * Toggles visibility of the Floating Action Button (FAB) menu.
 */
export function toggleFabMenu() {
  const fabMenu = document.getElementById("fabMenu");
  if (fabMenu) fabMenu.classList.toggle("hidden");
}

/**
 * Prompt-based category creation (fallback).
 */
export function openCategoryPrompt() {
  const name = prompt("Enter new category name:");
  if (!name) return;

  if (state[name]) {
    alert("Category already exists.");
    return;
  }

  state[name] = [];
  save();
  render();
  toggleFabMenu();
}

/**
 * Prompt-based task creation (fallback).
 */
export function openTaskPrompt() {
  if (Object.keys(state).length === 0) {
    alert("No categories found. Please create a category first.");
    return;
  }

  const item = prompt("Enter new task/item name:");
  if (!item) return;

  const categories = Object.keys(state);
  const catList = categories.map((c, i) => `${i + 1}. ${c}`).join("\n");
  const choice = prompt(`Select category for the task:\n${catList}`);

  const index = parseInt(choice, 10) - 1;
  if (isNaN(index) || index < 0 || index >= categories.length) {
    alert("Invalid category choice.");
    return;
  }

  const selectedCat = categories[index];
  if (state[selectedCat].includes(item)) {
    alert("Item already exists in that category.");
    return;
  }

  state[selectedCat].push(item);
  save();
  render();
  toggleFabMenu();
}

/**
 * Modal-based category creation for better UX.
 */
export function openCategoryModalFromFab() {
  openCategoryModal();
  toggleFabMenu();
}

/**
 * Modal-based task creation for better UX.
 */
export function openTaskModalFromFab() {
  openTaskModal();
  toggleFabMenu();
}
