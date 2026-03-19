# Encyclopedia Importer

Plugin para Obsidian que exporta artículos de **Wikipedia**, **SEP** (Stanford Encyclopedia of Philosophy) e **IEP** directamente al baúl, con wikilinks inteligentes y tabla de contenidos automática.

---

## Instalación

1. Crear la carpeta `.obsidian/plugins/encyclopedia-importer/` en el baúl
2. Copiar `main.js`, `manifest.json` y `styles.css` dentro de esa carpeta
3. En Obsidian: **Configuración > Plugins de comunidad > activar Encyclopedia Importer**

> En Mac: mostrar carpetas ocultas con `Cmd + Shift + .`  
> En Windows: activar "Elementos ocultos" en el Explorador

---

## Uso

| Acción | Cómo |
|---|---|
| Abrir el importador | Icono 📖 en la barra lateral |
| Paleta de comandos | `Ctrl+P` > "Importar artículo" |
| Desde una selección | Seleccionar texto > clic derecho > "Buscar en enciclopedia" |
| Por fuente directa | `Ctrl+P` > "Importar desde Wikipedia / SEP / IEP" |

---

## Formato de salida

```markdown
# Historia de la criptografía

## Resumen

La historia de la criptografía se remonta a miles de años...

## Contenidos

- [[#Criptografía clásica|Criptografía clásica]]
- [[#Criptografía medieval|Criptografía medieval]]
- [[#Criptografía moderna|Criptografía moderna]]

## Criptografía clásica

El uso más antiguo conocido de la criptografía se halla en [[jeroglíficos]]
tallados en monumentos del [[Antiguo Egipto]]...

---
*Fuente: [Wikipedia](https://es.wikipedia.org/wiki/Historia_de_la_criptografía)*  
*Exportado el 19 de marzo de 2026*
```

---

## Configuración

**Configuración > Plugins de comunidad > Encyclopedia Importer ⚙**

| Opción | Por defecto | Descripción |
|---|---|---|
| Fuente | `wikipedia` | Fuente al abrir el modal |
| Idioma | `es` | Código ISO (en, es, fr…) |
| Carpeta | *(raíz)* | Subcarpeta destino dentro del baúl |
| Wikilinks | activado | Inserta [[enlaces]] automáticos |
| Máx. wikilinks | `50` | Por nota |
| YAML Frontmatter | desactivado | Metadatos compatibles con Obsidian Properties |
| Resumen | activado | Primer bloque del artículo |
| Tabla de contenidos | activado | Índice con wikilinks internos |
| Créditos al pie | activado | Fuente y fecha de exportación |

---

## Fuentes soportadas

| Clave | Nombre | Idioma |
|---|---|---|
| `wikipedia` | Wikipedia | Multilingüe |
| `sep` | Stanford Encyclopedia of Philosophy | Inglés |
| `iep` | Internet Encyclopedia of Philosophy | Inglés |

---

## Añadir una nueva fuente

1. Crear `src/sources/mi_fuente.ts` heredando de `ArticleSource`
2. Registrarla en `src/sources/index.ts`
3. Recompilar: `npm run build`

---

