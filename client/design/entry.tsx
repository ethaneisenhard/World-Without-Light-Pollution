/** @jsxImportSource remix/ui */
import { run } from "remix/ui";
import { DesignSandboxRoot, DESIGN_SANDBOX_ENTRY_ID } from "./sandbox-root.tsx";

const clientRegistry: Record<string, typeof DesignSandboxRoot> = {
  DesignSandboxRoot,
};

const app = run({
  loadModule(moduleUrl, exportName) {
    const expectedHref = DESIGN_SANDBOX_ENTRY_ID.split("#")[0];
    if (moduleUrl !== expectedHref) {
      throw new Error(`Unknown client module URL: ${moduleUrl}`);
    }
    const component = clientRegistry[exportName];
    if (!component) throw new Error(`Unknown client export: ${exportName}`);
    return component;
  },
});

void app.ready();
