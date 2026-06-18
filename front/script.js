let selectedRoute = "all";

/* =======================================================
   1. BACKEND INTEGRATSIYASI (LOGIN VA REGISTRATSIYA)
   ======================================================= */

// Backend manzili (Docker-compose dagi 8000 tashqi portiga moslandi)
const BACKEND_BASE = "http://localhost:8000";

// URL manzillarni bəkendga 100% moslashtiramiz (oxiridagi slashlarga e'tibor bering)
const LOGIN_URL = `${BACKEND_BASE}/api/v1/login/`;      // token/ emas, bəkenddagi kabi login/ bo'lishi shart!
const REGISTER_URL = `${BACKEND_BASE}/api/v1/register/`;

// Oynalarni almashtirish funksiyasi (Login <-> Register tablari)
function switchAuthTab(tab) {
  const loginBlock = document.getElementById("login-form-block");
  const registerBlock = document.getElementById("register-form-block");
  const loginBtn = document.getElementById("tab-login-btn");
  const registerBtn = document.getElementById("tab-register-btn");

  // ?. operatori yoki xavfsiz tekshiruv yordamida elementlar tozalanadi
  if (document.getElementById("login-error")) document.getElementById("login-error").style.display = "none";
  if (document.getElementById("register-error")) document.getElementById("register-error").style.display = "none";
  if (document.getElementById("register-success")) document.getElementById("register-success").style.display = "none";

  if (tab === "login") {
    if (loginBlock) loginBlock.style.display = "block";
    if (registerBlock) registerBlock.style.display = "none";
    if (loginBtn) loginBtn.classList.add("active");
    if (registerBtn) registerBtn.classList.remove("active");
  } else {
    if (loginBlock) loginBlock.style.display = "none";
    if (registerBlock) registerBlock.style.display = "block";
    if (loginBtn) loginBtn.classList.remove("active");
    if (registerBtn) registerBtn.classList.add("active");
  }
}

// Foydalanuvchi tizimga kirgan yoki kirmaganligini tekshirish
function checkAuthStatus() {
  const token = localStorage.getItem("accessToken");
  const authScreen = document.getElementById("auth-screen");
  const mainNav = document.getElementById("main-nav");
  const mainContent = document.getElementById("main-content");
  const logoutWrapper = document.getElementById("logout-wrapper");

  if (token) {
    if (authScreen) authScreen.style.display = "none";
    if (mainNav) mainNav.style.display = "flex";
    if (mainContent) mainContent.style.display = "block";
    if (logoutWrapper) logoutWrapper.style.display = "block";
  } else {
    if (authScreen) authScreen.style.display = "flex";
    if (mainNav) mainNav.style.display = "none";
    if (mainContent) mainContent.style.display = "none";
    if (logoutWrapper) logoutWrapper.style.display = "none";
  }
}

// TIZIMGA KIRISH (LOGIN) SO'ROVI
async function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("login-error");
  const submitBtn = event.target.querySelector('button[type="submit"]');

  try {
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Kutilmoqda..."; }
    if (errorMsg) errorMsg.style.display = "none";

    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("accessToken", data.access);
      if (data.refresh) localStorage.setItem("refreshToken", data.refresh);

      checkAuthStatus();
    } else {
      const errData = await response.json().catch(() => ({}));
      if (errorMsg) {
        errorMsg.textContent = errData.detail || "Login yoki parol noto'g'ri!";
        errorMsg.style.display = "block";
      }
    }
  } catch (err) {
    if (errorMsg) { errorMsg.textContent = "Backend server bilan aloqa yo'q!"; errorMsg.style.display = "block"; }
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Kirish"; }
  }
}

// RO'YXATDAN O'TISH (REGISTER) SO'ROVI
async function handleRegister(event) {
  event.preventDefault();

  const username = document.getElementById("reg-username").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const passwordConfirm = document.getElementById("reg-password-confirm").value;

  const errorMsg = document.getElementById("register-error");
  const successMsg = document.getElementById("register-success");
  const submitBtn = event.target.querySelector('button[type="submit"]');

  if (errorMsg) errorMsg.style.display = "none";
  if (successMsg) successMsg.style.display = "none";

  if (password !== passwordConfirm) {
    if (errorMsg) {
      errorMsg.textContent = "Parollar mos kelmadi!";
      errorMsg.style.display = "block";
    }
    return;
  }

  try {
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Ro'yxatdan o'tilmoqda..."; }

    const response = await fetch(REGISTER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    if (response.ok || response.status === 201) {
      if (successMsg) {
        successMsg.textContent = "Muvaffaqiyatli ro'yxatdan o'tdingiz! Yo'naltirilmoqda...";
        successMsg.style.display = "block";
      }
      event.target.reset();
      setTimeout(() => switchAuthTab('login'), 2000);
    } else {
      const errData = await response.json().catch(() => ({}));
      if (errorMsg) {
        let errMsg = "Ro'yxatdan o'tishda xatolik!";
        if (errData.username) errMsg = `Username: ${errData.username[0]}`;
        else if (errData.email) errMsg = `Email: ${errData.email[0]}`;
        else if (errData.password) errMsg = `Password: ${errData.password[0]}`;

        errorMsg.textContent = errMsg;
        errorMsg.style.display = "block";
      }
    }
  } catch (err) {
    if (errorMsg) { errorMsg.textContent = "Server bilan aloqa uzildi!"; errorMsg.style.display = "block"; }
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Ro'yxatdan o'tish"; }
  }
}

// TIZIMDAN CHIQISH (LOGOUT)
function handleLogout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  checkAuthStatus();
}


/* =======================================================
   2. MATRITSA VA STATIK MA'LUMOTLAR
   ======================================================= */

const drivers = [
  { name: "Asanov Sanjar", bus: "01 | 123 XA", route: "M-5", schedule: "even", shift: "06:00 - 22:30", status: "Yo'nalishda" },
  { name: "Valiyev Vali", bus: "01 | 456 BA", route: "M-5", schedule: "odd", shift: "06:00 - 22:30", status: "Dam olmoqda" },
  { name: "Karimov Sherzod", bus: "01 | 789 CA", route: "M-12", schedule: "even", shift: "05:30 - 21:40", status: "Yo'nalishda" },
  { name: "Umarov Akmal", bus: "01 | 321 DA", route: "M-12", schedule: "odd", shift: "05:30 - 21:40", status: "Dam olmoqda" },
  { name: "Aliyev Ali", bus: "01 | 654 EA", route: "M-2", schedule: "even", shift: "06:15 - 23:00", status: "Yo'nalishda" },
  { name: "G'ofurov Tohir", bus: "01 | 987 FA", route: "M-2", schedule: "odd", shift: "06:15 - 23:00", status: "Ta'mirlashda" }
];

const techData = {
  tires: [
    { bus: "01 | 123 XA", status: "good", left: "85%", desc: "Shinalar yangi, bosim me'yorda." },
    { bus: "01 | 456 BA", status: "warning", left: "45%", desc: "Old shinalar eskirgan. 5000 km dan keyin almashtirish tavsiya etiladi." },
    { bus: "01 | 789 CA", status: "good", left: "70%", desc: "Holati qoniqarli." },
    { bus: "01 | 987 FA", status: "danger", left: "15%", desc: "Shinalar mutloq eskirgan! Zudlik bilan almashtiring." }
  ],
  brakes: [
    { bus: "01 | 123 XA", status: "good", left: "90%", desc: "Tormoz tizimi ideal holatda." },
    { bus: "01 | 456 BA", status: "good", left: "75%", desc: "Tormoz kolodkalari yaxshi." },
    { bus: "01 | 789 CA", status: "warning", left: "35%", desc: "Kolodkalar yupqalashgan. Keyingi TO da almashtirilsin." }
  ],
  oil: [
    { bus: "01 | 123 XA", status: "good", left: "8000 km", desc: "Shell Rimula 5W-40. Moy darajasi yaxshi." },
    { bus: "01 | 456 BA", status: "danger", left: "200 km", desc: "Moy almashtirish muddati kelgan! Davom etish taqiqlanadi." }
  ],
  schedule: [
    { bus: "01 | 123 XA", type: "TO-2", date: "15.06.2026", status: "pending", desc: "Rejali texnik ko'rik." },
    { bus: "01 | 789 CA", type: "TO-1", date: "10.06.2026", status: "done", desc: "Ko'rikdan o'tdi: moy va filtrlar almashtirildi." }
  ]
};

// Sahifa yuklanganda ishga tushadigan qism
document.addEventListener("DOMContentLoaded", () => {
  initClock();
  initDefaultDate();
  checkAuthStatus();
  renderDaily();
  renderDrivers();
  renderTech();
});

/* =======================================================
   3. SOAT VA NAVIGATSIYA FUNKSIYALARI
   ======================================================= */

function initClock() {
  setInterval(() => {
    const now = new Date();
    const clock = document.getElementById("live-clock");
    if (clock) {
      clock.textContent = now.toTimeString().split(' ')[0];
    }
  }, 1000);
}

function initDefaultDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const dateStr = `${day}.${month}.${year}`;

  const liveDateEl = document.getElementById("live-date");
  if (liveDateEl) {
    liveDateEl.textContent = `${dateStr} — Toshkent`;
  }
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

  const targetPage = document.getElementById(`page-${pageId}`);
  const targetBtn = document.getElementById(`nav-${pageId}`);

  if (targetPage) targetPage.classList.add("active");
  if (targetBtn) targetBtn.classList.add("active");
}

function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute("data-theme");
  const icon = document.getElementById("theme-icon");
  const text = document.getElementById("theme-text");

  if (currentTheme === "light") {
    html.removeAttribute("data-theme");
    if (icon) icon.textContent = "🌙";
    if (text) text.textContent = "To'q rang";
  } else {
    html.setAttribute("data-theme", "light");
    if (icon) icon.textContent = "☀️";
    if (text) text.textContent = "Yorug' rang";
  }
}

/* =======================================================
   4. KUNLIK (EJDNEVNAYA) SAHIFA FUNKSIYALARI
   ======================================================= */

function renderDaily() {
  const tbody = document.getElementById("daily-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  let onlineCount = 0;
  let repairCount = 0;

  drivers.forEach(d => {
    if (d.status === "Yo'nalishda") onlineCount++;
    if (d.status === "Ta'mirlashda") repairCount++;

    if (selectedRoute !== "all" && d.route !== selectedRoute) return;

    let statusClass = "st-off";
    if (d.status === "Yo'nalishda") statusClass = "st-line";
    if (d.status === "Ta'mirlashda") statusClass = "st-repair";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${d.name}</strong></td>
      <td><span class="bus-num">${d.bus}</span></td>
      <td><span class="mono">${d.route}</span></td>
      <td><span class="mono" style="font-size:11px; color:var(--muted);">${d.shift}</span></td>
      <td><span class="status-badge ${statusClass}">${d.status}</span></td>
    `;
    tbody.appendChild(tr);
  });

  // Hisoblagichlar renderDaily ichida xavfsiz yangilanadi
  const mOnLine = document.getElementById("m-on-line");
  const mTotalDrivers = document.getElementById("m-total-drivers");
  const mInRepair = document.getElementById("m-in-repair");

  if (mOnLine) mOnLine.textContent = onlineCount;
  if (mTotalDrivers) mTotalDrivers.textContent = drivers.length;
  if (mInRepair) mInRepair.textContent = repairCount;
}

function filterDaily(route) {
  selectedRoute = route;

  document.querySelectorAll(".filter-bar .add-btn").forEach(btn => {
    btn.classList.remove("active");
    btn.style.background = "var(--bg2)";
    btn.style.color = "var(--text)";
    btn.style.border = "1px solid var(--border)";
  });

  const activeBtn = document.getElementById(`filter-${route.toLowerCase().replace('-', '')}`);
  if (activeBtn) {
    activeBtn.classList.add("active");
    activeBtn.style.background = "var(--accent)";
    activeBtn.style.color = "#000";
    activeBtn.style.border = "none";
  }

  renderDaily();
}

/* =======================================================
   5. HAYDOVCHILAR (VODITELI) SAHIFA FUNKSIYALARI
   ======================================================= */

function renderDrivers() {
  const grid = document.getElementById("drivers-grid");
  if (!grid) return;
  grid.innerHTML = "";

  drivers.forEach((d, i) => {
    let statusClass = "st-off";
    if (d.status === "Yo'nalishda") statusClass = "st-line";
    if (d.status === "Ta'mirlashda") statusClass = "st-repair";

    const card = document.createElement("div");
    card.className = "driver-card";
    card.innerHTML = `
      <div class="driver-actions">
        <button onclick="editDriver(${i})" class="add-btn" style="height: 26px; padding: 0 8px; font-size: 11px; background: var(--bg3); color: var(--text); border: 1px solid var(--border);">Tahrirlash</button>
        <button onclick="deleteDriver(${i})" class="add-btn" style="height: 26px; padding: 0 8px; font-size: 11px; background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5;">O'chirish</button>
      </div>
      <div class="driver-top">
        <div class="driver-avatar">${d.name.split(" ").map(n => n[0]).join("")}</div>
        <div>
          <div class="driver-name" style="padding-right: 140px;">${d.name}</div>
          <div class="driver-sub">${d.schedule === 'even' ? 'Juft kunlar' : 'Toq kunlar'}</div>
        </div>
      </div>
      <div class="driver-row">
        <span class="driver-row-lbl">Avtobus:</span>
        <span class="bus-num">${d.bus}</span>
      </div>
      <div class="driver-row">
        <span class="driver-row-lbl">Yo'nalish:</span>
        <strong>${d.route}</strong>
      </div>
      <div class="driver-row">
        <span class="driver-row-lbl">Smena:</span>
        <span class="mono">${d.shift}</span>
      </div>
      <div style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
        <span class="driver-row-lbl">Hozirgi holat:</span>
        <span class="status-badge ${statusClass}">${d.status}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

function openDriverModal() {
  document.getElementById("modal-title-text").textContent = "Yangi haydovchi";
  document.getElementById("d-form-index").value = "";
  document.getElementById("driver-form").reset();

  const modal = document.getElementById("driver-modal");
  if (modal) modal.classList.add("active");
}

function saveDriver(event) {
  event.preventDefault();

  const idx = document.getElementById("d-form-index").value;
  const name = document.getElementById("d-form-name").value;
  const bus = document.getElementById("d-form-bus").value;
  const route = document.getElementById("d-form-route").value;
  const schedule = document.getElementById("d-form-schedule").value;
  const status = document.getElementById("d-form-status").value;
  const start = document.getElementById("d-form-shift-start").value;
  const end = document.getElementById("d-form-shift-end").value;

  const driverData = {
    name, bus, route, schedule, status,
    shift: `${start} - ${end}`
  };

  if (idx === "") {
    drivers.push(driverData);
  } else {
    drivers[parseInt(idx)] = driverData;
  }

  const modal = document.getElementById("driver-modal");
  if (modal) modal.classList.remove("active");

  renderDaily();
  renderDrivers();
}

function editDriver(i) {
  const d = drivers[i];
  document.getElementById("modal-title-text").textContent = "Tahrirlash";
  document.getElementById("d-form-index").value = i;
  document.getElementById("d-form-name").value = d.name;
  document.getElementById("d-form-bus").value = d.bus;
  document.getElementById("d-form-route").value = d.route;
  document.getElementById("d-form-schedule").value = d.schedule;
  document.getElementById("d-form-status").value = d.status;

  const times = d.shift.split(" - ");
  if (times.length === 2) {
    document.getElementById("d-form-shift-start").value = times[0];
    document.getElementById("d-form-shift-end").value = times[1];
  }

  const modal = document.getElementById("driver-modal");
  if (modal) modal.classList.add("active");
}

function deleteDriver(i) {
  if (confirm(`Haydovchi ${drivers[i].name} ni o'chirmoqchimisiz?`)) {
    drivers.splice(i, 1);
    renderDaily();
    renderDrivers();
  }
}

/* =======================================================
   6. TEXNIK XIZMAT KO'RSATISH SAHIFA FUNKSIYALARI
   ======================================================= */

function showTech(section, btn) {
  document.querySelectorAll(".tech-section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".subtabs .stab").forEach(b => b.classList.remove("active"));

  const target = document.getElementById(`tech-${section}`);
  if (target) target.classList.add("active");
  if (btn) btn.classList.add("active");
}

function renderTech() {
  const tiresList = document.getElementById("tires-list");
  if (tiresList) {
    tiresList.innerHTML = techData.tires.map(t => `
      <div class="tech-item">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <span class="bus-num">${t.bus}</span>
          <span class="status-badge ${t.status === 'good' ? 'st-line' : t.status === 'warning' ? 'st-off' : 'st-repair'}">Resurs: ${t.left}</span>
        </div>
        <div style="font-size:13px; color:var(--text); line-height:1.4;">${t.desc}</div>
      </div>
    `).join("");
  }

  const brakesList = document.getElementById("brakes-list");
  if (brakesList) {
    brakesList.innerHTML = techData.brakes.map(b => `
      <div class="tech-item">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <span class="bus-num">${b.bus}</span>
          <span class="status-badge ${b.status === 'good' ? 'st-line' : 'st-repair'}">Resurs: ${b.left}</span>
        </div>
        <div style="font-size:13px; color:var(--text); line-height:1.4;">${b.desc}</div>
      </div>
    `).join("");
  }

  const oilList = document.getElementById("oil-list");
  if (oilList) {
    oilList.innerHTML = techData.oil.map(o => `
      <div class="tech-item">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <span class="bus-num">${o.bus}</span>
          <span class="status-badge ${o.status === 'good' ? 'st-line' : 'st-repair'}">Moy resursi: ${o.left}</span>
        </div>
        <div style="font-size:13px; color:var(--text); line-height:1.4;">${o.desc}</div>
      </div>
    `).join("");
  }

  const scheduleList = document.getElementById("schedule-list");
  if (scheduleList) {
    scheduleList.innerHTML = techData.schedule.map(s => `
      <div class="tech-item">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <span class="bus-num">${s.bus} — <strong style="color:var(--accent);">${s.type}</strong></span>
          <span class="status-badge ${s.status === 'done' ? 'st-line' : 'st-off'}">${s.date} (${s.status === 'done' ? 'Bajarildi' : 'Kutilmoqda'})</span>
        </div>
        <div style="font-size:13px; color:var(--text); line-height:1.4;">${s.desc}</div>
      </div>
    `).join("");
  }
}