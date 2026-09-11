import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB

export type ParseResumeFileResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export async function parseResumeFile(
  file: File
): Promise<ParseResumeFileResult> {
  if (file.size === 0) {
    return { ok: false, error: "That file is empty." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "That file is too large (max 8MB)." };
  }

  const name = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
  const isDocx =
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx");

  if (!isPdf && !isDocx) {
    return { ok: false, error: "Please upload a PDF or DOCX file." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    if (isPdf) {
      const pdf = await getDocumentProxy(bytes);
      const { text } = await extractText(pdf, { mergePages: true });
      if (!text.trim()) {
        return { ok: false, error: "Couldn't extract any text from that PDF." };
      }
      return { ok: true, text };
    }

    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    if (!result.value.trim()) {
      return {
        ok: false,
        error: "Couldn't extract any text from that document.",
      };
    }
    return { ok: true, text: result.value };
  } catch {
    return { ok: false, error: "Couldn't read that file. Please try a different one." };
  }
}
