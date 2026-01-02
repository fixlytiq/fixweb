'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Receipt, AlertCircle } from 'lucide-react';
import type { Sale } from '@/lib/types';
import { toast } from 'sonner';
import { useRefunds, useAvailableSales, useCreateRefund } from '@/hooks/use-refunds';

export default function RefundsPage() {
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    saleId: '',
    amount: '',
    reason: '',
  });

  // React Query hooks
  const { data: refunds = [], isLoading } = useRefunds();
  const { data: sales = [], isLoading: loadingSales } = useAvailableSales();
  const createRefundMutation = useCreateRefund();

  // Find selected sale
  const selectedSale = useMemo(() => {
    return sales.find(s => s.id === formData.saleId) || null;
  }, [formData.saleId, sales]);

  // Pre-fill amount when sale is selected
  useEffect(() => {
    if (selectedSale && selectedSale.total) {
      setFormData(prev => ({ ...prev, amount: selectedSale.total!.toString() }));
    }
  }, [selectedSale]);

  const handleProcessRefund = () => {
    if (!formData.saleId || !formData.amount) {
      toast.error('Please select a sale and enter an amount');
      return;
    }

    const amount = Number(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Amount must be a positive number');
      return;
    }

    if (selectedSale && selectedSale.total && amount > selectedSale.total) {
      toast.error(`Amount cannot exceed sale total of $${selectedSale.total.toFixed(2)}`);
      return;
    }

    createRefundMutation.mutate(
      {
        saleId: formData.saleId,
        amount: amount,
        reason: formData.reason || undefined,
      },
      {
        onSuccess: () => {
          setProcessDialogOpen(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setFormData({
      saleId: '',
      amount: '',
      reason: '',
    });
  };

  const handleDialogOpenChange = (open: boolean) => {
    setProcessDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Refunds</h1>
          <p className="text-muted-foreground">
            Manage refunds and returns
          </p>
        </div>
        <Dialog open={processDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Process Refund
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Process Refund</DialogTitle>
              <DialogDescription>
                Select a sale and enter refund details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="sale">Sale *</Label>
                {loadingSales ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={formData.saleId}
                    onValueChange={(value) => setFormData({ ...formData, saleId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sale" />
                    </SelectTrigger>
                    <SelectContent>
                      {sales.length === 0 ? (
                        <SelectItem value="no-sales" disabled>
                          No available sales
                        </SelectItem>
                      ) : (
                        sales.map((sale) => (
                          <SelectItem key={sale.id} value={sale.id}>
                            Sale #{sale.id.slice(0, 8)} - ${sale.total != null ? Number(sale.total).toFixed(2) : '0.00'} - {new Date(sale.createdAt).toLocaleDateString()}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
                {selectedSale && (
                  <div className="mt-2 rounded-lg border bg-muted/50 p-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">Sale Total:</span>
                        <p className="font-medium">${selectedSale.total != null ? Number(selectedSale.total).toFixed(2) : '0.00'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date:</span>
                        <p className="font-medium">{new Date(selectedSale.createdAt).toLocaleDateString()}</p>
                      </div>
                      {selectedSale.customer && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Customer:</span>
                          <p className="font-medium">
                            {selectedSale.customer.firstName || ''} {selectedSale.customer.lastName || ''}
                            {selectedSale.customer.email && ` (${selectedSale.customer.email})`}
                          </p>
                        </div>
                      )}
                      {selectedSale.ticket && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Ticket:</span>
                          <p className="font-medium">{selectedSale.ticket.title}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Refund Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedSale?.total || undefined}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
                {selectedSale && selectedSale.total && (
                  <p className="text-xs text-muted-foreground">
                    Maximum refund: ${selectedSale.total.toFixed(2)}
                  </p>
                )}
                {formData.amount && selectedSale && selectedSale.total && Number(formData.amount) > selectedSale.total && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>Amount cannot exceed sale total</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Enter reason for refund"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Provide a reason for this refund
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleDialogOpenChange(false)}
                disabled={createRefundMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProcessRefund}
                disabled={
                  createRefundMutation.isPending ||
                  !formData.saleId ||
                  !formData.amount ||
                  (selectedSale && selectedSale.total && Number(formData.amount) > selectedSale.total) ||
                  Number(formData.amount) <= 0
                }
              >
                {createRefundMutation.isPending ? 'Processing...' : 'Process Refund'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : refunds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No refunds found</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Process refunds as needed
            </p>
            <Dialog open={processDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Process Refund
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Refunds</CardTitle>
            <CardDescription>
              {refunds.length} refund{refunds.length !== 1 ? 's' : ''} processed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {refunds.map((refund) => (
                <div
                  key={refund.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">
                      Refund #{refund.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Sale: {refund.saleId.slice(0, 8)} • {new Date(refund.refundedAt).toLocaleDateString()}
                    </p>
                    {refund.reason && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Reason: {refund.reason}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-destructive">
                      -${Number(refund.amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

