import fs from "fs";
import path from "path";
import { z } from "zod";

const SUPPORTED_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

const EXTRACTION_PROMPT = `You are extracting structured subscription information from an invoice, receipt, billing screenshot, or subscription confirmation document.

Extract only information explicitly supported by the document.

Return structured JSON with:
name
amount
currency
renewalDate
billingCycle
category

Rules:
- name: string, required, subscription/service name
- amount: positive number, required, numeric only (no currency symbols)
- currency: string, 3-letter code or INR/USD etc, default INR if inferable
- renewalDate: valid date string (YYYY-MM-DD preferred), required
- billingCycle: one of monthly, quarterly, yearly, custom (normalize: per month/monthly/every month->monthly, quarterly/every 3 months->quarterly, annual/yearly/per year->yearly, else custom)
- category: string, optional

Do not invent missing values. If a required field cannot be determined reliably, indicate that it cannot be determined.
Return ONLY valid JSON, no markdown, no extra text.`;

// Zod schema after normalization
const extractionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.string().trim().min(1).max(10).default("INR"),
  renewalDate: z.coerce.date({ invalid_type_error: "Invalid renewalDate" }),
  billingCycle: z.enum(["monthly", "quarterly", "yearly", "custom"]),
  category: z.string().trim().max(50).optional(),
});

function normalizeCurrency(raw) {
  if (!raw) return "INR";
  let s = String(raw).trim().toUpperCase();
  // map symbols
  if (s.includes("₹") || s === "RS" || s === "RS." || s === "INR") return "INR";
  if (s.includes("$") || s === "USD") return "USD";
  if (s.includes("€") || s === "EUR") return "EUR";
  if (s.includes("£") || s === "GBP") return "GBP";
  // strip symbols
  s = s.replace(/[₹$€£]/g, "").trim();
  if (!s) return "INR";
  return s.slice(0, 10);
}

function normalizeAmount(rawAmount, rawCurrency) {
  let currency = rawCurrency;
  if (rawAmount == null) return { amount: null, currency };
  let str = String(rawAmount).trim();
  // detect currency symbols inside amount string
  if (str.includes("₹")) currency = currency || "INR";
  else if (str.includes("$")) currency = currency || "USD";
  else if (str.includes("€")) currency = currency || "EUR";
  else if (str.includes("£")) currency = currency || "GBP";

  // extract numeric part: keep digits, dot, comma, minus
  // remove commas, extract first number
  const cleaned = str.replace(/,/g, "");
  const match = cleaned.match(/-?\d+(\.\d+)?/);
  if (!match) return { amount: null, currency };
  const num = Number(match[0]);
  if (Number.isNaN(num)) return { amount: null, currency };
  return { amount: num, currency };
}

function normalizeBillingCycle(raw) {
  if (!raw) return "custom";
  const s = String(raw).trim().toLowerCase();
  if (["monthly", "quarterly", "yearly", "custom"].includes(s)) return s;
  if (s.includes("quarter") || s.includes("3 month")) return "quarterly";
  if (s.includes("annual") || s.includes("yearly") || s.includes("per year") || s.includes("annually") || s === "year" || s.includes("year")) return "yearly";
  if (s.includes("month")) return "monthly";
  return "custom";
}

function normalizeRenewalDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
  if (typeof raw === "number") {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }
  let str = String(raw).trim();
  if (!str) return null;

  // Try ISO YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]);
    const d = Number(isoMatch[3]);
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) return date;
    return null;
  }

  // Slash or dash with 3 parts but not ISO (first part not 4 digits)
  const dmMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmMatch) {
    const a = Number(dmMatch[1]);
    const b = Number(dmMatch[2]);
    let y = Number(dmMatch[3]);
    if (y < 100) y += 2000; // 2-digit year
    // ambiguous check
    const bothLE12 = a <= 12 && b <= 12;
    if (bothLE12) return null; // ambiguous -> fail per spec
    let day, month;
    if (a > 12) {
      // must be DD/MM
      day = a;
      month = b;
    } else if (b > 12) {
      // must be MM/DD
      day = b;
      month = a;
    } else {
      return null;
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const date = new Date(y, month - 1, day);
    if (date.getFullYear() === y && date.getMonth() === month - 1 && date.getDate() === day) return date;
    return null;
  }

  // Natural language: try Date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    // Additional guard: if original string was slash ambiguous but we already returned null, this won't be reached
    // For natural language, accept
    return parsed;
  }
  return null;
}

function extractJsonFromResponse(text) {
  if (!text) return null;
  let t = String(text).trim();
  // strip markdown fences
  const fenceMatch = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) t = fenceMatch[1].trim();
  // try direct JSON parse
  try {
    return JSON.parse(t);
  } catch {}
  // try to find first { ... } block
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const sub = t.slice(start, end + 1);
    try {
      return JSON.parse(sub);
    } catch {}
  }
  return null;
}

function validateAndNormalize(raw) {
  if (!raw || typeof raw !== "object") return { error: "AI returned invalid structure" };

  // Handle case where AI nests inside data/result
  let data = raw;
  if (raw.data && typeof raw.data === "object" && !raw.name) data = raw.data;
  if (raw.result && typeof raw.result === "object" && !raw.name) data = raw.result;

  let { name, amount, currency, renewalDate, billingCycle, category } = data;

  // Normalize amount + currency
  if (typeof amount === "string") {
    const norm = normalizeAmount(amount, currency);
    amount = norm.amount;
    currency = norm.currency;
  } else if (typeof amount === "number") {
    // still check currency symbols in currency field
    currency = normalizeCurrency(currency);
  } else if (amount != null) {
    const norm = normalizeAmount(String(amount), currency);
    amount = norm.amount;
    currency = norm.currency;
  }

  currency = normalizeCurrency(currency);
  billingCycle = normalizeBillingCycle(billingCycle);

  const normalizedDate = normalizeRenewalDate(renewalDate);
  if (!normalizedDate) {
    return { error: "Invalid or ambiguous renewalDate" };
  }

  const toValidate = {
    name: name != null ? String(name).trim() : "",
    amount,
    currency,
    renewalDate: normalizedDate,
    billingCycle,
  };
  if (category != null && String(category).trim()) toValidate.category = String(category).trim();

  const parsed = extractionSchema.safeParse(toValidate);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, issues: parsed.error.issues };
  }
  return { data: parsed.data };
}

// Provider abstraction
async function callMockProvider(filePath, mimeType) {
  const behavior = (process.env.AI_MOCK_BEHAVIOR || "success").toLowerCase();
  if (behavior === "malformed") {
    return "not json at all {{{";
  }
  if (behavior === "missing") {
    return JSON.stringify({ name: "Test", amount: null, currency: "INR" });
  }
  if (behavior === "failure") {
    throw new Error("Mock provider failure");
  }

  // success: return deterministic valid JSON
  // ponytail: mock returns canned data; replace with real provider when AI_API_KEY set
  const baseName = path.basename(filePath, path.extname(filePath));
  // try to infer name from file content? keep simple
  const future = new Date();
  future.setDate(future.getDate() + 30);
  const name = baseName && baseName !== "undefined" ? baseName.slice(0, 50) : "Extracted Subscription";
  // Use a friendly name if baseName is uuid
  const displayName = /^[0-9a-f-]{10,}$/i.test(name) ? "Mock Subscription" : name.replace(/[_-]+/g, " ").trim() || "Mock Subscription";
  return JSON.stringify({
    name: displayName,
    amount: 649,
    currency: "INR",
    renewalDate: future.toISOString().split("T")[0],
    billingCycle: "monthly",
    category: "entertainment",
  });
}

async function callOpenAIProvider(filePath, mimeType) {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 30000);

  if (!apiKey) throw new Error("AI provider not configured");

  const buf = await fs.promises.readFile(filePath);
  const b64 = buf.toString("base64");
  const dataUrl = `data:${mimeType};base64,${b64}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Use chat completions with vision; for PDF we send as image_url too if provider supports pdf
    // ponytail: single OpenAI-compatible call, per-provider adapters if needed
    const body = {
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: EXTRACTION_PROMPT },
            // For images and PDFs, send as image_url; OpenAI now supports PDFs via image_url with pdf mime
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 1000,
    };

    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`AI provider error ${res.status}: ${txt.slice(0, 500)}`);
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");
    return typeof content === "string" ? content : JSON.stringify(content);
  } finally {
    clearTimeout(timeout);
  }
}

async function callAIProvider(filePath, mimeType) {
  const provider = (process.env.AI_PROVIDER || "").toLowerCase();
  const hasKey = !!(process.env.AI_API_KEY || process.env.OPENAI_API_KEY);
  if (provider === "openai" || (hasKey && provider !== "mock")) {
    return callOpenAIProvider(filePath, mimeType);
  }
  return callMockProvider(filePath, mimeType);
}

export async function extractSubscriptionFromFile(filePath, mimeType) {
  if (!SUPPORTED_MIMES.has(mimeType)) {
    const err = new Error("Unsupported file type");
    err.statusCode = 400;
    throw err;
  }
  if (!fs.existsSync(filePath)) {
    const err = new Error("File not found");
    err.statusCode = 404;
    throw err;
  }

  let rawText;
  try {
    rawText = await callAIProvider(filePath, mimeType);
  } catch (e) {
    // provider failure -> let controller mark as failed and return 500/422
    e.isProviderError = true;
    throw e;
  }

  const parsedJson = extractJsonFromResponse(rawText);
  if (!parsedJson) {
    const err = new Error("AI returned malformed JSON");
    err.statusCode = 422;
    err.details = rawText?.slice(0, 500);
    throw err;
  }

  const result = validateAndNormalize(parsedJson);
  if (result.error) {
    const err = new Error(result.error);
    err.statusCode = 422;
    err.issues = result.issues;
    throw err;
  }

  return result.data;
}

export const _internal = {
  normalizeAmount,
  normalizeCurrency,
  normalizeBillingCycle,
  normalizeRenewalDate,
  validateAndNormalize,
  extractJsonFromResponse,
};
