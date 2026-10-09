import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_CATEGORIES, pkr } from "@/lib/format";
import { fetchServices, type Service } from "@/lib/pos";
import { useStaff } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin/services")({
  head: () => ({
    meta: [
      { title: "Services — Laser Grafix POS" },
      { name: "description", content: "Manage clinic treatments, categories and prices." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Services — Laser Grafix POS" },
      { property: "og:description", content: "Treatment menu and pricing for the clinic." },
    ],
  }),
  component: Services,
});

function Services() {
  const queryClient = useQueryClient();
  const { isAdmin } = useStaff();
  const [editing, setEditing] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(SERVICE_CATEGORIES[0]);
  const [price, setPrice] = useState("");

  const services = useQuery({ queryKey: ["services", "all"], queryFn: () => fetchServices(false) });

  function startNew() {
    setEditing(null);
    setName("");
    setCategory(SERVICE_CATEGORIES[0]);
    setPrice("");
    setOpen(true);
  }

  function startEdit(service: Service) {
    setEditing(service);
    setName(service.name);
    setCategory(service.category);
    setPrice(String(Math.round(Number(service.price))));
    setOpen(true);
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["services"] });

  const save = useMutation({
    mutationFn: async () => {
      const value = Number(price);
      if (!name.trim()) throw new Error("Name is required");
      if (!value || value <= 0) throw new Error("Enter a valid price");
      const payload = { name: name.trim(), category, price: value };
      const { error } = editing
        ? await supabase.from("services").update(payload).eq("id", editing.id)
        : await supabase.from("services").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(editing ? "Service updated" : "Service added");
      setOpen(false);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggle = useMutation({
    mutationFn: async (service: Service) => {
      const { error } = await supabase
        .from("services")
        .update({ is_active: !service.is_active })
        .eq("id", service.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (service: Service) => {
      const { error } = await supabase.from("services").delete().eq("id", service.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Service deleted");
      invalidate();
    },
    onError: () =>
      toast.error("This service is used in past sales — switch it off instead of deleting."),
  });

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary-hover"
          onClick={startNew}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Service
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-pos-border bg-pos-card shadow-card">
        <table className="w-full text-sm">
          <thead className="text-left text-xs tracking-wide text-pos-text-muted uppercase">
            <tr>
              <th className="px-5 py-3">Service</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Active</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(services.data ?? []).map((service) => (
              <tr key={service.id} className="border-t border-pos-border">
                <td className="px-5 py-3 font-medium">{service.name}</td>
                <td className="px-5 py-3 text-pos-text-muted">{service.category}</td>
                <td className="tabular px-5 py-3">{pkr(service.price)}</td>
                <td className="px-5 py-3">
                  <Switch
                    checked={service.is_active}
                    onCheckedChange={() => toggle.mutate(service)}
                    aria-label={`Toggle ${service.name}`}
                  />
                </td>
                <td className="px-5 py-3 text-right">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(service)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => remove.mutate(service)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sans">
              {editing ? "Edit service" : "Add service"}
            </DialogTitle>
            <DialogDescription>Prices are in Pakistani rupees.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="s-name">Name *</Label>
              <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-price">Price *</Label>
              <Input
                id="s-price"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
              disabled={save.isPending}
              onClick={() => save.mutate()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
