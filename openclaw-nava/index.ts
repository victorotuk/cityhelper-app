/**
 * Nava plugin for OpenClaw
 * Use Nava from messaging apps (WhatsApp, iMessage, etc.)
 * Config: plugins.entries.nava.config = { api_url, api_key }
 */

const PLUGIN_ID = "nava";

function getConfig(api: { config?: any }) {
  return api.config?.plugins?.entries?.[PLUGIN_ID]?.config ?? {};
}

async function callNavaApi(api: { config?: any }, action: string, params: object): Promise<unknown> {
  const cfg = getConfig(api);
  const url = (cfg.api_url || "").replace(/\/$/, "");
  const key = cfg.api_key;
  if (!url || !key) {
    throw new Error("Nava plugin: Configure api_url and api_key in plugins.entries.nava.config");
  }
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ action, params }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `Nava API error: ${res.status}`);
  }
  return data;
}

function textResult(obj: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(obj) }] };
}

export default function (api: any) {
  api.registerTool(
    {
      name: "nava_add_item",
      description: "Add a compliance item (renewal, bill, deadline, subscription).",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Short name (e.g. Netflix renewal)" },
          category: {
            type: "string",
            enum: [
              "subscriptions", "parking", "driving", "tax", "health", "legal_court",
              "housing", "immigration", "credit_banking", "personal_insurance",
              "education", "trust", "kids_family", "business_tax", "assets", "other",
            ],
          },
          due_date: { type: "string", description: "YYYY-MM-DD or omit" },
          notes: { type: "string" },
          recurrence_interval: { type: "string", enum: ["1_month", "3_months", "6_months", "1_year"] },
          country: { type: "string", enum: ["ca", "us"] },
        },
        required: ["name", "category"],
      },
      async execute(_id: string, params: any) {
        const r = await callNavaApi(api, "add_item", params);
        return textResult(r);
      },
    },
    { optional: true }
  );

  api.registerTool(
    {
      name: "nava_list_items",
      description: "List user's compliance items.",
      parameters: { type: "object", properties: {} },
      async execute() {
        const r = await callNavaApi(api, "list_items", {});
        return textResult(r);
      },
    },
    { optional: true }
  );

  api.registerTool(
    {
      name: "nava_get_upcoming",
      description: "Get items due in the next 30 days.",
      parameters: { type: "object", properties: {} },
      async execute() {
        const r = await callNavaApi(api, "get_upcoming", {});
        return textResult(r);
      },
    },
    { optional: true }
  );

  api.registerTool(
    {
      name: "nava_update_item",
      description: "Update an item (due_date, name, notes, recurrence).",
      parameters: {
        type: "object",
        properties: {
          item_id: { type: "string" },
          due_date: { type: "string" },
          name: { type: "string" },
          notes: { type: "string" },
          recurrence_interval: { type: "string", enum: ["1_month", "3_months", "6_months", "1_year"] },
          alert_emails: { type: "string" },
        },
        required: ["item_id"],
      },
      async execute(_id: string, params: any) {
        const r = await callNavaApi(api, "update_item", params);
        return textResult(r);
      },
    },
    { optional: true }
  );

  api.registerTool(
    {
      name: "nava_delete_item",
      description: "Delete a compliance item.",
      parameters: {
        type: "object",
        properties: { item_id: { type: "string" } },
        required: ["item_id"],
      },
      async execute(_id: string, params: any) {
        const r = await callNavaApi(api, "delete_item", params);
        return textResult(r);
      },
    },
    { optional: true }
  );

  api.registerTool(
    {
      name: "nava_mark_done",
      description: "Mark an item as done. For recurring items, sets next due date.",
      parameters: {
        type: "object",
        properties: { item_id: { type: "string" } },
        required: ["item_id"],
      },
      async execute(_id: string, params: any) {
        const r = await callNavaApi(api, "mark_done", params);
        return textResult(r);
      },
    },
    { optional: true }
  );

  api.registerTool(
    {
      name: "nava_snooze_item",
      description: "Snooze reminders for an item (1, 3, or 7 days).",
      parameters: {
        type: "object",
        properties: {
          item_id: { type: "string" },
          days: { type: "number", enum: [1, 3, 7] },
        },
        required: ["item_id", "days"],
      },
      async execute(_id: string, params: any) {
        const r = await callNavaApi(api, "snooze_item", params);
        return textResult(r);
      },
    },
    { optional: true }
  );

  api.registerTool(
    {
      name: "nava_filter_items",
      description: "Filter items by category (subscriptions, parking, tax, etc.).",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: [
              "subscriptions", "parking", "driving", "tax", "health", "legal_court",
              "housing", "immigration", "credit_banking", "personal_insurance",
              "education", "trust", "kids_family", "business_tax", "assets", "other",
            ],
          },
        },
        required: ["category"],
      },
      async execute(_id: string, params: any) {
        const r = await callNavaApi(api, "filter_items", params);
        return textResult(r);
      },
    },
    { optional: true }
  );

  api.registerTool(
    {
      name: "nava_get_completed",
      description: "Get recently completed items.",
      parameters: {
        type: "object",
        properties: { days: { type: "number", description: "Look back days (default 30)" } },
      },
      async execute(_id: string, params: any) {
        const r = await callNavaApi(api, "get_completed", params || {});
        return textResult(r);
      },
    },
    { optional: true }
  );

  api.registerTool(
    {
      name: "nava_get_application_guide",
      description: "Get step-by-step guide for government applications (work permit, study permit, visitor visa, PR card).",
      parameters: {
        type: "object",
        properties: {
          application_type: {
            type: "string",
            enum: ["work_permit", "study_permit", "visitor_visa", "pr_card"],
          },
        },
        required: ["application_type"],
      },
      async execute(_id: string, params: any) {
        const r = await callNavaApi(api, "get_application_guide", params);
        return textResult(r);
      },
    },
    { optional: true }
  );
}
