"use client";

import { useState, useTransition } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseResumeImport, commitImport, type ImportState } from "./actions";
import type { CareerProfileExtraction } from "@/lib/ai";

type ReviewExperience = CareerProfileExtraction["experiences"][number] & {
  included: boolean;
};
type ReviewProject = CareerProfileExtraction["projects"][number] & {
  included: boolean;
};
type ReviewSkill = { name: string; included: boolean };

function toDateInputValue(value: string | null): string {
  return value ?? "";
}

export default function ImportPage() {
  const [parseState, parseAction, isParsing] = useActionState<
    ImportState,
    FormData
  >(parseResumeImport, {});

  const [initializedFor, setInitializedFor] =
    useState<CareerProfileExtraction | null>(null);
  const [experiences, setExperiences] = useState<ReviewExperience[]>([]);
  const [projects, setProjects] = useState<ReviewProject[]>([]);
  const [skills, setSkills] = useState<ReviewSkill[]>([]);

  // Initialize editable review state the first time a new extraction
  // arrives — the React-documented pattern for deriving state from a prop
  // that changes, guarded so it only runs once per new result.
  if (parseState.extracted && parseState.extracted !== initializedFor) {
    setInitializedFor(parseState.extracted);
    setExperiences(
      parseState.extracted.experiences.map((e) => ({ ...e, included: true }))
    );
    setProjects(
      parseState.extracted.projects.map((p) => ({ ...p, included: true }))
    );
    setSkills(
      parseState.extracted.skills.map((name) => ({ name, included: true }))
    );
  }

  const [commitError, setCommitError] = useState<string | null>(null);
  const [isCommitting, startCommit] = useTransition();

  function handleCommit() {
    setCommitError(null);
    startCommit(async () => {
      const result = await commitImport({
        experiences: experiences
          .filter((e) => e.included)
          .map(({ included: _included, ...rest }) => ({
            ...rest,
            startDate: rest.startDate ?? "",
          })),
        projects: projects
          .filter((p) => p.included)
          .map(({ included: _included, ...rest }) => rest),
        skills: skills.filter((s) => s.included).map((s) => s.name),
      });
      if (result.error) setCommitError(result.error);
    });
  }

  if (!initializedFor) {
    return (
      <div className="max-w-2xl space-y-4">
        <div>
          <h1 className="text-[26px] leading-tight font-medium">Import from resume</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Upload an existing resume (PDF or DOCX). The AI extracts a
            baseline Career Profile from it, which you review and edit below
            before anything is saved — nothing is written to your profile
            until you confirm it.
          </p>
        </div>
        <form action={parseAction} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="file">Resume file</Label>
            <input
              id="file"
              name="file"
              type="file"
              accept=".pdf,.docx"
              required
              className="text-sm"
            />
          </div>
          {parseState.error && (
            <p className="text-sm text-destructive">{parseState.error}</p>
          )}
          <Button type="submit" className="self-start" disabled={isParsing}>
            {isParsing ? "Analyzing resume..." : "Analyze resume"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-[26px] leading-tight font-medium">Review before saving</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Uncheck anything you don&apos;t want, edit anything that&apos;s
          wrong, then save. Nothing has been added to your Career Profile
          yet.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Experiences</h2>
        {experiences.map((experience, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center gap-2">
              <Checkbox
                checked={experience.included}
                onCheckedChange={(checked) =>
                  setExperiences((prev) =>
                    prev.map((e, i) =>
                      i === index ? { ...e, included: checked === true } : e
                    )
                  )
                }
              />
              <CardTitle className="text-base">
                {experience.title || "Untitled role"}
                {experience.company ? ` — ${experience.company}` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Company</Label>
                  <Input
                    value={experience.company}
                    onChange={(e) =>
                      setExperiences((prev) =>
                        prev.map((x, i) =>
                          i === index ? { ...x, company: e.target.value } : x
                        )
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input
                    value={experience.title}
                    onChange={(e) =>
                      setExperiences((prev) =>
                        prev.map((x, i) =>
                          i === index ? { ...x, title: e.target.value } : x
                        )
                      )
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Location</Label>
                <Input
                  value={experience.location ?? ""}
                  onChange={(e) =>
                    setExperiences((prev) =>
                      prev.map((x, i) =>
                        i === index
                          ? { ...x, location: e.target.value || null }
                          : x
                      )
                    )
                  }
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Start date</Label>
                  <Input
                    type="date"
                    value={toDateInputValue(experience.startDate)}
                    required
                    onChange={(e) =>
                      setExperiences((prev) =>
                        prev.map((x, i) =>
                          i === index
                            ? { ...x, startDate: e.target.value || null }
                            : x
                        )
                      )
                    }
                  />
                  {!experience.startDate && (
                    <p className="text-xs text-destructive">
                      Couldn&apos;t determine a start date — required before
                      saving.
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>End date</Label>
                  <Input
                    type="date"
                    value={toDateInputValue(experience.endDate)}
                    onChange={(e) =>
                      setExperiences((prev) =>
                        prev.map((x, i) =>
                          i === index
                            ? { ...x, endDate: e.target.value || null }
                            : x
                        )
                      )
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Technologies (comma-separated)</Label>
                <Input
                  value={experience.technologies.join(", ")}
                  onChange={(e) =>
                    setExperiences((prev) =>
                      prev.map((x, i) =>
                        i === index
                          ? {
                              ...x,
                              technologies: e.target.value
                                .split(",")
                                .map((t) => t.trim())
                                .filter(Boolean),
                            }
                          : x
                      )
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  value={experience.description ?? ""}
                  onChange={(e) =>
                    setExperiences((prev) =>
                      prev.map((x, i) =>
                        i === index
                          ? { ...x, description: e.target.value || null }
                          : x
                      )
                    )
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Accomplishments</Label>
                {experience.accomplishments.map((text, bulletIndex) => (
                  <div key={bulletIndex} className="flex gap-2">
                    <Input
                      value={text}
                      onChange={(e) =>
                        setExperiences((prev) =>
                          prev.map((x, i) =>
                            i === index
                              ? {
                                  ...x,
                                  accomplishments: x.accomplishments.map(
                                    (b, bi) =>
                                      bi === bulletIndex ? e.target.value : b
                                  ),
                                }
                              : x
                          )
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setExperiences((prev) =>
                          prev.map((x, i) =>
                            i === index
                              ? {
                                  ...x,
                                  accomplishments: x.accomplishments.filter(
                                    (_, bi) => bi !== bulletIndex
                                  ),
                                }
                              : x
                          )
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {experiences.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No experiences found in that resume.
          </p>
        )}
      </div>

      {projects.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Projects</h2>
          {projects.map((project, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center gap-2">
                <Checkbox
                  checked={project.included}
                  onCheckedChange={(checked) =>
                    setProjects((prev) =>
                      prev.map((p, i) =>
                        i === index ? { ...p, included: checked === true } : p
                      )
                    )
                  }
                />
                <CardTitle className="text-base">
                  {project.name || "Untitled project"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input
                    value={project.name}
                    onChange={(e) =>
                      setProjects((prev) =>
                        prev.map((x, i) =>
                          i === index ? { ...x, name: e.target.value } : x
                        )
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Accomplishments</Label>
                  {project.accomplishments.map((text, bulletIndex) => (
                    <div key={bulletIndex} className="flex gap-2">
                      <Input
                        value={text}
                        onChange={(e) =>
                          setProjects((prev) =>
                            prev.map((x, i) =>
                              i === index
                                ? {
                                    ...x,
                                    accomplishments: x.accomplishments.map(
                                      (b, bi) =>
                                        bi === bulletIndex ? e.target.value : b
                                    ),
                                  }
                                : x
                            )
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setProjects((prev) =>
                            prev.map((x, i) =>
                              i === index
                                ? {
                                    ...x,
                                    accomplishments: x.accomplishments.filter(
                                      (_, bi) => bi !== bulletIndex
                                    ),
                                  }
                                : x
                            )
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Skills</h2>
        <div className="flex flex-wrap gap-3">
          {skills.map((skill, index) => (
            <label
              key={index}
              className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm"
            >
              <Checkbox
                checked={skill.included}
                onCheckedChange={(checked) =>
                  setSkills((prev) =>
                    prev.map((s, i) =>
                      i === index ? { ...s, included: checked === true } : s
                    )
                  )
                }
              />
              {skill.name}
            </label>
          ))}
        </div>
        {skills.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No skills found in that resume.
          </p>
        )}
      </div>

      {commitError && <p className="text-sm text-destructive">{commitError}</p>}

      <Button onClick={handleCommit} disabled={isCommitting}>
        {isCommitting ? "Saving..." : "Save to Career Profile"}
      </Button>
    </div>
  );
}
