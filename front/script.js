/* ==========================================
   1. БАЗОВЫЕ ДАННЫЕ И ИНИЦИАЛИЗАЦИЯ
   ========================================== */

const drivers = [
  { name: "Алишер Каримов", bus: "01 | 123 XA", route: "М-5", schedule: "even", shift: "06:00 – 22:30", status: "На линии" },
  { name: "Джамшид Султанов", bus: "01 | 456 BA", route: "М-5", schedule: "odd", shift: "06:00 – 22:30", status: "Отдых" },
  { name: "Сардор Умаров", bus: "01 | 789 CA", route: "М-12", schedule: "even", shift: "05:30 – 21:40", status: "На линии" },
  { name: "Донияр Ахмедов", bus: "01 | 321 DA", route: "М-12", schedule: "odd", shift: "05:30 – 21:40", status: "Отдых" },
  { name: "Фарход Алиев", bus: "01 | 654 EA", route: "М-2", schedule: "even", shift: "06:15 – 23:00", status: "На линии" },
  { name: "Тимур Рахимов", bus: "01 | 987 FA", route: "М-2", schedule: "odd", shift: "06:15 – 23:00", status: "Отдых" }
];

const manualDailyRecords = {};

function rng(seed, min, max) {
  const x = Math.sin(seed) * 10000;
  return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
}

document.addEventListener("DOMContentLoaded", () => {
  initClock();
  initDefaultDate();
  renderDaily();
  renderDrivers();
  renderTech();
});

function initClock() {
  const clock = document.getElementById("live-clock");
  if (clock) {
    clock.textContent = new Date().toLocaleTimeString("ru-RU");
    setInterval(() => {
      clock.textContent = new Date().toLocaleTimeString("ru-RU");
    }, 1000);
  }
}

function initDefaultDate() {
  const picker = document.getElementById("date-picker");
  if (picker && !picker.value) {
    picker.value = new Date().toISOString().slice(0, 10);
  }
}

function toggleTheme() {
  const body = document.body;
  const btnIcon = document.getElementById("theme-icon");
  const btnText = document.getElementById("theme-text");

  if (body.getAttribute("data-theme") === "light") {
    body.removeAttribute("data-theme");
    if(btnIcon) btnIcon.textContent = "🌙";
    if(btnText) btnText.textContent = "Тёмная";
  } else {
    body.setAttribute("data-theme", "light");
    if(btnIcon) btnIcon.textContent = "☀️";
    if(btnText) btnText.textContent = "Светлая";
  }
}

/* ==========================================
   2. АВТОРИЗАЦИЯ И НАВИГАЦИЯ
   ========================================== */

function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("login-error");

  if (email === "admin@mail.com" && password === "123456") {
    document.getElementById("auth-screen").style.display = "none";
    document.getElementById("main-nav").style.display = "flex";
    document.getElementById("main-content").style.display = "block";
    errorMsg.style.display = "none";
  } else {
    errorMsg.style.display = "block";
  }
}

function handleLogout() {
  document.getElementById("auth-screen").style.display = "flex";
  document.getElementById("main-nav").style.display = "none";
  document.getElementById("main-content").style.display = "none";
}

function showPage(pageId, btn) {
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(`page-${pageId}`).classList.add("active");

  if (pageId === "daily") renderDaily();
  if (pageId === "drivers") renderDrivers();
  if (pageId === "tech") renderTech();
}

/* ==========================================
   3. ДНЕВНОЙ ПЛАН И РАЗДЕЛЕНИЕ ЛИСТОВ
   ========================================== */

let currentView = "day";

function setView(viewType, btn) {
  currentView = viewType;
  document.querySelectorAll(".vt-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  if (viewType === "day") {
    document.getElementById("day-summary").style.display = "block";
    document.getElementById("month-summary").style.display = "none";
    renderDayView();
  } else {
    document.getElementById("day-summary").style.display = "none";
    document.getElementById("month-summary").style.display = "block";
    renderMonthView();
  }
}

function renderDaily() {
  if (currentView === "day") {
    document.getElementById("day-summary").style.display = "block";
    document.getElementById("month-summary").style.display = "none";
    renderDayView();
  } else {
    document.getElementById("day-summary").style.display = "none";
    document.getElementById("month-summary").style.display = "block";
    renderMonthView();
  }
  if (document.getElementById("add-trip-form-wrap").style.display === "block") {
    populateDriverSelect();
  }
}

function getSelectedDayParity() {
  const val = document.getElementById("date-picker").value || new Date().toISOString().slice(0, 10);
  const d = new Date(val + "T00:00:00");
  return (d.getDate() % 2 === 0) ? "even" : "odd";
}

function renderDayView() {
  const val = document.getElementById("date-picker").value || new Date().toISOString().slice(0, 10);
  const d = new Date(val + "T00:00:00");
  const day = d.getDate();
  const currentParity = (day % 2 === 0) ? "even" : "odd";
  const seed = day * 137 + d.getMonth() * 31 + 1;

  const bar = document.getElementById("day-info-bar");
  if (bar) {
    bar.innerHTML = `
      <span class="day-pill ${currentParity === "even" ? "day-even" : "day-odd"}">
        ${currentParity === "even" ? "Чётный день" : "Нечётный день"}
      </span>
      <span style="font-family: var(--mono); font-size: 12px; color: var(--muted);">
        ${d.toLocaleDateString("ru-RU", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </span>
    `;
  }

  const activeDriversToday = drivers.filter(drv => drv.schedule === currentParity);

  let currentBusesList = activeDriversToday.map((drv, i) => {
    const times = drv.shift.split("–");
    return {
      num: drv.bus,
      route: drv.route,
      driver: drv.name,
      out: times[0] ? times[0].trim() : "06:00",
      in: times[1] ? times[1].trim() : "22:30",
      manualTrips: null,
      manualMissed: null
    };
  });

  if (manualDailyRecords[val]) {
    manualDailyRecords[val].forEach(manualBus => {
      const existingIndex = currentBusesList.findIndex(b => b.num === manualBus.num);
      if (existingIndex !== -1) {
        currentBusesList[existingIndex].manualTrips = manualBus.manualTrips;
        currentBusesList[existingIndex].manualMissed = manualBus.manualMissed;
      } else {
        currentBusesList.push(manualBus);
      }
    });
  }

  let totalTrips = 0;
  let totalMissed = 0;

  const rowsHtml = currentBusesList.map((b, i) => {
    const trips = b.manualTrips !== null ? b.manualTrips : rng(seed + i * 13, 14, 22);
    const missed = b.manualMissed !== null ? b.manualMissed : rng(seed + i * 7 + 3, 0, 4);

    totalTrips += trips;
    totalMissed += missed;

    return `
      <tr>
        <td><span class="badge b-blue">${b.route}</span></td>
        <td><span class="bus-num">${b.num}</span></td>
        <td>${b.driver}</td>
        <td class="mono">${b.out}</td>
        <td class="mono">${b.in}</td>
        <td class="mono" style="font-weight:bold;">${trips}</td>
        <td class="mono" style="font-weight:bold; color:${missed > 0 ? 'var(--red)' : 'var(--green)'};">${missed}</td>
      </tr>
    `;
  }).join("");

  const label = document.getElementById("day-date-label");
  if (label) label.textContent = d.toLocaleDateString("ru-RU");

  const tbody = document.getElementById("daily-body");
  if (tbody) tbody.innerHTML = rowsHtml;

  const metricsDiv = document.getElementById("day-metrics");
  if (metricsDiv) {
    metricsDiv.innerHTML = `
      <div class="metric-card">
        <div class="metric-lbl">Автобусов на линии</div>
        <div class="metric-val white">${currentBusesList.length}</div>
      </div>
      <div class="metric-card green">
        <div class="metric-lbl">Всего рейсов</div>
        <div class="metric-val green">${totalTrips}</div>
      </div>
      <div class="metric-card red">
        <div class="metric-lbl">Пропущено ост.</div>
        <div class="metric-val red">${totalMissed}</div>
      </div>
    `;
  }
}

function renderMonthView() {
  const tbody = document.getElementById("month-body");
  if (!tbody) return;

  let totalTrips = 0;
  let totalMissed = 0;

  const rowsHtml = drivers.map((drv, i) => {
    const seed = i * 45 + 7;
    const workingDays = 15;
    const trips = rng(seed, 240, 290);
    const missed = rng(seed + 2, 5, 25);

    totalTrips += trips;
    totalMissed += missed;

    return `
      <tr>
        <td><span class="bus-num">${drv.bus}</span></td>
        <td>${drv.name}</td>
        <td><span class="badge b-blue">${drv.route}</span></td>
        <td class="mono">${trips}</td>
        <td class="mono" style="color:var(--red);">${missed}</td>
        <td class="mono">${workingDays}</td>
        <td><span style="color:var(--green);">● Выполнен</span></td>
      </tr>
    `;
  }).join("");

  tbody.innerHTML = rowsHtml;

  const monthMetrics = document.getElementById("month-metrics");
  if (monthMetrics) {
    monthMetrics.innerHTML = `
      <div class="metric-card green">
        <div class="metric-lbl">Рейсов за месяц</div>
        <div class="metric-val green">${totalTrips}</div>
      </div>
      <div class="metric-card red">
        <div class="metric-lbl">Пропуски за месяц</div>
        <div class="metric-val red">${totalMissed}</div>
      </div>
    `;
  }
}

/* ==========================================
   4. ЛОГИКА УМНОЙ ФОРМЫ РЕЙСОВ
   ========================================== */

function toggleAddTripForm() {
  const formWrap = document.getElementById("add-trip-form-wrap");
  if (formWrap.style.display === "none") {
    formWrap.style.display = "block";
    populateDriverSelect();
  } else {
    formWrap.style.display = "none";
  }
}

function populateDriverSelect() {
  const select = document.getElementById("form-driver-select");
  if (!select) return;

  const currentParity = getSelectedDayParity();
  const availableDrivers = drivers.filter(d => d.schedule === currentParity);

  if (availableDrivers.length === 0) {
    select.innerHTML = '<option value="">Нет водителей на этот график</option>';
    clearFormFields();
    return;
  }

  select.innerHTML = '<option value="">-- Выберите водителя --</option>' +
    availableDrivers.map(d => `<option value="${d.name}">${d.name}</option>`).join("");

  clearFormFields();
}

function handleFormDriverChange() {
  const select = document.getElementById("form-driver-select");
  const driverName = select.value;

  if (!driverName) {
    clearFormFields();
    return;
  }

  const driverData = drivers.find(d => d.name === driverName);

  if (driverData) {
    const times = driverData.shift.split("–");
    document.getElementById("form-route").value = driverData.route;
    document.getElementById("form-num").value = driverData.bus;
    document.getElementById("form-out").value = times[0] ? times[0].trim() : "06:00";
    document.getElementById("form-in").value = times[1] ? times[1].trim() : "22:30";
  }
}

function clearFormFields() {
  document.getElementById("form-route").value = "";
  document.getElementById("form-num").value = "";
  document.getElementById("form-out").value = "";
  document.getElementById("form-in").value = "";
  document.getElementById("form-trips").value = "";
  document.getElementById("form-missed").value = "";
}

function saveNewTrip(event) {
  event.preventDefault();
  const dateKey = document.getElementById("date-picker").value || new Date().toISOString().slice(0, 10);
  const driverName = document.getElementById("form-driver-select").value;

  if (!driverName) {
    alert("Пожалуйста, выберите водителя!");
    return;
  }

  const route = document.getElementById("form-route").value;
  const num = document.getElementById("form-num").value;
  const outTime = document.getElementById("form-out").value;
  const inTime = document.getElementById("form-in").value;
  const trips = parseInt(document.getElementById("form-trips").value) || 0;
  const missed = parseInt(document.getElementById("form-missed").value) || 0;

  if (!manualDailyRecords[dateKey]) manualDailyRecords[dateKey] = [];

  if (manualDailyRecords[dateKey].some(b => b.num === num)) {
    alert("Этот автобус уже добавлен на сегодня!");
    return;
  }

  manualDailyRecords[dateKey].push({
    route: route, num: num, driver: driverName, out: outTime, in: inTime, manualTrips: trips, manualMissed: missed
  });

  toggleAddTripForm();
  renderDayView();
}

/* ==========================================
   5. ДОБАВЛЕНИЕ ВОДИТЕЛЕЙ С КЛАВИАТУРЫ
   ========================================== */

function toggleAddDriverForm() {
  const wrap = document.getElementById("add-driver-form-wrap");
  wrap.style.display = (wrap.style.display === "none") ? "block" : "none";
}

function saveNewDriver(event) {
  event.preventDefault();

  const name = document.getElementById("d-form-name").value.trim();
  const bus = document.getElementById("d-form-bus").value.trim();
  const route = document.getElementById("d-form-route").value.trim();
  const schedule = document.getElementById("d-form-schedule").value;
  const shift = document.getElementById("d-form-shift").value.trim();

  // Добавляем новый объект в массив данных
  drivers.push({
    name: name,
    bus: bus,
    route: route,
    schedule: schedule,
    shift: shift,
    status: "Отдых"
  });

  // Очистка полей формы ввода
  document.getElementById("d-form-name").value = "";
  document.getElementById("d-form-bus").value = "";
  document.getElementById("d-form-route").value = "";
  document.getElementById("d-form-shift").value = "06:00 – 22:30";

  toggleAddDriverForm();
  renderDrivers(); // Перерисовать страницу водителей
  renderDaily();   // Синхронизировать селекторы в дневном плане
}

function renderDrivers() {
  const grid = document.getElementById("drivers-grid");
  if (!grid) return;

  const filter = document.getElementById("driver-filter").value;
  const filtered = drivers.filter(d => filter === "all" || d.schedule === filter);

  grid.innerHTML = filtered.map(d => `
    <div class="driver-card">
      <div class="driver-top">
        <div class="driver-avatar">${d.name.split(" ").map(n => n[0]).join("")}</div>
        <div>
          <div class="driver-name">${d.name}</div>
          <div class="driver-sub">${d.schedule === 'even' ? 'Чётные дни' : 'Нечётные дни'}</div>
        </div>
      </div>
      <div class="driver-row">
        <span class="driver-row-lbl">Автобус:</span>
        <span class="bus-num">${d.bus}</span>
      </div>
      <div class="driver-row">
        <span class="driver-row-lbl">Маршрут:</span>
        <strong>${d.route}</strong>
      </div>
      <div class="driver-row">
        <span class="driver-row-lbl">Смена:</span>
        <span class="mono">${d.shift}</span>
      </div>
    </div>
  `).join("");
}

/* ==========================================
   6. СТРАНИЦА ТЕХОБСЛУЖИВАНИЯ
   ========================================== */

function showTech(sectionId, btn) {
  document.querySelectorAll(".stab").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.querySelectorAll(".tech-section").forEach(s => s.classList.remove("active"));
  document.getElementById(`tech-${sectionId}`).classList.add("active");
}

function renderTech() {
  const tires = document.getElementById("tires-list");
  if (tires) tires.innerHTML = `<div class="tech-item"><strong>01 | 123 XA</strong> — Износ протектора в норме (25%).</div>`;
  const brakes = document.getElementById("brakes-list");
  if (brakes) brakes.innerHTML = `<div class="tech-item">Колодки проверены, критических дефектов не обнаружено.</div>`;
  const oil = document.getElementById("oil-list");
  if (oil) oil.innerHTML = `<div class="tech-item">Ближайшая замена тех. жидкостей через 1200 км.</div>`;
  const schedule = document.getElementById("schedule-list");
  if (schedule) schedule.innerHTML = `<div class="sched-card sched-ok"><div class="sched-type">ТО-2</div><div class="sched-days">В норме</div></div>`;
}