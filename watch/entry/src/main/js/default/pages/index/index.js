import router from '@system.router';
import {
  addMonths, cellState, dateLabel, dayParts, describe, monthFrame, monthTitle, scheduleFor, today, weekdayHeader,
} from '../../common/schedule.js';
import { loadSetup, parseSetup, saveSetup } from '../../common/setup.js';

const CELL_FIELDS = ['num', 'bg', 'fg', 'ring', 'ringWidth'];
// The swiper reports a new page once its slide has finished. Refilling the page that slid away waits
// this long more, so the slide's last frame is drawn first.
const REFILL_DELAY_MS = 30;
// The setup made on the watch (see common/setup.js) and the schedule worked out from it. Kept out of
// `data` so the watch doesn't track every day of the schedule for changes.
let setup = null;
let settings = null;
// The swiper's three pages: the month each holds (as months from today's) and its grid frame.
let pages = [];
// The page on screen.
let current = 1;
// A page to refill once the slide has finished ({ page, offset }), and the timer that does it.
let pending = null;
let pendingTimer = null;
// Adds the months either side after the first frame (see onReady).
let readyTimer = null;

export default {
  data: {
    // The setup the setup screen has just saved, passed along in case saving it failed.
    saved: '',
    todayDay: 0,
    selectedDay: 0,
    weekdays: [],
    // False until the months either side of the first one have been added (see onReady).
    ready: false,
    title0: '',
    title1: '',
    title2: '',
    // 6 rows of 7 cells per page, built once. Changing month only updates the cells' values, which is
    // much cheaper on the watch than recreating the elements.
    weeks0: [],
    weeks1: [],
    weeks2: [],
    infoTitle: '',
    infoDetail: '',
    // The page's own colour, so the pill only appears with the setup.
    infoBg: '#f2f2f4',
    infoInk: '#111111',
  },
  onInit() {
    const t = today();
    this.todayDay = t;
    this.selectedDay = t;
    setup = null;
    settings = null;
    pages = [{ offset: -1, frame: null }, { offset: 0, frame: null }, { offset: 1, frame: null }];
    current = 1;
    pending = null;
    pendingTimer = null;
    this.weekdays = weekdayHeader();
    for (let p = 0; p < 3; p++) {
      const weeks = [];
      for (let r = 0; r < 6; r++) {
        const days = [];
        for (let c = 0; c < 7; c++) {
          // Ids run on across the pages so a tap says which page it came from.
          days.push({ id: p * 42 + r * 7 + c, num: '', bg: '', fg: '', ring: '', ringWidth: '0px' });
        }
        weeks.push({ id: r, days });
      }
      this['weeks' + p] = weeks;
    }
    // The month is drawn once the setup has been read (reading it takes a moment), rather than drawn
    // plain and then coloured in.
    const passed = this.saved ? parseSetup(this.saved) : null;
    if (passed) this.useSetup(passed);
    else loadSetup((saved) => this.useSetup(saved));
  },
  onReady() {
    // Only the month on screen is drawn at first. The months either side are added once that's up,
    // so the app opens as quickly as with one month.
    readyTimer = setTimeout(() => {
      readyTimer = null;
      this.ready = true;
    }, 50);
  },
  onShow() {
    this.crownFocus(true);
  },
  onHide() {
    this.crownFocus(false);
  },
  onDestroy() {
    if (readyTimer !== null) clearTimeout(readyTimer);
    readyTimer = null;
    this.cancel();
  },
  // The crown slides through the months once the swiper has its focus.
  crownFocus(focus) {
    const swiper = this.$refs ? this.$refs.months : null;
    if (swiper && typeof swiper.rotation === 'function') swiper.rotation({ focus });
  },
  // Shows the shifts from a setup, or opens the setup screen if the watch hasn't been set up yet.
  useSetup(saved) {
    const schedule = saved ? scheduleFor(saved) : null;
    if (!schedule) {
      setTimeout(() => this.openSetup(), 0);
      return;
    }
    setup = saved;
    settings = schedule;
    for (let p = 0; p < 3; p++) this.fill(p, pages[p].offset);
    this.showInfo();
  },
  openSetup() {
    this.cancel();
    router.replace({ uri: 'pages/setup/setup' });
  },
  // Puts the month `offset` months from today's on page p.
  fill(p, offset) {
    const now = dayParts(this.todayDay);
    const m = addMonths(now.year, now.month, offset);
    const frame = monthFrame(m.year, m.month);
    pages[p] = { offset, frame };
    this['title' + p] = monthTitle(m.year, m.month, now.year);
    const weeks = this['weeks' + p];
    for (let r = 0; r < 6; r++) {
      const days = weeks[r].days;
      for (let c = 0; c < 7; c++) this.paint(days[c], frame);
    }
  },
  // Writes only the values that changed, so untouched cells cost nothing to redraw.
  paint(cell, frame) {
    const state = cellState(frame.start + (cell.id % 42), frame, settings, this.todayDay, this.selectedDay);
    for (let k = 0; k < CELL_FIELDS.length; k++) {
      const key = CELL_FIELDS[k];
      if (cell[key] !== state[key]) cell[key] = state[key];
    }
  },
  showInfo() {
    if (settings) {
      const info = describe(this.selectedDay, settings, this.todayDay);
      this.infoTitle = info.title;
      this.infoDetail = info.detail;
      this.infoBg = info.color;
      this.infoInk = info.ink;
    } else {
      this.infoTitle = dateLabel(this.selectedDay);
      this.infoDetail = '';
    }
  },
  // The swiper settled on another page: the next month (swiped up) or the previous one (down).
  paged(e) {
    const index = e.index;
    if (index === current) return;
    // A refill still waiting from the last slide is either this page, which must be right now, or
    // the page about to be refilled again below.
    if (pending && pending.page === index) this.flush();
    else this.cancel();
    const step = index === (current + 1) % 3 ? 1 : -1;
    current = index;
    // The page beyond the new month still holds the month that slid away: refill it with the month
    // after the new one, off screen, so the next swipe has it ready.
    const page = (index + step + 3) % 3;
    const offset = pages[index].offset + step;
    if (pages[page].offset === offset) return;
    pending = { page, offset };
    pendingTimer = setTimeout(() => this.flush(), REFILL_DELAY_MS);
  },
  flush() {
    const job = pending;
    this.cancel();
    if (job) this.fill(job.page, job.offset);
  },
  cancel() {
    if (pendingTimer !== null) clearTimeout(pendingTimer);
    pendingTimer = null;
    pending = null;
  },
  // The date in the cell with this id (ids run on across the three pages), or null before it's drawn.
  dayOf(id) {
    const frame = pages[Math.floor(id / 42)].frame;
    return frame ? frame.start + (id % 42) : null;
  },
  select(id) {
    const day = this.dayOf(id);
    if (day !== null && settings) this.selectDay(day, false);
  },
  // Holding a date books it as annual leave, or clears the leave on it. Saved on the watch.
  hold(id) {
    const day = this.dayOf(id);
    if (day === null || !setup) return;
    const marked = setup.leave;
    const onLeave = !!settings.leave[day];
    delete marked[day];
    settings = scheduleFor(setup);
    // Without the watch's own mark the day may still be on leave from config.js: clear that too.
    if (onLeave && settings.leave[day]) marked[day] = 'none';
    else if (!onLeave && !settings.leave[day]) marked[day] = 'AL';
    settings = scheduleFor(setup);
    saveSetup(setup);
    this.selectDay(day, true);
  },
  // Moves the green ring to `day` and shows that day in the pill, repainting only the cells involved.
  // `changed` repaints the day even if it was already selected.
  selectDay(day, changed) {
    const old = this.selectedDay;
    if (day === old && !changed) return;
    this.selectedDay = day;
    for (let p = 0; p < 3; p++) {
      const frame = pages[p].frame;
      if (!frame) continue;
      const weeks = this['weeks' + p];
      for (let i = 0; i < 42; i++) {
        const cellDay = frame.start + i;
        if (cellDay === old || cellDay === day) this.paint(weeks[Math.floor(i / 7)].days[i % 7], frame);
      }
    }
    this.showInfo();
  },
};
