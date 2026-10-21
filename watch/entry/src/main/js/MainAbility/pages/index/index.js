import {
  addMonths, dateLabel, dayParts, describe, monthLabel, monthWeeks, mySchedule, today, weekdayHeader,
} from '../../common/schedule.js';

// How many months either side of the current one the title picker (and swiping) can reach.
const SPAN = 24;

export default {
  data: {
    settings: null,
    todayDay: 0,
    selectedDay: 0,
    offset: 0,
    monthLabels: [],
    monthPos: '24',
    weekdays: [],
    weeks: [],
    rowHeight: '50px',
    cellSize: '44px',
    cellRadius: '22px',
    numSize: '24px',
    infoTitle: '',
    infoDetail: '',
  },
  onInit() {
    const t = today();
    const now = dayParts(t);
    this.todayDay = t;
    this.selectedDay = t;
    this.offset = 0;
    this.settings = mySchedule();
    const labels = [];
    for (let i = -SPAN; i <= SPAN; i++) {
      const m = addMonths(now.year, now.month, i);
      labels.push(monthLabel(m.year, m.month, now.year));
    }
    this.monthLabels = labels;
    this.weekdays = weekdayHeader();
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
    const weeks = monthWeeks(m.year, m.month, this.settings, this.todayDay, this.selectedDay);
    const six = weeks.length > 5;
    this.rowHeight = six ? '44px' : '50px';
    this.cellSize = six ? '40px' : '44px';
    this.cellRadius = six ? '20px' : '22px';
    this.numSize = six ? '22px' : '24px';
    this.weeks = weeks;
    this.monthPos = String(this.offset + SPAN);
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
  select(day) {
    if (day < 0) return; // padding cell outside the month
    this.selectedDay = day;
    this.refresh();
  },
  // Swipe left for the next month and right for the previous one, like the watch's calendar.
  swiped(e) {
    if (e.direction === 'left') this.showMonth(this.offset + 1);
    else if (e.direction === 'right') this.showMonth(this.offset - 1);
  },
};
