const firebaseConfig = {
  apiKey: "AIzaSyCx1vu-SRQuK1OdMHizP-qw5aAo-2PPrDs",
  authDomain: "inventory-app-378b4.firebaseapp.com",
  projectId: "inventory-app-378b4",
  storageBucket: "inventory-app-378b4.firebasestorage.app",
  messagingSenderId: "256438364788",
  appId: "1:256438364788:web:90b7b5e7dabe7fb48bbf21",
  measurementId: "G-0MJ4QGRHC6",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let state = {}; // { category: [items...] }
let checkedItems = {}; // { itemName: true }
let dueDates = {}; // { itemName: "YYYY-MM-DD" }
let collapsedState = {}; // { category: true/false }

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d)) return "-";
  return d.toISOString().slice(0, 10);
}

function isOverdue(dateStr) {
  const normalized = normalizeDateStr(dateStr);
  if (!normalized) return false;

  const dueDate = new Date(normalized);
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Set to midnight for date-only compare

  return dueDate < now;
}

function groupTasksByDueDate() {
  const groups = { today: [], scheduled: [], overdue: [], all: [] };
  const todayDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

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

function renderGroupSummaryCard(container, title, tasks, cssClass) {
  const card = document.createElement("div");
  card.className = `group-summary-card ${cssClass}`;
  card.style.cursor = "pointer";

  const heading = document.createElement("h2");
  heading.textContent = title;
  card.appendChild(heading);

  const count = document.createElement("p");
  count.textContent = `${tasks.length} task${tasks.length !== 1 ? "s" : ""}`;
  count.style.opacity = 0.7;
  card.appendChild(count);

  card.onclick = () => showGroupDetails(title.toLowerCase(), tasks);

  container.appendChild(card);
}

function renderCategorySections(container) {
  for (const item of state[cat]) {
    const li = document.createElement("li");

    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !!checkedItems[item];

    checkbox.onclick = (event) => event.stopPropagation();
    checkbox.onchange = (event) => {
      event.stopPropagation();
      if (checkbox.checked) checkedItems[item] = true;
      else delete checkedItems[item];
      save();
      render();
    };

    label.appendChild(checkbox);

    const span = document.createElement("span");
    span.textContent = item;
    label.appendChild(span);

    li.appendChild(label);

    // 🟢 ADD: Set Due Date button
    const setDueBtn = document.createElement("button");
    setDueBtn.textContent = "📅";
    setDueBtn.title = "Set due date";
    setDueBtn.style.marginLeft = "0.5em";
    setDueBtn.onclick = () => {
      const current = dueDates[item] || "";
      const newDate = prompt(
        `Enter due date for "${item}" (YYYY-MM-DD):`,
        current
      );
      if (!newDate) return;

      const isValid = /^\d{4}-\d{2}-\d{2}$/.test(newDate);
      if (!isValid) {
        alert("Invalid date format. Use YYYY-MM-DD.");
        return;
      }

      dueDates[item] = newDate;
      save();
      render();
    };
    li.appendChild(setDueBtn);

    ul.appendChild(li);
  }
}

function showGroupDetails(groupKey, tasks) {
  const container = document.getElementById("container");
  container.innerHTML = "";

  const backLabels = {
    all: "All Tasks List",
    scheduled: "Scheduled List",
    today: "Today's List",
    overdue: "Overdue List",
  };
  const backLabel = backLabels[groupKey] || "All Tasks List";

  const backBtn = document.createElement("button");
  backBtn.className = "back-button";
  backBtn.textContent = `← ${backLabel}`;
  backBtn.onclick = () => render();
  container.appendChild(backBtn);

  if (tasks.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No tasks in this group.";
    container.appendChild(empty);
    return;
  }

  // Group tasks by category
  const tasksByCategory = {};
  for (const task of tasks) {
    if (!tasksByCategory[task.cat]) tasksByCategory[task.cat] = [];
    tasksByCategory[task.cat].push(task);
  }

  for (const cat of Object.keys(tasksByCategory)) {
    const section = document.createElement("section");
    section.className = "category-section";

    // Header container
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.userSelect = "none";
    header.style.marginBottom = "0.5em";
    header.style.cursor = "default"; // no pointer on header container itself

    // Arrow
    const arrow = document.createElement("span");
    arrow.textContent = "▶"; // right triangle
    arrow.style.cursor = "pointer";
    arrow.style.transition = "transform 0.2s ease";
    arrow.style.marginRight = "8px";
    arrow.style.userSelect = "none";

    // Category title text
    const titleSpan = document.createElement("span");
    titleSpan.textContent = cat;
    titleSpan.style.flexGrow = "1";
    titleSpan.style.pointerEvents = "none";

    // Append arrow and title to header
    header.appendChild(arrow);
    header.appendChild(titleSpan);

    section.appendChild(header);

    // Tasks list
    const ul = document.createElement("ul");
    ul.style.marginLeft = "1.5em";
    ul.style.display = "none";

    for (const { item, due, checked } of tasksByCategory[cat]) {
      const li = document.createElement("li");
      const label = document.createElement("label");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = checked;

      checkbox.addEventListener("click", (e) => e.stopPropagation());
      label.addEventListener("click", (e) => e.stopPropagation());

      checkbox.onchange = () => {
        if (checkbox.checked) checkedItems[item] = true;
        else delete checkedItems[item];
        save();
        showGroupDetails(groupKey, tasks);
      };

      label.appendChild(checkbox);

      // Task name span
      const taskNameSpan = document.createElement("span");
      taskNameSpan.textContent = ` ${item} `;
      label.appendChild(taskNameSpan);

      // Due date input
      const dueInput = document.createElement("input");
      dueInput.type = "date";
      dueInput.value = due || "";
      dueInput.style.marginLeft = "8px";
      dueInput.title = "Set due date";

      dueInput.onchange = () => {
        if (dueInput.value) {
          dueDates[item] = dueInput.value;
        } else {
          delete dueDates[item];
        }
        save();
        showGroupDetails(groupKey, tasks);
      };

      label.appendChild(dueInput);

      li.appendChild(label);

      // DELETE button
      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.style.marginLeft = "10px";
      delBtn.style.color = "white";
      delBtn.style.backgroundColor = "#d9534f"; // bootstrap danger red
      delBtn.style.border = "none";
      delBtn.style.borderRadius = "4px";
      delBtn.style.padding = "2px 6px";
      delBtn.style.cursor = "pointer";

      delBtn.onclick = (e) => {
        e.stopPropagation();

        // Confirm delete
        if (
          confirm(
            `Are you sure you want to delete task "${item}" from category "${cat}"?`
          )
        ) {
          // Remove from category array
          const idx = state[cat].indexOf(item);
          if (idx > -1) state[cat].splice(idx, 1);

          // Remove from checkedItems and dueDates if present
          delete checkedItems[item];
          delete dueDates[item];

          save();

          // Refresh view with updated data
          showGroupDetails(
            groupKey,
            tasks.filter((t) => t.item !== item)
          );
        }
      };

      li.appendChild(delBtn);

      ul.appendChild(li);
    }

    section.appendChild(ul);

    arrow.onclick = (e) => {
      e.stopPropagation();
      const isCollapsed = ul.style.display === "none";
      ul.style.display = isCollapsed ? "block" : "none";
      arrow.style.transform = isCollapsed ? "rotate(90deg)" : "rotate(0deg)";
    };

    header.onclick = (e) => e.stopPropagation();

    container.appendChild(section);
  }
}
function showGroupDetails(groupKey, tasks) {
  const container = document.getElementById("container");
  container.innerHTML = "";

  const backLabels = {
    all: "All Tasks List",
    scheduled: "Scheduled List",
    today: "Today's List",
    overdue: "Overdue List",
  };
  const backLabel = backLabels[groupKey] || "All Tasks List";

  const backBtn = document.createElement("button");
  backBtn.className = "back-button";
  backBtn.textContent = `← ${backLabel}`;
  backBtn.onclick = () => render();
  container.appendChild(backBtn);

  if (tasks.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No tasks in this group.";
    container.appendChild(empty);
    return;
  }

  // Group tasks by category
  const tasksByCategory = {};
  for (const task of tasks) {
    if (!tasksByCategory[task.cat]) tasksByCategory[task.cat] = [];
    tasksByCategory[task.cat].push(task);
  }

  for (const cat of Object.keys(tasksByCategory)) {
    const section = document.createElement("section");
    section.className = "category-section";

    // Header container
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.userSelect = "none";
    header.style.marginBottom = "0.5em";
    header.style.cursor = "default"; // no pointer on header container itself

    // Arrow
    const arrow = document.createElement("span");
    arrow.textContent = "▶"; // right triangle
    arrow.style.cursor = "pointer";
    arrow.style.transition = "transform 0.2s ease";
    arrow.style.marginRight = "8px";
    arrow.style.userSelect = "none";

    // Category title text
    const titleSpan = document.createElement("span");
    titleSpan.textContent = cat;
    titleSpan.style.flexGrow = "1";
    titleSpan.style.pointerEvents = "none";

    header.appendChild(arrow);
    header.appendChild(titleSpan);
    section.appendChild(header);

    const ul = document.createElement("ul");
    ul.style.marginLeft = "1.5em";
    ul.style.display = "none";

    for (const { item, due, checked } of tasksByCategory[cat]) {
      const li = document.createElement("li");

      const label = document.createElement("label");
      label.style.userSelect = "none"; // optional: prevent text selection on click

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = checked;

      // Prevent checkbox click bubbling up
      checkbox.addEventListener("click", (e) => e.stopPropagation());
      checkbox.addEventListener("change", (e) => {
        e.stopPropagation();
        if (checkbox.checked) checkedItems[item] = true;
        else delete checkedItems[item];
        save();
        showGroupDetails(groupKey, tasks);
      });

      label.appendChild(checkbox);

      const taskNameSpan = document.createElement("span");
      taskNameSpan.textContent = ` ${item} `;
      label.appendChild(taskNameSpan);

      // Due date input
      const dueInput = document.createElement("input");
      dueInput.type = "date";
      dueInput.value = due || "";
      dueInput.style.marginLeft = "8px";
      dueInput.title = "Set due date";

      dueInput.addEventListener("click", (e) => e.stopPropagation());
      dueInput.addEventListener("change", (e) => {
        e.stopPropagation();
        if (dueInput.value) dueDates[item] = dueInput.value;
        else delete dueDates[item];
        save();
        showGroupDetails(groupKey, tasks);
      });

      label.appendChild(dueInput);

      li.appendChild(label);

      // Delete button
      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.style.marginLeft = "10px";
      delBtn.style.color = "white";
      delBtn.style.backgroundColor = "#d9534f";
      delBtn.style.border = "none";
      delBtn.style.borderRadius = "4px";
      delBtn.style.padding = "2px 6px";
      delBtn.style.cursor = "pointer";

      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (
          confirm(
            `Are you sure you want to delete task "${item}" from category "${cat}"?`
          )
        ) {
          const idx = state[cat].indexOf(item);
          if (idx > -1) state[cat].splice(idx, 1);
          delete checkedItems[item];
          delete dueDates[item];
          save();
          showGroupDetails(
            groupKey,
            tasks.filter((t) => t.item !== item)
          );
        }
      });

      li.appendChild(delBtn);

      ul.appendChild(li);
    }

    section.appendChild(ul);

    // Only arrow toggles collapse
    arrow.addEventListener("click", (e) => {
      e.stopPropagation();
      const isCollapsed = ul.style.display === "none";
      ul.style.display = isCollapsed ? "block" : "none";
      arrow.style.transform = isCollapsed ? "rotate(90deg)" : "rotate(0deg)";
    });

    // Prevent header clicks from toggling collapse
    header.addEventListener("click", (e) => e.stopPropagation());

    container.appendChild(section);
  }
}

async function load() {
  try {
    const doc = await db.collection("household-inventory").doc("state").get();
    if (doc.exists) {
      const data = doc.data() || {};
      state = typeof data.state === "object" ? data.state : {};
      checkedItems =
        typeof data.checkedItems === "object" ? data.checkedItems : {};
      dueDates = typeof data.dueDates === "object" ? data.dueDates : {};
      collapsedState =
        typeof data.collapsedState === "object" ? data.collapsedState : {};
    } else {
      seedDefaultData();
      save();
    }
  } catch {
    const backup = localStorage.getItem("backup-state");
    if (backup) {
      try {
        const parsed = JSON.parse(backup);
        state = parsed.state || {};
        checkedItems = parsed.checkedItems || {};
        dueDates = parsed.dueDates || {};
        collapsedState = parsed.collapsedState || {};
        alert("Loaded data from local backup.");
      } catch {
        useEmptyState();
      }
    } else {
      useEmptyState();
    }
  }
}

function save() {
  const data = { state, checkedItems, dueDates, collapsedState };
  db.collection("household-inventory").doc("state").set(data);
  localStorage.setItem("backup-state", JSON.stringify(data));
}

function seedDefaultData() {
  state = {
    "🏠 Household": [
      "🧦 Sock holder",
      "💨 Dehumidifier",
      "🛍️ Bin bags",
      "Kitchen roll",
      "Floor cleaner",
    ],
    "🧻 Bathroom": ["Toilet roll"],
    "📋 Household Tasks": [
      "🔔 Contact maintenance (fix bell)",
      "💡 Ring Mark (light bulbs)",
    ],
    "🛒 Groceries": [
      "Mixed beans (tin)",
      "Tuna",
      "Chicken breast",
      "Eggs",
      "Daal",
      "Bread",
      "Potatoes",
      "Wraps",
      "Crumpets",
      "Pasta",
      "Spring onion",
      "Coriander 🌿",
      "Garlic 🧄",
      "Lemon 🍋",
      "Lime 🍋",
      "Panch phoron",
      "Bay leaves 🍃",
      "Cinnamon stick",
      "Cardamon",
      "Cajun",
      "Cayenne 🌶️",
      "Sandwich filling",
      "Tomato purée 🍅",
      "Garlic and ginger paste",
      "Coffee",
      "Orange juice 🍊",
    ],
    "🐱 House Stuff": ["Cat biscuits", "Cat litter 🐱", "Bin Buddy 🗑️"],
  };
  checkedItems = {};
  dueDates = {};
  collapsedState = {};
}

function useEmptyState() {
  state = {};
  checkedItems = {};
  dueDates = {};
  collapsedState = {};
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", isDark ? "true" : "false");
}

function applyDarkMode(dark) {
  if (dark) document.body.classList.add("dark");
  else document.body.classList.remove("dark");
  localStorage.setItem("darkMode", dark ? "true" : "false");
}

// FAB Menu toggling
function toggleFabMenu() {
  document.getElementById("fabMenu").classList.toggle("hidden");
}

// Prompt for new category
function openCategoryPrompt() {
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

// Prompt for new task with category choice
function openTaskPrompt() {
  if (Object.keys(state).length === 0) {
    alert("No categories found. Please create a category first.");
    return;
  }
  const item = prompt("Enter new task/item name:");
  if (!item) return;

  const categories = Object.keys(state);
  const catList = categories.map((c, i) => `${i + 1}. ${c}`).join("\n");
  const choice = prompt(`Select category for the task:\n${catList}`);

  const index = parseInt(choice) - 1;
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

// Render today's tasks section
function renderTodayTasks(container, todayTasks) {
  if (todayTasks.length === 0) {
    const p = document.createElement("p");
    p.textContent = "No tasks scheduled for today.";
    container.appendChild(p);
    return;
  }

  const section = document.createElement("section");
  section.className = "today-tasks-section";

  const heading = document.createElement("h2");
  heading.textContent = "Today's Tasks";
  section.appendChild(heading);

  const ul = document.createElement("ul");

  for (const task of todayTasks) {
    const li = document.createElement("li");

    const label = document.createElement("label");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !!checkedItems[task.item];

    // Prevent click bubbling to parent handlers
    checkbox.onclick = (event) => event.stopPropagation();
    checkbox.onchange = (event) => {
      event.stopPropagation();
      if (checkbox.checked) checkedItems[task.item] = true;
      else delete checkedItems[task.item];
      save();
      render();
    };

    label.appendChild(checkbox);

    const span = document.createElement("span");
    span.textContent = `${task.item} (Category: ${task.cat})`;
    label.appendChild(span);

    li.appendChild(label);
    ul.appendChild(li);
  }

  section.appendChild(ul);
  container.appendChild(section);
}

function normalizeDateStr(dateStr) {
  if (!dateStr) return null;
  return dateStr.trim().slice(0, 10);
}

// Main render function
function render() {
  const container = document.getElementById("container");
  container.innerHTML = "";

  const grouped = groupTasksByDueDate();

  // Summary cards container
  const cardGrid = document.createElement("div");
  cardGrid.className = "card-grid";
  container.appendChild(cardGrid);

  renderGroupSummaryCard(cardGrid, "Today", grouped.today, "stat-today");
  renderGroupSummaryCard(
    cardGrid,
    "Scheduled",
    grouped.scheduled,
    "stat-scheduled"
  );
  renderGroupSummaryCard(cardGrid, "All Tasks", grouped.all, "stat-all");
  renderGroupSummaryCard(cardGrid, "Overdue", grouped.overdue, "stat-overdue");

  // Render only today's tasks below the cards
  renderTodayTasks(container, grouped.today);
}

// Grab modal elements once
const modalOverlay = document.getElementById("modalOverlay");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalContent = document.getElementById("modalContent");
const modalCancelBtn = document.getElementById("modalCancelBtn");
const modalSubmitBtn = document.getElementById("modalSubmitBtn");

// Utility: Show modal with custom content and callbacks
function showModal({ title, contentHtml, onSubmit }) {
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

// Open category modal
function openCategoryModal() {
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
  toggleFabMenu(); // Close FAB menu
}

// Open task modal
function openTaskModal() {
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
  toggleFabMenu(); // Close FAB menu
}

// On window load
window.onload = async () => {
  const saved = localStorage.getItem("darkMode");
  if (saved === "true") applyDarkMode(true);
  else if (saved === "false") applyDarkMode(false);
  else {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    applyDarkMode(prefersDark);
  }

  const darkModeSwitch = document.getElementById("darkModeSwitch");

  darkModeSwitch.addEventListener("change", () => {
    const isDark = darkModeSwitch.checked;
    applyDarkMode(isDark);
  });

  // On window load, sync switch with saved dark mode state
  const savedDark = localStorage.getItem("darkMode");
  let isDark;

  if (savedDark === "true") isDark = true;
  else if (savedDark === "false") isDark = false;
  else isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  applyDarkMode(isDark);
  darkModeSwitch.checked = isDark;

  await load();
  render();
};
