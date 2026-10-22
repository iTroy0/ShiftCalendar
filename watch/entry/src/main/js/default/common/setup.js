import file from '@system.file';

// The setup made on the watch: { rotation: name, start: day number of a day 1, leave: { dayNumber: type } }.
// It's kept in the app's own storage on the watch.
const URI = 'internal://app/setup.json';

/** A setup from its saved text, or null if the text isn't one. */
export function parseSetup(text) {
  try {
    const setup = JSON.parse(text);
    if (!setup || typeof setup.rotation !== 'string' || typeof setup.start !== 'number') return null;
    return { rotation: setup.rotation, start: setup.start, leave: setup.leave || {} };
  } catch (e) {
    return null;
  }
}

/** Reads the saved setup and calls done(setup), or done(null) if the watch hasn't been set up yet. */
export function loadSetup(done) {
  file.readText({
    uri: URI,
    success: (data) => done(parseSetup(data.text)),
    fail: () => done(null),
  });
}

/** Saves a setup. done(saved) is told whether it worked. */
export function saveSetup(setup, done) {
  file.writeText({
    uri: URI,
    text: JSON.stringify(setup),
    // Replaces the file. Left out, the watch logs an error about it.
    append: false,
    success: () => {
      if (done) done(true);
    },
    fail: () => {
      if (done) done(false);
    },
  });
}
