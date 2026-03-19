import { Article } from "../types";
import { ArticleSource } from "./base";

export class WikipediaSource extends ArticleSource {
  readonly name = "wikipedia";
  readonly displayName = "Wikipedia";
  readonly supportedLangs: string[] = [];

  private static readonly STRIP_SECTIONS = new Set([
    // ES
    "referencias", "notas", "notas y referencias", "bibliografía",
    "enlaces externos", "lectura recomendada", "fuentes",
    "véase también", "ver también",
    // EN
    "references", "notes", "notes and references", "bibliography",
    "external links", "further reading", "sources", "footnotes",
    "see also",
  ]);

  get baseUrl(): string {
    return `https://${this.lang}.wikipedia.org`;
  }

  private get apiBase(): string {
    return `${this.baseUrl}/w/api.php`;
  }

  async fetch(topic: string): Promise<Article | null> {
    try {
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

      const rawExtract: string = page.extract ?? "";
      const summary = this.extractSummary(rawExtract);
      const content = this.parseContent(rawExtract);
      // Secciones se extraen del contenido ya procesado (sin vacías ni meta)
      const sections = this.extractSectionsFromContent(content);
      const links = (page.links ?? []).map((l: any) => l.title as string);

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
      console.error("[EncyclopediaImporter] Wikipedia error:", e);
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

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async apiCall(params: Record<string, string>): Promise<any> {
    const url = new URL(this.apiBase);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  /** Resumen = texto introductorio antes del primer == heading == */
  private extractSummary(extract: string): string {
    const firstHeading = extract.search(/^[ \t]*==/m);
    const intro = firstHeading !== -1 ? extract.slice(0, firstHeading) : extract;
    return intro.replace(/\n{3,}/g, "\n\n").trim();
  }

  /** Títulos h2 del contenido ya procesado (sin secciones vacías ni meta). */
  private extractSectionsFromContent(content: string): string[] {
    return content
      .split("\n")
      .filter((l) => /^## .+/.test(l))
      .map((l) => l.replace(/^## /, "").trim());
  }

  private parseContent(extract: string): string {
    // 1. Eliminar el intro (evita duplicar el bloque Resumen del formatter)
    const firstHeading = extract.search(/^[ \t]*==/m);
    let md = firstHeading !== -1 ? extract.slice(firstHeading) : extract;

    // 2. *** Normalizar sangría: quitar espacios/tabs al inicio de cada línea ***
    //    Wikipedia indenta con espacios en wikitext; esto rompe todos los regex
    //    posteriores si no se limpia aquí.
    md = md.split("\n").map((l) => l.trimStart()).join("\n");

    // 3. Convertir encabezados wiki → Markdown
    md = md.replace(/^====\s*(.+?)\s*====$/gm, "#### $1");
    md = md.replace(/^===\s*(.+?)\s*===$/gm,   "### $1");
    md = md.replace(/^==\s*(.+?)\s*==$/gm,     "## $1");

    // 4. Eliminar secciones meta completas
    md = this.stripMetaSections(md);

    // 5. Eliminar encabezados sin contenido
    md = this.removeEmptySections(md);

    // 6. Normalizar espacios finales y líneas en blanco extra
    md = md.replace(/[ \t]+$/gm, "");
    md = md.replace(/\n{3,}/g, "\n\n");

    return md.trim();
  }

  /**
   * Elimina secciones meta (Referencias, Notas, Bibliografía, Véase también, etc.)
   * y todo su contenido hasta el siguiente heading del mismo nivel o superior.
   */
  private stripMetaSections(md: string): string {
    const lines = md.split("\n");
    const result: string[] = [];
    let skipping = false;
    let skipLevel = 0;

    for (const line of lines) {
      // El trimStart() ya fue aplicado en parseContent, pero por seguridad:
      const m = line.match(/^(#{2,4})\s+(.+)$/);
      if (m) {
        const level = m[1].length;
        const title = m[2].trim().toLowerCase();

        if (WikipediaSource.STRIP_SECTIONS.has(title)) {
          skipping = true;
          skipLevel = level;
          continue;
        }
        if (skipping && level <= skipLevel) {
          skipping = false;
        }
      }
      if (!skipping) result.push(line);
    }

    return result.join("\n");
  }

  /** Elimina encabezados que no tienen contenido antes del siguiente heading. */
  private removeEmptySections(md: string): string {
    return md.replace(/^(#{2,4} [^\n]+)\n+(?=#{2,4} )/gm, "");
  }
}
