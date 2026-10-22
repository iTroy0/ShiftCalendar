import {
  addMonths, cellState, dateLabel, dayParts, describe, monthFrame, monthLabel, mySchedule, today, weekdayHeader,
} from '../../common/schedule.js';

// How many months either side of the current one the title picker (and swiping) can reach.
const SPAN = 12;
const CELL_FIELDS = ['num', 'bg', 'fg', 'ring', 'ringWidth'];
// Kept out of `data` so the watch doesn't track every day of the schedule for changes.
let settings = null;
let frame = null;

export default {
  data: {
    todayDay: 0,
    selectedDay: 0,
    offset: 0,
    monthLabels: [],
    monthPos: '12',
    weekdays: [],
    // 6 rows of 7 cells, built once. Changing month only updates the cells' values, which is much
    // cheaper on the watch than recreating 42 elements.
    weeks: [],
    infoTitle: '',
    infoDetail: '',
  },
  onInit() {
    const t = today();
    const now = dayParts(t);
    this.todayDay = t;
    this.selectedDay = t;
    settings = mySchedule();
    const labels = [];
    for (let i = -SPAN; i <= SPAN; i++) {
      const m = addMonths(now.year, now.month, i);
      labels.push(monthLabel(m.year, m.month, now.year));
    }
    this.monthLabels = labels;
    this.weekdays = weekdayHeader();
    const weeks = [];
    for (let r = 0; r < 6; r++) {
      const days = [];
      for (let c = 0; c < 7; c++) {
        days.push({ id: r * 7 + c, num: '', bg: '#f2f2f4', fg: '#111111', ring: '#f2f2f4', ringWidth: '0px' });
      }
      weeks.push({ id: r, days });
    }
    this.weeks = weeks;
    this.refresh();
  },
  onShow() {
    this.crownFocus(true);
  },
  onHide() {
    this.crownFocus(false);
  },
  // Turning the crown scrolls the month picker; it needs focus for that.
  crownFocus(focus) {
    const picker = this.$refs ? this.$refs.monthPicker : null;
    if (picker && typeof picker.rotation === 'function') picker.rotation({ focus });
  },
  // Not called render: the framework puts the compiled template under that name.
  refresh() {
    const now = dayParts(this.todayDay);
    const m = addMonths(now.year, now.month, this.offset);
    frame = monthFrame(m.year, m.month);
    for (let i = 0; i < 42; i++) {
      this.paint(this.weeks[Math.floor(i / 7)].days[i % 7]);
    }
    this.monthPos = String(this.offset + SPAN);
    this.showInfo();
  },
  // Writes only the values that changed, so untouched cells cost nothing to redraw.
  paint(cell) {
    const state = cellState(frame.start + cell.id, frame, settings, this.todayDay, this.selectedDay);
    for (let k = 0; k < CELL_FIELDS.length; k++) {
      const key = CELL_FIELDS[k];
      if (cell[key] !== state[key]) cell[key] = state[key];
    }
  },
  showInfo() {
    if (settings) {
      const info = describe(this.selectedDay, settings, this.todayDay);
      this.infoTitle = info.title + ' · ' + info.label;
      this.infoDetail = info.time;
    } else {
      this.infoTitle = dateLabel(this.selectedDay);
      this.infoDetail = 'Check config.js';
    }
  },
  showMonth(offset) {
    const next = Math.max(-SPAN, Math.min(SPAN, offset));
    if (next === this.offset) return;
    this.offset = next;
    this.refresh();
  },
  pickMonth(e) {
    this.showMonth(e.newSelected - SPAN);
  },
  // Tapping a date only repaints the old and new selection. index is the cell's place in the grid.
  select(index) {
    const day = frame.start + index;
    const old = this.selectedDay;
    if (day === old) return;
    this.selectedDay = day;
    for (let r = 0; r < 6; r++) {
      const days = this.weeks[r].days;
      for (let c = 0; c < 7; c++) {
        const cellDay = frame.start + days[c].id;
        if (cellDay === old || cellDay === day) this.paint(days[c]);
      }
    }
    this.showInfo();
  },
  // Swipe up for the next month and down for the previous one.
  swiped(e) {
    if (e.direction === 'up') this.showMonth(this.offset + 1);
    else if (e.direction === 'down') this.showMonth(this.offset - 1);
  },
};
