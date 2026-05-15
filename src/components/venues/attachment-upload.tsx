"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ATTACHMENT_KIND_LABELS } from "@/lib/constants";
import { uploadAttachmentAction } from "@/server/actions/attachments";

const KINDS = ["CONTRACT", "PHOTO", "INVOICE", "OTHER"] as const;

export function AttachmentUpload({ venueId }: { venueId: string }) {
  const router = useRouter();
  const [kind, setKind] = useState<string>("CONTRACT");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    fd.set("kind", kind);
    startTransition(async () => {
      const r = await uploadAttachmentAction(venueId, fd);
      if (!r.ok) {
        toast.error(r.message ?? "Error subiendo archivo");
        return;
      }
      toast.success("Adjunto subido");
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="w-44">
        <Label className="mb-2 block">Tipo</Label>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KINDS.map((k) => (
              <SelectItem key={k} value={k}>
                {ATTACHMENT_KIND_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <Label className="mb-2 block">Archivo (PDF o imagen)</Label>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,image/*"
          onChange={onFile}
          disabled={isPending}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
        />
      </div>
      {isPending && (
        <Button variant="outline" disabled>
          <Loader2 className="h-4 w-4 animate-spin" />
          Subiendo
        </Button>
      )}
      {!isPending && (
        <Button variant="outline" type="button" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" />
          Elegir archivo
        </Button>
      )}
    </div>
  );
}
