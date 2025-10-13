import re
import argparse
import wikipedia
from pathlib import Path
from datetime import datetime
from typing import Optional

def clean_content(content: str) -> str:
    content = re.sub(r"\r", "", content)
    content = re.sub(r"==== (.+?) ====", r"\n#### \1\n", content)
    content = re.sub(r"=== (.+?) ===", r"\n### \1\n", content)
    content = re.sub(r"== (.+?) ==", r"\n## \1\n", content)
    content = re.sub(r"'''(.*?)'''", r"**\1**", content)
    content = re.sub(r"''(.*?)''", r"*\1*", content)
    content = re.sub(r"\[\d+\]", "", content)
    content = re.sub(r"&nbsp;", " ", content)
    content = re.sub(r"([^\n])\n([^\n#*-])", r"\1\n\n\2", content)
    content = re.sub(r"(^#+ .+?$)", r"\1\n", content, flags=re.MULTILINE)
    content = re.sub(r"\n{3,}", "\n\n", content)
    return content.strip()

def generate_markdown(topic: str, lang: str = "es") -> Optional[str]:
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

    output_dir = Path("md_output")
    output_dir.mkdir(parents=True, exist_ok=True)

    markdown = f"# {topic}\n\n"
    if page.summary:
        markdown += "## Resumen\n\n"
        markdown += f"{page.summary.strip()}\n\n---\n\n"

    content = clean_content(page.content)

    for link in sorted(page.links, key=len, reverse=True):
        if len(link.split()) <= 5:
            pattern = r"\b" + re.escape(link) + r"\b"
            content = re.sub(pattern, f"[[{link}]]", content)

    markdown += content.strip() + "\n\n"
    markdown += "---\n\n"
    markdown += "## Referencias\n\n"
    markdown += f"- **Fuente:** [{page.url}]({page.url})\n"
    markdown += f"- **Generado:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"

    filename = topic.replace(" ", "_").replace("/", "_")
    output_file = output_dir / f"{filename}.md"

    try:
        with open(output_file, "w", encoding="utf-8") as file:
            file.write(markdown)
        print(f"Documento creado: {output_file}")
        return str(output_file)
    except IOError as e:
        print(f"Error al guardar archivo: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(
        description="Genera un documento Markdown limpio a partir de un artículo de Wikipedia con wikilinks de Obsidian."
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
