const state = {
  todos: [],
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

const els = {
  createCollapsible: document.getElementById("todo-create-collapsible"),
  advancedSettings: document.getElementById("todo-advanced-settings"),
  form: document.getElementById("todo-form"),
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
  labels: document.getElementById("todo-labels"),
  recurrence: document.getElementById("todo-recurrence"),
  parent: document.getElementById("todo-parent"),
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
};

bindEvents();
initializeApp();

async function initializeApp() {
  render();
  try {
    await loadTodos();
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
  });

  els.advancedSettings.addEventListener("toggle", () => {
    if (!els.advancedSettings.open) {
      closeCalendarPopover();
    }
  });

  els.settingsButton.addEventListener("click", () => {
    closeNotificationPopover();
    closeCalendarPopover();
    openDialog(els.settingsDialog);
  });

  els.closeNotificationSettings.addEventListener("click", () => {
    closeDialog(els.settingsDialog);
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
    await createTodo();
  });

  els.todoList.addEventListener("change", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (!target.classList.contains("status-select")) return;

    const id = Number(target.dataset.todoId);
    const todo = state.todos.find((item) => item.id === id);
    if (!todo) return;

    const previousStatus = todo.status;
    const nextStatus = target.value;

    try {
      const updatedTodo = await patchTodo(id, { status: nextStatus });
      if (previousStatus !== "completed" && updatedTodo.status === "completed" && updatedTodo.recurrence !== "none") {
        await createNextRecurringTodo(updatedTodo);
      }
      await loadTodos();
      showValidation("");
    } catch (error) {
      console.error(error);
      target.value = previousStatus;
      showValidation(extractErrorMessage(error, "Todoの状態更新に失敗しました。"));
    }

    render();
  });

  els.todoList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-delete-id]");
    if (!button) return;

    try {
      await deleteTodo(Number(button.dataset.deleteId));
      await loadTodos();
      showValidation("");
    } catch (error) {
      console.error(error);
      showValidation(extractErrorMessage(error, "Todoの削除に失敗しました。"));
    }

    render();
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
}

async function createTodo() {
  const todo = buildTodoFromForm();

  if (!todo.title) {
    showValidation("Title is required.");
    return;
  }
  if (todo.title.length > 120) {
    showValidation("Title must be 120 characters or fewer.");
    return;
  }
  if (els.startTime.value && !els.startDate.value) {
    showValidation("Start date is required when start time is set.");
    return;
  }
  if (els.dueTime.value && !els.dueDate.value) {
    showValidation("Due date is required when due time is set.");
    return;
  }
  if (!isValidStartDue(todo.startDate, todo.dueDate)) {
    showValidation("Due date must be on or after start date.");
    return;
  }

  try {
    await requestJSON("/api/todos", {
      method: "POST",
      body: JSON.stringify(toApiTodoPayload(todo)),
    });
    clearForm();
    showValidation("");
    await loadTodos();
  } catch (error) {
    console.error(error);
    showValidation(extractErrorMessage(error, "Todoの保存に失敗しました。"));
  }

  render();
}

function buildTodoFromForm() {
  const labels = (els.labels.value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    title: (els.title.value || "").trim(),
    description: (els.description.value || "").trim(),
    status: "active",
    startDate: combineDateAndTime(els.startDate.value, els.startTime.value),
    dueDate: combineDateAndTime(els.dueDate.value, els.dueTime.value),
    assignee: (els.assignee.value || "").trim(),
    labels,
    recurrence: els.recurrence.value || "none",
    parentTodoId: els.parent.value ? Number(els.parent.value) : null,
  };
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
  syncDateDisplays();
  renderParentOptions();
  renderTodoList();
  renderNotifications();
}

function renderParentOptions() {
  const currentValue = els.parent.value;
  els.parent.innerHTML = `
    <md-select-option value="">
      <div slot="headline">なし</div>
    </md-select-option>
  `;

  for (const todo of state.todos) {
    const option = document.createElement("md-select-option");
    option.value = String(todo.id);
    option.innerHTML = `<div slot="headline">#${todo.id} ${escapeHtml(todo.title)}</div>`;
    els.parent.appendChild(option);
  }

  if (currentValue && state.todos.some((todo) => String(todo.id) === currentValue)) {
    els.parent.value = currentValue;
    return;
  }
  els.parent.value = "";
}

function renderTodoList() {
  const visible = state.todos;

  els.todoCount.textContent = `${visible.length} items`;

  if (visible.length === 0) {
    els.todoList.innerHTML = `<p class="empty">一致するTodoはありません。</p>`;
    return;
  }

  els.todoList.innerHTML = visible
    .map((todo) => {
      const labels = todo.labels.map((label) => `<span class="meta-chip">#${escapeHtml(label)}</span>`).join("");
      const parent = todo.parentTodoId ? `<span class="meta-chip">parent: #${todo.parentTodoId}</span>` : "";
      return `
        <article class="todo-card">
          <div class="todo-top">
            <div>
              <h3 class="todo-title">${escapeHtml(todo.title)}</h3>
              <p>${escapeHtml(todo.description || "")}</p>
            </div>
            <span class="meta-chip">${todo.status}</span>
          </div>
          <div class="todo-meta">
            ${todo.startDate ? `<span class="meta-chip">start: ${formatDateTimeForDisplay(todo.startDate)}</span>` : ""}
            ${todo.dueDate ? `<span class="meta-chip">due: ${formatDateTimeForDisplay(todo.dueDate)}</span>` : ""}
            ${todo.assignee ? `<span class="meta-chip">@${escapeHtml(todo.assignee)}</span>` : ""}
            ${todo.recurrence !== "none" ? `<span class="meta-chip">repeat: ${todo.recurrence}</span>` : ""}
            ${labels}
            ${parent}
          </div>
          <div class="todo-actions">
            <select class="status-select" data-todo-id="${todo.id}">
              ${renderStatusOptions(todo.status)}
            </select>
            <button class="danger-btn" data-delete-id="${todo.id}">削除</button>
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
          title: `Start reminder: ${todo.title}`,
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
          title: `Due reminder: ${todo.title}`,
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

function renderStatusOptions(selectedStatus) {
  const statuses = ["active", "in_progress", "waiting", "completed"];
  return statuses
    .map((status) => `<option value="${status}" ${selectedStatus === status ? "selected" : ""}>${status}</option>`)
    .join("");
}

function showValidation(message) {
  els.validation.textContent = message;
}

function clearForm() {
  els.form.reset();
  els.startDate.value = "";
  els.dueDate.value = "";
  els.parent.value = "";
  els.recurrence.value = "none";
  if (els.advancedSettings.open) {
    els.advancedSettings.open = false;
  }
  syncDateDisplays();
  closeCalendarPopover();
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
  closeCalendarPopover();
}

function clearCalendarDate() {
  if (state.calendar.target === "start") {
    els.startDate.value = "";
  } else if (state.calendar.target === "due") {
    els.dueDate.value = "";
  }
  syncDateDisplays();
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
