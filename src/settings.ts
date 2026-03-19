import { App, PluginSettingTab, Setting } from "obsidian";
import type EncyclopediaPlugin from "./main";
import { listSources } from "./sources/index";

export class EncyclopediaSettingTab extends PluginSettingTab {
  plugin: EncyclopediaPlugin;

  constructor(app: App, plugin: EncyclopediaPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Encyclopedia Exporter — Configuración" });

    // ── General ──────────────────────────────────────────────────────────
    containerEl.createEl("h3", { text: "General" });

    new Setting(containerEl)
      .setName("Fuente por defecto")
      .setDesc("Fuente que se selecciona al abrir el modal.")
      .addDropdown((dd) => {
        for (const { key, displayName } of listSources()) {
          dd.addOption(key, displayName);
        }
        dd.setValue(this.plugin.settings.defaultSource);
        dd.onChange(async (v) => {
          this.plugin.settings.defaultSource = v;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Idioma por defecto")
      .setDesc("Código ISO 639-1 (ej. es, en, fr, de).")
      .addText((t) =>
        t
          .setPlaceholder("es")
          .setValue(this.plugin.settings.defaultLang)
          .onChange(async (v) => {
            this.plugin.settings.defaultLang = v.trim() || "es";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Carpeta por defecto")
      .setDesc("Ruta dentro del baúl (ej. Filosofía/Enciclopedias). Vacío = raíz.")
      .addText((t) =>
        t
          .setPlaceholder("Enciclopedias")
          .setValue(this.plugin.settings.defaultFolder)
          .onChange(async (v) => {
            this.plugin.settings.defaultFolder = v.trim();
            await this.plugin.saveSettings();
          })
      );

    // ── Wikilinks ────────────────────────────────────────────────────────
    containerEl.createEl("h3", { text: "Wikilinks inteligentes" });

    new Setting(containerEl)
      .setName("Activar wikilinks")
      .setDesc("Inserta [[enlaces]] a los artículos relacionados mencionados en el texto.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.wikilinks.enabled).onChange(async (v) => {
          this.plugin.settings.wikilinks.enabled = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Máximo de wikilinks por nota")
      .setDesc("Limita cuántos [[enlaces]] se insertan para no saturar el texto.")
      .addSlider((s) =>
        s
          .setLimits(10, 200, 10)
          .setValue(this.plugin.settings.wikilinks.maxLinks)
          .setDynamicTooltip()
          .onChange(async (v) => {
            this.plugin.settings.wikilinks.maxLinks = v;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Longitud mínima de título")
      .setDesc("No enlazar palabras con menos caracteres que este valor.")
      .addSlider((s) =>
        s
          .setLimits(2, 10, 1)
          .setValue(this.plugin.settings.wikilinks.minWordLength)
          .setDynamicTooltip()
          .onChange(async (v) => {
            this.plugin.settings.wikilinks.minWordLength = v;
            await this.plugin.saveSettings();
          })
      );

    // ── Markdown ─────────────────────────────────────────────────────────
    containerEl.createEl("h3", { text: "Formato Markdown" });

    new Setting(containerEl)
      .setName("YAML Frontmatter")
      .setDesc("Añade metadatos compatibles con Obsidian Properties.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.markdown.frontmatter).onChange(async (v) => {
          this.plugin.settings.markdown.frontmatter = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Incluir resumen")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.markdown.includeSummary).onChange(async (v) => {
          this.plugin.settings.markdown.includeSummary = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Tabla de contenidos")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.markdown.includeToc).onChange(async (v) => {
          this.plugin.settings.markdown.includeToc = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Referencias al pie")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.markdown.includeReferences).onChange(async (v) => {
          this.plugin.settings.markdown.includeReferences = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Prefijo de tags")
      .setDesc("Prefijo para los tags automáticos (ej. 'fuente/' → #fuente/wikipedia).")
      .addText((t) =>
        t
          .setPlaceholder("fuente/")
          .setValue(this.plugin.settings.markdown.tagPrefix)
          .onChange(async (v) => {
            this.plugin.settings.markdown.tagPrefix = v;
            await this.plugin.saveSettings();
          })
      );
  }
}
