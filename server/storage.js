import fs from 'node:fs/promises';
import path from 'node:path';

export function createJsonStore({ filePath, initialData }) {
  const dirPath = path.dirname(filePath);
  let data = null;
  let writeChain = Promise.resolve();

  async function ensureLoaded() {
    if (data) return;
    await fs.mkdir(dirPath, { recursive: true });
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      if (!raw || raw.trim() === '') {
        data = structuredClone(initialData);
      } else {
        data = JSON.parse(raw);
        // Validate basic structure
        if (!data || typeof data !== 'object') {
           data = structuredClone(initialData);
        }
        // Ensure all initial keys exist
        for (const key in initialData) {
           const expected = initialData[key];
           const actual = data[key];
           
           if (!(key in data)) {
              data[key] = structuredClone(expected);
           } else if (Array.isArray(expected) && !Array.isArray(actual)) {
              // Fix: If expected is array but actual is not (e.g. null/object), reset it to prevent crashes
              data[key] = structuredClone(expected);
           }
        }
      }
    } catch (err) {
      console.warn(`[Storage] Failed to load DB from ${filePath}, resetting to defaults. Error: ${err.message}`);
      data = structuredClone(initialData);
      await flush();
    }
  }

  async function flush() {
    const serialized = JSON.stringify(data, null, 2);
    const tmpPath = `${filePath}.tmp`;
    await fs.writeFile(tmpPath, serialized, 'utf8');
    await fs.rename(tmpPath, filePath);
  }

  function enqueueWrite() {
    writeChain = writeChain.then(() => flush()).catch(() => flush());
    return writeChain;
  }

  return {
    async read() {
      await ensureLoaded();
      return data;
    },
    async write(mutator) {
      await ensureLoaded();
      const result = await mutator(data);
      await enqueueWrite();
      return result === undefined ? data : result;
    }
  };
}
