import { ArticleSource } from "./base";
import { WikipediaSource } from "./wikipedia";
import { SEPSource } from "./sep";
import { IEPSource } from "./iep";

export type SourceKey = "wikipedia" | "sep" | "iep";

export const SOURCE_REGISTRY: Record<SourceKey, new (lang: string) => ArticleSource> = {
  wikipedia: WikipediaSource,
  sep:       SEPSource,
  iep:       IEPSource,
};

export function getSource(key: string, lang: string): ArticleSource {
  const Cls = SOURCE_REGISTRY[key as SourceKey];
  if (!Cls) throw new Error(`Fuente desconocida: ${key}`);
  return new Cls(lang);
}

export function listSources(): { key: string; displayName: string }[] {
  return Object.entries(SOURCE_REGISTRY).map(([key, Cls]) => ({
    key,
    displayName: new Cls("en").displayName,
  }));
}

export { ArticleSource };
