import router from '@system.router';
import {
  configSetup, dateLabel, findRotation, position, rotationDayLabels, rotationNames, rotationPattern, today,
} from '../../common/schedule.js';
import { loadSetup, saveSetup } from '../../common/setup.js';

// Leave already booked on the watch, kept when the rotation is set again.
let leave = {};
// The setup the pickers started from: its rotation's index and today's day of it.
let start = { rotation: 0, day: 0 };
// Turns the crown to the picker once it has been created.
let focusTimer = null;

export default {
  data: {
    title: '',
    hint: '',
    button: '',
    pickingRotation: true,
    pickingDay: false,
    rotations: [],
    // The pickers' selected rows, as strings like their `selected` attribute.
    rotation: '0',
    days: [],
    day: '0',
  },
  onInit() {
    leave = {};
    focusTimer = null;
    this.rotations = rotationNames();
    // Starts from config.js, or from the watch's own setup when it's being changed.
    this.prefill(configSetup());
    this.showStep(true);
    loadSetup((saved) => {
      if (!saved) return;
      leave = saved.leave || {};
      // Once past the first step the pickers are left alone.
      if (this.pickingRotation) this.prefill(saved);
    });
  },
  onShow() {
    this.crownFocus();
  },
  onHide() {
    this.focusPicker('rotationPicker', false);
    this.focusPicker('dayPicker', false);
  },
  onDestroy() {
    if (focusTimer !== null) clearTimeout(focusTimer);
    focusTimer = null;
  },
  // Turns the rotation picker to a setup's rotation, and remembers which of its days today is.
  prefill(setup) {
    const index = Math.max(0, findRotation(setup.rotation));
    const length = rotationDayLabels(this.rotations[index]).length;
    start = { rotation: index, day: typeof setup.start === 'number' ? position(today(), setup.start, length) : 0 };
    this.rotation = String(index);
    this.hint = rotationPattern(this.rotations[index]);
  },
  pickRotation(e) {
    this.rotation = String(e.newSelected);
    this.hint = rotationPattern(this.rotations[Number(this.rotation)]);
  },
  pickDay(e) {
    this.day = String(e.newSelected);
  },
  showStep(first) {
    if (!first) {
      // The day picker is created with this list, starting on today's day if the rotation is unchanged.
      const index = Number(this.rotation);
      this.days = rotationDayLabels(this.rotations[index]);
      this.day = String(index === start.rotation ? start.day : 0);
    }
    this.pickingRotation = first;
    this.pickingDay = !first;
    this.title = first ? 'Your rotation' : 'Today is';
    this.hint = first ? rotationPattern(this.rotations[Number(this.rotation)]) : dateLabel(today());
    this.button = first ? 'Next' : 'Save';
    if (focusTimer !== null) clearTimeout(focusTimer);
    focusTimer = setTimeout(() => {
      focusTimer = null;
      this.crownFocus();
    }, 50);
  },
  back() {
    this.showStep(true);
  },
  next() {
    if (this.pickingRotation) {
      this.showStep(false);
      return;
    }
    // Today is day `day` of the rotation, so its day 1 was that many days ago.
    const setup = { rotation: this.rotations[Number(this.rotation)], start: today() - Number(this.day), leave };
    saveSetup(setup, () => {
      // Passed along too, so the calendar shows it even if the watch couldn't save it.
      router.replace({ uri: 'pages/index/index', params: { saved: JSON.stringify(setup) } });
    });
  },
  // The crown turns the picker on screen.
  crownFocus() {
    this.focusPicker(this.pickingRotation ? 'rotationPicker' : 'dayPicker', true);
  },
  focusPicker(ref, focus) {
    const picker = this.$refs ? this.$refs[ref] : null;
    if (picker && typeof picker.rotation === 'function') picker.rotation({ focus });
  },
};
