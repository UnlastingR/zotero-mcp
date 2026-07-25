/**
 * Global persistent file and memory logger for Zotero MCP Plugin
 */

function getZoteroGlobal(): any {
  if (typeof Zotero !== "undefined" && Zotero.Items) return Zotero;
  if (typeof globalThis !== "undefined") {
    const win = (globalThis as any).window;
    if (win?.opener?.Zotero) return win.opener.Zotero;
  }
  if (typeof Services !== "undefined" && (Services as any).wm) {
    const mainWin = (Services as any).wm.getMostRecentWindow(
      "navigator:browser",
    );
    if (mainWin && mainWin.Zotero) return mainWin.Zotero;
  }
  return null;
}

export function appendMcpLog(msg: string, level = "info") {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] [${level.toUpperCase()}] ${msg}`;

  const zotero = getZoteroGlobal();

  // Console output
  if (level === "error") {
    console.error(formatted);
  } else if (level === "warn") {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }

  if (zotero) {
    if (!zotero.ZoteroMCP) zotero.ZoteroMCP = {};
    if (!zotero.ZoteroMCP.mcpLogs) zotero.ZoteroMCP.mcpLogs = [];

    zotero.ZoteroMCP.mcpLogs.push(formatted);
    if (zotero.ZoteroMCP.mcpLogs.length > 500) {
      zotero.ZoteroMCP.mcpLogs.shift();
    }

    // Persist to file: Zotero.DataDirectory.dir/zotero-mcp-debug.log
    try {
      const dataDir = zotero.DataDirectory?.dir;
      if (dataDir) {
        let logPath = "";
        if (typeof PathUtils !== "undefined" && PathUtils.join) {
          logPath = PathUtils.join(dataDir, "zotero-mcp-debug.log");
        } else {
          logPath = dataDir + "/zotero-mcp-debug.log";
        }

        const content = zotero.ZoteroMCP.mcpLogs.join("\n") + "\n";

        if (zotero.File?.putContentsAsync) {
          zotero.File.putContentsAsync(logPath, content).catch(() => {});
        } else if (typeof IOUtils !== "undefined" && IOUtils.writeUTF8) {
          IOUtils.writeUTF8(logPath, content).catch(() => {});
        }
      }
    } catch (_) {}
  }
}

export function getMcpMemoryLogs(): string[] {
  const zotero = getZoteroGlobal();
  if (zotero?.ZoteroMCP?.mcpLogs) {
    return [...zotero.ZoteroMCP.mcpLogs];
  }
  return ["- 尚未产生 MCP 调试日志 -"];
}
