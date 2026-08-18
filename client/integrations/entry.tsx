/** @jsxImportSource remix/ui */
/**
 * Client entry for `/__as/integrations` — mounts shared Directory demo.
 */
import { createRoot } from "remix/ui";
import { IntegrationsDemoRoot } from "./integrations-demo-root.tsx";

const el = document.getElementById("root");
if (el) {
  const root = createRoot(el);
  root.render(<IntegrationsDemoRoot />);
  root.flush();
}
