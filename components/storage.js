import { db } from "./firebase.js";
import { state, checkedItems, dueDates, collapsedState } from "./state.js";

// Load state from Firestore, fallback to localStorage backup or seed default
export async function load() {
  try {
    const doc = await db.collection("household-inventory").doc("state").get();
    if (doc.exists) {
      const data = doc.data() || {};
      Object.assign(state, typeof data.state === "object" ? data.state : {});
      Object.assign(
        checkedItems,
        typeof data.checkedItems === "object" ? data.checkedItems : {}
      );
      Object.assign(
        dueDates,
        typeof data.dueDates === "object" ? data.dueDates : {}
      );
      Object.assign(
        collapsedState,
        typeof data.collapsedState === "object" ? data.collapsedState : {}
      );
    } else {
      seedDefaultData();
      save();
    }
  } catch {
    const backup = localStorage.getItem("backup-state");
    if (backup) {
      try {
        const parsed = JSON.parse(backup);
        Object.assign(state, parsed.state || {});
        Object.assign(checkedItems, parsed.checkedItems || {});
        Object.assign(dueDates, parsed.dueDates || {});
        Object.assign(collapsedState, parsed.collapsedState || {});
        alert("Loaded data from local backup.");
      } catch {
        useEmptyState();
      }
    } else {
      useEmptyState();
    }
  }
}

// Save current state to Firestore and localStorage backup
export function save() {
  const data = { state, checkedItems, dueDates, collapsedState };
  db.collection("household-inventory").doc("state").set(data);
  localStorage.setItem("backup-state", JSON.stringify(data));
}

// Populate state with some default data
export function seedDefaultData() {
  Object.assign(state, {
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
  });
  Object.keys(checkedItems).forEach((k) => delete checkedItems[k]);
  Object.keys(dueDates).forEach((k) => delete dueDates[k]);
  Object.keys(collapsedState).forEach((k) => delete collapsedState[k]);
}

// Reset all state to empty objects
export function useEmptyState() {
  Object.keys(state).forEach((k) => delete state[k]);
  Object.keys(checkedItems).forEach((k) => delete checkedItems[k]);
  Object.keys(dueDates).forEach((k) => delete dueDates[k]);
  Object.keys(collapsedState).forEach((k) => delete collapsedState[k]);
}
