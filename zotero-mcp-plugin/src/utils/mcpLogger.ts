/**
 * Single file logger persistence for Zotero MCP Plugin
 */

const memoryLogs: string[] = [];
const MAX_MEMORY_LOGS = 500;

export function appendMcpLog(msg: string, level = "info") {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] [${level.toUpperCase()}] ${msg}`;

  memoryLogs.push(formatted);
  if (memoryLogs.length > MAX_MEMORY_LOGS) {
    memoryLogs.shift();
  }

  // Console output
  if (level === "error") {
    console.error(formatted);
  } else if (level === "warn") {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }

  // Persist asynchronously to Zotero.DataDirectory/zotero-mcp-debug.log
  try {
    if (
      typeof Zotero !== "undefined" &&
      Zotero.DataDirectory?.dir &&
      typeof PathUtils !== "undefined"
    ) {
      const logPath = PathUtils.join(
        Zotero.DataDirectory.dir,
        "zotero-mcp-debug.log",
      );
      if (typeof IOUtils !== "undefined" && IOUtils.writeUTF8) {
        const text = memoryLogs.join("\n") + "\n";
        IOUtils.writeUTF8(logPath, text).catch(() => {});
      }
    }
  } catch (_) {}
}

export function getMcpMemoryLogs(): string[] {
  return [...memoryLogs];
}
