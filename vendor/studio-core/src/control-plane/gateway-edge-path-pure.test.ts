import { describe, expect, it } from "vitest";
import {
  gatewayEdgePathKind,
  isPublicGatewayApiPath,
} from "./gateway-edge-path-pure.js";

describe("gateway-edge-path-pure", () => {
  it("locks OpenAI-compat and admin API on the public vhost", () => {
    expect(gatewayEdgePathKind("/v1/models")).toBe("api");
    expect(gatewayEdgePathKind("/v1/chat/completions")).toBe("api");
    expect(isPublicGatewayApiPath("/key/info")).toBe(true);
    expect(isPublicGatewayApiPath("/health/liveliness")).toBe(true);
    expect(isPublicGatewayApiPath("/models")).toBe(true);
  });

  it("leaves Admin UI paths on the public vhost", () => {
    expect(gatewayEdgePathKind("/")).toBe("ui");
    expect(gatewayEdgePathKind("/ui")).toBe("ui");
    expect(gatewayEdgePathKind("/fallback/login")).toBe("ui");
    expect(isPublicGatewayApiPath("/sso/callback")).toBe(false);
  });
});
