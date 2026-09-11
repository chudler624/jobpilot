import { Document, Packer, Paragraph, TextRun } from "docx";
import type { Database } from "@/types/supabase";

type ResumeSection = Database["public"]["Tables"]["resume_sections"]["Row"];

export interface ResumeHeaderInfo {
  name: string;
  contactLine: string;
}

// ATS-safe by construction: this file never imports Table, TextBox/Frame,
// images, or multi-column section config — the only docx APIs used below
// are plain paragraphs, runs, and the built-in bullet convenience. Safety
// comes from what this file doesn't do, not a validation pass.
function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24 })],
    spacing: { before: 240, after: 80 },
  });
}

function headerParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true })],
    spacing: { before: 160 },
  });
}

function bulletParagraph(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    children: [new TextRun(text)],
  });
}

export async function buildResumeDocx(
  sections: ResumeSection[],
  header: ResumeHeaderInfo
): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: header.name, bold: true, size: 32 })],
    }),
    new Paragraph({
      children: [new TextRun({ text: header.contactLine, size: 20 })],
    }),
  ];

  const summaryClaims = sections.filter((s) => s.section_type === "summary_claim");
  if (summaryClaims.length > 0) {
    children.push(sectionHeading("SUMMARY"));
    children.push(
      new Paragraph({
        children: [
          new TextRun(summaryClaims.map((c) => c.content_text).join(" ")),
        ],
      })
    );
  }

  const skills = sections.filter((s) => s.section_type === "skill");
  if (skills.length > 0) {
    children.push(sectionHeading("SKILLS"));
    children.push(
      new Paragraph({
        children: [new TextRun(skills.map((s) => s.content_text).join(", "))],
      })
    );
  }

  const experienceRows = sections.filter(
    (s) => s.section_type === "experience_header" || s.section_type === "experience_bullet"
  );
  if (experienceRows.length > 0) {
    children.push(sectionHeading("EXPERIENCE"));
    for (const row of experienceRows) {
      children.push(
        row.section_type === "experience_header"
          ? headerParagraph(row.content_text)
          : bulletParagraph(row.content_text)
      );
    }
  }

  const projectRows = sections.filter(
    (s) => s.section_type === "project_header" || s.section_type === "project_bullet"
  );
  if (projectRows.length > 0) {
    children.push(sectionHeading("PROJECTS"));
    for (const row of projectRows) {
      children.push(
        row.section_type === "project_header"
          ? headerParagraph(row.content_text)
          : bulletParagraph(row.content_text)
      );
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
