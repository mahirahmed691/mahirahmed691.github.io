const firebaseConfig = {
  apiKey: "AIzaSyCx1vu-SRQuK1OdMHizP-qw5aAo-2PPrDs",
  authDomain: "inventory-app-378b4.firebaseapp.com",
  projectId: "inventory-app-378b4",
  storageBucket: "inventory-app-378b4.firebasestorage.app",
  messagingSenderId: "256438364788",
  appId: "1:256438364788:web:90b7b5e7dabe7fb48bbf21",
  measurementId: "G-0MJ4QGRHC6"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let state = {}; // { category: [items...] }
let checkedItems = {}; // { itemName: true }
let dueDates = {}; // { itemName: "YYYY-MM-DD" }
let collapsedState = {}; // { category: true/false }
let deletedStack = []; // for undo

async function load() {
  try {
    const doc = await db.collection('household-inventory').doc('state').get();
    if (doc.exists) {
      const data = doc.data();
      state = data.state || {};
      checkedItems = data.checkedItems || {};
      dueDates = data.dueDates || {};
      collapsedState = data.collapsedState || {};
    } else {
      state = {
        "🏠 Household": ["🧦 Sock holder", "💨 Dehumidifier", "🛍️ Bin bags", "Kitchen roll", "Floor cleaner"],
        "🧻 Bathroom": ["Toilet roll"],
        "📋 Household Tasks": ["🔔 Contact maintenance (fix bell)", "💡 Ring Mark (light bulbs)"],
        "🛒 Groceries": ["Mixed beans (tin)", "Tuna", "Chicken breast", "Eggs", "Daal", "Bread", "Potatoes", "Wraps", "Crumpets", "Pasta", "Spring onion", "Coriander 🌿", "Garlic 🧄", "Lemon 🍋", "Lime 🍋", "Panch phoron", "Bay leaves 🍃", "Cinnamon stick", "Cardamon", "Cajun", "Cayenne 🌶️", "Sandwich filling", "Tomato purée 🍅", "Garlic and ginger paste", "Coffee", "Orange juice 🍊"],
        "🐱 House Stuff": ["Cat biscuits", "Cat litter 🐱", "Bin Buddy 🗑️"]
      };
      checkedItems = {};
      dueDates = {};
      collapsedState = {};
      save();
    }
  } catch (err) {
    alert("Failed to load data from Firebase: " + err);
  }
}

async function save() {
  try {
    await db.collection('household-inventory').doc('state').set({
      state,
      checkedItems,
      dueDates,
      collapsedState
    });
  } catch (err) {
    alert("Failed to save data to Firebase: " + err);
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return '-';
  return d.toISOString().slice(0, 10);
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d < new Date();
}

function isUpcoming(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d - now;
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

function toggleCollapse(cat) {
  collapsedState[cat] = !collapsedState[cat];
  save();
  render();
}

// === SWIPE GESTURE HANDLER ===
function addSwipeListeners(li, item, cat) {
  let startX = 0;
  let currentX = 0;
  let threshold = 80; // minimum swipe distance in px to trigger action
  let swiping = false;

  li.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    swiping = true;
    li.style.transition = ''; // cancel transition for drag
  });

  li.addEventListener('touchmove', (e) => {
    if (!swiping) return;
    currentX = e.touches[0].clientX;
    let deltaX = currentX - startX;
    if (Math.abs(deltaX) > 5) {
      e.preventDefault(); // prevent vertical scroll while swiping horizontally
      li.style.transform = `translateX(${deltaX}px)`;
    }
  });

  li.addEventListener('touchend', (e) => {
    swiping = false;
    let deltaX = currentX - startX;
    li.style.transition = 'transform 0.3s ease';

    if (deltaX > threshold) {
      // Swipe right: toggle checked state
      if (checkedItems[item]) {
        delete checkedItems[item];
      } else {
        checkedItems[item] = true;
      }
      save();
      render();
    } else if (deltaX < -threshold) {
      // Swipe left: delete item
      deletedStack.push({ cat, item });
      const idx = state[cat].indexOf(item);
      if (idx !== -1) {
        state[cat].splice(idx, 1);
        delete checkedItems[item];
        delete dueDates[item];
        save();
        render();
        document.getElementById('undoBtn')?.removeAttribute('disabled');
      }
    } else {
      // Not enough swipe distance - reset position
      li.style.transform = 'translateX(0)';
    }
  });
}

function render() {
  const container = document.getElementById('container');
  container.innerHTML = '';

  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const taskFilter = document.getElementById('taskFilter').value;

  for (const cat of Object.keys(state)) {
    let filteredItems = state[cat].filter(item => item.toLowerCase().includes(searchTerm));
    if (taskFilter === 'due' || taskFilter === 'overdue') {
      if (cat !== '📋 Household Tasks') continue;
      filteredItems = filteredItems.filter(item => {
        const due = dueDates[item];
        if (!due) return false;
        if (taskFilter === 'due') return isOverdue(due) || isUpcoming(due);
        if (taskFilter === 'overdue') return isOverdue(due);
        return true;
      });
      if (filteredItems.length === 0) continue;
    }

    const allChecked = filteredItems.every(item => checkedItems[item]);
    const section = document.createElement('section');
    section.className = 'section';
    if (collapsedState[cat]) section.classList.add('collapsed');

    const h2 = document.createElement('h2');
    h2.textContent = cat + (allChecked ? ' ✅' : '');
    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.textContent = collapsedState[cat] ? '▶' : '▼';
    h2.prepend(arrow);
    h2.onclick = () => toggleCollapse(cat);
    section.appendChild(h2);

    const ul = document.createElement('ul');

    for (const item of filteredItems) {
      const li = document.createElement('li');

      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = !!checkedItems[item];
      checkbox.onchange = () => {
        if (checkbox.checked) checkedItems[item] = true;
        else delete checkedItems[item];
        save();
        render();
      };
      label.appendChild(checkbox);

      const span = document.createElement('span');
      span.textContent = item;
      span.contentEditable = true;
      span.spellcheck = false;
      span.onblur = () => {
        const newName = span.textContent.trim();
        if (!newName) {
          alert('Item name cannot be empty!');
          span.textContent = item;
          return;
        }
        if (newName !== item) {
          const idx = state[cat].indexOf(item);
          if (idx !== -1) {
            if (state[cat].includes(newName)) {
              alert('Item already exists in this category!');
              span.textContent = item;
              return;
            }
            state[cat][idx] = newName;
            if (checkedItems[item]) {
              checkedItems[newName] = checkedItems[item];
              delete checkedItems[item];
            }
            if (dueDates[item]) {
              dueDates[newName] = dueDates[item];
              delete dueDates[item];
            }
            save();
            render();
          }
        }
      };
      label.appendChild(span);

      if (cat === '📋 Household Tasks') {
        const due = dueDates[item];
        const dueDateText = document.createElement('span');
        dueDateText.className = 'due-date';
        dueDateText.textContent = due ? formatDate(due) : '-';
        if (isOverdue(due)) dueDateText.classList.add('overdue');
        else if (isUpcoming(due)) dueDateText.classList.add('upcoming');
        label.appendChild(dueDateText);

        const dueBtn = document.createElement('button');
        dueBtn.className = 'due-date-btn';
        dueBtn.title = 'Set due date (YYYY-MM-DD)';
        dueBtn.textContent = '⏰';
        dueBtn.onclick = (e) => {
          e.stopPropagation();
          const newDue = prompt('Enter due date (YYYY-MM-DD), or blank to clear:', due || '');
          if (newDue === '') {
            delete dueDates[item];
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(newDue)) {
            dueDates[item] = newDue;
          } else if (newDue !== null) {
            alert('Invalid date format!');
          }
          save();
          render();
        };
        label.appendChild(dueBtn);
      }

      li.appendChild(label);

      const delBtn = document.createElement('button');
      delBtn.className = 'danger';
      delBtn.innerHTML = '🗑️';
      delBtn.title = 'Delete item';
      delBtn.onclick = () => {
        deletedStack.push({ cat, item });
        const idx = state[cat].indexOf(item);
        if (idx !== -1) {
          state[cat].splice(idx, 1);
          delete checkedItems[item];
          delete dueDates[item];
          save();
          render();
          document.getElementById('undoBtn')?.removeAttribute('disabled');
        }
      };
      li.appendChild(delBtn);

      // Attach swipe listeners for mobile swipe gestures
      addSwipeListeners(li, item, cat);

      ul.appendChild(li);
    }

    section.appendChild(ul);
    container.appendChild(section);
  }

  const categorySelect = document.getElementById('categorySelect');
  categorySelect.innerHTML = '';
  for (const cat of Object.keys(state)) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  }

  const catList = document.getElementById('categoryList');
  catList.innerHTML = '';
  for (const cat of Object.keys(state)) {
    const li = document.createElement('li');

    const span = document.createElement('span');
    span.contentEditable = true;
    span.spellcheck = false;
    span.textContent = cat;
    span.onblur = () => {
      const newName = span.textContent.trim();
      if (!newName) {
        alert('Category name cannot be empty!');
        span.textContent = cat;
        return;
      }
      if (newName !== cat) {
        if (state[newName]) {
          alert('Category already exists!');
          span.textContent = cat;
          return;
        }
        state[newName] = state[cat];
        delete state[cat];
        collapsedState[newName] = collapsedState[cat];
        delete collapsedState[cat];
        save();
        render();
      }
    };
    li.appendChild(span);

    const delBtn = document.createElement('button');
    delBtn.innerHTML = '🗑️';
    delBtn.className = 'danger';
    delBtn.title = 'Delete category';
    delBtn.onclick = () => {
      if (confirm(`Delete category "${cat}" and all its items?`)) {
        for (const item of state[cat]) {
          delete checkedItems[item];
          delete dueDates[item];
        }
        delete state[cat];
        delete collapsedState[cat];
        save();
        render();
      }
    };
    li.appendChild(delBtn);

    catList.appendChild(li);
  }
}

function addItem() {
  const nameInput = document.getElementById('itemName');
  const categorySelect = document.getElementById('categorySelect');
  const name = nameInput.value.trim();
  const category = categorySelect.value;
  if (!name) {
    alert('Please enter an item name.');
    return;
  }
  if (!category) {
    alert('Please select a category.');
    return;
  }
  if (!state[category]) state[category] = [];
  if (state[category].includes(name)) {
    alert('Item already exists in this category!');
    return;
  }
  state[category].push(name);
  save();
  nameInput.value = '';
  render();
}

function addCategory() {
  const input = document.getElementById('newCategoryName');
  const name = input.value.trim();
  if (!name) {
    alert('Please enter a category name.');
    return;
  }
  if (state[name]) {
    alert('Category already exists!');
    return;
  }
  state[name] = [];
  collapsedState[name] = false;
  save();
  input.value = '';
  render();
}

// Dark mode toggle & persistence
function applyDarkMode(dark) {
  if (dark) document.body.classList.add('dark');
  else document.body.classList.remove('dark');
  localStorage.setItem('darkMode', dark ? 'true' : 'false');
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', isDark ? 'true' : 'false');
}

function exportPDF() {
  window.print();
}

window.onload = async () => {
  const saved = localStorage.getItem('darkMode');
  if (saved === 'true') {
    applyDarkMode(true);
  } else if (saved === 'false') {
    applyDarkMode(false);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyDarkMode(prefersDark);
  }

  await load();
  render();
};
