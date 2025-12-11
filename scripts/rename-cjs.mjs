/* eslint-disable no-undef, @typescript-eslint/explicit-function-return-type */
import { readdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const baseDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'cjs');

/**
 * Recursively rename .js files to .cjs in a directory and update require statements
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
 * Process a single file entry to update require statements
 * @param {string} directoryPath - The parent directory path
 * @param {import('fs').Dirent} entry - The directory entry
 * @returns {Promise<void>}
 */
async function processEntry(directoryPath, entry) {
  const entryPath = path.join(directoryPath, entry.name);

  if (entry.isDirectory()) {
    await updateRequireStatements(entryPath);
    return;
  }

  if (entry.isFile() && entry.name.endsWith('.cjs')) {
    const content = await readFile(entryPath, 'utf8');
    const updatedContent = await updateRequireInContent(content, directoryPath);

    if (updatedContent !== content) {
      await writeFile(entryPath, updatedContent, 'utf8');
    }
  }
}

/**
 * Update require statements in file content
 * @param {string} content - The file content
 * @param {string} directoryPath - The directory path
 * @returns {Promise<string>}
 */
async function updateRequireInContent(content, directoryPath) {
  let updatedContent = content;
  const requireRegex = /require\("(\.\/[^"]*?)"\)/g;
  let match;

  while ((match = requireRegex.exec(content)) !== null) {
    const requirePath = match[1];
    const fullPath = requirePath.startsWith('./') ? requirePath.slice(2) : requirePath;
    const directoryPath_ = path.join(directoryPath, fullPath);

    try {
      const stats = await stat(directoryPath_);
      if (!stats.isDirectory()) {
        continue;
      }
      // Check if index.cjs exists in this directory
      const indexPath = path.join(directoryPath_, 'index.cjs');
      const indexStats = await stat(indexPath);
      if (indexStats.isFile()) {
        updatedContent = updatedContent.replace(
          `require("${requirePath}")`,
          `require("${requirePath}/index.cjs")`
        );
      }
    } catch {
      // Path doesn't exist as directory, use .cjs extension
    }

    // Default case: add .cjs extension
    updatedContent = updatedContent.replace(
      `require("${requirePath}")`,
      `require("${requirePath}.cjs")`
    );
  }

  return updatedContent;
}

/**
 * Update require statements in .cjs files to use .cjs extensions
 * @param {string} directoryPath - The directory path to process
 * @returns {Promise<void>}
 */
async function updateRequireStatements(directoryPath) {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  await Promise.all(entries.map((entry) => processEntry(directoryPath, entry)));
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
  await updateRequireStatements(baseDirectory);
}

(async () => {
  try {
    await main();
  } catch (error) {
    console.error('Failed to rename CommonJS outputs', error);
    process.exitCode = 1;
  }
})();
