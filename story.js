const byId = id => document.getElementById(id);
const canvas = byId('lake-map');
const map = canvas.getContext('2d');
const grain = Array.from({ length: 520 }, (_, index) => [
  (Math.sin(index * 77.73) + 1) * canvas.width * .499,
  (Math.sin(index * 19.12) + 1) * canvas.height * .499,
]);

function paintMap(amount) {
  if (!map) return;
  const { width, height } = canvas;
  const coast = x => 208 + Math.sin(x * .009 + 1.2) * 43 + Math.sin(x * .022) * 19 + Math.sin(x * .039) * 7;
  const trace = (curve, start = 0) => {
    map.beginPath();
    map.moveTo(start, curve(start));
    for (let x = start + 4; x <= width; x += 4) map.lineTo(x, curve(x));
  };

  map.fillStyle = '#334b38';
  map.fillRect(0, 0, width, height);
  trace(coast);
  map.lineTo(width, height);
  map.lineTo(0, height);
  map.closePath();
  const lake = map.createLinearGradient(0, 180, width, height);
  lake.addColorStop(0, '#203b36');
  lake.addColorStop(1, '#142e2c');
  map.fillStyle = lake;
  map.fill();

  map.lineWidth = 1;
  for (let index = 0; index < 21; index++) {
    trace(x => coast(x) - (index + 1) * 11 + Math.sin(x * .017 + index * .19) * (4 + index * .55));
    map.strokeStyle = index % 4 === 0 ? '#bdc48f69' : '#bac48d3b';
    map.stroke();
  }
  for (let index = 0; index < 12; index++) {
    trace(x => coast(x) + 9 + index * 17 + Math.sin(x * .011 + index * .39) * (1 + index * 2.2));
    map.strokeStyle = index % 3 === 0 ? '#93b2a35c' : '#79a59635';
    map.stroke();
  }
  trace(coast);
  map.strokeStyle = '#c2c998a0';
  map.stroke();

  map.beginPath();
  for (let x = 32; x < width; x += 50) { map.moveTo(x, 0); map.lineTo(x, height); }
  for (let y = 36; y < height; y += 50) { map.moveTo(0, y); map.lineTo(width, y); }
  map.strokeStyle = '#d5ded325';
  map.stroke();
  map.fillStyle = '#eeeed34d';
  for (const [x, y] of grain) map.fillRect(x, y, 1, 1);

  map.setLineDash([5, 5]);
  map.beginPath();
  map.moveTo(20, 113);
  map.bezierCurveTo(100, 107, 120, 198, 234, 187);
  map.bezierCurveTo(340, 168, 338, 70, 558, 93);
  map.strokeStyle = '#e1c88ca5';
  map.stroke();
  map.setLineDash([]);
  map.fillStyle = '#ced39c';
  map.fillRect(220, 186, 23, 7);
  map.fillRect(231, 194, 12, 4);
  if (amount > .08) {
    map.fillStyle = `rgba(201, 205, 151, ${amount * .57})`;
    map.fillRect(232 + amount * 9, 201 + amount * 22, 14, 4);
  }
  map.fillStyle = `rgba(45, 42, 26, ${amount * .46})`;
  map.fillRect(0, 0, width, height);
}

const root = document.documentElement;
const rooms = byId('rooms');
const reviews = byId('stories');
const guide = byId('guide');
const promo = byId('reservations');
const booking = byId('booking');
const bookingRoom = byId('booking-room');
const checkIn = byId('check-in');
const checkOut = byId('check-out');
const bookingResult = byId('booking-result');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

const chapters = [
  {},
  {
    'inventory-note': '共 16 间客房 · 更新于 03:17',
  },
  {
    'room-inventory': '部分房态正在同步，请稍后重查',
    'inventory-note': '编号 01–16 · 仍有 17 条房态',
    'review-middle': '我们住了两晚。第二晚我把窗关上了。早晨前台说，第二晚登记的是另一个人。',
  },
  {
    'header-status': '夜间值班 · 房态更新中',
    'header-hours': '入住 15:00 · 退房以房卡回执为准',
    'review-last': '我走的时候把房卡留在了木盒里。前台打来电话，说我刚刚从房间打给了他。',
    'review-last-name': '陈女士 · 06 号房',
    'review-last-date': '更新于 03:17',
    'hours-answer': '入住从 15:00 开始。退房时间由前台登记，一般在住客离开之后。',
    'arrival-answer': '可以。若登记册旁已经有一张与你相同的房卡，请在前台等一会儿。',
    'leaving-answer': '可以。把房卡放回木盒后，等前台把你的房间从在住名单上划掉。只需退回一张。',
  },
];

const reservationUpdates = [
  {},
  {
    'reservation-time': '03:17:00',
    'reservation-state': '剩余 1 间',
    'reservation-note': '正在核对预留客房。',
  },
  {
    'reservation-time': '03:16:59',
    'reservation-room': '北翼湖景房 · 06',
    'reservation-date': '已登记',
    'reservation-state': '在住 · 1 位',
    'reservation-note': '前台收到一张退回的房卡。房内登记没有结束。',
  },
  {
    'promo-title': '房间还在等你回来。',
    'promo-description': '床头灯还是你离开时的亮度。',
    'reservation-label': '空房查询 · 自动回执',
    'reservation-time': '03:17:00',
    'reservation-date-label': '退房',
    'reservation-date': '已登记',
    'reservation-state': '门已从内侧锁上',
    'reservation-note': '早餐仍按一位准备。登记册上的住客，是你。',
  },
];

const initial = new Map();
for (const changes of [...chapters, ...reservationUpdates]) {
  for (const id of Object.keys(changes)) initial.set(id, byId(id).textContent);
}

const timers = new Set();
let chapter = 0;
let reservationStage = 0;
let scheduled = false;
let tone = 0;
let lastPaint = -1;
let raf = 0;

function applyCopy(changes) {
  for (const [id, text] of Object.entries(changes)) byId(id).textContent = text;
}

function showReservation(next) {
  reservationStage = next;
  applyCopy(reservationUpdates[next]);
  if (next >= 2) promo.dataset.status = 'revised';
  if (!bookingResult.hidden) showBookingResult();
}

const observer = new IntersectionObserver(entries => {
  if (scheduled || !entries.some(entry => entry.isIntersecting)) return;
  scheduled = true;
  for (const [delay, step] of [[900, 1], [2350, 2], [4250, 3]]) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      showReservation(step);
    }, delay);
    timers.add(timer);
  }
}, { threshold: .48 });
observer.observe(promo);

function clamp(value) {
  return Math.min(1, Math.max(0, value));
}

function render() {
  raf = 0;
  const scroll = clamp(scrollY / Math.max(1, root.scrollHeight - innerHeight));
  const nextChapter = guide.getBoundingClientRect().top < innerHeight * .58 ? 3
    : reviews.getBoundingClientRect().top < innerHeight * .47 ? 2
    : rooms.getBoundingClientRect().top < innerHeight * .15 ? 1 : 0;
  while (chapter < nextChapter) applyCopy(chapters[++chapter]);

  const target = clamp((scroll - .15) / .85) ** 1.45 * .76;
  tone = reducedMotion.matches ? target : tone + (target - tone) * .13;
  if (Math.abs(tone - target) < .001) tone = target;
  root.style.setProperty('--decay', `${(tone * 100).toFixed(2)}%`);
  root.style.setProperty('--drift', `${(tone * 9).toFixed(1)}px`);
  const mapTone = Math.max(tone, (chapter > 1 ? .16 : 0));
  if (lastPaint < 0 || (Math.abs(mapTone - lastPaint) > .018 && canvas.getBoundingClientRect().bottom > 0)) {
    paintMap(mapTone);
    lastPaint = mapTone;
  }
  if (tone !== target) requestRender();
}

function requestRender() {
  if (!raf) raf = requestAnimationFrame(render);
}

function dateValue(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function updateDates() {
  const tomorrow = new Date(`${checkIn.value || checkIn.min}T12:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  checkOut.min = dateValue(tomorrow);
  if (checkOut.value < checkOut.min) checkOut.value = checkOut.min;
  bookingResult.hidden = true;
}

function showBookingResult() {
  let result;
  if (reservationStage >= 2) {
    result = '最后一间可查询房型为北翼湖景房。系统已找到同一间房的在住记录。';
  } else if (chapter >= 2) {
    result = `${bookingRoom.value}还有 1 间。前台正在核对登记册上的同一间房。`;
  } else {
    const rate = bookingRoom.selectedIndex === 0 ? 680 : 960;
    result = `${bookingRoom.value}可预订，¥${rate} 起 / 晚，含早餐。`;
  }
  byId('booking-message').textContent = result;
  bookingResult.hidden = false;
}

for (const button of document.querySelectorAll('.js-book')) {
  button.addEventListener('click', () => {
    if (button.dataset.room) bookingRoom.value = button.dataset.room;
    checkIn.min = dateValue(new Date());
    if (checkIn.value < checkIn.min) checkIn.value = checkIn.min;
    updateDates();
    booking.showModal();
  });
}
checkIn.addEventListener('change', updateDates);
checkOut.addEventListener('change', () => { bookingResult.hidden = true; });
bookingRoom.addEventListener('change', () => { bookingResult.hidden = true; });
byId('booking-form').addEventListener('submit', event => {
  event.preventDefault();
  showBookingResult();
});
byId('close-booking').addEventListener('click', () => booking.close());
booking.addEventListener('click', event => {
  if (event.target === booking) booking.close();
});

byId('reset').addEventListener('click', () => {
  for (const timer of timers) clearTimeout(timer);
  timers.clear();
  chapter = 0;
  reservationStage = 0;
  scheduled = false;
  tone = 0;
  lastPaint = -1;
  delete promo.dataset.status;
  applyCopy(Object.fromEntries(initial));
  for (const detail of guide.querySelectorAll('details[open]')) detail.open = false;
  bookingResult.hidden = true;
  history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.querySelector('.brand').focus({ preventScroll: true });
  requestRender();
});

window.addEventListener('scroll', requestRender, { passive: true });
window.addEventListener('resize', requestRender);
window.addEventListener('pageshow', requestRender);
reducedMotion.addEventListener('change', requestRender);
requestRender();
