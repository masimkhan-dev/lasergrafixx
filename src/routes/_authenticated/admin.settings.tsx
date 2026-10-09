import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery, type SettingsMap } from "@/lib/pos";
import { useStaff } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Laser Grafix POS" },
      { name: "description", content: "Clinic details and receipt text used on printed receipts." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Settings — Laser Grafix POS" },
      { property: "og:description", content: "Configure clinic information and receipt text." },
    ],
  }),
  component: Settings,
});

const FIELDS = [
  { key: "clinic_name", label: "Clinic name" },
  { key: "clinic_phone", label: "Clinic phone" },
  { key: "clinic_address", label: "Clinic address", multiline: true },
  { key: "receipt_header", label: "Receipt header" },
  { key: "receipt_footer", label: "Receipt footer" },
  { key: "social_handle", label: "Social handle" },
] as const;

function Settings() {
  const queryClient = useQueryClient();
  const { isAdmin } = useStaff();
  const settings = useQuery(settingsQuery);
  const [values, setValues] = useState<SettingsMap>({});

  useEffect(() => {
    if (settings.data) setValues(settings.data);
  }, [settings.data]);

  const save = useMutation({
    mutationFn: async () => {
      const rows = FIELDS.map((field) => ({ key: field.key, value: values[field.key] ?? "" }));
      const { error } = await supabase.from("settings").upsert(rows, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => toast.error("Only an admin can change clinic settings."),
  });

  return (
    <div className="max-w-2xl space-y-5">
      <div className="space-y-5 rounded-xl border border-pos-border bg-pos-card p-6 shadow-card">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            {"multiline" in field && field.multiline ? (
              <Textarea
                id={field.key}
                rows={3}
                disabled={!isAdmin}
                value={values[field.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              />
            ) : (
              <Input
                id={field.key}
                disabled={!isAdmin}
                value={values[field.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              />
            )}
          </div>
        ))}

        {isAdmin ? (
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary-hover"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            Save settings
          </Button>
        ) : (
          <p className="text-sm text-pos-text-muted">
            These details are read-only for staff accounts. Ask an admin to change them.
          </p>
        )}
      </div>
    </div>
  );
}
