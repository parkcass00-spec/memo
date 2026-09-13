(() => {
  const STORAGE_KEY = "neon-calendar-data";
  const YEAR_RANGE = 10;

  const state = {
    viewYear: null,
    viewMonth: null, // 0-indexed
    selectedDate: null, // "YYYY-MM-DD"
    data: loadData(),
  };

  const todayObj = new Date();
  state.viewYear = todayObj.getFullYear();
  state.viewMonth = todayObj.getMonth();

  const calendarGrid = document.getElementById("calendarGrid");
  const yearSelect = document.getElementById("yearSelect");
  const monthSelect = document.getElementById("monthSelect");
  const selectedDateLabel = document.getElementById("selectedDateLabel");
  const todoForm = document.getElementById("todoForm");
  const todoInput = document.getElementById("todoInput");
  const todoAddBtn = document.getElementById("todoAddBtn");
  const todoList = document.getElementById("todoList");
  const todoEmpty = document.getElementById("todoEmpty");

  populateSelectors();

  document.getElementById("prevMonth").addEventListener("click", () => changeMonth(-1));
  document.getElementById("nextMonth").addEventListener("click", () => changeMonth(1));
  document.getElementById("todayBtn").addEventListener("click", () => {
    const now = new Date();
    state.viewYear = now.getFullYear();
    state.viewMonth = now.getMonth();
    syncSelectors();
    selectDate(formatDate(now));
    renderCalendar();
  });

  yearSelect.addEventListener("change", () => {
    state.viewYear = Number(yearSelect.value);
    renderCalendar();
  });

  monthSelect.addEventListener("change", () => {
    state.viewMonth = Number(monthSelect.value);
    renderCalendar();
  });

  todoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!state.selectedDate) return;
    const text = todoInput.value.trim();
    if (!text) return;
    const entry = getEntry(state.selectedDate);
    entry.items.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text, done: false });
    todoInput.value = "";
    saveData();
    renderTodos();
    renderCalendar();
  });

  function populateSelectors() {
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = "";
    for (let y = currentYear - YEAR_RANGE; y <= currentYear + YEAR_RANGE; y++) {
      const opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      yearSelect.appendChild(opt);
    }
    monthSelect.innerHTML = "";
    for (let m = 0; m < 12; m++) {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m + 1;
      monthSelect.appendChild(opt);
    }
    syncSelectors();
  }

  function syncSelectors() {
    yearSelect.value = state.viewYear;
    monthSelect.value = state.viewMonth;
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return migrateData(parsed);
    } catch (e) {
      return {};
    }
  }

  function migrateData(parsed) {
    const migrated = {};
    Object.keys(parsed).forEach((dateKey) => {
      const entry = parsed[dateKey];
      const items = Array.isArray(entry.items) ? entry.items.slice() : [];
      if (Array.isArray(entry.todos)) {
        entry.todos.forEach((t) => items.push(t));
      }
      if (typeof entry.memo === "string" && entry.memo.trim()) {
        items.unshift({ id: "memo-" + dateKey, text: entry.memo.trim(), done: false });
      }
      migrated[dateKey] = { items };
    });
    return migrated;
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    } catch (e) {
      /* storage unavailable, ignore */
    }
  }

  function getEntry(dateKey) {
    if (!state.data[dateKey]) {
      state.data[dateKey] = { items: [] };
    }
    return state.data[dateKey];
  }

  function formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function changeMonth(delta) {
    state.viewMonth += delta;
    if (state.viewMonth < 0) {
      state.viewMonth = 11;
      state.viewYear -= 1;
    } else if (state.viewMonth > 11) {
      state.viewMonth = 0;
      state.viewYear += 1;
    }
    syncSelectors();
    renderCalendar();
  }

  function renderCalendar() {
    calendarGrid.innerHTML = "";

    const firstOfMonth = new Date(state.viewYear, state.viewMonth, 1);
    const startWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(state.viewYear, state.viewMonth, 0).getDate();
    const todayKey = formatDate(new Date());

    const totalCells = 42;
    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - startWeekday + 1;
      let cellDate, otherMonth = false;

      if (dayNum < 1) {
        cellDate = new Date(state.viewYear, state.viewMonth - 1, daysInPrevMonth + dayNum);
        otherMonth = true;
      } else if (dayNum > daysInMonth) {
        cellDate = new Date(state.viewYear, state.viewMonth + 1, dayNum - daysInMonth);
        otherMonth = true;
      } else {
        cellDate = new Date(state.viewYear, state.viewMonth, dayNum);
      }

      const dateKey = formatDate(cellDate);
      const weekday = cellDate.getDay();

      const cell = document.createElement("div");
      cell.className = "day-cell";
      if (otherMonth) cell.classList.add("other-month");
      if (weekday === 0) cell.classList.add("sunday");
      if (weekday === 6) cell.classList.add("saturday");
      if (dateKey === todayKey) cell.classList.add("today");
      if (dateKey === state.selectedDate) cell.classList.add("selected");

      if (!otherMonth) {
        const numEl = document.createElement("div");
        numEl.className = "day-number";
        numEl.textContent = cellDate.getDate();
        cell.appendChild(numEl);

        const itemsWrap = document.createElement("div");
        itemsWrap.className = "cell-items";
        const entry = state.data[dateKey];
        if (entry && entry.items && entry.items.length) {
          entry.items.forEach((item) => {
            const el = document.createElement("div");
            el.className = "cell-item" + (item.done ? " done" : "");
            el.textContent = item.text;
            itemsWrap.appendChild(el);
          });
        }
        cell.appendChild(itemsWrap);

        cell.addEventListener("click", () => {
          selectDate(dateKey);
        });
      }

      calendarGrid.appendChild(cell);
    }
  }

  function selectDate(dateKey) {
    state.selectedDate = dateKey;
    const [y, m, d] = dateKey.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"];
    selectedDateLabel.textContent = `${y}년 ${m}월 ${d}일 (${weekdayNames[dateObj.getDay()]})`;

    todoInput.disabled = false;
    todoAddBtn.disabled = false;

    renderTodos();
    renderCalendar();
  }

  function renderTodos() {
    todoList.innerHTML = "";
    if (!state.selectedDate) {
      todoEmpty.style.display = "block";
      todoEmpty.textContent = "날짜를 선택하세요.";
      return;
    }
    const entry = getEntry(state.selectedDate);
    if (!entry.items.length) {
      todoEmpty.style.display = "block";
      todoEmpty.textContent = "내용이 없습니다.";
      return;
    }
    todoEmpty.style.display = "none";

    entry.items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "todo-item" + (item.done ? " done" : "");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "todo-check";
      checkbox.checked = item.done;
      checkbox.addEventListener("change", () => {
        item.done = checkbox.checked;
        saveData();
        renderTodos();
        renderCalendar();
      });

      const text = document.createElement("span");
      text.className = "todo-text";
      text.textContent = item.text;

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "todo-delete";
      deleteBtn.textContent = "✕";
      deleteBtn.addEventListener("click", () => {
        entry.items = entry.items.filter((t) => t.id !== item.id);
        saveData();
        renderTodos();
        renderCalendar();
      });

      li.appendChild(checkbox);
      li.appendChild(text);
      li.appendChild(deleteBtn);
      todoList.appendChild(li);
    });
  }

  renderCalendar();
  selectDate(formatDate(new Date()));
})();
