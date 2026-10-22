import { legacyHapTasks } from '@ohos/hvigor-ohos-plugin';
import * as fs from 'fs';
import * as path from 'path';

// The lite packer can leave stray bytes after the last entry of the .bin it writes. Cut them off
// before signing so the watch reads a clean package.
function trimLiteBinPlugin() {
  return {
    pluginId: 'trimLiteBinPlugin',
    apply(node: any) {
      const root = typeof node.getNodePath === 'function' ? node.getNodePath() : __dirname;
      node.registerTask({
        name: 'trimLiteBin',
        run: () => {
          const file = path.resolve(root, 'build/default/outputs/default/bin/entry-default-unsigned.bin');
          if (!fs.existsSync(file)) return;
          const b = fs.readFileSync(file);
          const u32 = (i: number) => b.readUInt32BE(i);
          let i = 1 + 4 + u32(1); // magic byte, bundle name length, bundle name
          while (i + 4 <= b.length) {
            const nameLen = u32(i);
            if (nameLen > 512 || i + 4 + nameLen + 4 > b.length) break;
            const sizeAt = i + 4 + nameLen + 4 + u32(i + 4 + nameLen);
            if (sizeAt + 8 > b.length) break;
            const next = sizeAt + 8 + Number(b.readBigUInt64BE(sizeAt));
            if (next > b.length) break;
            i = next;
          }
          if (i < b.length) fs.writeFileSync(file, b.subarray(0, i));
        },
        dependencies: ['default@LegacyGenerateLiteCode'],
        postDependencies: ['default@LegacySignLiteBin'],
      });
    },
  };
}

export default {
  system: legacyHapTasks,
  plugins: [trimLiteBinPlugin()]
}
