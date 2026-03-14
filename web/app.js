const state = {
  todos: [],
  editingTodoId: null,
  pendingDeleteTodoId: null,
  editingProjectId: null,
  availableProjects: [],
  selectedProjectId: null,
  projectSearch: "",
  projectPickerOpen: false,
  projectCreatorOpen: false,
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
  projectInput: document.getElementById("todo-project-input"),
  projectPicker: document.getElementById("todo-project-picker"),
  projectOptions: document.getElementById("todo-project-options"),
  projectClearButton: document.getElementById("todo-project-clear"),
  projectCreateToggleButton: document.getElementById("project-create-toggle"),
  projectCreator: document.getElementById("project-quick-create"),
  projectNameInput: document.getElementById("project-name-input"),
  saveProjectButton: document.getElementById("save-project-button"),
  cancelProjectCreateButton: document.getElementById("cancel-project-create"),
  projectValidation: document.getElementById("project-validation-message"),
  projectManagerButton: document.getElementById("project-manager-button"),
  projectManagementDialog: document.getElementById("project-management-dialog"),
  projectManageNameInput: document.getElementById("project-manage-name-input"),
  saveManagedProjectButton: document.getElementById("save-managed-project-button"),
  cancelProjectEditButton: document.getElementById("cancel-project-edit"),
  closeProjectManagementButton: document.getElementById("close-project-management"),
  projectManagementValidation: document.getElementById("project-management-validation"),
  projectManagementList: document.getElementById("project-management-list"),
  assignee: document.getElementById("todo-assignee"),
  recurrence: document.getElementById("todo-recurrence"),
  parent: document.getElementById("todo-parent"),
  cancelEditButton: document.getElementById("todo-cancel-edit"),
  submitButton: document.getElementById("todo-submit-button"),
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
  calendarMonthHeading: document.getElementById("calendar-month-heading"),
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
    await Promise.all([loadTodos(), loadProjects()]);
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
    closeProjectPicker({ commitSelection: true, renderAfter: false });
    closeDialog(els.projectManagementDialog);
    closeProjectCreator({ clearInput: false });
    resetProjectEditor();
    render();
    openDialog(els.settingsDialog);
  });

  els.projectManagerButton.addEventListener("click", () => {
    closeNotificationPopover();
    closeCalendarPopover();
    closeProjectPicker({ commitSelection: true, renderAfter: false });
    closeDialog(els.settingsDialog);
    closeProjectCreator({ clearInput: false });
    resetProjectEditor();
    render();
    openDialog(els.projectManagementDialog);
  });

  els.closeNotificationSettings.addEventListener("click", () => {
    closeDialog(els.settingsDialog);
  });

  els.projectManagementDialog.addEventListener("close", () => {
    resetProjectEditor();
    render();
  });

  els.closeProjectManagementButton.addEventListener("click", () => {
    closeDialog(els.projectManagementDialog);
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

    if (!els.projectPicker.contains(target)) {
      closeProjectPicker({ commitSelection: true });
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNotificationPopover();
      closeCalendarPopover();
      closeProjectPicker({ commitSelection: true });
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

  els.projectCreateToggleButton.addEventListener("click", () => {
    toggleProjectCreator();
  });

  els.cancelProjectCreateButton.addEventListener("click", () => {
    closeProjectCreator();
  });

  els.saveProjectButton.addEventListener("click", async () => {
    await submitProjectCreator();
  });

  els.projectNameInput.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    await submitProjectCreator();
  });

  els.projectInput.addEventListener("focus", () => {
    openProjectPicker();
  });

  els.projectInput.addEventListener("click", () => {
    openProjectPicker();
  });

  els.projectInput.addEventListener("input", () => {
    state.projectSearch = String(els.projectInput.value || "");
    if (getSelectedProjectName() !== state.projectSearch.trim()) {
      state.selectedProjectId = null;
    }
    openProjectPicker();
    renderProjectField();
  });

  els.projectInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeProjectPicker({ commitSelection: true });
      return;
    }
    if (event.key !== "Enter") return;
    event.preventDefault();
    commitProjectSelectionFromInput();
  });

  els.projectClearButton.addEventListener("click", () => {
    clearSelectedProject();
  });

  els.projectOptions.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const option = target.closest("button[data-project-id]");
    if (!option) return;

    const rawProjectID = option.dataset.projectId;
    if (rawProjectID === "none") {
      clearSelectedProject();
      return;
    }
    selectProjectByID(Number(rawProjectID));
  });

  els.saveManagedProjectButton.addEventListener("click", async () => {
    await submitProjectEditor();
  });

  els.cancelProjectEditButton.addEventListener("click", () => {
    resetProjectEditor();
    render();
  });

  els.projectManageNameInput.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    await submitProjectEditor();
  });

  els.projectManagementList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const editButton = target.closest("button[data-edit-project-id]");
    if (editButton) {
      beginProjectEditing(Number(editButton.dataset.editProjectId));
      return;
    }

    const deleteButton = target.closest("button[data-delete-project-id]");
    if (deleteButton) {
      await deleteProject(Number(deleteButton.dataset.deleteProjectId));
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

async function loadProjects() {
  const projects = await requestJSON("/api/projects");
  state.availableProjects = Array.isArray(projects)
    ? projects.map(fromApiProject).filter((project) => project.name)
    : [];
  state.availableProjects.sort((left, right) => left.name.localeCompare(right.name, "ja", { sensitivity: "base" }));
  syncSelectedProject();
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
    projectId: state.selectedProjectId,
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
      projectId: todo.projectId,
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
  if (Object.hasOwn(changes, "projectId")) payload.project_id = changes.projectId;
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
        projectId: todo.projectId,
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
  const project = fromApiProject(todo.project);
  return {
    id: todo.id,
    title: todo.title || "",
    description: todo.description || "",
    status: todo.status || "active",
    startDate: todo.start_date || "",
    dueDate: todo.due_date || "",
    assignee: todo.assignee || "",
    projectId: Number.isInteger(todo.project_id) ? todo.project_id : project ? project.id : null,
    project,
    recurrence: todo.recurrence_rule || "none",
    parentTodoId: todo.parent_todo_id ?? null,
    createdAt: todo.created_at || "",
    updatedAt: todo.updated_at || "",
  };
}

function fromApiProject(project) {
  if (!project || typeof project !== "object") {
    return null;
  }
  return {
    id: Number(project.id),
    name: typeof project.name === "string" ? project.name.trim() : "",
    createdAt: project.created_at || "",
    updatedAt: project.updated_at || "",
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
    project_id: todo.projectId ?? null,
    recurrence_rule: todo.recurrence || "none",
    parent_todo_id: todo.parentTodoId,
  };
}

function render() {
  updateFormMode();
  updateProjectEditorMode();
  syncProjectInput();
  syncDateDisplays();
  syncCreateSummary();
  renderProjectOptions();
  renderProjectManagementList();
  renderParentOptions();
  renderTodoList();
  renderNotifications();
}

function renderProjectField() {
  syncProjectInput();
  syncCreateSummary();
  renderProjectOptions();
}

function renderProjectOptions() {
  els.projectOptions.classList.toggle("hidden", !state.projectPickerOpen);
  els.projectInput.setAttribute("aria-expanded", state.projectPickerOpen ? "true" : "false");
  els.projectClearButton.classList.toggle("hidden", state.selectedProjectId === null && !state.projectSearch.trim());
  els.projectCreator.classList.toggle("hidden", !state.projectCreatorOpen);

  if (!state.projectPickerOpen) {
    return;
  }

  const filteredProjects = getFilteredProjects(state.projectSearch);
  const selectedProject = getSelectedProject();
  const options = [
    `
      <button
        type="button"
        class="project-option${selectedProject === null ? " is-selected" : ""}"
        data-project-id="none"
        role="option"
        aria-selected="${selectedProject === null ? "true" : "false"}"
      >
        <span class="project-option-name">未設定</span>
        <span class="project-option-meta">プロジェクトなし</span>
      </button>
    `,
  ];

  if (filteredProjects.length === 0) {
    options.push('<p class="empty project-empty">一致するプロジェクトはありません。</p>');
  } else {
    options.push(
      filteredProjects
        .map(
          (project) => `
            <button
              type="button"
              class="project-option${project.id === state.selectedProjectId ? " is-selected" : ""}"
              data-project-id="${project.id}"
              role="option"
              aria-selected="${project.id === state.selectedProjectId ? "true" : "false"}"
            >
              <span class="project-option-name">${escapeHtml(project.name)}</span>
              <span class="project-option-meta">${project.id === state.selectedProjectId ? "選択中" : "候補"}</span>
            </button>
          `,
        )
        .join(""),
    );
  }

  els.projectOptions.innerHTML = options.join("");
}

function renderProjectManagementList() {
  if (state.availableProjects.length === 0) {
    els.projectManagementList.innerHTML = `<p class="empty">プロジェクトはまだありません。</p>`;
    return;
  }

  els.projectManagementList.innerHTML = state.availableProjects
    .map(
      (project) => `
        <article class="project-admin-row${project.id === state.editingProjectId ? " is-editing" : ""}">
          <div>
            <p class="project-admin-name">${escapeHtml(project.name)}</p>
          </div>
          <div class="project-admin-actions">
            <button class="secondary-btn secondary-btn-small" type="button" data-edit-project-id="${project.id}">
              編集
            </button>
            <button class="danger-btn danger-btn-small" type="button" data-delete-project-id="${project.id}">
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
      const project = todo.project ? `<span class="meta-chip">プロジェクト ${escapeHtml(todo.project.name)}</span>` : "";
      const parent = todo.parentTodoId ? `<span class="meta-chip">親タスク #${todo.parentTodoId}</span>` : "";
      const isEditing = todo.id === state.editingTodoId;
      return `
        <article class="todo-card${isEditing ? " is-editing" : ""}">
          <div class="todo-top">
            <div class="todo-copy">
              <h3 class="todo-title">${escapeHtml(todo.title)}</h3>
              ${todo.description ? `<p class="todo-description">${escapeHtml(todo.description)}</p>` : ""}
            </div>
            <span class="status-badge status-${todo.status}">${escapeHtml(getStatusText(todo.status))}</span>
          </div>
          <div class="todo-meta">
            ${todo.startDate ? `<span class="meta-chip">開始 ${formatDateTimeForDisplay(todo.startDate)}</span>` : ""}
            ${todo.dueDate ? `<span class="meta-chip">期限 ${formatDateTimeForDisplay(todo.dueDate)}</span>` : ""}
            ${todo.assignee ? `<span class="meta-chip">担当 ${escapeHtml(todo.assignee)}</span>` : ""}
            ${project}
            ${todo.recurrence !== "none" ? `<span class="meta-chip">繰り返し ${escapeHtml(getRecurrenceText(todo.recurrence))}</span>` : ""}
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
        ${escapeHtml(getStatusText(status))}
      </button>
    `;
  }).join("");
}

function showValidation(message) {
  els.validation.textContent = message;
}

function showProjectValidation(message) {
  els.projectValidation.textContent = message;
}

function showProjectManagementValidation(message) {
  els.projectManagementValidation.textContent = message;
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
  state.selectedProjectId = null;
  state.projectSearch = "";
  els.assignee.value = "";
  els.parent.value = "";
  els.recurrence.value = "none";
  els.advancedSettings.open = preserveAdvancedState ? advancedWasOpen : false;
  closeProjectPicker({ commitSelection: false, renderAfter: false });
  closeProjectCreator();
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
    ? "タイトル・プロジェクト・期限・担当者などを見直して保存"
    : "タイトル・プロジェクト・期限・担当者などを設定して追加";
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
  state.selectedProjectId = todo.projectId;
  syncSelectedProject(todo.project ? todo.project.name : "");
  els.assignee.value = todo.assignee;
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
    projectName: getSelectedProjectName(),
    projectDraft: state.selectedProjectId === null ? state.projectSearch.trim() : "",
    assignee: (els.assignee.value || "").trim(),
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
      snapshot.projectName ||
      snapshot.projectDraft ||
      snapshot.assignee ||
      snapshot.recurrence !== "none" ||
      snapshot.parentTodoId,
  );
}

function buildFormPreview(snapshot, editing) {
  const meta = [];
  if (snapshot.dueDate) meta.push(`期限 ${formatDateTimeForDisplay(snapshot.dueDate)}`);
  if (snapshot.startDate) meta.push(`開始 ${formatDateTimeForDisplay(snapshot.startDate)}`);
  if (snapshot.projectName) meta.push(`プロジェクト ${snapshot.projectName}`);
  if (!snapshot.projectName && snapshot.projectDraft) meta.push(`プロジェクト候補 ${snapshot.projectDraft}`);
  if (snapshot.assignee) meta.push(`担当 ${snapshot.assignee}`);
  if (snapshot.recurrence !== "none") meta.push(`繰り返し ${getRecurrenceText(snapshot.recurrence)}`);
  if (snapshot.parentTodoId) meta.push(`親タスク #${snapshot.parentTodoId}`);
  if (meta.length === 0) {
    meta.push(editing ? "保存前の内容を保持しています" : "タイトルだけでもすぐに追加できます");
  }

  return {
    title: snapshot.title || (editing ? "タイトル未入力の編集中Todo" : "タイトル未入力の新規Todo"),
    meta: meta.join(" / "),
  };
}

function syncProjectInput() {
  if (els.projectInput.value !== state.projectSearch) {
    els.projectInput.value = state.projectSearch;
  }
  els.projectCreateToggleButton.textContent = state.projectCreatorOpen
    ? "作成を閉じる"
    : "+ 新しいプロジェクト";
}

function updateProjectEditorMode() {
  const editing = Number.isInteger(state.editingProjectId);
  els.cancelProjectEditButton.hidden = !editing;
  els.saveManagedProjectButton.textContent = "保存";
}

function toggleProjectCreator() {
  if (state.projectCreatorOpen) {
    closeProjectCreator();
    render();
    return;
  }

  state.projectCreatorOpen = true;
  els.projectNameInput.value = state.selectedProjectId === null ? state.projectSearch.trim() : "";
  showProjectValidation("");
  render();
  els.projectNameInput.focus();
}

function closeProjectCreator({ clearInput = true } = {}) {
  state.projectCreatorOpen = false;
  if (clearInput) {
    els.projectNameInput.value = "";
  }
  showProjectValidation("");
}

async function submitProjectCreator() {
  const name = normalizeProjectName(els.projectNameInput.value);
  if (!name) {
    showProjectValidation("プロジェクト名を入力してください。");
    return;
  }
  if (findProjectByName(name)) {
    showProjectValidation("このプロジェクト名はすでに存在します");
    return;
  }

  try {
    const created = await requestJSON("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    const project = fromApiProject(created);
    state.selectedProjectId = project ? project.id : null;
    state.projectSearch = project ? project.name : name;
    await loadProjects();
    closeProjectCreator();
    showProjectValidation("");
    closeProjectPicker({ commitSelection: false, renderAfter: false });
  } catch (error) {
    console.error(error);
    showProjectValidation(extractProjectErrorMessage(error, "プロジェクトの保存に失敗しました。"));
  }

  render();
}

function resetProjectEditor() {
  state.editingProjectId = null;
  els.projectManageNameInput.value = "";
  showProjectManagementValidation("");
}

function beginProjectEditing(projectID) {
  const project = findProjectByID(projectID);
  if (!project) {
    showProjectManagementValidation("編集対象のプロジェクトが見つかりません。");
    return;
  }
  state.editingProjectId = project.id;
  els.projectManageNameInput.value = project.name;
  showProjectManagementValidation("");
  render();
  els.projectManageNameInput.focus();
}

async function submitProjectEditor() {
  const name = normalizeProjectName(els.projectManageNameInput.value);
  if (!name) {
    showProjectManagementValidation("プロジェクト名を入力してください。");
    return;
  }

  try {
    if (Number.isInteger(state.editingProjectId)) {
      await requestJSON(`/api/projects/${state.editingProjectId}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      await Promise.all([loadProjects(), loadTodos()]);
    } else {
      await requestJSON("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      await loadProjects();
    }

    resetProjectEditor();
    showProjectManagementValidation("");
  } catch (error) {
    console.error(error);
    showProjectManagementValidation(extractProjectErrorMessage(error, "プロジェクトの保存に失敗しました。"));
  }

  render();
}

async function deleteProject(projectID) {
  const project = findProjectByID(projectID);
  if (!project) {
    showProjectManagementValidation("削除対象のプロジェクトが見つかりません。");
    return;
  }
  if (!window.confirm("このプロジェクトを削除しますか？")) {
    return;
  }

  try {
    await requestJSON(`/api/projects/${projectID}`, {
      method: "DELETE",
    });
    if (state.selectedProjectId === projectID) {
      state.selectedProjectId = null;
      state.projectSearch = "";
    }
    if (state.editingProjectId === projectID) {
      resetProjectEditor();
    }
    await Promise.all([loadProjects(), loadTodos()]);
    showProjectManagementValidation("");
  } catch (error) {
    console.error(error);
    showProjectManagementValidation(extractProjectErrorMessage(error, "プロジェクトの削除に失敗しました。"));
  }

  render();
}

function openProjectPicker() {
  if (state.projectPickerOpen) return;
  state.projectPickerOpen = true;
  renderProjectField();
}

function closeProjectPicker({ commitSelection = true, renderAfter = true } = {}) {
  if (!state.projectPickerOpen) {
    return;
  }
  if (commitSelection) {
    commitProjectSelectionFromInput({ renderAfter: false });
  }
  state.projectPickerOpen = false;
  if (renderAfter) renderProjectField();
}

function commitProjectSelectionFromInput({ renderAfter = true } = {}) {
  const query = normalizeProjectName(state.projectSearch);
  if (!query) {
    state.selectedProjectId = null;
    state.projectSearch = "";
    if (renderAfter) renderProjectField();
    return;
  }

  const exactMatch = findProjectByName(query);
  if (exactMatch) {
    state.selectedProjectId = exactMatch.id;
    state.projectSearch = exactMatch.name;
  } else if (state.selectedProjectId !== null) {
    const selectedProject = getSelectedProject();
    if (selectedProject) {
      state.projectSearch = selectedProject.name;
    } else {
      state.selectedProjectId = null;
      state.projectSearch = query;
    }
  } else {
    state.projectSearch = query;
  }

  if (renderAfter) renderProjectField();
}

function selectProjectByID(projectID) {
  const project = findProjectByID(projectID);
  if (!project) return;
  state.selectedProjectId = project.id;
  state.projectSearch = project.name;
  state.projectPickerOpen = false;
  renderProjectField();
}

function clearSelectedProject({ renderAfter = true } = {}) {
  state.selectedProjectId = null;
  state.projectSearch = "";
  state.projectPickerOpen = false;
  if (renderAfter) renderProjectField();
}

function syncSelectedProject(fallbackName = "") {
  if (state.selectedProjectId === null) {
    if (!state.projectSearch && fallbackName) {
      state.projectSearch = fallbackName;
    }
    return;
  }

  const project = findProjectByID(state.selectedProjectId);
  if (!project) {
    state.selectedProjectId = null;
    state.projectSearch = fallbackName;
    return;
  }
  state.projectSearch = project.name;
}

function getFilteredProjects(query) {
  const normalizedQuery = normalizeProjectName(query).toLowerCase();
  if (!normalizedQuery) {
    return state.availableProjects.slice();
  }
  return state.availableProjects.filter((project) => project.name.toLowerCase().includes(normalizedQuery));
}

function getSelectedProject() {
  return findProjectByID(state.selectedProjectId);
}

function getSelectedProjectName() {
  const project = getSelectedProject();
  return project ? project.name : "";
}

function findProjectByID(projectID) {
  return state.availableProjects.find((project) => project.id === projectID) || null;
}

function findProjectByName(name) {
  const target = normalizeProjectName(name).toLowerCase();
  if (!target) return null;
  return state.availableProjects.find((project) => project.name.toLowerCase() === target) || null;
}

function normalizeProjectName(name) {
  return String(name || "").trim();
}

function extractProjectErrorMessage(error, fallback) {
  const message = extractErrorMessage(error, fallback);
  if (message === "project already exists") return "このプロジェクト名はすでに存在します";
  if (message === "project name is required") return "プロジェクト名を入力してください。";
  return message;
}

function getStatusText(status) {
  return STATUS_LABELS[status] || status;
}

function getRecurrenceText(recurrence) {
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
  els.calendarMonthHeading.textContent = new Intl.DateTimeFormat("ja-JP", {
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
