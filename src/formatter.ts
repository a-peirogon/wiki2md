import { Article, PluginSettings } from "./types";

export function formatArticle(article: Article, settings: PluginSettings): string {
  const blocks: string[] = [];

  // ── Frontmatter ──────────────────────────────────────────────────────────
  // Desactivado por defecto — activable desde Settings si se desea
  if (settings.markdown.frontmatter) {
    blocks.push(buildFrontmatter(article, settings));
  }

  // ── Título ───────────────────────────────────────────────────────────────
  blocks.push(`# ${article.title}`);

  // ── Resumen ──────────────────────────────────────────────────────────────
  if (settings.markdown.includeSummary && article.summary) {
    blocks.push(`## Resumen\n\n${article.summary.trim()}`);
  }

  // ── Tabla de contenidos ───────────────────────────────────────────────────
  if (settings.markdown.includeToc && article.sections.length > 0) {
    blocks.push(buildToc(article.sections));
  }

  // ── Cuerpo ────────────────────────────────────────────────────────────────
  blocks.push(article.content.trim());

  // ── Créditos ─────────────────────────────────────────────────────────────
  if (settings.markdown.includeReferences) {
    blocks.push(buildCredits(article));
  }

  return blocks.join("\n\n");
}

// ── Bloques ──────────────────────────────────────────────────────────────────

function buildFrontmatter(article: Article, settings: PluginSettings): string {
  const prefix = settings.markdown.tagPrefix || "fuente/";
  const tags = [
    `${prefix}${article.sourceName.toLowerCase()}`,
    `idioma/${article.lang}`,
  ];

  const lines = [
    "---",
    `title: "${article.title.replace(/"/g, '\\"')}"`,
    `source: ${article.sourceName}`,
    `url: "${article.url}"`,
    `lang: ${article.lang}`,
    `created: ${new Date().toISOString().slice(0, 10)}`,
    `tags: [${tags.join(", ")}]`,
  ];

  if (article.authors.length > 0) {
    lines.push(`authors: [${article.authors.join(", ")}]`);
  }

  lines.push("---");
  return lines.join("\n");
}

function buildToc(sections: string[]): string {
  const items = sections.map((s) => `- [[#${s}|${s}]]`);
  return `## Contenidos\n\n${items.join("\n")}`;
}

function buildCredits(article: Article): string {
  const date = new Date().toLocaleDateString("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const lines = [
    "---",
    `*Fuente: [${article.sourceName}](${article.url})*`,
  ];

  if (article.authors.length > 0) {
    lines.push(`*Autor(es): ${article.authors.join(", ")}*`);
  }

  lines.push(`*Importado el ${date}*`);

  return lines.join("  \n");
}
