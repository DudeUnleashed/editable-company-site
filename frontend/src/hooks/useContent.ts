import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../config";
import { ContentBlock, ContentMap } from "../types/content";
import { cachedFetch } from "../utils/cache";
import { useCacheInvalidation } from "../contexts/CacheContext";

function buildContentMap(data: ContentBlock[]): ContentMap {
  const map: ContentMap = {};
  data.forEach((block) => {
    map[block.section] = block.content || "";
  });
  return map;
}

export function useContent(page: string) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [content, setContent] = useState<ContentMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { version } = useCacheInvalidation();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await cachedFetch<ContentBlock[]>(
          API_ENDPOINTS.CONTENT(page),
          `content_${page}`
        );
        if (cancelled) return;
        setBlocks(data);
        setContent(buildContentMap(data));
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [page, version]);

  const getJson = <T = any>(section: string): T[] => {
    const raw = content[section];
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };

  return { blocks, content, loading, error, getJson };
}
