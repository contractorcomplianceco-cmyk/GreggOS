import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import {
  useListExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  getListExpensesQueryKey,
} from "@workspace/api-client-react";
import type { Expense, ExpenseCategory, CurrentClient } from "@/lib/types";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Receipt } from "lucide-react";
import { LoadingState } from "@/components/layout/FishingSpinner";

const CATEGORIES: ExpenseCategory[] = [
  "Travel",
  "Client Visit",
  "Relationship",
  "Event",
  "Other",
];

const OWNERS = ["Gregg", "Landon", "Tara"];

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

interface FormState {
  category: ExpenseCategory;
  description: string;
  amount: string;
  clientId: string;
  spentOn: string;
  notes: string;
  owner: string;
}

const EMPTY_FORM: FormState = {
  category: "Travel",
  description: "",
  amount: "",
  clientId: "none",
  spentOn: "",
  notes: "",
  owner: "Gregg",
};

export default function Expenses() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { clients } = useStore();

  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const params = categoryFilter !== "All" ? { category: categoryFilter } : {};
  const { data, isLoading } = useListExpenses(params, {
    query: { queryKey: getListExpensesQueryKey(params) },
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: getListExpensesQueryKey() });
  const mOpts = { mutation: { onSuccess: invalidate } };
  const createM = useCreateExpense(mOpts);
  const updateM = useUpdateExpense(mOpts);
  const deleteM = useDeleteExpense(mOpts);

  const expenses = (data ?? []) as unknown as Expense[];

  const clientName = (id: string | null): string => {
    if (!id) return "—";
    const c = (clients as CurrentClient[]).find((x) => x.id === id);
    return c ? c.companyName || c.clientName : "Unknown";
  };

  const totals = useMemo(() => {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const byCategory: Record<string, number> = {};
    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    }
    const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    return { total, count: expenses.length, top };
  }, [expenses]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(exp: Expense) {
    setEditing(exp);
    setForm({
      category: exp.category,
      description: exp.description,
      amount: String(exp.amount),
      clientId: exp.clientId ?? "none",
      spentOn: exp.spentOn,
      notes: exp.notes,
      owner: exp.owner || "Gregg",
    });
    setDialogOpen(true);
  }

  async function save() {
    const amountNum = Number(form.amount);
    if (!form.amount.trim() || Number.isNaN(amountNum) || amountNum < 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    const payload = {
      category: form.category,
      description: form.description,
      amount: amountNum,
      clientId: form.clientId === "none" ? null : form.clientId,
      spentOn: form.spentOn,
      notes: form.notes,
      owner: form.owner,
    };
    try {
      if (editing) {
        await updateM.mutateAsync({
          expenseId: editing.id,
          data: payload as never,
        });
        toast({ title: "Expense updated" });
      } else {
        await createM.mutateAsync({ data: payload as never });
        toast({ title: "Expense logged" });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: "Could not save expense", variant: "destructive" });
    }
  }

  async function remove(exp: Expense) {
    try {
      await deleteM.mutateAsync({ expenseId: exp.id });
      toast({ title: "Expense deleted" });
    } catch {
      toast({ title: "Could not delete expense", variant: "destructive" });
    }
  }

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <PageHeader
          tag="Ship's Ledger"
          title="Expense Tracker"
          subtitle="Track travel, client-visit, relationship-building and event costs. This log organizes spend for review — it does not approve reimbursements or budgets."
          action={
            <Button onClick={openCreate} data-testid="button-add-expense">
              <Plus className="h-4 w-4 mr-1" /> Log expense
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard label="Total Logged" value={usd(totals.total)} accent="primary" />
          <StatCard label="Entries" value={totals.count} accent="accent" />
          <Card className="relative overflow-hidden shadow-sm">
            <div className="absolute inset-x-0 top-0 h-1 bg-border" />
            <CardContent className="p-6">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Top Category
              </p>
              <div className="mt-4 text-2xl font-semibold">
                {totals.top ? totals.top[0] : "—"}
              </div>
              {totals.top ? (
                <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                  {usd(totals.top[1])}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Category
          </Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48" data-testid="select-category-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <LoadingState message="Opening the ship’s ledger…" />
            ) : expenses.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                <Receipt className="h-6 w-6 mx-auto mb-3 opacity-50" />
                No expenses logged yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((exp) => (
                    <TableRow
                      key={exp.id}
                      className="cursor-pointer"
                      onClick={() => openEdit(exp)}
                      data-testid={`row-expense-${exp.id}`}
                    >
                      <TableCell className="tabular-nums text-muted-foreground">
                        {exp.spentOn || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{exp.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {exp.description || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {clientName(exp.clientId)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {exp.owner}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {usd(exp.amount)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(exp);
                          }}
                          data-testid={`button-delete-expense-${exp.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit expense" : "Log expense"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm({ ...form, category: v as ExpenseCategory })
                  }
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount (USD)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  data-testid="input-amount"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="What was this for?"
                data-testid="input-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Client</Label>
                <Select
                  value={form.clientId}
                  onValueChange={(v) => setForm({ ...form, clientId: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(clients as CurrentClient[]).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.companyName || c.clientName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Owner</Label>
                <Select
                  value={form.owner}
                  onValueChange={(v) => setForm({ ...form, owner: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OWNERS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.spentOn}
                onChange={(e) => setForm({ ...form, spentOn: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} data-testid="button-save-expense">
              {editing ? "Save changes" : "Log expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
