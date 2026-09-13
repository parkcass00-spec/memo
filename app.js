(() => {
  const STORAGE_KEY = "neon-calendar-data";

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
  const monthLabel = document.getElementById("monthLabel");
  const selectedDateLabel = document.getElementById("selectedDateLabel");
  const memoInput = document.getElementById("memoInput");
  const todoForm = document.getElementById("todoForm");
  const todoInput = document.getElementById("todoInput");
  const todoAddBtn = document.getElementById("todoAddBtn");
  const todoList = document.getElementById("todoList");
  const todoEmpty = document.getElementById("todoEmpty");

  document.getElementById("prevMonth").addEventListener("click", () => {
    changeMonth(-1);
  });
  document.getElementById("nextMonth").addEventListener("click", () => {
    changeMonth(1);
  });
  document.getElementById("todayBtn").addEventListener("click", () => {
    const now = new Date();
    state.viewYear = now.getFullYear();
    state.viewMonth = now.getMonth();
    selectDate(formatDate(now));
    renderCalendar();
  });

  memoInput.addEventListener("input", () => {
    if (!state.selectedDate) return;
    const entry = getEntry(state.selectedDate);
    entry.memo = memoInput.value;
    saveData();
    renderCalendar();
  });

  todoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!state.selectedDate) return;
    const text = todoInput.value.trim();
    if (!text) return;
    const entry = getEntry(state.selectedDate);
    entry.todos.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text, done: false });
    todoInput.value = "";
    saveData();
    renderTodos();
    renderCalendar();
  });

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
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
      state.data[dateKey] = { memo: "", todos: [] };
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
    renderCalendar();
  }

  function renderCalendar() {
    monthLabel.textContent = `${state.viewYear}년 ${state.viewMonth + 1}월`;
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

      const numEl = document.createElement("div");
      numEl.className = "day-number";
      numEl.textContent = cellDate.getDate();
      cell.appendChild(numEl);

      const entry = state.data[dateKey];
      const meta = document.createElement("div");
      meta.className = "day-meta";
      if (entry) {
        if (entry.memo && entry.memo.trim()) {
          const flag = document.createElement("span");
          flag.className = "memo-flag";
          flag.textContent = "✎";
          meta.appendChild(flag);
        }
        if (entry.todos && entry.todos.length) {
          const doneCount = entry.todos.filter((t) => t.done).length;
          const count = document.createElement("span");
          count.className = "todo-count";
          count.textContent = `${doneCount}/${entry.todos.length}`;
          meta.appendChild(count);
        }
      }
      cell.appendChild(meta);

      cell.addEventListener("click", () => {
        selectDate(dateKey);
        if (otherMonth) {
          state.viewYear = cellDate.getFullYear();
          state.viewMonth = cellDate.getMonth();
          renderCalendar();
        }
      });

      calendarGrid.appendChild(cell);
    }
  }

  function selectDate(dateKey) {
    state.selectedDate = dateKey;
    const [y, m, d] = dateKey.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"];
    selectedDateLabel.textContent = `${y}년 ${m}월 ${d}일 (${weekdayNames[dateObj.getDay()]})`;

    memoInput.disabled = false;
    todoInput.disabled = false;
    todoAddBtn.disabled = false;

    const entry = getEntry(dateKey);
    memoInput.value = entry.memo || "";

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
    if (!entry.todos.length) {
      todoEmpty.style.display = "block";
      todoEmpty.textContent = "할 일이 없습니다.";
      return;
    }
    todoEmpty.style.display = "none";

    entry.todos.forEach((todo) => {
      const li = document.createElement("li");
      li.className = "todo-item" + (todo.done ? " done" : "");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "todo-check";
      checkbox.checked = todo.done;
      checkbox.addEventListener("change", () => {
        todo.done = checkbox.checked;
        saveData();
        renderTodos();
        renderCalendar();
      });

      const text = document.createElement("span");
      text.className = "todo-text";
      text.textContent = todo.text;

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "todo-delete";
      deleteBtn.textContent = "✕";
      deleteBtn.addEventListener("click", () => {
        entry.todos = entry.todos.filter((t) => t.id !== todo.id);
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
