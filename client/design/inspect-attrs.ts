/**
 * remix/ui inspect attr bag — mirror SSR stamps (tokens-and-markup.mdc).
 */

export type InspectComponentAttrs = {
  "data-as-inspect": "1";
  "data-as-kind": "component";
  "data-as-component": string;
  "data-as-instance"?: string;
  "data-as-source"?: string;
};

export type InspectSlotAttrs = {
  "data-as-inspect": "1";
  "data-as-kind": "slot";
  "data-as-component": string;
  "data-as-slot": string;
  "data-as-instance"?: string;
};

export function inspectComponentAttrs(input: {
  componentId: string;
  instanceId?: string;
  source?: string;
}): InspectComponentAttrs {
  const attrs: InspectComponentAttrs = {
    "data-as-inspect": "1",
    "data-as-kind": "component",
    "data-as-component": input.componentId,
  };
  if (input.instanceId) attrs["data-as-instance"] = input.instanceId;
  if (input.source) attrs["data-as-source"] = input.source;
  return attrs;
}

export function inspectSlotAttrs(input: {
  componentId: string;
  slot: string;
  instanceId?: string;
}): InspectSlotAttrs {
  const attrs: InspectSlotAttrs = {
    "data-as-inspect": "1",
    "data-as-kind": "slot",
    "data-as-component": input.componentId,
    "data-as-slot": input.slot,
  };
  if (input.instanceId) attrs["data-as-instance"] = input.instanceId;
  return attrs;
}
