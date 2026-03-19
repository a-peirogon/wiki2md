const STOPWORDS = new Set([
  "the","a","an","of","in","on","at","to","for","and","or","but","not",
  "is","are","was","were","be","been","has","have","had","do","does","did",
  "will","would","can","could","may","might","shall","should",
  "el","la","los","las","un","una","de","en","y","o","que","del","al",
  "se","con","por","para","su","sus",
]);

export interface WikilinkResult {
  text: string;
  applied: number;
}

export function applyWikilinks(
  text: string,
  candidates: string[],
  maxLinks = 50,
  minWordLength = 3,
): WikilinkResult {
  let applied = 0;

  // Mayor longitud primero para evitar match parciales
  const sorted = [...new Set(candidates)].sort((a, b) => b.length - a.length);

  for (const title of sorted) {
    if (applied >= maxLinks) break;
    if (!isValid(title, minWordLength)) continue;

    const escaped = escapeRegex(title);
    // No enlazar si ya está dentro de [[ ]]
    const pattern = new RegExp(`(?<!\\[\\[)\\b(${escaped})\\b(?!\\]\\])`, "i");

    if (!pattern.test(text)) continue;

    // Reemplazar solo la primera ocurrencia
    let replaced = false;
    text = text.replace(pattern, (match) => {
      if (replaced) return match;
      replaced = true;
      return `[[${match}]]`;
    });

    if (replaced) applied++;
  }

  return { text, applied };
}

function isValid(title: string, minWordLength: number): boolean {
  const words = title.trim().split(/\s+/);
  if (words.length === 1 && title.length < minWordLength) return false;
  if (STOPWORDS.has(title.toLowerCase())) return false;
  return true;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
