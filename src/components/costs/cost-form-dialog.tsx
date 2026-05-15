"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COST_CATEGORIES,
  installationCostSchema,
  type InstallationCostInput,
} from "@/lib/zod-schemas/cost";
import { COST_CATEGORY_LABELS } from "@/lib/constants";
import { createCostAction, updateCostAction } from "@/server/actions/costs";

interface Props {
  venueId: string;
  defaultCurrency?: string;
  cost?: {
    id: string;
    category: string;
    description: string;
    amount: string | number;
    currency: string;
    incurredAt: Date | string;
  };
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "ghost" | "secondary";
  triggerSize?: "default" | "sm" | "icon";
}

export function CostFormDialog({
  venueId,
  defaultCurrency = "USD",
  cost,
  triggerLabel,
  triggerVariant = "default",
  triggerSize = "sm",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const editing = !!cost;

  const form = useForm<InstallationCostInput>({
    resolver: zodResolver(installationCostSchema),
    defaultValues: {
      category: (cost?.category as "CAMERA") ?? "CAMERA",
      description: cost?.description ?? "",
      amount: cost ? String(cost.amount) : "",
      currency: cost?.currency ?? defaultCurrency,
      incurredAt: cost
        ? new Date(cost.incurredAt).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    },
  });

  function onSubmit(values: InstallationCostInput) {
    startTransition(async () => {
      const result = editing
        ? await updateCostAction(cost!.id, values)
        : await createCostAction(venueId, values);
      if (!result.ok) {
        toast.error(result.message ?? "Error al guardar");
        return;
      }
      toast.success(editing ? "Costo actualizado" : "Costo agregado");
      setOpen(false);
      form.reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize}>
          {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {triggerLabel ?? (editing ? "Editar" : "Nuevo costo")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar costo" : "Nuevo costo de instalación"}</DialogTitle>
          <DialogDescription>
            Registrá un gasto puntual asociado a la instalación de esta cancha.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COST_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {COST_CATEGORY_LABELS[c]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="incurredAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={String(field.value ?? "")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input placeholder="Cámara IP 4K + soporte" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={(field.value as string) ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? "USD"} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
      </DialogContent>
    </Dialog>
  );
}
