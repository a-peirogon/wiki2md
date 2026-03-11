import { App, Modal, Notice, Setting, TextComponent, TFile } from "obsidian";
import { PluginSettings } from "./types";
import { getSource, listSources } from "./sources/index";
import { applyWikilinks } from "./wikilinks";
import { formatArticle } from "./formatter";

export class ExportModal extends Modal {
  private settings: PluginSettings;
  private onExported?: (path: string) => void;

  // Estado interno del modal
  private topic = "";
  private selectedSource: string;
  private selectedLang: string;
  private selectedFolder: string;
  private isLoading = false;

  // Referencias DOM
  private statusEl!: HTMLElement;
  private previewEl!: HTMLElement;
  private exportBtn!: HTMLButtonElement;
  private topicInput!: HTMLInputElement;
  private suggestionsEl!: HTMLElement;
  private suggestTimeout: number | null = null;

  constructor(app: App, settings: PluginSettings, onExported?: (path: string) => void) {
    super(app);
    this.settings = settings;
    this.onExported = onExported;
    this.selectedSource = settings.defaultSource;
    this.selectedLang = settings.defaultLang;
    this.selectedFolder = settings.defaultFolder;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("enc-modal");
    this.buildUI(contentEl);
  }

  onClose() {
    this.contentEl.empty();
    if (this.suggestTimeout) window.clearTimeout(this.suggestTimeout);
  }

  // ── UI ──────────────────────────────────────────────────────────────────

  private buildUI(root: HTMLElement) {
    // Header
    root.createEl("h2", { cls: "enc-title", text: "📚 Exportar artículo" });

    // Topic input
    const searchWrap = root.createDiv({ cls: "enc-search-wrap" });
    const topicInput = searchWrap.createEl("input", {
      type: "text",
      cls: "enc-topic-input",
      placeholder: "Ej: Immanuel Kant, Free Will, Consciousness…",
    });
    this.topicInput = topicInput;
    topicInput.focus();

    // Suggestions dropdown
    this.suggestionsEl = searchWrap.createDiv({ cls: "enc-suggestions" });
    this.suggestionsEl.hide();

    topicInput.addEventListener("input", () => {
      this.topic = topicInput.value;
      this.scheduleSuggestions();
    });
    topicInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.doExport();
    });

    // Options row
    const optRow = root.createDiv({ cls: "enc-options-row" });

    // Source selector
    const sourceWrap = optRow.createDiv({ cls: "enc-option" });
    sourceWrap.createEl("label", { text: "Fuente" });
    const sourceSelect = sourceWrap.createEl("select", { cls: "enc-select" });
    for (const { key, displayName } of listSources()) {
      const opt = sourceSelect.createEl("option", { value: key, text: displayName });
      if (key === this.selectedSource) opt.selected = true;
    }
    sourceSelect.addEventListener("change", () => {
      this.selectedSource = sourceSelect.value;
      // Auto-ajustar idioma para SEP/IEP
      if (["sep", "iep"].includes(this.selectedSource)) {
        this.selectedLang = "en";
        langInput.value = "en";
      }
    });

    // Language input
    const langWrap = optRow.createDiv({ cls: "enc-option" });
    langWrap.createEl("label", { text: "Idioma" });
    const langInput = langWrap.createEl("input", {
      type: "text",
      cls: "enc-lang-input",
      value: this.selectedLang,
      placeholder: "es",
    });
    langInput.addEventListener("change", () => {
      this.selectedLang = langInput.value.trim() || "es";
    });

    // Folder input
    const folderWrap = root.createDiv({ cls: "enc-folder-wrap" });
    folderWrap.createEl("label", { text: "Guardar en (carpeta del baúl)" });
    const folderInput = folderWrap.createEl("input", {
      type: "text",
      cls: "enc-folder-input",
      value: this.selectedFolder,
      placeholder: "Filosofía/Enciclopedias (dejar vacío = raíz)",
    });
    folderInput.addEventListener("change", () => {
      this.selectedFolder = folderInput.value.trim();
    });

    // Status
    this.statusEl = root.createDiv({ cls: "enc-status" });

    // Preview panel
    this.previewEl = root.createDiv({ cls: "enc-preview" });
    this.previewEl.hide();

    // Action buttons
    const actions = root.createDiv({ cls: "enc-actions" });

    const previewBtn = actions.createEl("button", {
      cls: "enc-btn enc-btn-secondary",
      text: "Vista previa",
    });
    previewBtn.addEventListener("click", () => this.doPreview());

    this.exportBtn = actions.createEl("button", {
      cls: "enc-btn enc-btn-primary",
      text: "Exportar al baúl →",
    });
    this.exportBtn.addEventListener("click", () => this.doExport());
  }

  // ── Suggestions ─────────────────────────────────────────────────────────

  private scheduleSuggestions() {
    if (this.suggestTimeout) window.clearTimeout(this.suggestTimeout);
    if (this.topic.length < 2) {
      this.suggestionsEl.hide();
      return;
    }
    this.suggestTimeout = window.setTimeout(() => this.loadSuggestions(), 400);
  }

  private async loadSuggestions() {
    try {
      const src = getSource(this.selectedSource, this.selectedLang);
      const suggestions = await src.search(this.topic);
      this.renderSuggestions(suggestions);
    } catch {
      // Sin sugerencias
    }
  }

  private renderSuggestions(suggestions: string[]) {
    this.suggestionsEl.empty();
    if (!suggestions.length) {
      this.suggestionsEl.hide();
      return;
    }
    for (const s of suggestions.slice(0, 8)) {
      const item = this.suggestionsEl.createDiv({ cls: "enc-suggestion-item", text: s });
      item.addEventListener("click", () => {
        this.topic = s;
        this.topicInput.value = s;
        this.suggestionsEl.hide();
      });
    }
    this.suggestionsEl.show();
  }

  // ── Core actions ─────────────────────────────────────────────────────────

  private async fetchArticle() {
    const topic = this.topic.trim();
    if (!topic) {
      this.setStatus("⚠ Escribe un tema para buscar.", "warn");
      return null;
    }

    this.setLoading(true);
    this.setStatus(`Buscando "${topic}" en ${this.selectedSource.toUpperCase()}…`);

    try {
      const src = getSource(this.selectedSource, this.selectedLang);
      const article = await src.fetch(topic);

      if (!article) {
        this.setStatus(`✗ No se encontró "${topic}". Prueba otro término o fuente.`, "error");
        return null;
      }

      // Wikilinks
      if (this.settings.wikilinks.enabled && article.links.length > 0) {
        const { text, applied } = applyWikilinks(
          article.content,
          article.links,
          this.settings.wikilinks.maxLinks,
          this.settings.wikilinks.minWordLength,
        );
        article.content = text;
        this.setStatus(`✓ Artículo obtenido. ${applied} wikilinks aplicados.`, "ok");
      } else {
        this.setStatus("✓ Artículo obtenido.", "ok");
      }

      return article;
    } finally {
      this.setLoading(false);
    }
  }

  private async doPreview() {
    const article = await this.fetchArticle();
    if (!article) return;

    const markdown = formatArticle(article, this.settings);
    const preview = markdown.slice(0, 2000) + (markdown.length > 2000 ? "\n\n*…(truncado)*" : "");

    this.previewEl.empty();
    this.previewEl.createEl("pre", { cls: "enc-preview-code", text: preview });
    this.previewEl.show();
  }

  private async doExport() {
    const article = await this.fetchArticle();
    if (!article) return;

    this.setStatus("Guardando en el baúl…");
    const markdown = formatArticle(article, this.settings);

    try {
      // Construir ruta destino
      const folder = this.selectedFolder || "";
      const safeName = article.title.replace(/[\\/*?:"<>|]/g, "");
      const filePath = folder ? `${folder}/${safeName}.md` : `${safeName}.md`;

      // Crear carpeta si no existe
      if (folder) {
        const folderExists = this.app.vault.getAbstractFileByPath(folder);
        if (!folderExists) {
          await this.app.vault.createFolder(folder);
        }
      }

      // Crear o sobreescribir nota
      const existing = this.app.vault.getAbstractFileByPath(filePath);
      if (existing instanceof TFile) {
        await this.app.vault.modify(existing, markdown);
      } else {
        await this.app.vault.create(filePath, markdown);
      }

      new Notice(`✅ Exportado: ${filePath}`);
      this.setStatus(`✅ Guardado en: ${filePath}`, "ok");
      this.onExported?.(filePath);
      this.close();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.setStatus(`✗ Error al guardar: ${msg}`, "error");
    }
  }

  // ── UI helpers ────────────────────────────────────────────────────────────

  private setStatus(msg: string, type: "ok" | "error" | "warn" | "info" = "info") {
    this.statusEl.setText(msg);
    this.statusEl.className = `enc-status enc-status-${type}`;
    this.statusEl.show();
  }

  private setLoading(loading: boolean) {
    this.isLoading = loading;
    this.exportBtn.disabled = loading;
    this.exportBtn.setText(loading ? "Buscando…" : "Exportar al baúl →");
  }
}
