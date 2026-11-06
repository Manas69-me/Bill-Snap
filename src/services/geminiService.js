import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const configuredModel = import.meta.env.VITE_GEMINI_MODEL;

// These are models returned by the user's own Gemini Models API list.
// The service fails over only when a model is temporarily unavailable or not found.
const MODEL_CANDIDATES = [
  "gemini-3.5-flash-lite",
  configuredModel,
  "gemini-3.6-flash",
  "gemini-3.8-flash",
  "gemini-flash-latest",
].filter((model, index, all) => model && all.indexOf(model) === index);

const CATEGORIES = [
  "Food",
  "Utilities",
  "Groceries",
  "Transport",
  "Entertainment",
  "Shopping",
  "Other",
];

function getStatus(error) {
  const status = error?.status ?? error?.code;
  if (typeof status === "number") return status;
  const message = String(error?.message ?? error ?? "");
  const match = message.match(/\b(400|401|403|404|429|500|502|503|504)\b/);
  return match ? Number(match[1]) : null;
}

function toUserMessage(error) {
  const status = getStatus(error);
  if (!API_KEY) return "Gemini API key is missing. Add it to .env and restart the app.";
  if (status === 401) return "Gemini rejected the API key. Create a valid Gemini API key and update .env.";
  if (status === 403) return "Gemini access is blocked for this project. Check API access and project restrictions.";
  if (status === 404) return "The selected Gemini model is unavailable for this project. Tried the configured fallback models.";
  if (status === 429) return "Gemini rate or quota limit reached. Check your AI Studio usage limits and try again later.";
  if (status === 503 || status === 502 || status === 504) return "Gemini is temporarily busy. All configured fallback models were unavailable; please try again shortly.";
  return error?.message || "Bill analysis failed. Please try another image.";
}

function parseImageData(imageData) {
  if (typeof imageData !== "string" || !imageData.trim()) {
    throw new Error("No image was provided.");
  }

  const commaIndex = imageData.indexOf(",");
  const header = commaIndex >= 0 ? imageData.slice(0, commaIndex) : "";
  const data = commaIndex >= 0 ? imageData.slice(commaIndex + 1) : imageData;
  const mimeType = header.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64$/)?.[1] || "image/jpeg";

  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(mimeType)) {
    throw new Error(`Unsupported image format: ${mimeType}. Please use JPG, PNG, or WEBP.`);
  }
  if (!data) throw new Error("The selected image is empty. Please choose it again.");

  return { mimeType, data };
}

function normalizeResult(raw) {
  if (!raw || typeof raw !== "object" || typeof raw.is_bill !== "boolean") {
    throw new Error("Gemini returned an invalid result. Please try the image again.");
  }

  if (!raw.is_bill) {
    return {
      is_bill: false,
      reason: String(raw.reason || "This image doesn't appear to be a bill, receipt, or invoice."),
      merchant_name: "",
      date: "",
      total_amount: "",
      category: "Other",
      uncertain_fields: [],
    };
  }

  const uncertainFields = Array.isArray(raw.uncertain_fields)
    ? raw.uncertain_fields.filter((field) => ["merchant_name", "date", "total_amount", "category"].includes(field))
    : [];
  const category = CATEGORIES.includes(raw.category) ? raw.category : "Other";
  if (category === "Other" && raw.category !== "Other") uncertainFields.push("category");

  return {
    is_bill: true,
    reason: "",
    merchant_name: String(raw.merchant_name ?? "").trim(),
    date: String(raw.date ?? "").trim(),
    total_amount: String(raw.total_amount ?? "").trim(),
    category,
    uncertain_fields: [...new Set(uncertainFields)],
  };
}

export async function analyzeBillImage(imageData) {
  if (!API_KEY) {
    throw new Error("Gemini API key is missing. Add VITE_GEMINI_API_KEY to .env and restart Vite.");
  }

  const { mimeType, data } = parseImageData(imageData);
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = `
You are a careful financial-document extraction assistant.
First decide whether the image itself is a bill, receipt, or invoice.
A photo of a person, ID card, landscape, product, game/chat screenshot, or unrelated document is NOT a bill.
Do not infer that an image is a bill merely because it contains numbers or text.

If it is a bill, extract the merchant name, transaction date, final amount payable, and one category.
Use the final amount paid/payable, not subtotal, tax, discount, or change.
Preserve the date as YYYY-MM-DD when unambiguous; otherwise preserve the printed date text.
Do not guess. If a field is unreadable, return an empty string and include its field name in uncertain_fields.
Categories must be exactly one of: Food, Utilities, Groceries, Transport, Entertainment, Shopping, Other.

Return only a JSON object with this exact schema:
{
  "is_bill": true,
  "reason": "",
  "merchant_name": "",
  "date": "",
  "total_amount": "",
  "category": "Other",
  "uncertain_fields": []
}
For non-bills set is_bill=false, explain briefly in reason, and leave the extracted fields empty.
`;

  const request = {
    contents: [{
      role: "user",
      parts: [
        { inlineData: { mimeType, data } },
        { text: prompt },
      ],
    }],
    config: { responseMimeType: "application/json", temperature: 0 },
  };

  let lastError;
  for (const model of MODEL_CANDIDATES) {
    try {
      const response = await ai.models.generateContent({ model, ...request });
      if (!response.text) throw new Error(`Gemini (${model}) returned an empty response.`);
      let parsed;
      try {
        parsed = JSON.parse(response.text);
      } catch {
        throw new Error(`Gemini (${model}) returned malformed JSON. Please retry the image.`);
      }
      return { ...normalizeResult(parsed), model_used: model };
    } catch (error) {
      lastError = error;
      const status = getStatus(error);
      console.error(`Gemini model ${model} failed:`, error);
      // A 503/404 can be model-specific. Try the next model. Do not mask
      // authentication, quota, or permission errors with unnecessary calls.
      if (
        status === 404 ||
        status === 429 ||
        status === 503 ||
        status === 502 ||
        status === 504
      ) {
        continue;
      }
      
      throw new Error(toUserMessage(error));
    }
  }

  throw new Error(toUserMessage(lastError));
}
