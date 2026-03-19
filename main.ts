import { Editor, MarkdownView, Menu, Notice, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, PluginSettings } from "./types";
import { ExportModal } from "./modal";
import { EncyclopediaSettingTab } from "./settings";

export default class EncyclopediaPlugin extends Plugin {
  settings!: PluginSettings;

  async onload() {
    await this.loadSettings();

    // ── Ribbon icon ────────────────────────────────────────────────────
    this.addRibbonIcon("book-open", "Importar artículo enciclopédico", () => {
      this.openExportModal();
    });

    // ── Comando de paleta — sin editor ─────────────────────────────────
    this.addCommand({
      id: "open-export-modal",
      name: "Importar artículo de enciclopedia",
      callback: () => this.openExportModal(),
    });

    this.addCommand({
      id: "export-wikipedia",
      name: "Importar desde Wikipedia",
      callback: () => this.openExportModal("wikipedia"),
    });

    this.addCommand({
      id: "export-sep",
      name: "Importar desde SEP (Stanford)",
                    callback: () => this.openExportModal("sep"),
    });

    this.addCommand({
      id: "export-iep",
      name: "Importar desde IEP",
      callback: () => this.openExportModal("iep"),
    });

    // ── Comando de paleta — desde selección (editorCallback) ───────────
    // Solo aparece cuando hay un editor activo; Obsidian lo deshabilita
    // automáticamente si no hay texto seleccionado.
    this.addCommand({
      id: "export-from-selection",
      name: "Buscar selección en enciclopedia",
      editorCallback: (editor: Editor) => {
        const selection = this.cleanSelection(editor.getSelection());
        if (!selection) {
          new Notice("Selecciona un término en el editor primero.");
          return;
        }
        this.openExportModal(undefined, selection);
      },
    });

    // ── Menú contextual del editor ─────────────────────────────────────
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor) => {
        const selection = this.cleanSelection(editor.getSelection());
        if (!selection) return; // No mostrar la opción si no hay selección

        menu.addSeparator();
        menu.addItem((item) => {
          item
          .setTitle(`🔍 Buscar "${this.truncate(selection, 30)}" en enciclopedia`)
          .setIcon("book-open")
          .onClick(() => this.openExportModal(undefined, selection));
        });

        // Sub-opciones por fuente para ir directo sin cambiar el selector
        menu.addItem((item) => {
          item
          .setTitle("   → Wikipedia")
          .setIcon("globe")
          .onClick(() => this.openExportModal("wikipedia", selection));
        });
        menu.addItem((item) => {
          item
          .setTitle("   → SEP (Stanford)")
          .setIcon("library")
          .onClick(() => this.openExportModal("sep", selection));
        });
        menu.addItem((item) => {
          item
          .setTitle("   → IEP")
          .setIcon("library")
          .onClick(() => this.openExportModal("iep", selection));
        });
        menu.addSeparator();
      }),
    );

    // ── Settings tab ───────────────────────────────────────────────────
    this.addSettingTab(new EncyclopediaSettingTab(this.app, this));
  }

  onunload() {}

  // ── Helpers ───────────────────────────────────────────────────────────

  openExportModal(forceSource?: string, prefill = "") {
    const settings = forceSource
    ? { ...this.settings, defaultSource: forceSource }
    : this.settings;

    new ExportModal(this.app, settings, async (path: string) => {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file) {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(file as any);
      }
    }, prefill).open();
  }

  /**
   * Limpia el texto seleccionado para usarlo como término de búsqueda:
   * - Elimina saltos de línea y espacios extra
   * - Quita marcado Markdown (**bold**, [[links]], etc.)
   * - Devuelve "" si el resultado es demasiado largo para ser un término útil
   */
  private cleanSelection(raw: string): string {
    if (!raw) return "";

    let clean = raw
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1") // [[link|alias]] → link
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")           // **bold** / *italic*
    .replace(/`([^`]+)`/g, "$1")                        // `code`
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")            // [text](url) → text
    .replace(/#+\s*/g, "")                              // headings
    .replace(/\s+/g, " ")
    .trim();

    // Si la selección es un párrafo entero (>120 chars), no es un término útil
    if (clean.length > 120) return "";

    return clean;
  }

  private truncate(text: string, max: number): string {
    return text.length > max ? text.slice(0, max) + "…" : text;
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.settings.wikilinks = Object.assign(
      {},
      DEFAULT_SETTINGS.wikilinks,
      this.settings.wikilinks,
    );
    this.settings.markdown = Object.assign(
      {},
      DEFAULT_SETTINGS.markdown,
      this.settings.markdown,
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
