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
      data = JSON.parse(raw);
    } catch (err) {
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
