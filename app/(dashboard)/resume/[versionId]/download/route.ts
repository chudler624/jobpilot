import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildResumeDocx } from "@/lib/resume/template";

// Generated on-demand from resume_sections, never stored as a file — this
// is how "no public resume URLs" (CLAUDE.md) is satisfied: there's never a
// stored asset with a URL, only this authenticated, RLS-scoped handler.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ versionId: string }> }
) {
  const { versionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Not signed in", { status: 401 });
  }

  const [{ data: version }, { data: sections }, { data: profile }] =
    await Promise.all([
      supabase.from("resume_versions").select("*").eq("id", versionId).single(),
      supabase
        .from("resume_sections")
        .select("*")
        .eq("resume_version_id", versionId)
        .order("order_index"),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ]);

  // RLS already scopes both queries to this user — a versionId belonging
  // to someone else simply returns no rows here, not another user's data.
  if (!version || !sections || sections.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = await buildResumeDocx(sections, {
    name: profile?.display_name ?? profile?.email ?? "Resume",
    contactLine: profile?.email ?? "",
  });

  const filename = `${(version.label || "resume")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
