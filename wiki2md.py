import re
import argparse
import wikipedia
from pathlib import Path
from datetime import datetime
from typing import Optional


# ==========================
#  UTILIDADES DE FORMATO
# ==========================

def clean_content(content: str) -> str:
    """Limpia y normaliza el contenido de Wikipedia para formato Markdown."""
    # Eliminar caracteres de retorno
    content = re.sub(r"\r", "", content)
    
    # Conversión de formato Wikipedia → Markdown
    content = re.sub(r"==== (.+?) ====", r"\n#### \1\n", content)
    content = re.sub(r"=== (.+?) ===", r"\n### \1\n", content)
    content = re.sub(r"== (.+?) ==", r"\n## \1\n", content)
    content = re.sub(r"'''(.*?)'''", r"**\1**", content)  # Negrita
    content = re.sub(r"''(.*?)''", r"*\1*", content)      # Cursiva

    # Eliminar referencias tipo [1], [2], etc.
    content = re.sub(r"\[\d+\]", "", content)

    # Reemplazar &nbsp; por espacio
    content = re.sub(r"&nbsp;", " ", content)

    # Asegurar salto doble entre párrafos (evitar bloques densos)
    content = re.sub(r"([^\n])\n([^\n#*-])", r"\1\n\n\2", content)

    # Asegurar separación después de encabezados
    content = re.sub(r"(^#+ .+?$)", r"\1\n", content, flags=re.MULTILINE)

    # Normalizar triples saltos
    content = re.sub(r"\n{3,}", "\n\n", content)

    return content.strip()


# ==========================
#  PROCESAMIENTO PRINCIPAL
# ==========================

def generate_markdown(topic: str, lang: str = "es") -> Optional[str]:
    """Genera un documento Markdown limpio y estructurado a partir de Wikipedia."""

    try:
        page = wikipedia.page(topic, auto_suggest=False)
    except wikipedia.exceptions.DisambiguationError as e:
        print(f"Múltiples resultados encontrados para '{topic}':")
        for i, opt in enumerate(e.options[:10], 1):
            print(f"  {i}. {opt}")
        return None
    except wikipedia.exceptions.PageError:
        print(f"✗ Página no encontrada para: {topic}")
        return None

    # ===========
    #  DIRECTORIO
    # ===========
    output_dir = Path("md_output")
    output_dir.mkdir(parents=True, exist_ok=True)

    # ===========
    #  ENCABEZADO PRINCIPAL
    # ===========
    markdown = f"# {topic}\n\n"

    # ===========
    #  RESUMEN
    # ===========
    if page.summary:
        markdown += "## Resumen\n\n"
        markdown += f"{page.summary.strip()}\n\n---\n\n"

    # ===========
    #  CONTENIDO PRINCIPAL
    # ===========
    content = clean_content(page.content)

    markdown += content.strip() + "\n\n"

    # ===========
    #  REFERENCIAS
    # ===========
    markdown += "---\n\n"
    markdown += "## Referencias\n\n"
    markdown += f"- **Fuente:** [{page.url}]({page.url})\n"
    markdown += f"- **Generado:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"

    # ===========
    #  GUARDADO
    # ===========
    filename = topic.replace(" ", "_").replace("/", "_")
    output_file = output_dir / f"{filename}.md"
    
    try:
        with open(output_file, "w", encoding="utf-8") as file:
            file.write(markdown)
        print(f"✓ Documento creado: {output_file}")
        return str(output_file)
    except IOError as e:
        print(f"✗ Error al guardar archivo: {e}")
        return None


# ==========================
#  CONSOLA
# ==========================

def main():
    parser = argparse.ArgumentParser(
        description="Genera un documento Markdown limpio a partir de un artículo de Wikipedia."
    )
    parser.add_argument("topic", type=str, help="Tema para generar el documento.")
    parser.add_argument(
        "--lang",
        type=str,
        default="es",
        help="Código de idioma Wikipedia (por defecto: 'es')."
    )
    args = parser.parse_args()

    wikipedia.set_lang(args.lang)
    generate_markdown(args.topic, lang=args.lang)


if __name__ == "__main__":
    main()
