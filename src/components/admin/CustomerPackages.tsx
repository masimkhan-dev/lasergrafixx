import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { dateOnly, pkr } from "@/lib/format";
import { fetchCustomerPackages, fetchPackageSessions } from "@/lib/pos";

const SESSION_PRESETS = [4, 6, 8];

export function CustomerPackages({ customerId }: { customerId: string }) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [sessions, setSessions] = useState("6");
  const [price, setPrice] = useState("");
  const [logFor, setLogFor] = useState<string | null>(null);
  const [logNotes, setLogNotes] = useState("");
  const [history, setHistory] = useState<string | null>(null);

  const packages = useQuery({
    queryKey: ["customer-packages", customerId],
    queryFn: () => fetchCustomerPackages(customerId),
  });

  const sessionLog = useQuery({
    queryKey: ["package-sessions", history],
    enabled: !!history,
    queryFn: () => fetchPackageSessions(history as string),
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["customer-packages", customerId] });

  const create = useMutation({
    mutationFn: async () => {
      const total = Number(sessions);
      const value = Number(price) || 0;
      if (!name.trim()) throw new Error("Package name is required");
      if (!Number.isInteger(total) || total < 1) throw new Error("Sessions must be 1 or more");
      const { error } = await supabase.from("customer_packages").insert({
        customer_id: customerId,
        package_name: name.trim(),
        total_sessions: total,
        price: value,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Package added");
      setAdding(false);
      setName("");
      setPrice("");
      setSessions("6");
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const redeem = useMutation({
    mutationFn: async (packageId: string) => {
      const { data, error } = await supabase.rpc("redeem_package_session", {
        p_package_id: packageId,
        ...(logNotes.trim() ? { p_notes: logNotes.trim() } : {}),
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: async (sessionNumber) => {
      toast.success(`Session ${sessionNumber} recorded`);
      setLogFor(null);
      setLogNotes("");
      await refresh();
      await queryClient.invalidateQueries({ queryKey: ["package-sessions"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Packages</p>
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add package
        </Button>
      </div>

      <div className="space-y-2">
        {(packages.data ?? []).map((pkg) => {
          const used = pkg.used_sessions;
          const total = pkg.total_sessions;
          const remaining = total - used;
          const done = pkg.status !== "active";
          return (
            <div key={pkg.id} className="rounded-lg border border-pos-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{pkg.package_name}</p>
                  <p className="text-xs text-pos-text-muted">
                    Session {used} of {total} completed · {remaining} remaining ·{" "}
                    {pkr(pkg.price)}
                  </p>
                </div>
                {done ? (
                  <span className="flex items-center gap-1 rounded-full bg-success/12 px-2.5 py-1 text-xs font-semibold text-success uppercase">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {pkg.status}
                  </span>
                ) : (
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary-hover"
                    onClick={() => {
                      setLogNotes("");
                      setLogFor(pkg.id);
                    }}
                  >
                    Log session
                  </Button>
                )}
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-pos-bg">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.round((used / total) * 100)}%` }}
                />
              </div>

              <button
                type="button"
                className="mt-2 text-xs font-medium text-primary underline-offset-2 hover:underline"
                onClick={() => setHistory(history === pkg.id ? null : pkg.id)}
              >
                {history === pkg.id ? "Hide session history" : "Session history"}
              </button>

              {history === pkg.id && (
                <ul className="mt-2 space-y-1 text-xs text-pos-text-muted">
                  {(sessionLog.data ?? []).map((row) => (
                    <li key={row.id}>
                      Session {row.session_number} — {dateOnly(row.performed_at)}
                      {row.notes ? ` · ${row.notes}` : ""}
                    </li>
                  ))}
                  {(sessionLog.data?.length ?? 0) === 0 && <li>No sessions recorded yet.</li>}
                </ul>
              )}
            </div>
          );
        })}
        {!packages.isLoading && (packages.data?.length ?? 0) === 0 && (
          <p className="text-sm text-pos-text-muted">No packages yet.</p>
        )}
      </div>

      {/* Add package */}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sans">Add package</DialogTitle>
            <DialogDescription>
              For treatments sold as a course of sessions, e.g. Full Legs 6 Sessions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="p-name">Package name *</Label>
              <Input
                id="p-name"
                placeholder="Full Legs Laser"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-sessions">Total sessions *</Label>
                <Input
                  id="p-sessions"
                  inputMode="numeric"
                  value={sessions}
                  onChange={(e) => setSessions(e.target.value)}
                />
                <div className="flex gap-2">
                  {SESSION_PRESETS.map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSessions(String(n))}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-price">Package price</Label>
                <Input
                  id="p-price"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
              disabled={create.isPending}
              onClick={() => create.mutate()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log session */}
      <Dialog open={!!logFor} onOpenChange={(open) => !open && setLogFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sans">Log a session</DialogTitle>
            <DialogDescription>
              Records today&apos;s session and reduces the remaining count.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            placeholder="Treatment notes (optional) — machine settings, skin reaction, next visit"
            value={logNotes}
            onChange={(e) => setLogNotes(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLogFor(null)}>
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
              disabled={redeem.isPending}
              onClick={() => logFor && redeem.mutate(logFor)}
            >
              Confirm session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
