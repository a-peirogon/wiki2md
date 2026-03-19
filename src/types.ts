// ── Tipos compartidos ──────────────────────────────────────────────────────

export interface Article {
  title: string;
  url: string;
  sourceName: string;
  summary: string;
  content: string;
  sections: string[];
  links: string[];       // Títulos de artículos enlazados en la fuente
  authors: string[];
  lang: string;
}

export interface PluginSettings {
  defaultSource: string;
  defaultLang: string;
  defaultFolder: string;
  wikilinks: {
    enabled: boolean;
    maxLinks: number;
    minWordLength: number;
  };
  markdown: {
    includeSummary: boolean;
    includeReferences: boolean;
    includeToc: boolean;
    frontmatter: boolean;
    tagPrefix: string;
  };
  sources: {
    [key: string]: { enabled: boolean };
  };
}

export const DEFAULT_SETTINGS: PluginSettings = {
  defaultSource: "wikipedia",
  defaultLang: "es",
  defaultFolder: "",
  wikilinks: {
    enabled: true,
    maxLinks: 50,
    minWordLength: 3,
  },
  markdown: {
    includeSummary: true,
    includeReferences: true,
    includeToc: true,
    frontmatter: false,
    tagPrefix: "fuente/",
  },
  sources: {
    wikipedia: { enabled: true },
    sep:       { enabled: true },
    iep:       { enabled: true },
  },
};
