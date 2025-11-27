import { readdir, rename, stat } from 'fs/promises';
import path from 'path';

const baseDir = new URL('../dist/cjs', import.meta.url);

async function renameToCjs(directoryUrl) {
  const entries = await readdir(directoryUrl, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const entryUrl = new URL(`./${entry.name}`, directoryUrl);

      if (entry.isDirectory()) {
        await renameToCjs(entryUrl);
        return;
      }

      if (entry.isFile() && entry.name.endsWith('.js')) {
        const parsed = path.parse(entry.name);
        const cjsName = `${parsed.name}.cjs`;
        const targetUrl = new URL(`./${cjsName}`, directoryUrl);
        await rename(entryUrl, targetUrl);
      }
    })
  );
}

async function ensureExists(url) {
  try {
    const stats = await stat(url);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

async function main() {
  const exists = await ensureExists(baseDir);
  if (!exists) {
    return;
  }

  await renameToCjs(baseDir);
}

main().catch((error) => {
  console.error('Failed to rename CommonJS outputs', error);
  process.exitCode = 1;
});
