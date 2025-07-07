// render.js
import { state, checkedItems, dueDates } from "./state.js";
import { groupTasksByDueDate, getRandomPastelColor } from "./helpers.js";
import { save } from "./storage.js";

/**
 * Render the entire app UI inside the #container element.
 */
export function render() {
  const container = document.getElementById("container");
  container.innerHTML = "";

  // Group tasks by due date using helper
  const grouped = groupTasksByDueDate(state, dueDates, checkedItems);

  // Create and append summary cards container
  const cardGrid = document.createElement("div");
  cardGrid.className = "group-summary-grid";
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

  // Render today's tasks list below summary cards
  renderTodayTasks(container, grouped.today);
}

/**
 * Render one summary card with title, task count, and click handler.
 * @param {HTMLElement} container - parent to append card
 * @param {string} title - title of the card
 * @param {Array} tasks - array of tasks in this group
 * @param {string} cssClass - extra CSS class for styling
 */
export function renderGroupSummaryCard(container, title, tasks, cssClass) {
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

/**
 * Render the "Today's Tasks" section showing tasks due today.
 * @param {HTMLElement} container - parent container
 * @param {Array} todayTasks - tasks due today
 */
export function renderTodayTasks(container, todayTasks) {
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

/**
 * Render detailed view of a group of tasks (e.g. today, overdue, etc).
 * Shows tasks grouped by category, with expand/collapse arrows, checkboxes,
 * due date input, and delete buttons.
 *
 * @param {string} groupKey - key of the group ("today", "all", etc)
 * @param {Array} tasks - array of task objects {item, cat, due, checked}
 */
export function showGroupDetails(groupKey, tasks) {
  const categoryColors = {
    work: "#fef9c3",
    personal: "#e0f2fe",
    shopping: "#fecaca",
    // add more category colors as needed
  };

  const container = document.getElementById("container");
  container.innerHTML = "";

  const backLabels = {
    all: "All Tasks List",
    scheduled: "Scheduled List",
    today: "Today's List",
    overdue: "Overdue List",
  };
  const backLabel = backLabels[groupKey] || "All Tasks List";

  // Back button to main view
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

  // For each category, create section with collapsible task list
  for (const cat of Object.keys(tasksByCategory)) {
    const section = document.createElement("section");
    section.className = "category-section";

    const color =
      categoryColors[cat.toLowerCase()] || getRandomPastelColor(cat);
    section.style.setProperty("--card-bg", color);

    // Header with arrow and category name
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.userSelect = "none";
    header.style.marginBottom = "0.5em";
    header.style.cursor = "default";

    const arrow = document.createElement("span");
    arrow.textContent = "▶";
    arrow.style.cursor = "pointer";
    arrow.style.transition = "transform 0.2s ease";
    arrow.style.marginRight = "8px";
    arrow.style.userSelect = "none";

    const titleSpan = document.createElement("span");
    titleSpan.textContent = cat;
    titleSpan.style.flexGrow = "1";
    titleSpan.style.pointerEvents = "none";

    header.appendChild(arrow);
    header.appendChild(titleSpan);
    section.appendChild(header);

    // Task list hidden by default
    const ul = document.createElement("ul");
    ul.style.marginLeft = "1.5em";
    ul.style.display = "none";

    // Each task with checkbox, due date input, and delete button
    for (const { item, due, checked } of tasksByCategory[cat]) {
      const li = document.createElement("li");

      const label = document.createElement("label");
      label.style.userSelect = "none";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = checked;

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
      delBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" 
             width="20" height="20" fill="white" 
             viewBox="0 0 16 16" 
             style="vertical-align: middle;">
          <path d="M5.5 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0v-6a.5.5 0 0 1 .5-.5zm5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0v-6a.5.5 0 0 1 .5-.5z"/>
          <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3.086a1 1 0 0 1 .707.293l.707.707h3l.707-.707A1 1 0 0 1 11.414 2H14.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118z"/>
        </svg>
      `;

      delBtn.style.marginLeft = "10px";
      delBtn.style.backgroundColor = "#d9534f";
      delBtn.style.border = "none";
      delBtn.style.borderRadius = "4px";
      delBtn.style.padding = "4px 12px";
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

    // Toggle collapse on arrow click
    arrow.addEventListener("click", (e) => {
      e.stopPropagation();
      const isCollapsed = ul.style.display === "none";
      ul.style.display = isCollapsed ? "block" : "none";
      arrow.style.transform = isCollapsed ? "rotate(90deg)" : "rotate(0deg)";
    });

    // Prevent header clicks toggling collapse
    header.addEventListener("click", (e) => e.stopPropagation());

    container.appendChild(section);
  }
}
