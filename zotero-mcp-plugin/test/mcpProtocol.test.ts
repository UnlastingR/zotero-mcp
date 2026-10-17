import { expect } from "chai";
import {
  isModernMCPRequest,
  validateModernMCPRequest,
} from "../src/modules/mcpProtocol.ts";

const version = "2026-07-28";
const metadata = {
  "io.modelcontextprotocol/protocolVersion": version,
  "io.modelcontextprotocol/clientCapabilities": {},
  "io.modelcontextprotocol/clientInfo": { name: "test-client", version: "1.0" },
};

describe("MCP 2026-07-28 stateless request envelopes", () => {
  it("accepts discovery without sessions", () => {
    const request = { method: "server/discover", params: { _meta: metadata } };
    const headers = { "mcp-protocol-version": version, "mcp-method": "server/discover" };
    expect(isModernMCPRequest(request, headers)).to.equal(true);
    expect(validateModernMCPRequest(request, headers)).to.equal(null);
  });

  it("enforces the tool name routing header", () => {
    const request = { method: "tools/call", params: { name: "search_library", _meta: metadata } };
    const headers = {
      "mcp-protocol-version": version,
      "mcp-method": "tools/call",
      "mcp-name": "search_library",
    };
    expect(validateModernMCPRequest(request, headers)).to.equal(null);
    expect(validateModernMCPRequest(request, { ...headers, "mcp-name": "write_item" })?.code).to.equal(-32020);
    expect(validateModernMCPRequest(request, { ...headers, "mcp-method": "tools/list" })?.code).to.equal(-32020);
  });

  it("rejects missing request capabilities", () => {
    const request = { method: "tools/list", params: { _meta: { "io.modelcontextprotocol/protocolVersion": version } } };
    const headers = { "mcp-protocol-version": version, "mcp-method": "tools/list" };
    expect(validateModernMCPRequest(request, headers)?.code).to.equal(-32600);
  });

  it("returns the supported versions for an unsupported modern revision", () => {
    const request = { method: "server/discover", params: { _meta: { ...metadata, "io.modelcontextprotocol/protocolVersion": "2027-01-01" } } };
    const headers = { "mcp-protocol-version": "2027-01-01", "mcp-method": "server/discover" };
    const error = validateModernMCPRequest(request, headers);
    expect(error?.code).to.equal(-32022);
    expect(error?.data?.supported).to.include(version);
  });

  it("keeps handshake-era clients on legacy handling", () => {
    expect(isModernMCPRequest({ method: "initialize", params: { protocolVersion: "2025-11-25" } }, {})).to.equal(false);
  });
});
