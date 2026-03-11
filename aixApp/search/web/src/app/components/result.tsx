"use client";
import { Answer } from "@/app/components/answer";
import { Relates } from "@/app/components/relates";
import { Sources } from "@/app/components/sources";
import { Relate } from "@/app/interfaces/relate";
import { Source } from "@/app/interfaces/source";
import { querySearch } from "@/aiApi";
import { Annoyed } from "lucide-react";
import { FC, useEffect, useState } from "react";

export const Result: FC<{ query: string; rid: string }> = ({ query, rid }) => {
  const [sources, setSources] = useState<Source[] | null>(null);
  const [markdown, setMarkdown] = useState<string>("");
  const [relates, setRelates] = useState<Relate[] | null>(null);
  const [error, setError] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        setLoading(true);
        const result = await querySearch(query, rid, true, controller.signal);
        setSources(result.sources);
        setMarkdown(result.markdown);
        setRelates(result.relates);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        const match = message.match(/status\s+(\d+)/i);
        const status = match ? Number(match[1]) : 503;
        setError(status);
      } finally {
        setLoading(false);
      }
    };
    void run();
    return () => {
      controller.abort();
    };
  }, [query]);
  return (
    <div className="flex flex-col gap-8">
      <Answer markdown={markdown} sources={sources ?? []}></Answer>
      <Relates relates={relates}></Relates>
      <Sources sources={sources}></Sources>
      {loading && !error && (
        <div className="absolute inset-4 flex items-center justify-center bg-white/40 backdrop-blur-sm">
          <div className="p-4 bg-white shadow-2xl rounded text-blue-500 font-medium">
            Loading...
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-4 flex items-center justify-center bg-white/40 backdrop-blur-sm">
          <div className="p-4 bg-white shadow-2xl rounded text-blue-500 font-medium flex gap-4">
            {error === 429 && <Annoyed></Annoyed>}
            {error === 429
              ? "Sorry, you have made too many requests recently, try again later."
              : "Loading..."}
          </div>
        </div>
      )}
    </div>
  );
};
