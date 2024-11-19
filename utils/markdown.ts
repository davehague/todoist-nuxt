// src/utils/markdown.ts
import { marked } from "marked";
import type { Token, Tokens } from "marked";

export const renderMarkdown = (content: string) => {
  try {
    const renderer = new marked.Renderer();
    renderer.link = ({ href, tokens }) => {
      const title = tokens.map((t: Token) => (t as Tokens.Text).text).join(",");
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-300 hover:underline">${title}</a>`;
    };

    return marked(content, { renderer });
  } catch {
    return content;
  }
};
