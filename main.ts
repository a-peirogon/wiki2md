import { Notice, Plugin, WorkspaceLeaf } from "obsidian";
import { DEFAULT_SETTINGS, PluginSettings } from "./types";
import { ExportModal } from "./modal";
import { EncyclopediaSettingTab } from "./settings";

export default class EncyclopediaPlugin extends Plugin {
  settings!: PluginSettings;

  async onload() {
    await this.loadSettings();

    // ── Ribbon icon ────────────────────────────────────────────────────
    this.addRibbonIcon("book-open", "Exportar artículo enciclopédico", () => {
      this.openExportModal();
    });

    // ── Comando de paleta ──────────────────────────────────────────────
    this.addCommand({
      id: "open-export-modal",
      name: "Exportar artículo de enciclopedia",
      callback: () => this.openExportModal(),
    });

    this.addCommand({
      id: "export-wikipedia",
      name: "Exportar desde Wikipedia",
      callback: () => this.openExportModal("wikipedia"),
    });

    this.addCommand({
      id: "export-sep",
      name: "Exportar desde SEP (Stanford)",
      callback: () => this.openExportModal("sep"),
    });

    this.addCommand({
      id: "export-iep",
      name: "Exportar desde IEP",
      callback: () => this.openExportModal("iep"),
    });

    // ── Settings tab ───────────────────────────────────────────────────
    this.addSettingTab(new EncyclopediaSettingTab(this.app, this));
  }

  onunload() {}

  // ── Helpers ───────────────────────────────────────────────────────────

  openExportModal(forceSource?: string) {
    const settings = forceSource
      ? { ...this.settings, defaultSource: forceSource }
      : this.settings;

    new ExportModal(this.app, settings, async (path: string) => {
      // Abrir la nota recién creada
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file) {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(file as any);
      }
    }).open();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    // Deep merge para sub-objetos
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
