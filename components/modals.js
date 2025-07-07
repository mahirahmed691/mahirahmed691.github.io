// modals.js
import { state } from "./state.js";
import { save } from "./storage.js";
import { render } from "./render.js";

/**
 * Utility to show a modal dialog with custom content and callbacks.
 * @param {object} options
 * @param {string} options.title - Modal title text
 * @param {string} options.contentHtml - Inner HTML for modal content area
 * @param {function} [options.onSubmit] - Callback when submit button is clicked. Return true to close modal.
 */
export function showModal({ title, contentHtml, onSubmit }) {
  const modalOverlay = document.getElementById("modalOverlay");
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalContent = document.getElementById("modalContent");
  const modalCancelBtn = document.getElementById("modalCancelBtn");
  const modalSubmitBtn = document.getElementById("modalSubmitBtn");

  modalTitle.textContent = title;
  modalContent.innerHTML = contentHtml;

  function cleanup() {
    modalOverlay.classList.add("hidden");
    modal.classList.add("hidden");
    modalSubmitBtn.onclick = null;
    modalCancelBtn.onclick = null;
  }

  modalSubmitBtn.onclick = () => {
    if (onSubmit) {
      const success = onSubmit();
      if (success) cleanup();
    } else {
      cleanup();
    }
  };

  modalCancelBtn.onclick = () => {
    cleanup();
  };

  modalOverlay.classList.remove("hidden");
  modal.classList.remove("hidden");
}

/**
 * Open modal to create a new category.
 */
export function openCategoryModal() {
  showModal({
    title: "Create New Category",
    contentHtml: `<input type="text" id="modalCategoryInput" placeholder="Category name" />`,
    onSubmit: () => {
      const input = document.getElementById("modalCategoryInput");
      const name = input.value.trim();
      if (!name) {
        alert("Please enter a category name");
        return false;
      }
      if (state[name]) {
        alert("Category already exists");
        return false;
      }
      state[name] = [];
      save();
      render();
      return true;
    },
  });
}

/**
 * Open modal to add a new task/item to an existing category.
 */
export function openTaskModal() {
  if (Object.keys(state).length === 0) {
    alert("No categories found. Please create a category first.");
    return;
  }

  const categoryOptions = Object.keys(state)
    .map((cat) => `<option value="${cat}">${cat}</option>`)
    .join("");

  showModal({
    title: "Add Task to Category",
    contentHtml: `
      <input type="text" id="modalTaskInput" placeholder="Task name" />
      <select id="modalCategorySelect">${categoryOptions}</select>
    `,
    onSubmit: () => {
      const itemInput = document.getElementById("modalTaskInput");
      const categorySelect = document.getElementById("modalCategorySelect");

      const itemName = itemInput.value.trim();
      const selectedCat = categorySelect.value;

      if (!itemName) {
        alert("Please enter a task name");
        return false;
      }
      if (!selectedCat) {
        alert("Please select a category");
        return false;
      }
      if (state[selectedCat].includes(itemName)) {
        alert("Task already exists in this category");
        return false;
      }

      state[selectedCat].push(itemName);
      save();
      render();
      return true;
    },
  });
}
