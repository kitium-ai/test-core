/* eslint-disable no-undef, @typescript-eslint/explicit-function-return-type */
import { readdir, rename, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const baseDirectory = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'dist',
  'cjs'
);

/**
 * Recursively rename .js files to .cjs in a directory
 * @param {string} directoryPath - The directory path to process
 * @returns {Promise<void>}
 */
async function renameToCjs(directoryPath) {
  const entries = await readdir(directoryPath, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        await renameToCjs(entryPath);
        return;
      }

      if (entry.isFile() && entry.name.endsWith('.js')) {
        const parsed = path.parse(entry.name);
        const cjsName = `${parsed.name}.cjs`;
        const targetPath = path.join(directoryPath, cjsName);
        await rename(entryPath, targetPath);
      }
    })
  );
}

/**
 * Check if a path points to an existing directory
 * @param {string} directoryPath - The directory path to check
 * @returns {Promise<boolean>}
 */
async function ensureExists(directoryPath) {
  try {
    const stats = await stat(directoryPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Main entry point
 * @returns {Promise<void>}
 */
async function main() {
  const exists = await ensureExists(baseDirectory);
  if (!exists) {
    return;
  }

  await renameToCjs(baseDirectory);
}

main().catch((error) => {
  console.error('Failed to rename CommonJS outputs', error);
  process.exitCode = 1;
});
