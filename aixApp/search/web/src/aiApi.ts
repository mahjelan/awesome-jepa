import { Relate } from "@/app/interfaces/relate";
import { Source } from "@/app/interfaces/source";

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const OPENAI_MODEL =
  (import.meta.env.VITE_OPENAI_MODEL as string | undefined) ?? "gpt-4o-mini";

if (!OPENAI_KEY) {
  console.warn(
    "OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your environment variables.",
  );
}

type ResponseMessage = {
  role: "user" | "system";
  content: string;
};

type ResponsesPayload = {
  model: string;
  max_output_tokens: number;
  temperature: number;
  input: ResponseMessage[];
};

type ResponsesResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string | null;
    }>;
  }>;
};

export type QueryResult = {
  sources: Source[];
  markdown: string;
  relates: Relate[];
};

export async function querySearch(
  query: string,
  _search_uuid: string,
  generateRelatedQuestions = true,
  signal?: AbortSignal,
): Promise<QueryResult> {
  if (!OPENAI_KEY) {
    throw new Error(
      "OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY environment variable.",
    );
  }

  if (!query.trim()) {
    throw new Error("query must be provided");
  }

  const answerPayload: ResponsesPayload = {
    model: OPENAI_MODEL,
    max_output_tokens: 1024,
    temperature: 0.7,
    input: [
      {
        role: "system",
        content:
          "You are a helpful assistant. Respond in concise markdown. Do not include citations.",
      },
      {
        role: "user",
        content: query,
      },
    ],
  };

  const [answerMarkdown, relates, sources] = await Promise.all([
    requestOpenAI(answerPayload, signal),
    generateRelatedQuestions ? getRelatedQuestions(query, signal) : Promise.resolve([]),
    getSources(query, signal),
  ]);

  return {
    sources,
    markdown: answerMarkdown,
    relates,
  };
}

async function requestOpenAI(payload: ResponsesPayload, signal?: AbortSignal) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Query failed with status ${response.status}`);
  }

  const data = (await response.json()) as ResponsesResponse;
  return getResponseText(data);
}

async function getRelatedQuestions(query: string, signal?: AbortSignal) {
  const payload: ResponsesPayload = {
    model: OPENAI_MODEL,
    max_output_tokens: 256,
    temperature: 0.5,
    input: [
      {
        role: "system",
        content:
          'Return ONLY a valid JSON array of 3 short related questions, no extra text. Example: ["Q1","Q2","Q3"]',
      },
      {
        role: "user",
        content: `Question: ${query}`,
      },
    ],
  };

  try {
    const text = await requestOpenAI(payload, signal);
    const parsed = safeParseQuestions(text);
    if (parsed.length > 0) {
      return parsed.map((question) => ({ question })) as Relate[];
    }
  } catch (error) {
    if (!isAbortError(error)) {
      console.warn("Failed to generate related questions:", error);
    }
  }

  return [];
}

async function getSources(query: string, signal?: AbortSignal) {
  const payload: ResponsesPayload = {
    model: OPENAI_MODEL,
    max_output_tokens: 512,
    temperature: 0.4,
    input: [
      {
        role: "system",
        content:
          'Return ONLY a valid JSON array of 3-5 sources with fields: name, url, snippet. Use real well-known sources when possible. Example: [{"name":"...", "url":"https://...", "snippet":"..."}]',
      },
      {
        role: "user",
        content: `Topic: ${query}`,
      },
    ],
  };

  try {
    const text = await requestOpenAI(payload, signal);
    return safeParseSources(text);
  } catch (error) {
    if (!isAbortError(error)) {
      console.warn("Failed to generate sources:", error);
    }
  }

  return [];
}

function getResponseText(response: ResponsesResponse) {
  if (response.output_text) {
    return response.output_text;
  }

  const contentBlocks = response.output?.flatMap((item) => item.content ?? []) ?? [];
  return contentBlocks
    .filter((block) => block.type === "output_text" || block.type === "text")
    .map((block) => block.text ?? "")
    .join("");
}

function safeParseSources(text: string): Source[] {
  const parsed = safeJsonArray(text);
  if (!parsed) return [];

  return parsed
    .filter(
      (item): item is { name: string; url: string; snippet?: string } =>
        typeof item?.name === "string" && typeof item?.url === "string",
    )
    .map((item, index) => toSource(item, index));
}

function safeParseQuestions(text: string): string[] {
  const parsed = safeJsonArray(text);
  if (parsed && parsed.every((item) => typeof item === "string")) {
    return parsed as string[];
  }

  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*\d.]+\s*/, "").trim())
    .filter((line) => line.length > 0)
    .slice(0, 3);
}

function safeJsonArray(text: string): unknown[] | null {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // fall through
  }

  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fall through
    }
  }

  return null;
}

function toSource(
  item: { name: string; url: string; snippet?: string },
  index: number,
): Source {
  const id = `${index}-${item.url}`;
  return {
    id,
    name: item.name,
    url: item.url,
    isFamilyFriendly: true,
    displayUrl: item.url,
    snippet: item.snippet ?? "",
    deepLinks: [],
    dateLastCrawled: "",
    cachedPageUrl: "",
    language: "en",
    isNavigational: false,
  };
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
