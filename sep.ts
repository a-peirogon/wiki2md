import { Article } from "../types";
import { ArticleSource } from "./base";

export class SEPSource extends ArticleSource {
  readonly name = "sep";
  readonly displayName = "SEP";
  readonly supportedLangs = ["en"];

  get baseUrl(): string {
    return "https://plato.stanford.edu";
  }

  async fetch(topic: string): Promise<Article | null> {
    const slug = this.slugify(topic);
    const url = `${this.baseUrl}/entries/${slug}/`;

    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const html = await res.text();
      return this.parse(html, url, topic);
    } catch (e) {
      console.error("[EncyclopediaExporter] SEP error:", e);
      return null;
    }
  }

  async search(query: string): Promise<string[]> {
    // SEP no tiene una API de búsqueda pública; devolvemos el slug directamente
    return [query];
  }

  private parse(html: string, url: string, fallbackTitle: string): Article | null {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const main = doc.getElementById("aueditable");
    if (!main) return null;

    const title = doc.querySelector("h1")?.textContent?.trim() ?? fallbackTitle;
    const authors = this.extractAuthors(doc);
    const summary = this.extractPreamble(main);
    const { content, sections } = this.extractContent(main);
    const links = this.extractLinks(main);

    return {
      title,
      url,
      sourceName: this.displayName,
      summary,
      content,
      sections,
      links,
      authors,
      lang: "en",
    };
  }

  private extractAuthors(doc: Document): string[] {
    const div = doc.getElementById("article-copyright");
    if (!div) return [];
    const text = div.textContent ?? "";
    const m = text.match(/by (.+?)(?:<|$)/);
    if (m) return m[1].split(" and ").map((a) => a.trim());
    return [];
  }

  private extractPreamble(main: Element): string {
    const parts: string[] = [];
    for (const el of Array.from(main.children)) {
      if (el.tagName.match(/^H[23]$/)) break;
      if (el.tagName === "P") parts.push(el.textContent?.trim() ?? "");
    }
    return parts.join(" ");
  }

  private extractContent(main: Element): { content: string; sections: string[] } {
    const parts: string[] = [];
    const sections: string[] = [];

    const walk = (el: Element) => {
      switch (el.tagName) {
        case "H2": {
          const h = el.textContent?.trim() ?? "";
          sections.push(h);
          parts.push(`\n## ${h}\n`);
          break;
        }
        case "H3":
          parts.push(`\n### ${el.textContent?.trim()}\n`);
          break;
        case "H4":
          parts.push(`\n#### ${el.textContent?.trim()}\n`);
          break;
        case "P": {
          const t = el.textContent?.trim();
          if (t) parts.push(t);
          break;
        }
        case "UL":
        case "OL":
          for (const li of Array.from(el.querySelectorAll(":scope > li"))) {
            parts.push(`- ${li.textContent?.trim()}`);
          }
          break;
        case "BLOCKQUOTE":
          parts.push(`> ${el.textContent?.trim()}`);
          break;
      }
    };

    for (const el of Array.from(main.querySelectorAll("h2,h3,h4,p,ul,ol,blockquote"))) {
      walk(el);
    }

    return { content: parts.join("\n\n").trim(), sections };
  }

  private extractLinks(main: Element): string[] {
    const links: string[] = [];
    const seen = new Set<string>();
    for (const a of Array.from(main.querySelectorAll("a[href]"))) {
      const href = a.getAttribute("href") ?? "";
      const m = href.match(/(?:https:\/\/plato\.stanford\.edu)?\/entries\/([^/]+)\/?/);
      if (m) {
        const title = m[1]
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        if (!seen.has(title)) {
          seen.add(title);
          links.push(title);
        }
      }
    }
    return links;
  }
}
