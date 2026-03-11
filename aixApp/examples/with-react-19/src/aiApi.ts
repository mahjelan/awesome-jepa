import type { SavedAnswerSource, SavedAnswerRelate } from './types/userData';

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const OPENAI_MODEL =
  (import.meta.env.VITE_OPENAI_MODEL as string | undefined) ?? 'gpt-4o-mini';

if (!OPENAI_KEY) {
  console.warn(
    'OpenAI API key not found. Set VITE_OPENAI_API_KEY in .env for AI search.'
  );
}

type ResponseMessage = { role: 'user' | 'system'; content: string };
type ResponsesPayload = {
  model: string;
  max_output_tokens: number;
  temperature: number;
  input: ResponseMessage[];
};
type ResponsesResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{ type?: string; text?: string | null }>;
  }>;
};

export type QueryResult = {
  sources: SavedAnswerSource[];
  markdown: string;
  relates: SavedAnswerRelate[];
};

export async function querySearch(
  query: string,
  _searchUuid: string,
  generateRelatedQuestions = true,
  signal?: AbortSignal
): Promise<QueryResult> {
  if (!OPENAI_KEY) {
    throw new Error(
      'OpenAI API key not configured. Set VITE_OPENAI_API_KEY in .env.'
    );
  }
  if (!query.trim()) throw new Error('query must be provided');

  const answerPayload: ResponsesPayload = {
    model: OPENAI_MODEL,
    max_output_tokens: 1024,
    temperature: 0.7,
    input: [
      {
        role: 'system',
        content:
          'You are a helpful assistant. Respond in concise markdown. Do not include citations.',
      },
      { role: 'user', content: query },
    ],
  };

  const [answerMarkdown, relates, sources] = await Promise.all([
    requestOpenAI(answerPayload, signal),
    generateRelatedQuestions ? getRelatedQuestions(query, signal) : Promise.resolve([]),
    getSources(query, signal),
  ]);

  return { sources, markdown: answerMarkdown, relates };
}

async function requestOpenAI(payload: ResponsesPayload, signal?: AbortSignal): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) throw new Error(`Query failed with status ${res.status}`);
  const data = (await res.json()) as ResponsesResponse;
  if (data.output_text) return data.output_text;
  const blocks = data.output?.flatMap((o) => o.content ?? []) ?? [];
  return blocks
    .filter((b) => b.type === 'output_text' || b.type === 'text')
    .map((b) => b.text ?? '')
    .join('');
}

async function getRelatedQuestions(query: string, signal?: AbortSignal): Promise<SavedAnswerRelate[]> {
  const payload: ResponsesPayload = {
    model: OPENAI_MODEL,
    max_output_tokens: 256,
    temperature: 0.5,
    input: [
      {
        role: 'system',
        content:
          'Return ONLY a valid JSON array of 3 short related questions, no extra text. Example: ["Q1","Q2","Q3"]',
      },
      { role: 'user', content: `Question: ${query}` },
    ],
  };
  try {
    const text = await requestOpenAI(payload, signal);
    const parsed = safeParseQuestions(text);
    return parsed.map((question) => ({ question }));
  } catch (e) {
    if (!(e instanceof DOMException && e.name === 'AbortError')) console.warn(e);
    return [];
  }
}

async function getSources(query: string, signal?: AbortSignal): Promise<SavedAnswerSource[]> {
  const payload: ResponsesPayload = {
    model: OPENAI_MODEL,
    max_output_tokens: 512,
    temperature: 0.4,
    input: [
      {
        role: 'system',
        content:
          'Return ONLY a valid JSON array of 3-5 sources with fields: name, url, snippet. Use real well-known sources when possible.',
      },
      { role: 'user', content: `Topic: ${query}` },
    ],
  };
  try {
    const text = await requestOpenAI(payload, signal);
    return safeParseSources(text);
  } catch (e) {
    if (!(e instanceof DOMException && e.name === 'AbortError')) console.warn(e);
    return [];
  }
}

function safeParseSources(text: string): SavedAnswerSource[] {
  const arr = safeJsonArray(text);
  if (!arr) return [];
  return arr
    .filter(
      (item): item is { name: string; url: string; snippet?: string } =>
        typeof (item as Record<string, unknown>)?.name === 'string' &&
        typeof (item as Record<string, unknown>)?.url === 'string'
    )
    .map((item, i) => ({
      id: `${i}-${(item as { url: string }).url}`,
      name: (item as { name: string }).name,
      url: (item as { url: string }).url,
      snippet: (item as { snippet?: string }).snippet ?? '',
    }));
}

function safeParseQuestions(text: string): string[] {
  const arr = safeJsonArray(text);
  if (arr && arr.every((x) => typeof x === 'string')) return arr as string[];
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*\d.]+\s*/, '').trim())
    .filter((line) => line.length > 0)
    .slice(0, 3);
}

function safeJsonArray(text: string): unknown[] | null {
  try {
    const p = JSON.parse(text);
    if (Array.isArray(p)) return p;
  } catch {
    //
  }
  const m = text.match(/\[[\s\S]*\]/);
  if (m) {
    try {
      const p = JSON.parse(m[0]);
      if (Array.isArray(p)) return p;
    } catch {
      //
    }
  }
  return null;
}
