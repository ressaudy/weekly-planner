/* ═══════════════════════════════════════
   Weekly Planner — app.js
   ═══════════════════════════════════════ */

/* ─────────────────────────────────────
   UTILS
───────────────────────────────────── */

/** Shorthand getElementById */
function $(id) {
  return document.getElementById(id);
}

/** Save data to localStorage as JSON */
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/** Load data from localStorage, return defaultValue if not found */
function load(key, defaultValue) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

/* ─────────────────────────────────────
   DATE HEADER
───────────────────────────────────── */

function initDateHeader() {
  const now = new Date();

  // Full date label
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  $('dateLabel').textContent = now.toLocaleDateString('id-ID', opts);

  // Week range badge (Mon–Sun)
  const dayOfWeek = now.getDay(); // 0=Sun
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  $('weekBadge').textContent = fmt(monday) + ' – ' + fmt(sunday);
}

initDateHeader();

/* ─────────────────────────────────────
   QUOTE HARIAN
───────────────────────────────────── */

const DEFAULT_QUOTE = '"The secret of getting ahead is getting started." — Mark Twain';

const quoteEl = $('quoteInput');
quoteEl.value = load('wp_quote', DEFAULT_QUOTE);
quoteEl.addEventListener('input', () => save('wp_quote', quoteEl.value));

/* ─────────────────────────────────────
   WEEKLY TABLE
───────────────────────────────────── */

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

/** Generate time options from 05:00 to 22:00 */
function generateTimeOptions(selectedTime) {
  let options = '';
  for (let hour = 5; hour <= 22; hour++) {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    options += `<option value="${time}"${time === selectedTime ? ' selected' : ''}>${time}</option>`;
  }
  return options;
}

const DEFAULT_ROWS = [
  { day: 'Senin',  time: '09:00', act: 'Morning review + cek email',           status: 'done'     },
  { day: 'Selasa', time: '10:00', act: 'Deep work — project utama',            status: 'progress' },
  { day: 'Rabu',   time: '14:00', act: 'Meeting tim & planning sprint',        status: 'none'     },
  { day: 'Kamis',  time: '15:00', act: 'Belajar skill baru / reading',         status: 'none'     },
  { day: 'Jumat',  time: '16:00', act: 'Weekly review & rencana minggu depan', status: 'none'     },
];

/** Get current rows from localStorage */
function getRows() {
  const rows = load('wp_rows', DEFAULT_ROWS);
  // Ensure all rows have time field
  return rows.map(row => ({ time: '09:00', ...row }));
}

/** Save rows to localStorage */
function saveRows(rows) {
  save('wp_rows', rows);
}

/** Return CSS class for row based on status */
function rowClass(status) {
  if (status === 'done')     return 'row-done';
  if (status === 'progress') return 'row-prog';
  return '';
}

/** Build and insert all table rows into the DOM */
function renderRows() {
  const rows = getRows();
  const tbody = $('weekBody');
  tbody.innerHTML = '';

  rows.forEach((row, index) => {
    const tr = document.createElement('tr');
    tr.className = rowClass(row.status);

    tr.innerHTML = `
      <td>
        <select class="time-select" onchange="changeField(${index}, 'time', this.value)">
          ${generateTimeOptions(row.time)}
        </select>
      </td>
      <td>
        <select class="day-select" onchange="changeField(${index}, 'day', this.value)">
          ${DAYS.map(d => `<option${d === row.day ? ' selected' : ''}>${d}</option>`).join('')}
        </select>
      </td>
      <td>
        <input
          class="act-input"
          type="text"
          value="${row.act.replace(/"/g, '&quot;')}"
          placeholder="Tambahkan aktivitas..."
          onchange="changeField(${index}, 'act', this.value)"
        />
      </td>
      <td>
        <select class="status-select" onchange="changeField(${index}, 'status', this.value)">
          <option value="none"${row.status === 'none'     ? ' selected' : ''}>— Belum</option>
          <option value="progress"${row.status === 'progress' ? ' selected' : ''}>● On-going</option>
          <option value="done"${row.status === 'done'     ? ' selected' : ''}>✓ Selesai</option>
        </select>
      </td>
      <td>
        <button class="del-btn" onclick="delRow(${index})" title="Hapus">×</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  updateStats(rows);
}

/** Update a single field for a row */
function changeField(index, field, value) {
  const rows = getRows();
  rows[index][field] = value;
  saveRows(rows);
  renderRows();
}

/** Delete a row by index */
function delRow(index) {
  const rows = getRows();
  rows.splice(index, 1);
  saveRows(rows);
  renderRows();
}

/** Add an empty row */
function addRow() {
  const rows = getRows();
  rows.push({ day: 'Senin', time: '09:00', act: '', status: 'none' });
  saveRows(rows);
  renderRows();
}

/** Recalculate and render progress stats */
function updateStats(rows) {
  const done  = rows.filter(r => r.status === 'done').length;
  const prog  = rows.filter(r => r.status === 'progress').length;
  const total = rows.length || 1;
  const pct   = Math.round((done / total) * 100);

  $('statDone').textContent = done;
  $('statProg').textContent = prog;
  $('statPct').textContent  = pct + '%';
  $('progFill').style.width = pct + '%';
  $('progLeft').textContent  = pct + '%';
  $('progRight').textContent = done + ' / ' + rows.length + ' task selesai';
}

// Initial render
renderRows();

/* ─────────────────────────────────────
   TO-DO LIST
───────────────────────────────────── */

let todos = load('wp_todos', [
  { text: 'Review laporan Q2',            done: false },
  { text: 'Kirim email follow-up klien',  done: true  },
  { text: 'Update dokumentasi proyek',    done: false },
]);

/** Build and insert all todo items into the DOM */
function renderTodos() {
  const container = $('todoList');
  container.innerHTML = '';

  todos.forEach((todo, index) => {
    const div = document.createElement('div');
    div.className = 'todo-item';

    div.innerHTML = `
      <input
        type="checkbox"
        class="todo-check"
        ${todo.done ? 'checked' : ''}
        onchange="toggleTodo(${index})"
      />
      <input
        class="todo-text${todo.done ? ' done' : ''}"
        type="text"
        value="${todo.text.replace(/"/g, '&quot;')}"
        placeholder="Nama tugas..."
        onchange="editTodo(${index}, this.value)"
      />
      <button class="del-btn" onclick="delTodo(${index})" title="Hapus">×</button>
    `;

    container.appendChild(div);
  });

  save('wp_todos', todos);
}

function toggleTodo(index) {
  todos[index].done = !todos[index].done;
  renderTodos();
}

function editTodo(index, value) {
  todos[index].text = value;
  save('wp_todos', todos);
}

function delTodo(index) {
  todos.splice(index, 1);
  renderTodos();
}

function addTodo() {
  todos.push({ text: '', done: false });
  renderTodos();
  // Auto-focus the new input
  setTimeout(() => {
    const inputs = document.querySelectorAll('.todo-text');
    if (inputs.length) inputs[inputs.length - 1].focus();
  }, 50);
}

// Initial render
renderTodos();

/* ─────────────────────────────────────
   NOTES
───────────────────────────────────── */

const notesEl = $('notesArea');
notesEl.value = load('wp_notes', '');
notesEl.addEventListener('input', () => save('wp_notes', notesEl.value));

/* ─────────────────────────────────────
   POMODORO TIMER
───────────────────────────────────── */

let pomoSeconds  = 25 * 60;  // current countdown in seconds
let pomoRunning  = false;
let pomoInterval = null;
let pomoSessions = 0;
let pomoMode     = 'focus';  // 'focus' | 'short' | 'long'

const MODE_LABELS = {
  focus: 'Fokus',
  short: 'Istirahat Pendek',
  long:  'Istirahat Panjang',
};

/** Format seconds into MM:SS string */
function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/** Update the timer display and browser tab title */
function updatePomoDisplay() {
  $('pomoTime').textContent = formatTime(pomoSeconds);
  document.title = pomoRunning
    ? `(${formatTime(pomoSeconds)}) Weekly Planner`
    : 'Weekly Planner';
}

/** Switch between focus / short break / long break */
function setMode(mode, minutes, buttonEl) {
  // Stop any running timer
  clearInterval(pomoInterval);
  pomoRunning = false;

  const startBtn = $('btnStart');
  startBtn.textContent = 'Mulai';
  startBtn.classList.remove('active');

  // Update state
  pomoMode    = mode;
  pomoSeconds = minutes * 60;

  // Update badge label
  $('pomoModeBadge').textContent = MODE_LABELS[mode];

  // Update selected mode button
  document.querySelectorAll('.pomo-mode-btn').forEach(b => b.classList.remove('selected'));
  if (buttonEl) buttonEl.classList.add('selected');

  updatePomoDisplay();
}

/** Start or pause the timer */
function togglePomo() {
  const startBtn = $('btnStart');

  if (pomoRunning) {
    // Pause
    clearInterval(pomoInterval);
    pomoRunning = false;
    startBtn.textContent = 'Lanjut';
    startBtn.classList.remove('active');
    document.title = 'Weekly Planner';
  } else {
    // Start
    pomoRunning = true;
    startBtn.textContent = 'Pause';
    startBtn.classList.add('active');

    pomoInterval = setInterval(() => {
      if (pomoSeconds > 0) {
        pomoSeconds--;
        updatePomoDisplay();
      } else {
        // Timer finished
        clearInterval(pomoInterval);
        pomoRunning = false;
        startBtn.textContent = 'Mulai';
        startBtn.classList.remove('active');
        document.title = 'Weekly Planner';

        if (pomoMode === 'focus') {
          pomoSessions++;
          $('pomoCnt').textContent = 'Sesi selesai: ' + pomoSessions;

          if (Notification.permission === 'granted') {
            new Notification('Sesi fokus selesai!', { body: 'Waktunya istirahat sejenak.' });
          } else {
            alert('Sesi fokus selesai! Waktunya istirahat.');
          }
        } else {
          alert('Istirahat selesai! Kembali fokus.');
        }
      }
    }, 1000);
  }
}

/** Reset timer to the current mode's default duration */
function resetPomo() {
  clearInterval(pomoInterval);
  pomoRunning = false;

  const startBtn = $('btnStart');
  startBtn.textContent = 'Mulai';
  startBtn.classList.remove('active');

  const durations = { focus: 25, short: 5, long: 15 };
  pomoSeconds = durations[pomoMode] * 60;

  updatePomoDisplay();
  document.title = 'Weekly Planner';
}

// Initial display
updatePomoDisplay();

// Request browser notification permission on first user interaction
document.addEventListener('click', function requestNotif() {
  if (Notification && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  document.removeEventListener('click', requestNotif);
}, { once: true });