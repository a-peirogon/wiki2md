# 📚 Encyclopedia Exporter — Plugin para Obsidian

Exporta artículos de **Wikipedia**, **SEP** (Stanford Encyclopedia of Philosophy) e **IEP** directamente a tu baúl, con wikilinks inteligentes, YAML frontmatter y tabla de contenidos.

---

## Instalación manual

> No es necesario instalar nada más. El plugin es un único archivo `.js`.

### Pasos

1. Abre la carpeta de tu baúl de Obsidian en el explorador de archivos.

2. Navega (o crea) la carpeta:
   ```
   TuBaúl/.obsidian/plugins/encyclopedia-exporter/
   ```

3. Copia estos tres archivos dentro de esa carpeta:
   - `main.js`
   - `manifest.json`
   - `styles.css`

4. En Obsidian: **Configuración → Plugins de comunidad → Activar "Encyclopedia Exporter"**
   - Si ves el aviso de "modo seguro", desactívalo primero.

5. ¡Listo! Verás el icono 📖 en la barra lateral izquierda.

---

## Uso

### Desde el ribbon (barra lateral)
Haz clic en el icono **📖** para abrir el modal de exportación.

### Desde la paleta de comandos
`Ctrl+P` (o `Cmd+P`) → busca:
- **"Exportar artículo de enciclopedia"** — abre el modal con la fuente por defecto
- **"Exportar desde Wikipedia"**
- **"Exportar desde SEP (Stanford)"**
- **"Exportar desde IEP"**

### En el modal

| Campo | Descripción |
|---|---|
| Caja de búsqueda | Escribe el tema; aparecen sugerencias automáticas |
| Fuente | Wikipedia / SEP / IEP |
| Idioma | Código ISO: `es`, `en`, `fr`, `de`… (SEP e IEP siempre en `en`) |
| Carpeta | Ruta dentro del baúl, ej. `Filosofía/Enciclopedias` |
| Vista previa | Muestra las primeras 2000 caracteres del Markdown |
| Exportar | Crea o actualiza la nota en el baúl y la abre |

---

## Formato de salida

```markdown
---
title: "Immanuel Kant"
source: Wikipedia
url: "https://es.wikipedia.org/wiki/Immanuel_Kant"
lang: es
created: 2024-01-15
tags: [fuente/wikipedia, idioma/es]
---

# Immanuel Kant

## Resumen

[[Immanuel Kant]] (1724–1804) fue un filósofo alemán de la [[Ilustración]]...

---

## Tabla de contenidos

- [[#Vida|Vida]]
- [[#Filosofía crítica|Filosofía crítica]]
- [[#Influencia|Influencia]]

## Vida

Nació en [[Königsberg]] (actual [[Kaliningrado]])...

---

## Referencias

- **Fuente:** [Wikipedia](https://es.wikipedia.org/wiki/Immanuel_Kant)
- **Exportado:** 15/1/2024 14:32
```

---

## Configuración

**Configuración → Plugins de comunidad → Encyclopedia Exporter ⚙**

| Opción | Por defecto | Descripción |
|---|---|---|
| Fuente por defecto | `wikipedia` | Fuente al abrir el modal |
| Idioma por defecto | `es` | Idioma de Wikipedia |
| Carpeta por defecto | *(raíz)* | Subcarpeta destino |
| Wikilinks activos | `✓` | Insertar [[enlaces]] |
| Máx. wikilinks | `50` | Por nota |
| Frontmatter YAML | `✓` | Compatibilidad con Obsidian Properties |
| Resumen | `✓` | Primer párrafo destacado |
| Tabla de contenidos | `✓` | TOC con wikilinks |
| Referencias al pie | `✓` | URL fuente y fecha |
| Prefijo de tags | `fuente/` | Tags automáticos: `#fuente/sep` |

---

## Añadir una nueva fuente

1. Crea `src/sources/mi_fuente.ts` heredando `ArticleSource`
2. Regístrala en `src/sources/index.ts`
3. Recompila con `npm run build`

```typescript
// src/sources/britannica.ts
export class BritannicaSource extends ArticleSource {
  readonly name = "britannica";
  readonly displayName = "Britannica";
  // ...
}
```

---

## Estructura del proyecto

```
encyclopedia-exporter/
├── main.js            ← Compilado final (el que va en el baúl)
├── manifest.json
├── styles.css
├── src/
│   ├── main.ts        ← Punto de entrada del plugin
│   ├── modal.ts       ← UI del modal de búsqueda
│   ├── settings.ts    ← Panel de configuración
│   ├── formatter.ts   ← Generador de Markdown
│   ├── wikilinks.ts   ← Motor de wikilinks inteligentes
│   ├── types.ts       ← Tipos e interfaces
│   └── sources/
│       ├── base.ts    ← Clase abstracta
│       ├── index.ts   ← Registro de fuentes
│       ├── wikipedia.ts
│       ├── sep.ts
│       └── iep.ts
└── package.json
```
