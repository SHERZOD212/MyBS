let selectedRoute="all";
/* ==========================================
   1. Slayderlar, Soat va Umumiy Ma'lumotlar
   ========================================== */

const drivers = [
  { name: "Иван Иванов", bus: "01 | 123 XA", route: "Т-5", schedule: "even", shift: "06:00 - 22:30", status: "На линии" },
  { name: "Петр Петров", bus: "01 | 456 BA", route: "Т-5", schedule: "odd", shift: "06:00 - 22:30", status: "Отдых" },
  { name: "Сергей Сидоров", bus: "01 | 789 CA", route: "Т-12", schedule: "even", shift: "05:30 - 21:40", status: "На линии" },
  { name: "Алексей Кузнецов", bus: "01 | 321 DA", route: "Т-12", schedule: "odd", shift: "05:30 - 21:40", status: "Отдых" },
  { name: "Михаил Попов", bus: "01 | 654 EA", route: "Т-2", schedule: "even", shift: "06:15 - 23:00", status: "На линии" },
  { name: "Елена Смирнова", bus: "01 | 987 FA", route: "Т-2", schedule: "odd", shift: "06:15 - 23:00", status: "Отдых" }
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

// MAVZUNI ALMASHTIRISH (Endi HTML va CSS ga to'liq mos keladi)
function toggleTheme() {
  const root = document.documentElement; // :root elementini (html) tanlaymiz
  const btnIcon = document.getElementById("theme-icon");
  const btnText = document.getElementById("theme-text");

  if (root.getAttribute("data-theme") === "light") {
    root.removeAttribute("data-theme"); // To'q fon (Dark mode) ishga tushadi
    if(btnIcon) btnIcon.textContent = "🌙";
    if(btnText) btnText.textContent = "Тёмная";
  } else {
    root.setAttribute("data-theme", "light"); // Yorqin fon (Light mode) ishga tushadi
    if(btnIcon) btnIcon.textContent = "☀️";
    if(btnText) btnText.textContent = "Светлая";
  }
}

/* ==========================================
   2. Avtorizatsiya va Navigatsiya
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
   3. Kunlik Hisobot va Grafika
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
  const formWrap = document.getElementById("add-trip-form-wrap");
  if (formWrap && formWrap.style.display === "block") {
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
    const times = drv.shift.split("-");
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

  const filteredBuses = selectedRoute === "all"
 ? currentBusesList
 : currentBusesList.filter(b => b.route === selectedRoute);

const rowsHtml = filteredBuses.map((b, i) => {
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
        <div class="metric-val white">${filteredBuses.length}</div>
      </div>
      <div class="metric-card green">
        <div class="metric-lbl">Всего рейсов</div>
        <div class="metric-val green">${totalTrips}</div>
      </div>
      <div class="metric-card red">
        <div class="metric-lbl">Пропущено рейс.</div>
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
        <td><span style="color:var(--green);">В графике</span></td>
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
        <div class="metric-lbl">Пропусков за месяц</div>
        <div class="metric-val red">${totalMissed}</div>
      </div>
    `;
  }
}

/* ==========================================
   4. Yangi Reyis Qo'shish Formasi
   ========================================== */

function toggleAddTripForm() {
  const formWrap = document.getElementById("add-trip-form-wrap");
  if (!formWrap) return;
  if (formWrap.style.display === "none" || formWrap.style.display === "") {
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
    select.innerHTML = '<option value="">Нет водителей на эту смену</option>';
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
    const times = driverData.shift.split("–"); // Gidro-tire yoki oddiy tire uchun tekshiruv
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
   5. Haydovchilarni Boshqarish
   ========================================== */

function toggleAddDriverForm() {
  const wrap = document.getElementById("add-driver-form-wrap");
  if (wrap) {
    wrap.style.display = (wrap.style.display === "none" || wrap.style.display === "") ? "block" : "none";
  }
}

function saveNewDriver(event) {
  event.preventDefault();

  const name = document.getElementById("d-form-name").value.trim();
  const bus = document.getElementById("d-form-bus").value.trim();
  const route = document.getElementById("d-form-route").value.trim();
  const schedule = document.getElementById("d-form-schedule").value;
  const shift = document.getElementById("d-form-shift").value.trim();

  drivers.push({
    name: name,
    bus: bus,
    route: route,
    schedule: schedule,
    shift: shift,
    status: "Отдых"
  });

  document.getElementById("d-form-name").value = "";
  document.getElementById("d-form-bus").value = "";
  document.getElementById("d-form-route").value = "";
  document.getElementById("d-form-shift").value = "06:00 - 22:30";

  toggleAddDriverForm();
  renderDrivers();
  renderDaily();
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
   6. Texnik Xizmat Ko'rsatish
   ========================================== */

function showTech(sectionId, btn) {
  document.querySelectorAll(".stab").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.querySelectorAll(".tech-section").forEach(s => s.classList.remove("active"));
  document.getElementById(`tech-${sectionId}`).classList.add("active");
}

function renderTech() {
  const tires = document.getElementById("tires-list");
  if (tires) tires.innerHTML = `<div class="tech-item"><strong>01 | 123 XA</strong> - Износ протектора в норме (25%).</div>`;
  const brakes = document.getElementById("brakes-list");
  if (brakes) brakes.innerHTML = `<div class="tech-item">Колодки проверены, критических дефектов не обнаружено.</div>`;
  const oil = document.getElementById("oil-list");
  if (oil) oil.innerHTML = `<div class="tech-item">Требуется замена масла через 1200 км.</div>`;
  const schedule = document.getElementById("schedule-list");
  if (schedule) schedule.innerHTML = `<div class="sched-card sched-ok"><div class="sched-type">ТО-2</div><div class="sched-days">В норме</div></div>`;
}

function saveNewDriver(event) {
  event.preventDefault();

  const name = document.getElementById("d-form-name").value.trim();
  const bus = document.getElementById("d-form-bus").value.trim();
  const route = document.getElementById("d-form-route").value.trim();
  const schedule = document.getElementById("d-form-schedule").value;

  // Alohida olingan vaqtlar tekshirilyapti va birlashtirilyapti
  const shiftStart = document.getElementById("d-form-shift-start").value;
  const shiftEnd = document.getElementById("d-form-shift-end").value;
  const fullShift = `${shiftStart} - ${shiftEnd}`;

  drivers.push({
    name: name,
    bus: bus,
    route: route,
    schedule: schedule,
    shift: fullShift, // Birlashgan format saqlanadi
    status: "Отдых"
  });

  // Formani tozalash
  document.getElementById("d-form-name").value = "";
  document.getElementById("d-form-bus").value = "";
  document.getElementById("d-form-route").value = "";
  document.getElementById("d-form-shift-start").value = "";
  document.getElementById("d-form-shift-end").value = "";

  toggleAddDriverForm();
  renderDrivers();
  renderDaily();
}

/* ==========================================
   5. Haydovchilarni Boshqarish (O'zgartirish va O'chirish)
   ========================================== */

function toggleAddDriverForm() {
  const wrap = document.getElementById("add-driver-form-wrap");
  if (!wrap) return;

  if (wrap.style.display === "none" || wrap.style.display === "") {
    wrap.style.display = "block";
    document.getElementById("form-driver-title").textContent = "Добавить нового водителя";
    document.getElementById("d-form-submit-btn").textContent = "Сохранить";
    document.getElementById("d-form-index").value = "";
    clearDriverForm();
  } else {
    wrap.style.display = "none";
  }
}

function clearDriverForm() {
  document.getElementById("d-form-name").value = "";
  document.getElementById("d-form-bus").value = "";
  document.getElementById("d-form-route").value = "";
  document.getElementById("d-form-shift-start").value = "";
  document.getElementById("d-form-shift-end").value = "";
  document.getElementById("d-form-index").value = "";
}

// 1. TAHRIRLASH: Tugma bosilganda bor ma'lumotni formaga yuklash
function editDriver(index) {
  const drv = drivers[index];
  const wrap = document.getElementById("add-driver-form-wrap");

  if (!drv || !wrap) return;

  wrap.style.display = "block";
  document.getElementById("form-driver-title").textContent = "Изменить данные водителя";
  document.getElementById("d-form-submit-btn").textContent = "Изменить";
  document.getElementById("d-form-index").value = index;

  document.getElementById("d-form-name").value = drv.name;
  document.getElementById("d-form-bus").value = drv.bus;
  document.getElementById("d-form-route").value = drv.route;
  document.getElementById("d-form-schedule").value = drv.schedule;

  if (drv.shift && drv.shift.includes("-")) {
    const times = drv.shift.split("-");
    document.getElementById("d-form-shift-start").value = times[0].trim();
    document.getElementById("d-form-shift-end").value = times[1].trim();
  } else {
    document.getElementById("d-form-shift-start").value = "06:00";
    document.getElementById("d-form-shift-end").value = "22:30";
  }

  wrap.scrollIntoView({ behavior: 'smooth' });
}

// 2. O'CHIRISH: Ro'yxatdan o'chirib tashlash funksiyasi
function deleteDriver(index) {
  const confirmDelete = confirm(`Вы действительно хотите удалить водителя ${drivers[index].name}?`);
  if (confirmDelete) {
    drivers.splice(index, 1); // Massivdan o'chirish
    renderDrivers();          // Ro'yxatni qayta chizish
    renderDaily();            // Kunlik planni ham yangilash
  }
}

// 3. SAQLASH (Yangi qo'shish yoki Borini o'zgartirish)
function saveNewDriver(event) {
  event.preventDefault();

  const indexVal = document.getElementById("d-form-index").value;
  const name = document.getElementById("d-form-name").value.trim();
  const bus = document.getElementById("d-form-bus").value.trim();
  const route = document.getElementById("d-form-route").value.trim();
  const schedule = document.getElementById("d-form-schedule").value;
  const shiftStart = document.getElementById("d-form-shift-start").value;
  const shiftEnd = document.getElementById("d-form-shift-end").value;
  const fullShift = `${shiftStart} - ${shiftEnd}`;

  if (indexVal !== "") {
    // Agar yashirin inputda indeks bo'lsa -> BORINI O'ZGARTIRISH
    const idx = parseInt(indexVal);
    drivers[idx].name = name;
    drivers[idx].bus = bus;
    drivers[idx].route = route;
    drivers[idx].schedule = schedule;
    drivers[idx].shift = fullShift;
  } else {
    // Agar bo'sh bo'lsa -> YANGI QO'SHISH
    drivers.push({
      name: name,
      bus: bus,
      route: route,
      schedule: schedule,
      shift: fullShift,
      status: "Отдых"
    });
  }

  clearDriverForm();
  document.getElementById("add-driver-form-wrap").style.display = "none";

  renderDrivers();
  renderDaily();
}

// 4. RENDER: Kartochkalarni tugmalari bilan birga chizish
function renderDrivers() {
  const grid = document.getElementById("drivers-grid");
  if (!grid) return;

  const filter = document.getElementById("driver-filter").value;

  grid.innerHTML = drivers.map((d, i) => {
    if (filter !== "all" && d.schedule !== filter) return "";

    return `
      <div class="driver-card" style="position: relative; padding-top: 50px;">
        <div style="position: absolute; top: 15px; right: 15px; display: flex; gap: 6px;">
          <button onclick="editDriver(${i})" class="add-btn" style="height: 26px; padding: 0 8px; font-size: 11px; background: var(--bg3); color: var(--main); border: 1px solid var(--border);">
            ✏️ Изменить
          </button>
          <button onclick="deleteDriver(${i})" class="add-btn" style="height: 26px; padding: 0 8px; font-size: 11px; background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5;">
            🗑️ Удалить
          </button>
        </div>

        <div class="driver-top">
          <div class="driver-avatar">${d.name.split(" ").map(n => n[0]).join("")}</div>
          <div>
            <div class="driver-name" style="padding-right: 140px;">${d.name}</div>
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
    `;
  }).join("");
}



function filterRoute(route,btn){
 selectedRoute=route;
 document.querySelectorAll('.route-btn').forEach(x=>x.classList.remove('active'));
 if(btn) btn.classList.add('active');
 renderDayView();
}
