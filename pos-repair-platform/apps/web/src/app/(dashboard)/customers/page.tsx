"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { customersApi, type Customer, type CreateCustomerDto } from "@/lib/api/customers";
import { Plus, Search, User, Edit, Trash2, Loader2, Mail, Phone, FileText, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CustomersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateCustomerDto>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (user && isAuthenticated) {
      fetchCustomers();
    }
  }, [user, isAuthenticated]);

  // Filter customers based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = customers.filter((customer) => {
      const firstName = customer.firstName?.toLowerCase() || "";
      const lastName = customer.lastName?.toLowerCase() || "";
      const email = customer.email?.toLowerCase() || "";
      const phone = customer.phone?.toLowerCase() || "";
      
      return (
        firstName.includes(query) ||
        lastName.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        `${firstName} ${lastName}`.trim().includes(query)
      );
    });
    setFilteredCustomers(filtered);
  }, [searchQuery, customers]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await customersApi.findAll();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (err: any) {
      console.error("Error fetching customers:", err);
      setError(err.message || "Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        email: customer.email || "",
        phone: customer.phone || "",
        notes: customer.notes || "",
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        notes: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      notes: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that at least one field is provided
    if (!formData.firstName && !formData.lastName && !formData.email && !formData.phone) {
      alert("Please provide at least one of: first name, last name, email, or phone number");
      return;
    }

    try {
      if (editingCustomer) {
        // Update existing customer
        const updated = await customersApi.update(editingCustomer.id, formData);
        setCustomers(customers.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        // Create new customer
        const newCustomer = await customersApi.create(formData);
        setCustomers([...customers, newCustomer]);
      }
      handleCloseModal();
      // Refresh the list to get updated counts
      fetchCustomers();
    } catch (err: any) {
      console.error("Error saving customer:", err);
      
      if (err.statusCode === 401) {
        alert("Your session has expired. Please log in again.");
        router.push('/login');
        return;
      }
      
      if (err.statusCode === 403) {
        alert("You do not have permission to perform this action.");
        return;
      }
      
      alert(err.message || "Failed to save customer");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(id);
      await customersApi.remove(id);
      setCustomers(customers.filter((c) => c.id !== id));
    } catch (err: any) {
      console.error("Error deleting customer:", err);
      
      if (err.statusCode === 401) {
        alert("Your session has expired. Please log in again.");
        router.push('/login');
        return;
      }
      
      if (err.statusCode === 403) {
        alert("You do not have permission to delete customers. Only Store Owners and Managers can delete customers.");
        return;
      }
      
      alert(err.message || "Failed to delete customer");
    } finally {
      setIsDeleting(null);
    }
  };

  const getCustomerName = (customer: Customer) => {
    const name = `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
    return name || customer.email || customer.phone || "Unnamed Customer";
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customer database</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search customers by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Customers List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? "No customers found matching your search" : "No customers yet. Add your first customer to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="p-6 bg-card rounded-lg border border-border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{getCustomerName(customer)}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {customer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(customer)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="Edit customer"
                  >
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </button>
                  {user && (user.role === 'OWNER' || user.role === 'MANAGER') && (
                    <button
                      onClick={() => handleDelete(customer.id)}
                      disabled={isDeleting === customer.id}
                      className="p-2 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      title="Delete customer"
                    >
                      {isDeleting === customer.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {customer.notes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm text-muted-foreground line-clamp-2">{customer.notes}</p>
                  </div>
                </div>
              )}

              {customer._count && (customer._count.Ticket > 0 || customer._count.Sale > 0) && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {customer._count.Ticket > 0 && (
                      <span>{customer._count.Ticket} ticket{customer._count.Ticket !== 1 ? 's' : ''}</span>
                    )}
                    {customer._count.Sale > 0 && (
                      <span>{customer._count.Sale} sale{customer._count.Sale !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card rounded-lg border border-border shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold">
                {editingCustomer ? "Edit Customer" : "Add Customer"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="john.doe@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                  placeholder="Additional notes about this customer..."
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {editingCustomer ? "Update Customer" : "Create Customer"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

