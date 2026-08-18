export interface FormSubmittedEventInput {
  destinationName: string;
  formTitle?: string;
  payload: Record<string, unknown>;
  test?: boolean;
}

/** Build the canonical form_submitted payload. */
export function buildFormSubmittedEventProperties(
  input: FormSubmittedEventInput,
): Record<string, unknown> | null {
  if (input.test) return null;
  return {
    form_id: input.destinationName,
    form_title: input.formTitle ?? input.destinationName,
    field_count: Object.keys(input.payload).length,
    event_label: "Form submitted",
  };
}

/** POST form_submitted through /api/events ingest. */
export async function postFormSubmittedEvent(
  apiBase: string,
  input: FormSubmittedEventInput,
  opts: {
    cookieHeader?: string;
    visitorId?: string;
    sessionId?: string;
    pageRoute?: string;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<void> {
  const properties = buildFormSubmittedEventProperties(input);
  if (!properties) return;
  const base = apiBase.replace(/\/$/, "");
  const fetchImpl = opts.fetchImpl ?? fetch;
  await fetchImpl(`${base}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(opts.cookieHeader ? { cookie: opts.cookieHeader } : {}),
    },
    body: JSON.stringify({
      event_name: "form_submitted",
      properties: {
        ...properties,
        ...(opts.visitorId ? { visitor_id: opts.visitorId } : {}),
        ...(opts.sessionId ? { session_id: opts.sessionId } : {}),
        ...(opts.pageRoute ? { page_route: opts.pageRoute } : {}),
      },
    }),
  });
}
