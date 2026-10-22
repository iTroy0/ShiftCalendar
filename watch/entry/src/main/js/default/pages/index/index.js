import {
  addMonths, cellState, dateLabel, dayParts, describe, gridStart, monthLabel, mySchedule, today, weekdayHeader,
} from '../../common/schedule.js';

// How many months either side of the current one the title picker (and swiping) can reach.
const SPAN = 24;
const CELL_FIELDS = ['num', 'bg', 'fg', 'ring', 'ringWidth'];

export default {
  data: {
    settings: null,
    todayDay: 0,
    selectedDay: 0,
    offset: 0,
    shownMonth: 0,
    monthLabels: [],
    monthPos: '24',
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
    this.settings = mySchedule();
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
        days.push({ id: r * 7 + c, day: 0, num: '', bg: '#f2f2f4', fg: '#111111', ring: '#f2f2f4', ringWidth: '0px' });
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
    this.shownMonth = m.month;
    const start = gridStart(m.year, m.month);
    for (let i = 0; i < 42; i++) {
      const cell = this.weeks[Math.floor(i / 7)].days[i % 7];
      cell.day = start + i;
      this.paint(cell);
    }
    this.monthPos = String(this.offset + SPAN);
    this.showInfo();
  },
  // Writes only the values that changed, so untouched cells cost nothing to redraw.
  paint(cell) {
    const state = cellState(cell.day, this.shownMonth, this.settings, this.todayDay, this.selectedDay);
    for (let k = 0; k < CELL_FIELDS.length; k++) {
      const key = CELL_FIELDS[k];
      if (cell[key] !== state[key]) cell[key] = state[key];
    }
  },
  showInfo() {
    if (this.settings) {
      const info = describe(this.selectedDay, this.settings, this.todayDay);
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
  // Tapping a date only repaints the old and new selection.
  select(day) {
    const old = this.selectedDay;
    if (day === old) return;
    this.selectedDay = day;
    for (let r = 0; r < 6; r++) {
      const days = this.weeks[r].days;
      for (let c = 0; c < 7; c++) {
        if (days[c].day === old || days[c].day === day) this.paint(days[c]);
      }
    }
    this.showInfo();
  },
  // Swipe left for the next month and right for the previous one, like the watch's calendar.
  swiped(e) {
    if (e.direction === 'left') this.showMonth(this.offset + 1);
    else if (e.direction === 'right') this.showMonth(this.offset - 1);
  },
};
