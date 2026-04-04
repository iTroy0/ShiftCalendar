const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAlarmSound(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const rawDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'raw'
      );

      if (!fs.existsSync(rawDir)) {
        fs.mkdirSync(rawDir, { recursive: true });
      }

      const src = path.join(config.modRequest.projectRoot, 'assets', 'alarm.mp3');
      const dest = path.join(rawDir, 'alarm.mp3');

      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }

      return config;
    },
  ]);
};
