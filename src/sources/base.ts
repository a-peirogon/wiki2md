import { Article } from "./types";

export abstract class ArticleSource {
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly supportedLangs: string[]; // vacío = todos

  constructor(protected lang: string = "es") {}

  abstract fetch(topic: string): Promise<Article | null>;
  abstract search(query: string): Promise<string[]>;
  abstract get baseUrl(): string;

  supportsLang(lang: string): boolean {
    return this.supportedLangs.length === 0 || this.supportedLangs.includes(lang);
  }

  protected slugify(text: string): string {
    return text.toLowerCase().replace(/\s+/g, "-");
  }
}
