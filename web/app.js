const state = {
  todos: [],
  editingTodoId: null,
  pendingDeleteTodoId: null,
  editingLabelId: null,
  availableLabels: [],
  selectedLabels: [],
  notifications: [],
  calendar: {
    target: null,
    viewYear: 0,
    viewMonth: 0,
  },
  notificationSettings: {
    startReminderMinutes: 30,
    dueReminderMinutes: 60,
    enabled: true,
  },
};

const STATUS_ORDER = ["active", "in_progress", "waiting", "completed"];

const STATUS_LABELS = {
  active: "未着手",
  in_progress: "進行中",
  waiting: "保留",
  completed: "完了",
};

const RECURRENCE_LABELS = {
  none: "なし",
  daily: "毎日",
  weekly: "毎週",
  monthly: "毎月",
};

const els = {
  createCollapsible: document.getElementById("todo-create-collapsible"),
  advancedSettings: document.getElementById("todo-advanced-settings"),
  form: document.getElementById("todo-form"),
  formHeading: document.getElementById("todo-form-heading"),
  formSummaryText: document.getElementById("todo-form-summary-text"),
  formBadge: document.getElementById("todo-form-badge"),
  formPreview: document.getElementById("todo-form-preview"),
  title: document.getElementById("todo-title"),
  description: document.getElementById("todo-description"),
  startDate: document.getElementById("todo-start-date"),
  startDateTrigger: document.getElementById("todo-start-date-trigger"),
  startDateDisplay: document.getElementById("todo-start-date-display"),
  startTime: document.getElementById("todo-start-time"),
  dueDate: document.getElementById("todo-due-date"),
  dueDateTrigger: document.getElementById("todo-due-date-trigger"),
  dueDateDisplay: document.getElementById("todo-due-date-display"),
  dueTime: document.getElementById("todo-due-time"),
  assignee: document.getElementById("todo-assignee"),
  labelSelector: document.getElementById("todo-label-selector"),
  recurrence: document.getElementById("todo-recurrence"),
  parent: document.getElementById("todo-parent"),
  cancelEditButton: document.getElementById("todo-cancel-edit"),
  submitButton: document.getElementById("todo-submit-button"),
  labelManagerButton: document.getElementById("label-manager-button"),
  labelManagementDialog: document.getElementById("label-management-dialog"),
  labelNameInput: document.getElementById("label-name-input"),
  saveLabelButton: document.getElementById("save-label-button"),
  closeLabelManagementButton: document.getElementById("close-label-management"),
  labelValidation: document.getElementById("label-validation-message"),
  labelManagementList: document.getElementById("label-management-list"),
  validation: document.getElementById("validation-message"),
  settingsButton: document.getElementById("settings-button"),
  notificationButton: document.getElementById("notification-button"),
  notificationBadge: document.getElementById("notification-badge"),
  notificationPopover: document.getElementById("notification-popover"),
  notificationPopoverCount: document.getElementById("notification-popover-count"),
  todoList: document.getElementById("todo-list"),
  todoCount: document.getElementById("todo-count"),
  notificationList: document.getElementById("notification-list"),
  calendarPopover: document.getElementById("calendar-popover"),
  calendarMonthLabel: document.getElementById("calendar-month-label"),
  calendarGrid: document.getElementById("calendar-grid"),
  calendarPrev: document.getElementById("calendar-prev"),
  calendarNext: document.getElementById("calendar-next"),
  calendarClear: document.getElementById("calendar-clear"),
  calendarClose: document.getElementById("calendar-close"),
  settingsDialog: document.getElementById("notification-settings-dialog"),
  startReminderMinutes: document.getElementById("start-reminder-minutes"),
  dueReminderMinutes: document.getElementById("due-reminder-minutes"),
  notificationEnabled: document.getElementById("notification-enabled"),
  closeNotificationSettings: document.getElementById("close-notification-settings"),
  saveNotificationSettings: document.getElementById("save-notification-settings"),
  deleteConfirmDialog: document.getElementById("delete-confirm-dialog"),
  deleteConfirmMessage: document.getElementById("delete-confirm-message"),
  cancelDeleteButton: document.getElementById("cancel-delete-button"),
  confirmDeleteButton: document.getElementById("confirm-delete-button"),
};

bindEvents();
initializeApp();

async function initializeApp() {
  render();
  try {
    await Promise.all([loadTodos(), loadLabels()]);
    showValidation("");
  } catch (error) {
    console.error(error);
    showValidation(extractErrorMessage(error, "Todoの読み込みに失敗しました。"));
  }
  render();
}

function bindEvents() {
  els.createCollapsible.addEventListener("toggle", () => {
    if (!els.createCollapsible.open) {
      closeCalendarPopover();
    }
    updateFormMode();
    syncCreateSummary();
  });

  els.advancedSettings.addEventListener("toggle", () => {
    if (!els.advancedSettings.open) {
      closeCalendarPopover();
    }
    syncCreateSummary();
  });

  els.settingsButton.addEventListener("click", () => {
    closeNotificationPopover();
    closeCalendarPopover();
    closeDialog(els.labelManagementDialog);
    resetLabelEditor();
    openDialog(els.settingsDialog);
  });

  els.labelManagerButton.addEventListener("click", () => {
    closeNotificationPopover();
    closeCalendarPopover();
    closeDialog(els.settingsDialog);
    resetLabelEditor();
    render();
    openDialog(els.labelManagementDialog);
  });

  els.closeNotificationSettings.addEventListener("click", () => {
    closeDialog(els.settingsDialog);
  });

  els.labelManagementDialog.addEventListener("close", () => {
    resetLabelEditor();
    render();
  });

  els.closeLabelManagementButton.addEventListener("click", () => {
    closeDialog(els.labelManagementDialog);
  });

  els.notificationButton.addEventListener("click", (event) => {
    event.stopPropagation();
    closeCalendarPopover();
    if (isNotificationPopoverOpen()) {
      closeNotificationPopover();
      return;
    }
    renderNotifications();
    openNotificationPopover();
  });

  els.startDateTrigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleCalendarPopover("start", els.startDateTrigger);
  });

  els.dueDateTrigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleCalendarPopover("due", els.dueDateTrigger);
  });

  els.calendarPrev.addEventListener("click", (event) => {
    event.preventDefault();
    state.calendar.viewMonth -= 1;
    if (state.calendar.viewMonth < 0) {
      state.calendar.viewMonth = 11;
      state.calendar.viewYear -= 1;
    }
    renderCalendar();
  });

  els.calendarNext.addEventListener("click", (event) => {
    event.preventDefault();
    state.calendar.viewMonth += 1;
    if (state.calendar.viewMonth > 11) {
      state.calendar.viewMonth = 0;
      state.calendar.viewYear += 1;
    }
    renderCalendar();
  });

  els.calendarGrid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-calendar-date]");
    if (!button) return;
    const value = button.getAttribute("data-calendar-date");
    if (!value) return;
    applyCalendarDate(value);
  });

  els.calendarClear.addEventListener("click", () => {
    clearCalendarDate();
  });

  els.calendarClose.addEventListener("click", () => {
    closeCalendarPopover();
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (!els.notificationPopover.contains(target) && !els.notificationButton.contains(target)) {
      closeNotificationPopover();
    }

    if (
      !els.calendarPopover.contains(target) &&
      !els.startDateTrigger.contains(target) &&
      !els.dueDateTrigger.contains(target)
    ) {
      closeCalendarPopover();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNotificationPopover();
      closeCalendarPopover();
    }
  });

  els.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitTodoForm();
  });

  els.form.addEventListener("input", () => {
    syncCreateSummary();
  });

  els.form.addEventListener("change", () => {
    syncCreateSummary();
  });

  els.cancelEditButton.addEventListener("click", () => {
    cancelEditing({ collapse: true });
  });

  els.saveLabelButton.addEventListener("click", async () => {
    await submitLabelEditor();
  });

  els.labelNameInput.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    await submitLabelEditor();
  });

  els.labelSelector.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const button = target.closest("button[data-label-name]");
    if (!button) return;

    toggleSelectedLabel(button.dataset.labelName || "");
  });

  els.labelManagementList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const editButton = target.closest("button[data-edit-label-id]");
    if (editButton) {
      beginLabelEditing(Number(editButton.dataset.editLabelId));
      return;
    }

    const deleteButton = target.closest("button[data-delete-label-id]");
    if (deleteButton) {
      await deleteLabel(Number(deleteButton.dataset.deleteLabelId));
    }
  });

  els.todoList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const statusButton = target.closest("button[data-status-id][data-next-status]");
    if (statusButton) {
      await setTodoStatus(
        Number(statusButton.dataset.statusId),
        String(statusButton.dataset.nextStatus || ""),
      );
      return;
    }

    const editButton = target.closest("button[data-edit-id]");
    if (editButton) {
      beginEditing(Number(editButton.dataset.editId));
      return;
    }

    const deleteButton = target.closest("button[data-delete-id]");
    if (!deleteButton) return;
    promptDeleteTodo(Number(deleteButton.dataset.deleteId));
  });

  els.deleteConfirmDialog.addEventListener("close", () => {
    state.pendingDeleteTodoId = null;
  });

  els.cancelDeleteButton.addEventListener("click", () => {
    closeDialog(els.deleteConfirmDialog);
  });

  els.confirmDeleteButton.addEventListener("click", async () => {
    await confirmDeleteTodo();
  });

  els.saveNotificationSettings.addEventListener("click", () => {
    const startReminderMinutes = Number(els.startReminderMinutes.value);
    const dueReminderMinutes = Number(els.dueReminderMinutes.value);
    const enabled = els.notificationEnabled.selected;

    state.notificationSettings.startReminderMinutes = Number.isNaN(startReminderMinutes)
      ? 30
      : Math.max(0, startReminderMinutes);
    state.notificationSettings.dueReminderMinutes = Number.isNaN(dueReminderMinutes)
      ? 60
      : Math.max(0, dueReminderMinutes);
    state.notificationSettings.enabled = enabled;

    renderNotifications();
    closeDialog(els.settingsDialog);
  });
}

async function loadTodos() {
  const todos = await requestJSON("/api/todos");
  state.todos = Array.isArray(todos) ? todos.map(fromApiTodo) : [];
  syncEditingState();
}

async function loadLabels() {
  const labels = await requestJSON("/api/labels");
  state.availableLabels = Array.isArray(labels) ? labels.map(fromApiLabel).filter((label) => label.name) : [];
  state.availableLabels.sort((left, right) => left.name.localeCompare(right.name, "ja", { sensitivity: "base" }));
  syncSelectedLabels();
}

async function submitTodoForm() {
  if (isEditingTodo()) {
    await updateTodo(state.editingTodoId);
    return;
  }
  await createTodo();
}

async function createTodo() {
  const todo = buildTodoFromForm();
  const validationMessage = validateTodoInput(todo);
  if (validationMessage) {
    showValidation(validationMessage);
    return;
  }

  try {
    await requestJSON("/api/todos", {
      method: "POST",
      body: JSON.stringify(
        toApiTodoPayload({
          ...todo,
          status: "active",
        }),
      ),
    });
    clearForm({ preserveAdvancedState: true });
    showValidation("");
    await loadTodos();
  } catch (error) {
    console.error(error);
    showValidation(extractErrorMessage(error, "Todoの保存に失敗しました。"));
  }

  render();
}

function buildTodoFromForm() {
  return {
    title: (els.title.value || "").trim(),
    description: (els.description.value || "").trim(),
    startDate: combineDateAndTime(els.startDate.value, els.startTime.value),
    dueDate: combineDateAndTime(els.dueDate.value, els.dueTime.value),
    assignee: (els.assignee.value || "").trim(),
    labels: state.selectedLabels.slice(),
    recurrence: els.recurrence.value || "none",
    parentTodoId: els.parent.value ? Number(els.parent.value) : null,
  };
}

async function updateTodo(id) {
  const todo = buildTodoFromForm();
  const validationMessage = validateTodoInput(todo);
  if (validationMessage) {
    showValidation(validationMessage);
    return;
  }

  try {
    await patchTodo(id, {
      title: todo.title,
      description: todo.description,
      startDate: todo.startDate,
      dueDate: todo.dueDate,
      assignee: todo.assignee,
      labels: todo.labels,
      recurrence: todo.recurrence,
      parentTodoId: todo.parentTodoId,
    });
    await loadTodos();
    cancelEditing({ clearValidation: false, collapse: true });
    showValidation("");
  } catch (error) {
    console.error(error);
    showValidation(extractErrorMessage(error, "Todoの更新に失敗しました。"));
  }

  render();
}

function validateTodoInput(todo) {
  if (!todo.title) return "タイトルは必須です。";
  if (todo.title.length > 120) return "タイトルは120文字以内で入力してください。";
  if (els.startTime.value && !els.startDate.value) return "開始時刻を設定する場合は開始予定日も入力してください。";
  if (els.dueTime.value && !els.dueDate.value) return "締切時刻を設定する場合は締切日も入力してください。";
  if (!isValidStartDue(todo.startDate, todo.dueDate)) return "締切日は開始予定日以降の日付にしてください。";
  return "";
}

async function patchTodo(id, changes) {
  const payload = {};
  if (Object.hasOwn(changes, "title")) payload.title = changes.title;
  if (Object.hasOwn(changes, "description")) payload.description = changes.description;
  if (Object.hasOwn(changes, "status")) payload.status = changes.status;
  if (Object.hasOwn(changes, "startDate")) payload.start_date = changes.startDate;
  if (Object.hasOwn(changes, "dueDate")) payload.due_date = changes.dueDate;
  if (Object.hasOwn(changes, "assignee")) payload.assignee = changes.assignee;
  if (Object.hasOwn(changes, "labels")) payload.labels = changes.labels;
  if (Object.hasOwn(changes, "recurrence")) payload.recurrence_rule = changes.recurrence;
  if (Object.hasOwn(changes, "parentTodoId")) payload.parent_todo_id = changes.parentTodoId;

  const updated = await requestJSON(`/api/todos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return fromApiTodo(updated);
}

async function deleteTodo(id) {
  await requestJSON(`/api/todos/${id}`, {
    method: "DELETE",
  });
}

async function setTodoStatus(id, nextStatus) {
  const todo = state.todos.find((item) => item.id === id);
  if (!todo || !STATUS_ORDER.includes(nextStatus) || todo.status === nextStatus) {
    return;
  }

  const previousStatus = todo.status;
  try {
    const updatedTodo = await patchTodo(id, { status: nextStatus });
    if (previousStatus !== "completed" && updatedTodo.status === "completed" && updatedTodo.recurrence !== "none") {
      await createNextRecurringTodo(updatedTodo);
    }
    await loadTodos();
    showValidation("");
  } catch (error) {
    console.error(error);
    showValidation(extractErrorMessage(error, "Todoの状態更新に失敗しました。"));
  }

  render();
}

function promptDeleteTodo(id) {
  const todo = state.todos.find((item) => item.id === id);
  if (!todo) {
    showValidation("削除対象のTodoが見つかりません。");
    return;
  }

  state.pendingDeleteTodoId = todo.id;
  els.deleteConfirmMessage.textContent = `「${todo.title}」を削除します。削除すると元に戻せません。`;
  openDialog(els.deleteConfirmDialog);
}

async function confirmDeleteTodo() {
  if (!Number.isInteger(state.pendingDeleteTodoId)) {
    closeDialog(els.deleteConfirmDialog);
    return;
  }

  try {
    await deleteTodo(state.pendingDeleteTodoId);
    closeDialog(els.deleteConfirmDialog);
    await loadTodos();
    showValidation("");
  } catch (error) {
    console.error(error);
    showValidation(extractErrorMessage(error, "Todoの削除に失敗しました。"));
  }

  render();
}

async function createNextRecurringTodo(todo) {
  if (!todo.dueDate) return;

  const baseDate = parseDateTime(todo.dueDate, "due");
  if (Number.isNaN(baseDate.getTime())) return;

  const nextDue = new Date(baseDate);
  if (todo.recurrence === "daily") nextDue.setDate(nextDue.getDate() + 1);
  if (todo.recurrence === "weekly") nextDue.setDate(nextDue.getDate() + 7);
  if (todo.recurrence === "monthly") nextDue.setMonth(nextDue.getMonth() + 1);

  let nextStartDate = "";
  if (todo.startDate) {
    const baseStart = parseDateTime(todo.startDate, "start");
    if (!Number.isNaN(baseStart.getTime())) {
      const shiftedStart = new Date(baseStart);
      if (todo.recurrence === "daily") shiftedStart.setDate(shiftedStart.getDate() + 1);
      if (todo.recurrence === "weekly") shiftedStart.setDate(shiftedStart.getDate() + 7);
      if (todo.recurrence === "monthly") shiftedStart.setMonth(shiftedStart.getMonth() + 1);
      nextStartDate = hasTimePart(todo.startDate) ? toInputDateTime(shiftedStart) : toInputDate(shiftedStart);
    }
  }

  await requestJSON("/api/todos", {
    method: "POST",
    body: JSON.stringify(
      toApiTodoPayload({
        title: todo.title,
        description: todo.description,
        status: "active",
        startDate: nextStartDate,
        dueDate: hasTimePart(todo.dueDate) ? toInputDateTime(nextDue) : toInputDate(nextDue),
        assignee: todo.assignee,
        labels: todo.labels,
        recurrence: todo.recurrence,
        parentTodoId: todo.parentTodoId,
      }),
    ),
  });
}

async function requestJSON(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  const data = text ? tryParseJSON(text) : null;
  if (!response.ok) {
    const message = typeof data === "string" ? data : data && data.message ? data.message : text;
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return data;
}

function tryParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractErrorMessage(error, fallback) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function fromApiTodo(todo) {
  return {
    id: todo.id,
    title: todo.title || "",
    description: todo.description || "",
    status: todo.status || "active",
    startDate: todo.start_date || "",
    dueDate: todo.due_date || "",
    assignee: todo.assignee || "",
    labels: Array.isArray(todo.labels) ? todo.labels : [],
    recurrence: todo.recurrence_rule || "none",
    parentTodoId: todo.parent_todo_id ?? null,
    createdAt: todo.created_at || "",
    updatedAt: todo.updated_at || "",
  };
}

function fromApiLabel(label) {
  return {
    id: Number(label.id),
    name: typeof label.name === "string" ? label.name.trim() : "",
    createdAt: label.created_at || "",
    updatedAt: label.updated_at || "",
  };
}

function toApiTodoPayload(todo) {
  return {
    title: todo.title,
    description: todo.description,
    status: todo.status,
    start_date: todo.startDate || "",
    due_date: todo.dueDate || "",
    assignee: todo.assignee || "",
    labels: Array.isArray(todo.labels) ? todo.labels : [],
    recurrence_rule: todo.recurrence || "none",
    parent_todo_id: todo.parentTodoId,
  };
}

function render() {
  updateFormMode();
  updateLabelEditorMode();
  syncDateDisplays();
  syncCreateSummary();
  renderLabelSelector();
  renderLabelManagementList();
  renderParentOptions();
  renderTodoList();
  renderNotifications();
}

function renderLabelSelector() {
  const names = getAvailableLabelNames();

  if (names.length === 0) {
    els.labelSelector.innerHTML = `<p class="empty label-empty">ラベルはまだありません。ヘッダーのタグアイコンから作成してください。</p>`;
    return;
  }

  const selected = new Set(state.selectedLabels);
  els.labelSelector.innerHTML = names
    .map(
      (name) => `
        <button
          type="button"
          class="label-chip-btn${selected.has(name) ? " is-selected" : ""}"
          data-label-name="${escapeHtml(name)}"
          aria-pressed="${selected.has(name) ? "true" : "false"}"
        >
          #${escapeHtml(name)}
        </button>
      `,
    )
    .join("");
}

function renderLabelManagementList() {
  if (state.availableLabels.length === 0) {
    els.labelManagementList.innerHTML = `<p class="empty">ラベルはまだありません。</p>`;
    return;
  }

  els.labelManagementList.innerHTML = state.availableLabels
    .map(
      (label) => `
        <article class="label-admin-row${label.id === state.editingLabelId ? " is-editing" : ""}">
          <div>
            <p class="label-admin-name">#${escapeHtml(label.name)}</p>
          </div>
          <div class="label-admin-actions">
            <button class="secondary-btn secondary-btn-small" type="button" data-edit-label-id="${label.id}">
              編集
            </button>
            <button class="danger-btn danger-btn-small" type="button" data-delete-label-id="${label.id}">
              削除
            </button>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderParentOptions() {
  const currentValue = els.parent.value;
  const availableTodos = state.todos.filter((todo) => todo.id !== state.editingTodoId);
  els.parent.innerHTML = `
    <md-select-option value="">
      <div slot="headline">なし</div>
    </md-select-option>
  `;

  for (const todo of availableTodos) {
    const option = document.createElement("md-select-option");
    option.value = String(todo.id);
    option.innerHTML = `<div slot="headline">#${todo.id} ${escapeHtml(todo.title)}</div>`;
    els.parent.appendChild(option);
  }

  if (currentValue && availableTodos.some((todo) => String(todo.id) === currentValue)) {
    els.parent.value = currentValue;
    return;
  }
  els.parent.value = "";
}

function renderTodoList() {
  const visible = state.todos;

  els.todoCount.textContent = `${visible.length}件`;

  if (visible.length === 0) {
    els.todoList.innerHTML = `<p class="empty">一致するTodoはありません。</p>`;
    return;
  }

  els.todoList.innerHTML = visible
    .map((todo) => {
      const labels = todo.labels.map((label) => `<span class="meta-chip">#${escapeHtml(label)}</span>`).join("");
      const parent = todo.parentTodoId ? `<span class="meta-chip">親タスク #${todo.parentTodoId}</span>` : "";
      const isEditing = todo.id === state.editingTodoId;
      return `
        <article class="todo-card${isEditing ? " is-editing" : ""}">
          <div class="todo-top">
            <div class="todo-copy">
              <h3 class="todo-title">${escapeHtml(todo.title)}</h3>
              ${todo.description ? `<p class="todo-description">${escapeHtml(todo.description)}</p>` : ""}
            </div>
            <span class="status-badge status-${todo.status}">${escapeHtml(getStatusLabel(todo.status))}</span>
          </div>
          <div class="todo-meta">
            ${todo.startDate ? `<span class="meta-chip">開始 ${formatDateTimeForDisplay(todo.startDate)}</span>` : ""}
            ${todo.dueDate ? `<span class="meta-chip">期限 ${formatDateTimeForDisplay(todo.dueDate)}</span>` : ""}
            ${todo.assignee ? `<span class="meta-chip">担当 ${escapeHtml(todo.assignee)}</span>` : ""}
            ${todo.recurrence !== "none" ? `<span class="meta-chip">繰り返し ${escapeHtml(getRecurrenceLabel(todo.recurrence))}</span>` : ""}
            ${labels}
            ${parent}
          </div>
          <div class="todo-actions">
            <div class="status-switcher" role="group" aria-label="状態変更">
              ${renderStatusButtons(todo.id, todo.status)}
            </div>
            <div class="todo-action-buttons">
              <button class="secondary-btn" data-edit-id="${todo.id}" ${isEditing ? "disabled" : ""}>
                ${isEditing ? "編集中" : "編集"}
              </button>
              <button class="danger-btn" data-delete-id="${todo.id}">削除</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderNotifications() {
  if (!state.notificationSettings.enabled) {
    state.notifications = [];
    updateNotificationBadge();
    els.notificationList.innerHTML = `<p class="empty">新しい通知はありません。</p>`;
    return;
  }

  const now = new Date();
  const notifications = [];

  for (const todo of state.todos) {
    if (todo.status === "completed") continue;

    if (todo.startDate) {
      const target = parseDateTime(todo.startDate, "start");
      const reminderAt = addMinutes(target, -state.notificationSettings.startReminderMinutes);
      if (now <= target && now >= reminderAt) {
        notifications.push({
          key: `start-${todo.id}`,
          title: `開始予定が近づいています: ${todo.title}`,
          time: `開始予定 ${formatDateTimeForDisplay(todo.startDate)}`,
        });
      }
    }

    if (todo.dueDate) {
      const target = parseDateTime(todo.dueDate, "due");
      const reminderAt = addMinutes(target, -state.notificationSettings.dueReminderMinutes);
      if (now <= target && now >= reminderAt) {
        notifications.push({
          key: `due-${todo.id}`,
          title: `締切が近づいています: ${todo.title}`,
          time: `締切 ${formatDateTimeForDisplay(todo.dueDate)}`,
        });
      }
    }
  }

  state.notifications = notifications;
  updateNotificationBadge();

  if (notifications.length === 0) {
    els.notificationList.innerHTML = `<p class="empty">新しい通知はありません。</p>`;
    return;
  }

  els.notificationList.innerHTML = notifications
    .map(
      (item) => `
      <article class="notification-card">
        <p class="notification-title">${escapeHtml(item.title)}</p>
        <p class="notification-time">${escapeHtml(item.time)}</p>
      </article>
    `,
    )
    .join("");
}

function renderStatusButtons(todoId, selectedStatus) {
  return STATUS_ORDER.map((status) => {
    const selected = selectedStatus === status;
    return `
      <button
        type="button"
        class="status-chip${selected ? " is-current" : ""}"
        data-status-id="${todoId}"
        data-next-status="${status}"
        aria-pressed="${selected ? "true" : "false"}"
      >
        ${escapeHtml(getStatusLabel(status))}
      </button>
    `;
  }).join("");
}

function showValidation(message) {
  els.validation.textContent = message;
}

function showLabelValidation(message) {
  els.labelValidation.textContent = message;
}

function clearForm({ preserveAdvancedState = false } = {}) {
  const advancedWasOpen = els.advancedSettings.open;
  els.form.reset();
  els.title.value = "";
  els.description.value = "";
  els.startDate.value = "";
  els.startTime.value = "";
  els.dueDate.value = "";
  els.dueTime.value = "";
  els.assignee.value = "";
  state.selectedLabels = [];
  els.parent.value = "";
  els.recurrence.value = "none";
  els.advancedSettings.open = preserveAdvancedState ? advancedWasOpen : false;
  syncDateDisplays();
  closeCalendarPopover();
}

function beginEditing(todoId) {
  const todo = state.todos.find((item) => item.id === todoId);
  if (!todo) {
    showValidation("編集対象のTodoが見つかりません。");
    return;
  }

  state.editingTodoId = todo.id;
  els.createCollapsible.open = true;
  populateForm(todo);
  showValidation("");
  render();
}

function cancelEditing({ clearValidation = true, collapse = false } = {}) {
  state.editingTodoId = null;
  clearForm();
  if (collapse) {
    els.createCollapsible.open = false;
  }
  if (clearValidation) {
    showValidation("");
  }
  render();
}

function syncEditingState() {
  if (!isEditingTodo()) return;
  if (state.todos.some((todo) => todo.id === state.editingTodoId)) return;
  cancelEditing({ clearValidation: false });
}

function updateFormMode() {
  const editing = isEditingTodo();
  const open = els.createCollapsible.open;
  els.formHeading.textContent = editing ? "Todoを編集中" : "新しいTodoを追加";
  els.formSummaryText.textContent = editing
    ? "タイトル・期限・担当者などを見直して保存"
    : "タイトル・期限・担当者などを設定して追加";
  els.submitButton.textContent = editing ? "更新する" : "追加する";
  els.cancelEditButton.textContent = editing ? "編集をキャンセル" : "キャンセル";
  els.cancelEditButton.hidden = !open;
}

function syncCreateSummary() {
  const snapshot = getFormSnapshot();
  const hasDraft = hasFormDraft(snapshot);
  const editing = isEditingTodo();
  const open = els.createCollapsible.open;

  els.formBadge.classList.toggle("hidden", !editing && !hasDraft);
  els.formBadge.textContent = editing ? "編集中" : hasDraft ? "入力途中" : "";

  const preview = buildFormPreview(snapshot, editing);
  const shouldShowPreview = !open && (editing || hasDraft);
  els.formPreview.classList.toggle("hidden", !shouldShowPreview);
  if (!shouldShowPreview) {
    els.formPreview.innerHTML = "";
    return;
  }

  els.formPreview.innerHTML = `
    <p class="create-preview-title">${escapeHtml(preview.title)}</p>
    <p class="create-preview-meta">${escapeHtml(preview.meta)}</p>
  `;
}

function populateForm(todo) {
  els.title.value = todo.title;
  els.description.value = todo.description;
  applyStoredDateTime("start", todo.startDate);
  applyStoredDateTime("due", todo.dueDate);
  els.assignee.value = todo.assignee;
  state.selectedLabels = normalizeLabelNames(todo.labels);
  syncSelectedLabels();
  els.recurrence.value = todo.recurrence || "none";
  renderParentOptions();
  els.parent.value = todo.parentTodoId === null ? "" : String(todo.parentTodoId);
  els.advancedSettings.open = shouldOpenAdvancedSettings(todo);
  syncDateDisplays();
  closeCalendarPopover();
}

function applyStoredDateTime(target, value) {
  const isStart = target === "start";
  const dateField = isStart ? els.startDate : els.dueDate;
  const timeField = isStart ? els.startTime : els.dueTime;

  if (!value) {
    dateField.value = "";
    timeField.value = "";
    return;
  }

  const [datePart, rawTimePart = ""] = String(value).split("T");
  dateField.value = datePart;
  timeField.value = rawTimePart.slice(0, 5);
}

function shouldOpenAdvancedSettings(todo) {
  return Boolean(
    todo.startDate ||
      todo.assignee ||
      todo.labels.length > 0 ||
      todo.recurrence !== "none" ||
      todo.parentTodoId,
  );
}

function isEditingTodo() {
  return Number.isInteger(state.editingTodoId);
}

function getFormSnapshot() {
  return {
    title: (els.title.value || "").trim(),
    description: (els.description.value || "").trim(),
    startDate: combineDateAndTime(els.startDate.value, els.startTime.value),
    dueDate: combineDateAndTime(els.dueDate.value, els.dueTime.value),
    assignee: (els.assignee.value || "").trim(),
    labels: state.selectedLabels.slice(),
    recurrence: els.recurrence.value || "none",
    parentTodoId: els.parent.value ? Number(els.parent.value) : null,
  };
}

function hasFormDraft(snapshot) {
  return Boolean(
    snapshot.title ||
      snapshot.description ||
      snapshot.startDate ||
      snapshot.dueDate ||
      snapshot.assignee ||
      snapshot.labels.length > 0 ||
      snapshot.recurrence !== "none" ||
      snapshot.parentTodoId,
  );
}

function buildFormPreview(snapshot, editing) {
  const meta = [];
  if (snapshot.dueDate) meta.push(`期限 ${formatDateTimeForDisplay(snapshot.dueDate)}`);
  if (snapshot.startDate) meta.push(`開始 ${formatDateTimeForDisplay(snapshot.startDate)}`);
  if (snapshot.assignee) meta.push(`担当 ${snapshot.assignee}`);
  if (snapshot.labels.length > 0) meta.push(`ラベル ${snapshot.labels.length}件`);
  if (snapshot.recurrence !== "none") meta.push(`繰り返し ${getRecurrenceLabel(snapshot.recurrence)}`);
  if (snapshot.parentTodoId) meta.push(`親タスク #${snapshot.parentTodoId}`);
  if (meta.length === 0) {
    meta.push(editing ? "保存前の内容を保持しています" : "タイトルだけでもすぐに追加できます");
  }

  return {
    title: snapshot.title || (editing ? "タイトル未入力の編集中Todo" : "タイトル未入力の新規Todo"),
    meta: meta.join(" / "),
  };
}

function updateLabelEditorMode() {
  const editing = Number.isInteger(state.editingLabelId);
  els.saveLabelButton.textContent = editing ? "ラベル更新" : "ラベル作成";
}

function resetLabelEditor() {
  state.editingLabelId = null;
  els.labelNameInput.value = "";
  showLabelValidation("");
}

function beginLabelEditing(labelId) {
  const label = findLabelById(labelId);
  if (!label) {
    showLabelValidation("編集対象のラベルが見つかりません。");
    return;
  }
  state.editingLabelId = label.id;
  els.labelNameInput.value = label.name;
  showLabelValidation("");
  els.labelNameInput.focus();
  render();
}

async function submitLabelEditor() {
  const name = (els.labelNameInput.value || "").trim();
  if (!name) {
    showLabelValidation("ラベル名を入力してください。");
    return;
  }

  try {
    if (Number.isInteger(state.editingLabelId)) {
      const currentLabel = findLabelById(state.editingLabelId);
      if (!currentLabel) {
        showLabelValidation("編集対象のラベルが見つかりません。");
        return;
      }

      const updated = await requestJSON(`/api/labels/${state.editingLabelId}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      replaceSelectedLabel(currentLabel.name, updated && typeof updated.name === "string" ? updated.name : name);
      await Promise.all([loadLabels(), loadTodos()]);
    } else {
      await requestJSON("/api/labels", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      await loadLabels();
    }

    resetLabelEditor();
    showLabelValidation("");
  } catch (error) {
    console.error(error);
    showLabelValidation(extractErrorMessage(error, "ラベルの保存に失敗しました。"));
  }

  render();
}

async function deleteLabel(labelId) {
  const label = findLabelById(labelId);
  if (!label) {
    showLabelValidation("削除対象のラベルが見つかりません。");
    return;
  }

  try {
    await requestJSON(`/api/labels/${labelId}`, {
      method: "DELETE",
    });
    state.selectedLabels = state.selectedLabels.filter((item) => item !== label.name);
    if (state.editingLabelId === labelId) {
      resetLabelEditor();
    }
    await Promise.all([loadLabels(), loadTodos()]);
    showLabelValidation("");
  } catch (error) {
    console.error(error);
    showLabelValidation(extractErrorMessage(error, "ラベルの削除に失敗しました。"));
  }

  render();
}

function toggleSelectedLabel(name) {
  const label = findAvailableLabel(name);
  if (!label) return;
  const labelName = label.name;

  if (state.selectedLabels.includes(labelName)) {
    state.selectedLabels = state.selectedLabels.filter((item) => item !== labelName);
  } else {
    state.selectedLabels = normalizeLabelNames([...state.selectedLabels, labelName]);
  }

  render();
}

function syncSelectedLabels() {
  state.selectedLabels = normalizeLabelNames(
    state.selectedLabels
      .map((label) => {
        const matched = findAvailableLabel(label);
        return matched ? matched.name : "";
      })
      .filter(Boolean),
  );
}

function findAvailableLabel(name) {
  const target = String(name || "").trim().toLowerCase();
  if (!target) return null;
  return state.availableLabels.find((label) => label.name.toLowerCase() === target) || null;
}

function findLabelById(id) {
  return state.availableLabels.find((label) => label.id === id) || null;
}

function replaceSelectedLabel(previousName, nextName) {
  state.selectedLabels = normalizeLabelNames(
    state.selectedLabels.map((label) => (label === previousName ? nextName : label)),
  );
}

function getAvailableLabelNames() {
  return state.availableLabels.map((label) => label.name);
}

function normalizeLabelNames(labels) {
  const seen = new Set();
  return labels
    .map((label) => String(label || "").trim())
    .filter((label) => {
      if (!label) return false;
      const key = label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => left.localeCompare(right, "ja", { sensitivity: "base" }));
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

function getRecurrenceLabel(recurrence) {
  return RECURRENCE_LABELS[recurrence] || recurrence;
}

function isValidStartDue(startDate, dueDate) {
  if (!startDate || !dueDate) return true;
  const start = parseDateTime(startDate, "start");
  const due = parseDateTime(dueDate, "due");
  if (Number.isNaN(start.getTime()) || Number.isNaN(due.getTime())) return false;
  return due >= start;
}

function updateNotificationBadge() {
  const count = state.notifications.length;
  els.notificationPopoverCount.textContent = `${count} 件`;
  if (count <= 0) {
    els.notificationBadge.classList.add("hidden");
    return;
  }

  els.notificationBadge.textContent = String(count);
  els.notificationBadge.classList.remove("hidden");
}

function openDialog(dialog) {
  if (dialog.open) return;
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
    return;
  }
  dialog.setAttribute("open", "");
}

function closeDialog(dialog) {
  if (!dialog.open) return;
  if (typeof dialog.close === "function") {
    dialog.close();
    return;
  }
  dialog.removeAttribute("open");
}

function syncDateDisplays() {
  syncDateDisplay("start");
  syncDateDisplay("due");
}

function syncDateDisplay(target) {
  const isStart = target === "start";
  const raw = isStart ? els.startDate.value : els.dueDate.value;
  const display = isStart ? els.startDateDisplay : els.dueDateDisplay;
  if (!raw) {
    display.textContent = "日付を選択";
    display.classList.add("placeholder");
    return;
  }
  display.textContent = formatDateForDisplay(raw);
  display.classList.remove("placeholder");
}

function toggleCalendarPopover(target, anchor) {
  if (isCalendarPopoverOpen() && state.calendar.target === target) {
    closeCalendarPopover();
    return;
  }
  openCalendarPopover(target, anchor);
}

function openCalendarPopover(target, anchor) {
  state.calendar.target = target;
  const value = target === "start" ? els.startDate.value : els.dueDate.value;
  const baseDate = value ? parseDateTime(value, target === "due" ? "due" : "start") : new Date();
  state.calendar.viewYear = baseDate.getFullYear();
  state.calendar.viewMonth = baseDate.getMonth();

  renderCalendar();
  els.calendarPopover.classList.remove("hidden");
  positionCalendarPopover(anchor);
  updateDateTriggerExpanded(target, true);
}

function closeCalendarPopover() {
  if (!isCalendarPopoverOpen()) return;
  els.calendarPopover.classList.add("hidden");
  updateDateTriggerExpanded("start", false);
  updateDateTriggerExpanded("due", false);
}

function isCalendarPopoverOpen() {
  return !els.calendarPopover.classList.contains("hidden");
}

function renderCalendar() {
  const base = new Date(state.calendar.viewYear, state.calendar.viewMonth, 1);
  els.calendarMonthLabel.textContent = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
  }).format(base);

  const firstWeekday = base.getDay();
  const daysInMonth = new Date(state.calendar.viewYear, state.calendar.viewMonth + 1, 0).getDate();
  const currentValue = getCalendarTargetValue();
  const today = toInputDate(new Date());
  const parts = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    parts.push('<span class="calendar-day-empty" aria-hidden="true"></span>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = [
      String(state.calendar.viewYear),
      String(state.calendar.viewMonth + 1).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");
    const selectedClass = iso === currentValue ? " is-selected" : "";
    const todayClass = iso === today ? " is-today" : "";
    parts.push(
      `<button type="button" class="calendar-day-btn${selectedClass}${todayClass}" data-calendar-date="${iso}">${day}</button>`,
    );
  }

  const trailing = (7 - (parts.length % 7)) % 7;
  for (let i = 0; i < trailing; i += 1) {
    parts.push('<span class="calendar-day-empty" aria-hidden="true"></span>');
  }

  els.calendarGrid.innerHTML = parts.join("");
}

function applyCalendarDate(value) {
  if (state.calendar.target === "start") {
    els.startDate.value = value;
  } else if (state.calendar.target === "due") {
    els.dueDate.value = value;
  }
  syncDateDisplays();
  syncCreateSummary();
  closeCalendarPopover();
}

function clearCalendarDate() {
  if (state.calendar.target === "start") {
    els.startDate.value = "";
  } else if (state.calendar.target === "due") {
    els.dueDate.value = "";
  }
  syncDateDisplays();
  syncCreateSummary();
  closeCalendarPopover();
}

function getCalendarTargetValue() {
  if (state.calendar.target === "start") return els.startDate.value;
  if (state.calendar.target === "due") return els.dueDate.value;
  return "";
}

function updateDateTriggerExpanded(target, expanded) {
  const startValue = target === "start" && expanded ? "true" : "false";
  const dueValue = target === "due" && expanded ? "true" : "false";
  els.startDateTrigger.setAttribute("aria-expanded", startValue);
  els.dueDateTrigger.setAttribute("aria-expanded", dueValue);
}

function positionCalendarPopover(anchor) {
  const rect = anchor.getBoundingClientRect();
  const popover = els.calendarPopover;
  const maxWidth = 320;
  const left = Math.max(12, Math.min(rect.left, window.innerWidth - maxWidth - 12));
  const estimatedHeight = 360;
  let top = rect.bottom + 8;
  if (top > window.innerHeight - estimatedHeight - 12) {
    top = Math.max(12, rect.top - estimatedHeight - 8);
  }
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
}

function openNotificationPopover() {
  els.notificationPopover.classList.remove("hidden");
}

function closeNotificationPopover() {
  els.notificationPopover.classList.add("hidden");
}

function isNotificationPopoverOpen() {
  return !els.notificationPopover.classList.contains("hidden");
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function parseDateTime(value, kind) {
  if (!value) return new Date(NaN);
  if (value.endsWith("Z") || /[+-]\d\d:\d\d$/.test(value)) return new Date(value);
  if (value.includes("T")) return new Date(`${value}:00+09:00`);
  const fallbackTime = kind === "due" ? "23:59:59" : "00:00:00";
  return new Date(`${value}T${fallbackTime}+09:00`);
}

function toInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toInputTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function toInputDateTime(date) {
  return `${toInputDate(date)}T${toInputTime(date)}`;
}

function combineDateAndTime(dateValue, timeValue) {
  if (!dateValue) return "";
  if (!timeValue) return dateValue;
  return `${dateValue}T${timeValue}`;
}

function hasTimePart(value) {
  return typeof value === "string" && value.includes("T");
}

function formatDateTimeForDisplay(value) {
  if (!value) return "";
  if (!hasTimePart(value)) return formatDateForDisplay(value);
  const [date, time] = value.split("T");
  const hhmm = (time || "").slice(0, 5);
  return `${formatDateForDisplay(date)} ${hhmm}`.trim();
}

function formatDateForDisplay(value) {
  return String(value).split("T")[0].replaceAll("-", "/");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
