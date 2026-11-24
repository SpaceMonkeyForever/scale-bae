export function preferredLocale(username, savedPreference) {
  if (["en-GB","id-ID"].includes(savedPreference)) return savedPreference;
  return username.trim().toLowerCase() === "squishy" ? "id-ID" : "en-GB";
}

const tabPreferences = new Map();

export function storedLocale(username, displayName) {
  if (tabPreferences.has(username)) return tabPreferences.get(username);
  let saved;
  try { saved = localStorage.getItem(preferenceKey(username)); } catch { /* Optional storage. */ }
  return preferredLocale(displayName?.trim().toLowerCase() === "squishy" ? displayName : username, saved);
}

export function preferenceKey(username) {
  return "scale-bae:budget:language:" + username.toLowerCase();
}

export function saveLocale(username, locale) {
  try {
    localStorage.setItem(preferenceKey(username), locale);
    tabPreferences.delete(username);
  } catch { tabPreferences.set(username, locale); }
  window.dispatchEvent(new CustomEvent("scale-bae-language", {detail:{username,locale}}));
}
