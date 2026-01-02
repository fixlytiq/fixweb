'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Users, Edit, Trash2, Search, Mail, Phone, FileText } from 'lucide-react';
import type { Customer } from '@/lib/types';
import { toast } from 'sonner';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '@/hooks/use-customers';
import { useDebounce } from '@/hooks/use-debounce';
import { CustomerForm } from '@/components/forms/customer-form';
import type { CustomerFormData } from '@/lib/validations/customer';

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  // Debounce search term for better performance
  const debouncedSearch = useDebounce(searchTerm, 300);

  // React Query hooks
  const { data: customers = [], isLoading, error } = useCustomers(debouncedSearch || undefined, 100);
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const handleCreate = (data: CustomerFormData) => {
    createMutation.mutate({
      firstName: data.firstName || undefined,
      lastName: data.lastName || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      notes: data.notes || undefined,
    }, {
      onSuccess: () => {
        setCreateOpen(false);
      },
    });
  };

  const handleEdit = (data: CustomerFormData) => {
    if (!editCustomer) return;

    updateMutation.mutate({
      id: editCustomer.id,
      data: {
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        notes: data.notes || undefined,
      },
    }, {
      onSuccess: () => {
        setEditCustomer(null);
      },
    });
  };

  const handleDelete = async () => {
    if (!deleteCustomer) return;
    deleteMutation.mutate(deleteCustomer.id, {
      onSuccess: () => {
        setDeleteCustomer(null);
      },
    });
  };

  const openEditDialog = (customer: Customer) => {
    setEditCustomer(customer);
  };

  const getCustomerName = (customer: Customer) => {
    if (customer.firstName || customer.lastName) {
      return `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
    }
    return customer.email || customer.phone || 'Unknown Customer';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer database
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Customer</DialogTitle>
              <DialogDescription>
                Create a new customer record
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <CustomerForm
                onSubmit={handleCreate}
                onCancel={() => setCreateOpen(false)}
                isLoading={createMutation.isPending}
                submitLabel="Create Customer"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            Search and manage your customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'No customers found matching your search' : 'No customers found'}
              </p>
              {!searchTerm && (
                <Button
                  className="mt-4"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Customer
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{getCustomerName(customer)}</h3>
                      {customer._count && (
                        <div className="flex gap-2">
                          {customer._count.Ticket !== undefined && customer._count.Ticket > 0 && (
                            <Badge variant="secondary">
                              {customer._count.Ticket} Ticket{customer._count.Ticket !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          {customer._count.Sale !== undefined && customer._count.Sale > 0 && (
                            <Badge variant="secondary">
                              {customer._count.Sale} Sale{customer._count.Sale !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {customer.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      )}
                      {customer.notes && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {customer.notes.length > 50 ? `${customer.notes.substring(0, 50)}...` : customer.notes}
                        </div>
                      )}
                    </div>
                    {customer.createdAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Added {new Date(customer.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(customer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteCustomer(customer)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editCustomer} onOpenChange={(open) => !open && setEditCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {editCustomer && (
              <CustomerForm
                defaultValues={{
                  firstName: editCustomer.firstName || '',
                  lastName: editCustomer.lastName || '',
                  email: editCustomer.email || '',
                  phone: editCustomer.phone || '',
                  notes: editCustomer.notes || '',
                }}
                onSubmit={handleEdit}
                onCancel={() => setEditCustomer(null)}
                isLoading={updateMutation.isPending}
                submitLabel="Update Customer"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteCustomer} onOpenChange={(open) => !open && setDeleteCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteCustomer ? getCustomerName(deleteCustomer) : 'this customer'}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCustomer(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

