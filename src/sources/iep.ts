import { Article } from "../types";
import { ArticleSource } from "./base";

export class IEPSource extends ArticleSource {
  readonly name = "iep";
  readonly displayName = "IEP";
  readonly supportedLangs = ["en"];

  get baseUrl(): string {
    return "https://iep.utm.edu";
  }

  async fetch(topic: string): Promise<Article | null> {
    const slug = this.slugify(topic);
    const url = `${this.baseUrl}/${slug}/`;

    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const html = await res.text();
      return this.parse(html, url, topic);
    } catch (e) {
      console.error("[EncyclopediaImporter] IEP error:", e);
      return null;
    }
  }

  async search(query: string): Promise<string[]> {
    return [query];
  }

  private parse(html: string, url: string, fallbackTitle: string): Article | null {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const main =
      doc.querySelector("article") ??
      doc.querySelector(".entry-content");
    if (!main) return null;

    const title =
      (doc.querySelector("h1.entry-title") ?? doc.querySelector("h1"))
        ?.textContent?.trim() ?? fallbackTitle;

    const authors = this.extractAuthors(doc);
    const summary = main.querySelector("p")?.textContent?.trim() ?? "";
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
    const el =
      doc.querySelector(".author") ??
      doc.querySelector(".entry-author") ??
      doc.querySelector(".byline");
    if (el) return [el.textContent?.trim() ?? ""];
    return [];
  }

  private extractContent(main: Element): { content: string; sections: string[] } {
    const parts: string[] = [];
    const sections: string[] = [];

    for (const el of Array.from(
      main.querySelectorAll("h2,h3,h4,p,ul,ol,blockquote")
    )) {
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
    }

    return { content: parts.join("\n\n").trim(), sections };
  }

  private extractLinks(main: Element): string[] {
    const links: string[] = [];
    const seen = new Set<string>();
    for (const a of Array.from(main.querySelectorAll("a[href]"))) {
      const href = a.getAttribute("href") ?? "";
      const m = href.match(/(?:https?:\/\/iep\.utm\.edu\/)?([a-z0-9-]+)\/?$/);
      if (m && !["", "about", "contact", "sitemap"].includes(m[1])) {
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
