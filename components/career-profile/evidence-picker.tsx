import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EvidencePicker({
  evidenceOptions,
  defaultValue,
  required,
}: {
  evidenceOptions: { id: string; title: string }[];
  defaultValue?: string | null;
  required?: boolean;
}) {
  const items: Record<string, string> = { "": "No evidence linked" };
  for (const evidence of evidenceOptions) {
    items[evidence.id] = evidence.title;
  }

  return (
    <Select
      name="evidence_id"
      defaultValue={defaultValue ?? ""}
      items={items}
      required={required}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="No evidence linked" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">No evidence linked</SelectItem>
        {evidenceOptions.map((evidence) => (
          <SelectItem key={evidence.id} value={evidence.id}>
            {evidence.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
