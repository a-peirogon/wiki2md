import { Article } from "../types";
import { ArticleSource } from "./base";

export class WikipediaSource extends ArticleSource {
  readonly name = "wikipedia";
  readonly displayName = "Wikipedia";
  readonly supportedLangs: string[] = []; // todos los idiomas

  get baseUrl(): string {
    return `https://${this.lang}.wikipedia.org`;
  }

  private get apiBase(): string {
    return `${this.baseUrl}/w/api.php`;
  }

  async fetch(topic: string): Promise<Article | null> {
    try {
      // 1. Resolver el título exacto
      const searchRes = await this.apiCall({
        action: "query",
        list: "search",
        srsearch: topic,
        srlimit: "1",
        format: "json",
        origin: "*",
      });

      const hits = searchRes?.query?.search;
      if (!hits?.length) return null;
      const exactTitle: string = hits[0].title;

      // 2. Obtener contenido, resumen y links en una sola llamada
      const pageRes = await this.apiCall({
        action: "query",
        titles: exactTitle,
        prop: "extracts|links|info",
        explaintext: "1",
        exsectionformat: "wiki",
        pllimit: "500",
        inprop: "url",
        format: "json",
        origin: "*",
      });

      const pages = pageRes?.query?.pages;
      if (!pages) return null;

      const page = Object.values(pages as Record<string, any>)[0] as any;
      if (!page || page.missing !== undefined) return null;

      const content = this.parseContent(page.extract ?? "");
      const sections = this.extractSections(page.extract ?? "");
      const links = (page.links ?? []).map((l: any) => l.title as string);
      const summary = this.extractSummary(page.extract ?? "");

      return {
        title: page.title,
        url: page.fullurl ?? `${this.baseUrl}/wiki/${encodeURIComponent(page.title)}`,
        sourceName: this.displayName,
        summary,
        content,
        sections,
        links,
        authors: [],
        lang: this.lang,
      };
    } catch (e) {
      console.error("[EncyclopediaExporter] Wikipedia error:", e);
      return null;
    }
  }

  async search(query: string): Promise<string[]> {
    try {
      const res = await this.apiCall({
        action: "opensearch",
        search: query,
        limit: "10",
        format: "json",
        origin: "*",
      });
      return (res?.[1] as string[]) ?? [];
    } catch {
      return [];
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async apiCall(params: Record<string, string>): Promise<any> {
    const url = new URL(this.apiBase);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  private extractSummary(extract: string): string {
    // El primer párrafo antes del primer salto doble
    const idx = extract.indexOf("\n\n");
    return idx !== -1 ? extract.slice(0, idx).trim() : extract.slice(0, 500).trim();
  }

  private extractSections(extract: string): string[] {
    const sections: string[] = [];
    const lines = extract.split("\n");
    for (const line of lines) {
      const m = line.match(/^(={2,4})\s*(.+?)\s*\1$/);
      if (m) sections.push(m[2]);
    }
    return sections;
  }

  private parseContent(extract: string): string {
    // Convertir marcado wiki sencillo a Markdown
    let md = extract;
    md = md.replace(/^====\s*(.+?)\s*====$/gm, "#### $1");
    md = md.replace(/^===\s*(.+?)\s*===$/gm, "### $1");
    md = md.replace(/^==\s*(.+?)\s*==$/gm, "## $1");
    md = md.replace(/\n{3,}/g, "\n\n");
    return md.trim();
  }
}
