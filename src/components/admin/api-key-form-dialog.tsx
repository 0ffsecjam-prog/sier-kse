"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  apiKeyCreateSchema,
  apiKeyUpdateSchema,
  type ApiKeyCreateInput,
  type ApiKeyUpdateInput,
} from "@/lib/zod-schemas/admin";
import { createApiKeyAction, updateApiKeyAction } from "@/server/actions/api-keys";

interface Props {
  apiKey?: {
    id: string;
    provider: string;
    label: string;
    active: boolean;
  };
}

export function ApiKeyFormDialog({ apiKey }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const editing = !!apiKey;

  type Values = ApiKeyCreateInput & ApiKeyUpdateInput;
  const form = useForm<Values>({
    resolver: zodResolver(editing ? apiKeyUpdateSchema : apiKeyCreateSchema),
    defaultValues: {
      provider: apiKey?.provider ?? "google_maps",
      label: apiKey?.label ?? "default",
      secret: "",
      active: apiKey?.active ?? true,
    },
  });

  function onSubmit(values: Values) {
    startTransition(async () => {
      const r = editing
        ? await updateApiKeyAction(apiKey!.id, {
            label: values.label,
            active: values.active,
            secret: values.secret || undefined,
          })
        : await createApiKeyAction(values);
      if (!r.ok) {
        toast.error(r.message ?? "Error");
        return;
      }
      if (!editing) {
        // Mostrar el secret una sola vez, después solo lastFour.
        setCreatedSecret(values.secret);
      } else {
        toast.success("API key actualizada");
        setOpen(false);
        form.reset();
        router.refresh();
      }
    });
  }

  function handleClose() {
    setOpen(false);
    setCreatedSecret(null);
    setCopied(false);
    form.reset();
    router.refresh();
  }

  async function copySecret() {
    if (!createdSecret) return;
    await navigator.clipboard.writeText(createdSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && createdSecret) {
          handleClose();
          return;
        }
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant={editing ? "outline" : "default"}>
          {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {editing ? "Editar" : "Nueva API key"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {createdSecret ? (
          <>
            <DialogHeader>
              <DialogTitle>Guardá esta key ahora</DialogTitle>
              <DialogDescription>
                Es la <strong>única vez</strong> que vas a ver el secret completo. Después solo
                vas a ver los últimos 4 caracteres.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Secret</Label>
              <div className="flex gap-2">
                <Input readOnly value={createdSecret} className="font-mono text-xs" />
                <Button type="button" variant="outline" onClick={copySecret}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copiado" : "Copiar"}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Listo</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar API key" : "Nueva API key"}</DialogTitle>
              <DialogDescription>
                Las keys se guardan encriptadas (AES-256-GCM). Si pierdas la <code>ENCRYPTION_KEY</code>
                {" "}del .env.docker, las keys son irrecuperables.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proveedor</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="google_maps, google_oauth, openai, ..."
                          {...field}
                          disabled={editing}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etiqueta</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="default / produccion / test"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{editing ? "Rotar secret (opcional)" : "Secret"}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={editing ? "Dejar vacío para no cambiar" : ""}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activa</FormLabel>
                      <div className="flex h-10 items-center gap-2">
                        <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                        <Label className="cursor-pointer">{field.value ? "Sí" : "No"}</Label>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
