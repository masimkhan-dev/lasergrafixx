import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Printer, Wallet, Ban, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Receipt } from "@/components/admin/Receipt";
import { InvoiceA4 } from "@/components/admin/InvoiceA4";
import { supabase } from "@/integrations/supabase/client";
import { dateTime, pkr, PAYMENT_METHODS, type PaymentMethod } from "@/lib/format";
import { printSheet, type PrintMode } from "@/lib/print";
import { fetchSaleDetail, settingsQuery, statusTone } from "@/lib/pos";
import { useStaff } from "@/hooks/useAuth";

export function SaleDetailDialog({
  saleId,
  onOpenChange,
}: {
  saleId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { isAdmin } = useStaff();
  const [addingPayment, setAddingPayment] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [confirmVoid, setConfirmVoid] = useState(false);
  const [printMode, setPrintMode] = useState<PrintMode>("thermal");

  const detailQuery = useQuery({
    queryKey: ["sale", saleId],
    enabled: !!saleId,
    queryFn: () => {
      if (!saleId) throw new Error("Sale ID is required");
      return fetchSaleDetail(saleId);
    },
  });
  const settings = useQuery(settingsQuery);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["sale", saleId] });
    queryClient.invalidateQueries({ queryKey: ["sales"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
  };

  const payMutation = useMutation({
    mutationFn: async () => {
      if (!saleId) throw new Error("Sale ID is required");
      const value = Number(amount);
      if (!value || value <= 0) throw new Error("Enter a valid amount");
      const { error } = await supabase.rpc("add_payment_to_sale", {
        p_sale_id: saleId,
        p_amount: value,
        p_method: method,
        ...(notes ? { p_notes: notes } : {}),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      setAddingPayment(false);
      setAmount("");
      setNotes("");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const voidMutation = useMutation({
    mutationFn: async () => {
      if (!saleId) throw new Error("Sale ID is required");
      const { error } = await supabase.rpc("void_sale", { p_sale_id: saleId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sale voided");
      setConfirmVoid(false);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const detail = detailQuery.data;
  const canPay =
    detail && detail.sale.payment_status !== "voided" && Number(detail.sale.remaining_amount) > 0;

  const phoneDigits = (detail?.sale.customers?.phone ?? "").replace(/\D/g, "");
  const whatsappHref =
    detail && phoneDigits.length === 11
      ? `https://wa.me/92${phoneDigits.slice(1)}?text=${encodeURIComponent(
          `${settings.data?.["clinic_name"] ?? "Laser Grafix"}\nInvoice ${detail.sale.sale_number}\nTotal: ${pkr(detail.sale.total)}\nPaid: ${pkr(detail.sale.paid_amount)}\nRemaining: ${pkr(detail.sale.remaining_amount)}\n\nThank you for visiting.`,
        )}`
      : null;

  return (
    <Dialog open={!!saleId} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-sans">
            {detail ? `Sale ${detail.sale.sale_number}` : "Sale"}
          </DialogTitle>
          <DialogDescription>
            {detail ? dateTime(detail.sale.created_at) : "Loading sale…"}
          </DialogDescription>
        </DialogHeader>

        {detail && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-pos-border bg-pos-bg p-4">
              <div>
                <p className="font-semibold">{detail.sale.customers?.name ?? "Walk-in"}</p>
                <p className="text-sm text-pos-text-muted">{detail.sale.customers?.phone ?? "—"}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusTone(detail.sale.payment_status)}`}
              >
                {detail.sale.payment_status}
              </span>
            </div>

            <div className="space-y-2">
              {detail.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.service_name} <span className="text-pos-text-muted">× {item.quantity}</span>
                  </span>
                  <span className="tabular">{pkr(item.total)}</span>
                </div>
              ))}
              <div className="mt-3 space-y-1 border-t border-pos-border pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-pos-text-muted">Subtotal</span>
                  <span className="tabular">{pkr(detail.sale.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-pos-text-muted">Discount</span>
                  <span className="tabular">{pkr(detail.sale.discount)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="tabular">{pkr(detail.sale.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-pos-text-muted">Paid</span>
                  <span className="tabular text-success">{pkr(detail.sale.paid_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-pos-text-muted">Remaining</span>
                  <span className="tabular">{pkr(detail.sale.remaining_amount)}</span>
                </div>
              </div>
            </div>

            {detail.payments.length > 0 && (
              <div>
                <p className="text-sm font-semibold">Payment history</p>
                <ul className="mt-2 space-y-1 text-sm text-pos-text-muted">
                  {detail.payments.map((p) => (
                    <li key={p.id} className="flex justify-between">
                      <span>
                        {dateTime(p.paid_at)} · {p.payment_method}
                      </span>
                      <span className="tabular text-pos-text">{pkr(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detail.sale.notes && (
              <p className="rounded-lg bg-pos-bg p-3 text-sm text-pos-text-muted">
                {detail.sale.notes}
              </p>
            )}

            {addingPayment && (
              <div className="space-y-3 rounded-lg border border-pos-border p-4">
                <div className="space-y-2">
                  <Label htmlFor="pay-amount">Amount</Label>
                  <Input
                    id="pay-amount"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={String(Math.round(Number(detail.sale.remaining_amount)))}
                  />
                </div>
                <div className="flex gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <Button
                      key={m}
                      type="button"
                      variant={method === m ? "default" : "outline"}
                      className={method === m ? "bg-primary hover:bg-primary-hover" : ""}
                      onClick={() => setMethod(m)}
                    >
                      {m}
                    </Button>
                  ))}
                </div>
                <Textarea
                  rows={2}
                  placeholder="Notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <Button
                  className="w-full bg-success text-success-foreground hover:bg-success/90"
                  disabled={payMutation.isPending}
                  onClick={() => payMutation.mutate()}
                >
                  Record payment
                </Button>
              </div>
            )}

            {settings.data && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-pos-border bg-pos-bg p-1">
                  {(["thermal", "a4"] as const).map((m) => (
                    <Button
                      key={m}
                      type="button"
                      variant="ghost"
                      onClick={() => setPrintMode(m)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                        printMode === m
                          ? "bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground"
                          : "text-pos-text-muted hover:text-pos-text"
                      }`}
                    >
                      {m === "thermal" ? "80mm Receipt" : "A4 Invoice"}
                    </Button>
                  ))}
                </div>
                <div className="flex justify-center overflow-x-auto rounded-lg border border-pos-border bg-pos-bg p-5">
                  {printMode === "thermal" ? (
                    <div className="w-[80mm] rounded-sm bg-white px-3 py-4 shadow-lg ring-1 ring-black/5">
                      <Receipt detail={detail} settings={settings.data} />
                    </div>
                  ) : (
                    <div className="print-scale w-[190mm] shrink-0 rounded-sm bg-white shadow-lg ring-1 ring-black/5">
                      <InvoiceA4 detail={detail} settings={settings.data} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {canPay && (
              <Button variant="outline" onClick={() => setAddingPayment((v) => !v)}>
                <Wallet className="mr-2 h-4 w-4" /> Add payment
              </Button>
            )}
            {isAdmin && detail && detail.sale.payment_status !== "voided" && (
              <Button variant="outline" className="text-destructive" onClick={() => setConfirmVoid(true)}>
                <Ban className="mr-2 h-4 w-4" /> Void
              </Button>
            )}
            {whatsappHref && (
              <Button variant="outline" asChild>
                <a href={whatsappHref} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                </a>
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
              onClick={() => printSheet(printMode)}
            >
              <Printer className="mr-2 h-4 w-4" />
              {printMode === "thermal" ? "Print receipt" : "Print / Save A4 invoice"}
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogFooter>

        <AlertDialog open={confirmVoid} onOpenChange={setConfirmVoid}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Void this sale?</AlertDialogTitle>
              <AlertDialogDescription>
                The sale stays in history but is marked voided. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground"
                onClick={() => voidMutation.mutate()}
              >
                Void sale
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
