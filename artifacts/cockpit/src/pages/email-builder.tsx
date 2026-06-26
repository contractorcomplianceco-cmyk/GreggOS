import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListEmailDrafts,
  useGenerateEmailDraft,
  useUpdateEmailDraft,
  useDeleteEmailDraft,
  getListEmailDraftsQueryKey,
} from "@workspace/api-client-react";
import type { EmailDraft } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Sparkles, Copy, Trash2, Check } from "lucide-react";

const TONES = [
  "Professional",
  "Warm",
  "Direct",
  "Appreciative",
  "Apologetic",
];

interface FormState {
  purpose: string;
  audience: string;
  tone: string;
  keyPoints: string;
}

const EMPTY_FORM: FormState = {
  purpose: "",
  audience: "",
  tone: "Professional",
  keyPoints: "",
};

export default function EmailBuilder() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [current, setCurrent] = useState<EmailDraft | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);

  const { data } = useListEmailDrafts(undefined, {
    query: { queryKey: getListEmailDraftsQueryKey() },
  });
  const drafts = (data ?? []) as unknown as EmailDraft[];

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: getListEmailDraftsQueryKey() });
  const mOpts = { mutation: { onSuccess: invalidate } };
  const generateM = useGenerateEmailDraft(mOpts);
  const updateM = useUpdateEmailDraft(mOpts);
  const deleteM = useDeleteEmailDraft(mOpts);

  function loadDraft(d: EmailDraft) {
    setCurrent(d);
    setSubject(d.subject);
    setBody(d.body);
    setForm({
      purpose: d.purpose,
      audience: d.audience,
      tone: d.tone || "Professional",
      keyPoints: d.keyPoints,
    });
  }

  async function generate() {
    if (!form.purpose.trim()) {
      toast({ title: "Purpose is required", variant: "destructive" });
      return;
    }
    try {
      const result = (await generateM.mutateAsync({
        data: {
          purpose: form.purpose.trim(),
          audience: form.audience,
          tone: form.tone,
          keyPoints: form.keyPoints,
        } as never,
      })) as unknown as EmailDraft;
      loadDraft(result);
      toast({
        title:
          result.source === "ai"
            ? "Draft generated"
            : "Draft generated (template)",
      });
    } catch {
      toast({ title: "Could not generate draft", variant: "destructive" });
    }
  }

  async function saveEdits() {
    if (!current) return;
    try {
      await updateM.mutateAsync({
        draftId: current.id,
        data: { subject, body } as never,
      });
      toast({ title: "Draft saved" });
    } catch {
      toast({ title: "Could not save draft", variant: "destructive" });
    }
  }

  async function markUsed() {
    if (!current) return;
    try {
      await updateM.mutateAsync({
        draftId: current.id,
        data: { status: "used" } as never,
      });
      toast({ title: "Marked used" });
    } catch {
      toast({ title: "Could not update draft", variant: "destructive" });
    }
  }

  async function copyToClipboard() {
    const text = `Subject: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  }

  async function remove(d: EmailDraft) {
    try {
      await deleteM.mutateAsync({ draftId: d.id });
      if (current?.id === d.id) {
        setCurrent(null);
        setSubject("");
        setBody("");
      }
      toast({ title: "Draft deleted" });
    } catch {
      toast({ title: "Could not delete draft", variant: "destructive" });
    }
  }

  function reset() {
    setCurrent(null);
    setSubject("");
    setBody("");
    setForm(EMPTY_FORM);
  }

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <PageHeader
          tag="Tackle Box"
          title="Email Builder"
          subtitle="Generate a clean, professional email draft from a short brief. Drafts are for you to review, edit, and send yourself — nothing is sent from this app, and it does not commit to pricing, refunds, legal, or compliance positions."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-5">
            <Card className="shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>Purpose</Label>
                  <Input
                    value={form.purpose}
                    onChange={(e) =>
                      setForm({ ...form, purpose: e.target.value })
                    }
                    placeholder="e.g. follow up after our review call"
                    data-testid="input-email-purpose"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Audience (optional)</Label>
                  <Input
                    value={form.audience}
                    onChange={(e) =>
                      setForm({ ...form, audience: e.target.value })
                    }
                    placeholder="e.g. Dave, operations lead"
                    data-testid="input-email-audience"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tone</Label>
                  <Select
                    value={form.tone}
                    onValueChange={(v) => setForm({ ...form, tone: v })}
                  >
                    <SelectTrigger data-testid="select-email-tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Key points (one per line)</Label>
                  <Textarea
                    value={form.keyPoints}
                    onChange={(e) =>
                      setForm({ ...form, keyPoints: e.target.value })
                    }
                    placeholder={"thank them for time\nconfirm next steps"}
                    rows={5}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={generate}
                    disabled={generateM.isPending}
                    className="flex-1"
                    data-testid="button-generate-email"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    {generateM.isPending ? "Generating…" : "Generate draft"}
                  </Button>
                  {current ? (
                    <Button variant="outline" onClick={reset}>
                      New
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {drafts.length > 0 ? (
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">
                    Saved drafts
                  </p>
                  <div className="space-y-1">
                    {drafts.map((d) => (
                      <div
                        key={d.id}
                        className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer ${
                          current?.id === d.id
                            ? "bg-slate-100"
                            : "hover:bg-slate-50"
                        }`}
                        onClick={() => loadDraft(d)}
                        data-testid={`draft-item-${d.id}`}
                      >
                        <span className="truncate flex-1">
                          {d.subject || d.purpose || "Untitled"}
                        </span>
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          {d.status}
                        </Badge>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(d);
                          }}
                          className="text-muted-foreground hover:text-rose-600 shrink-0"
                          data-testid={`button-delete-draft-${d.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="lg:col-span-2">
            <Card className="shadow-sm h-full">
              <CardContent className="p-6">
                {!current ? (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
                    <Mail className="h-8 w-8 mb-3 text-slate-300" />
                    Fill in the brief and generate a draft to edit it here.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant={current.source === "ai" ? "default" : "secondary"}
                      >
                        {current.source === "ai" ? "AI draft" : "Template draft"}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={copyToClipboard}
                          data-testid="button-copy-email"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 mr-1" />
                          ) : (
                            <Copy className="h-4 w-4 mr-1" />
                          )}
                          {copied ? "Copied" : "Copy"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={markUsed}
                          data-testid="button-mark-used"
                        >
                          Mark used
                        </Button>
                        <Button
                          size="sm"
                          onClick={saveEdits}
                          data-testid="button-save-email"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Subject</Label>
                      <Input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        data-testid="input-email-subject"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Body</Label>
                      <Textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={16}
                        className="font-sans"
                        data-testid="textarea-email-body"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
