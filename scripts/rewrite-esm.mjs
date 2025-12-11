/* eslint-disable no-undef, @typescript-eslint/explicit-function-return-type */
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const baseDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'esm');

/**
 * Process a single file entry to rewrite ESM imports
 * @param {string} directoryPath - The parent directory path
 * @param {import('fs').Dirent} entry - The directory entry
 * @returns {Promise<void>}
 */
async function processEsmEntry(directoryPath, entry) {
  const entryPath = path.join(directoryPath, entry.name);

  if (entry.isDirectory()) {
    await rewriteEsmImports(entryPath);
    return;
  }

  if (entry.isFile() && entry.name.endsWith('.js')) {
    const content = await readFile(entryPath, 'utf8');
    const updatedContent = await updateImportsInContent(content, directoryPath);

    if (updatedContent !== content) {
      await writeFile(entryPath, updatedContent, 'utf8');
    }
  }
}

/**
 * Update import statements in file content
 * @param {string} content - The file content
 * @param {string} directoryPath - The directory path
 * @returns {Promise<string>}
 */
async function updateImportsInContent(content, directoryPath) {
  let updatedContent = content;
  const importRegex = /from\s+['"](\.\/[^'"]*?)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];

    // Skip if it already ends with .js
    if (importPath.endsWith('.js')) {
      continue;
    }

    // Check if this points to a directory with index.js
    const fullPath = path.join(directoryPath, importPath);
    try {
      const stats = await stat(fullPath);
      if (!stats.isDirectory()) {
        continue;
      }
      const indexPath = path.join(fullPath, 'index.js');
      const indexStats = await stat(indexPath);
      if (indexStats.isFile()) {
        updatedContent = updatedContent.replace(
          `from '${importPath}'`,
          `from '${importPath}/index.js'`
        );
      }
    } catch {
      // Not a directory or doesn't exist
    }

    // If it's not a directory, add .js extension
    updatedContent = updatedContent.replace(`from '${importPath}'`, `from '${importPath}.js'`);
  }

  return updatedContent;
}

/**
 * Recursively rewrite relative imports in ESM files to include .js extensions
 * @param {string} directoryPath - The directory path to process
 * @returns {Promise<void>}
 */
async function rewriteEsmImports(directoryPath) {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  await Promise.all(entries.map((entry) => processEsmEntry(directoryPath, entry)));
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

  await rewriteEsmImports(baseDirectory);
}

(async () => {
  try {
    await main();
  } catch (error) {
    console.error('Failed to rewrite ESM imports', error);
    process.exitCode = 1;
  }
})();
