/* eslint-disable no-undef, @typescript-eslint/explicit-function-return-type */
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const baseDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'esm');

/**
 * Recursively rewrite relative imports in ESM files to include .js extensions
 * @param {string} directoryPath - The directory path to process
 * @returns {Promise<void>}
 */
async function rewriteEsmImports(directoryPath) {
  const entries = await readdir(directoryPath, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        await rewriteEsmImports(entryPath);
        return;
      }

      if (entry.isFile() && entry.name.endsWith('.js')) {
        const content = await readFile(entryPath, 'utf8');
        let updatedContent = content;

        // Find all import statements and update them
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
            if (stats.isDirectory()) {
              const indexPath = path.join(fullPath, 'index.js');
              const indexStats = await stat(indexPath);
              if (indexStats.isFile()) {
                updatedContent = updatedContent.replace(
                  `from '${importPath}'`,
                  `from '${importPath}/index.js'`
                );
                continue;
              }
            }
          } catch {
            // Not a directory or doesn't exist
          }

          // If it's not a directory, add .js extension
          updatedContent = updatedContent.replace(
            `from '${importPath}'`,
            `from '${importPath}.js'`
          );
        }

        if (updatedContent !== content) {
          await writeFile(entryPath, updatedContent, 'utf8');
        }
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
