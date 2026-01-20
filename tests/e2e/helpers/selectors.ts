// Centralized selectors for E2E tests
// Using data-testid where available, falling back to other selectors

export const SELECTORS = {
  // Authentication
  auth: {
    usernameInput: "#username",
    passwordInput: "#password",
    submitButton: '[data-testid="auth-submit"]',
    registerToggle: '[data-testid="switch-to-register"]',
    loginToggle: '[data-testid="switch-to-login"]',
    errorMessage: ".text-red-500, .text-destructive, [role='alert']",
  },

  // Header / Navigation
  header: {
    container: "header",
    userMenuButton: '[data-testid="user-menu-button"]',
    logoutButton: '[data-testid="logout-button"]',
    displayName: '[data-testid="display-name"]',
    adminLink: 'a[href="/admin"]',
    uploadLink: 'a[href="/upload"]',
    progressLink: 'a[href="/progress"]',
  },

  // Upload Page
  upload: {
    dropzone: '[data-testid="dropzone"]',
    fileInput: 'input[type="file"]',
    loadingState: '[data-testid="upload-loading"]',
    errorMessage: '[data-testid="upload-error"]',
    tryAgainButton: '[data-testid="try-again-button"]',
  },

  // Confirm Page
  confirm: {
    container: '[data-testid="confirm-page"]',
    weightDisplay: '[data-testid="weight-display"]',
    weightValue: '[data-testid="weight-value"]',
    confidenceIndicator: '[data-testid="confidence-indicator"]',
    editButton: '[data-testid="edit-weight-button"]',
    weightInput: '[data-testid="weight-input"]',
    unitSelect: '[data-testid="unit-select"]',
    editSaveButton: '[data-testid="edit-save-button"]',
    editCancelButton: '[data-testid="edit-cancel-button"]',
    noteTextarea: "#note",
    saveButton: '[data-testid="save-button"]',
    cancelButton: '[data-testid="cancel-button"]',
    successCard: '[data-testid="weight-saved-card"]',
    viewProgressButton: '[data-testid="view-progress-button"]',
  },

  // Progress Page
  progress: {
    container: '[data-testid="progress-page"]',
    title: "h1",
    chart: '[data-testid="weight-chart"]',
    chartSvg: '[data-testid="weight-chart"] svg',
    statsSummary: '[data-testid="stats-summary"]',
    currentWeight: '[data-testid="current-weight"]',
    totalChange: '[data-testid="total-change"]',
    totalEntries: '[data-testid="total-entries"]',
    goalProgress: '[data-testid="goal-progress"]',
    weightList: '[data-testid="weight-list"]',
    weightListItem: '[data-testid="weight-list-item"]',
    deleteWeightButton: '[data-testid="delete-weight-button"]',
    goalSetter: '[data-testid="goal-setter"]',
    goalInput: '[data-testid="goal-input"]',
    goalSaveButton: '[data-testid="goal-save-button"]',
    timeRangeButtons: '[data-testid="time-range"]',
    timeRange1Week: '[data-testid="time-range-1w"]',
    timeRange1Month: '[data-testid="time-range-1m"]',
    timeRange3Months: '[data-testid="time-range-3m"]',
    timeRangeAll: '[data-testid="time-range-all"]',
    achievementsDisplay: '[data-testid="achievements-display"]',
    achievementBadge: '[data-testid="achievement-badge"]',
    logWeightButton: '[data-testid="log-weight-button"]',
    emptyState: '[data-testid="empty-state"]',
  },

  // Modals
  modals: {
    celebration: '[data-testid="celebration-modal"]',
    celebrationTitle: '[data-testid="celebration-title"]',
    celebrationMessage: '[data-testid="celebration-message"]',
    celebrationClose: '[data-testid="celebration-close"]',
    achievement: '[data-testid="achievement-modal"]',
    achievementTitle: '[data-testid="achievement-title"]',
    achievementClose: '[data-testid="achievement-close"]',
    weeklySummary: '[data-testid="weekly-summary-modal"]',
    weeklySummaryClose: '[data-testid="weekly-summary-close"]',
    confirm: '[data-testid="confirm-modal"]',
    confirmTitle: '[data-testid="confirm-modal-title"]',
    confirmButton: '[data-testid="confirm-modal-confirm"]',
    cancelButton: '[data-testid="confirm-modal-cancel"]',
    confetti: '[data-testid="confetti"]',
    goalSetterModal: '[data-testid="goal-setter-modal"]',
  },

  // Admin Page
  admin: {
    container: '[data-testid="admin-page"]',
    title: "h1",
    usersList: '[data-testid="users-list"]',
    userItem: '[data-testid="user-item"]',
    deleteUserButton: '[data-testid="delete-user-button"]',
    activityLog: '[data-testid="activity-log"]',
    activityItem: '[data-testid="activity-item"]',
    userFilter: '[data-testid="user-filter"]',
    allUsersButton: '[data-testid="all-users-button"]',
  },

  // Common UI
  ui: {
    loadingSpinner: '[data-testid="loading-spinner"]',
    toast: '[data-testid="toast"]',
    button: "button",
    input: "input",
    select: "select",
  },
};

// Helper to get nth element
export function nth(selector: string, index: number): string {
  return `${selector}:nth-child(${index + 1})`;
}
