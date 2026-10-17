/** Stateless MCP (2026-07-28) envelope checks, independent of Zotero runtime. */
export const MODERN_MCP_VERSION = "2026-07-28";
export const LEGACY_MCP_VERSIONS = ["2025-11-25", "2025-03-26", "2024-11-05"];

export interface MCPEnvelope {
  id?: string | number | null;
  method?: string;
  params?: Record<string, any>;
  _meta?: Record<string, any>;
}

export interface MCPEnvelopeError {
  code: number;
  message: string;
  data?: Record<string, unknown>;
}

export function isModernMCPRequest(request: MCPEnvelope, headers: Record<string, string>): boolean {
  // MCP request metadata lives in params._meta, not at JSON-RPC top level.
  const version = (request.params?._meta ?? request._meta)?.["io.modelcontextprotocol/protocolVersion"];
  return request.method === "server/discover" ||
    (typeof version === "string" && version >= MODERN_MCP_VERSION) ||
    (typeof headers["mcp-protocol-version"] === "string" &&
      headers["mcp-protocol-version"] >= MODERN_MCP_VERSION);
}

/** Validate required 2026 metadata and mirrored routing headers. */
export function validateModernMCPRequest(
  request: MCPEnvelope,
  headers: Record<string, string>,
): MCPEnvelopeError | null {
  const meta = request.params?._meta ?? request._meta;
  const version = meta?.["io.modelcontextprotocol/protocolVersion"];
  if (version !== MODERN_MCP_VERSION) {
    return {
      code: -32022,
      message: "Unsupported protocol version",
      data: {
        supported: [MODERN_MCP_VERSION, ...LEGACY_MCP_VERSIONS],
        requested: version ?? headers["mcp-protocol-version"] ?? null,
      },
    };
  }

  const name = request.method === "tools/call" || request.method === "prompts/get"
    ? request.params?.name
    : request.method === "resources/read" ? request.params?.uri : undefined;
  if (headers["mcp-protocol-version"] !== version ||
      headers["mcp-method"] !== request.method ||
      (name !== undefined && headers["mcp-name"] !== name) ||
      (name === undefined && headers["mcp-name"] !== undefined)) {
    return { code: -32020, message: "MCP request header mismatch" };
  }

  const capabilities = meta?.["io.modelcontextprotocol/clientCapabilities"];
  if (!capabilities || typeof capabilities !== "object" || Array.isArray(capabilities)) {
    return { code: -32600, message: "Missing MCP client capabilities metadata" };
  }
  return null;
}
