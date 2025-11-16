"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { storesApi, type Store, type UpdateStoreDto } from "@/lib/api/stores";
import { employeesApi, type Employee, type CreateEmployeeDto } from "@/lib/api/employees";
import { User, Store as StoreIcon, Users, Bell, Shield, CreditCard, Plus, Edit, Trash2, X, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>("store");
  const [store, setStore] = useState<Store | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const [storesData, employeesData] = await Promise.all([
          storesApi.findAll().catch(() => []),
          employeesApi.findAll().catch(() => []),
        ]);

        // Users can only see their own store
        if (storesData.length > 0) {
          setStore(storesData[0]);
        }
        setEmployees(employeesData);
      } catch (err: any) {
        console.error("Error fetching settings data:", err);
        setError(err.message || "Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleUpdateStore = async (id: string, data: UpdateStoreDto) => {
    try {
      const updated = await storesApi.update(id, data);
      setStore(updated);
      setIsStoreModalOpen(false);
      setEditingStore(null);
    } catch (err: any) {
      console.error("Error updating store:", err);
      alert(err.message || "Failed to update store");
    }
  };

  const handleCreateEmployee = async (data: CreateEmployeeDto) => {
    try {
      const newEmployee = await employeesApi.create(data);
      setEmployees([...employees, newEmployee]);
      setIsEmployeeModalOpen(false);
    } catch (err: any) {
      console.error("Error creating employee:", err);
      alert(err.message || "Failed to create employee");
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee? This action cannot be undone.")) {
      return;
    }

    try {
      await employeesApi.remove(id);
      setEmployees(employees.filter((emp) => emp.id !== id));
    } catch (err: any) {
      console.error("Error deleting employee:", err);
      alert(err.message || "Failed to delete employee");
    }
  };

  const settingsSections = [
    {
      id: "store",
      title: "Store Settings",
      icon: StoreIcon,
      description: "Manage your store information",
    },
    {
      id: "employees",
      title: "Employees",
      icon: Users,
      description: "Manage store employees",
      requiresRole: ["OWNER", "MANAGER"],
    },
    {
      id: "profile",
      title: "Profile",
      icon: User,
      description: "Your account information",
    },
    {
      id: "notifications",
      title: "Notifications",
      icon: Bell,
      description: "Set up notification preferences",
    },
    {
      id: "security",
      title: "Security",
      icon: Shield,
      description: "Manage security settings",
    },
  ];

  const canManageEmployees = user && (user.role === "OWNER" || user.role === "MANAGER");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your store settings and preferences
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="font-medium text-red-900 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Settings Navigation */}
        <div className="lg:col-span-1 space-y-2">
          {settingsSections.map((section) => {
            // Hide sections that require specific roles
            if (section.requiresRole && !section.requiresRole.includes(user?.role || "")) {
              return null;
            }

            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full rounded-lg border p-4 text-left transition-all hover:shadow-md",
                  activeSection === section.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{section.title}</p>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeSection === "store" && (
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Store Information</h2>
                {user?.role === "OWNER" && store && (
                  <button
                    onClick={() => {
                      setEditingStore(store);
                      setIsStoreModalOpen(true);
                    }}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Store
                  </button>
                )}
              </div>
              {store ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground">Store Name</label>
                    <p className="mt-1 text-sm text-muted-foreground">{store.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">Store Email</label>
                    <p className="mt-1 text-sm text-muted-foreground">{store.storeEmail}</p>
                    <p className="mt-1 text-xs text-muted-foreground">This is used for login</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">Timezone</label>
                    <p className="mt-1 text-sm text-muted-foreground">{store.timezone}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No store information available</p>
              )}
            </div>
          )}

          {activeSection === "employees" && canManageEmployees && (
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Employees</h2>
                <button
                  onClick={() => {
                    setEditingEmployee(null);
                    setIsEmployeeModalOpen(true);
                  }}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Add Employee
                </button>
              </div>
              <div className="space-y-3">
                {employees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No employees found</p>
                ) : (
                  employees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4"
                    >
                      <div>
                        <p className="font-medium text-foreground">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">Role: {employee.role}</p>
                      </div>
                      {employee.role !== "OWNER" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeSection === "profile" && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">Role</label>
                  <p className="mt-1 text-sm text-muted-foreground">{user?.role || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Employee ID</label>
                  <p className="mt-1 text-sm text-muted-foreground font-mono">{user?.employeeId || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Store ID</label>
                  <p className="mt-1 text-sm text-muted-foreground font-mono">{user?.storeId || "N/A"}</p>
                </div>
              </div>
            </div>
          )}

          {(activeSection === "notifications" || activeSection === "security") && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                {settingsSections.find((s) => s.id === activeSection)?.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {settingsSections.find((s) => s.id === activeSection)?.description}
              </p>
              <p className="mt-4 text-sm text-muted-foreground">Coming soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* Store Modal */}
      {isStoreModalOpen && store && (
        <StoreModal
          store={editingStore}
          onSave={(data) => handleUpdateStore(store.id, data)}
          onClose={() => {
            setIsStoreModalOpen(false);
            setEditingStore(null);
          }}
        />
      )}

      {/* Employee Modal */}
      {isEmployeeModalOpen && (
        <EmployeeModal
          employee={editingEmployee}
          onSave={editingEmployee ? () => {} : handleCreateEmployee}
          onClose={() => {
            setIsEmployeeModalOpen(false);
            setEditingEmployee(null);
          }}
        />
      )}
    </div>
  );
}

// Store Modal Component
interface StoreModalProps {
  store: Store | null;
  onSave: (data: UpdateStoreDto) => void;
  onClose: () => void;
}

function StoreModal({ store, onSave, onClose }: StoreModalProps) {
  const [name, setName] = useState(store?.name || "");
  const [timezone, setTimezone] = useState(store?.timezone || "America/Chicago");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, timezone });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Edit Store</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="America/Chicago">America/Chicago (CST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="America/Denver">America/Denver (MST)</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Employee Modal Component
interface EmployeeModalProps {
  employee: Employee | null;
  onSave: (data: CreateEmployeeDto) => void;
  onClose: () => void;
}

function EmployeeModal({ employee, onSave, onClose }: EmployeeModalProps) {
  const [name, setName] = useState(employee?.name || "");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [role, setRole] = useState<CreateEmployeeDto["role"]>(employee?.role || "TECHNICIAN");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    if (pin.length < 4 || pin.length > 8) {
      setError("PIN must be between 4 and 8 characters");
      return;
    }

    onSave({ name, pin, role });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Add Employee</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              PIN <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={4}
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="4-8 characters"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Each employee must have a unique PIN
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Confirm PIN <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={4}
              maxLength={8}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="4-8 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as CreateEmployeeDto["role"])}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="TECHNICIAN">Technician</option>
              <option value="MANAGER">Manager</option>
              <option value="CASHIER">Cashier</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Note: OWNER role cannot be assigned to new employees
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Create Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
