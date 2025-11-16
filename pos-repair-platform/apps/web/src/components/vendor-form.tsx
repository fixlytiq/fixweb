"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Save, X, Building2, Mail, Phone, MapPin, FileText } from "lucide-react";

export interface VendorFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

interface VendorFormProps {
  initialData?: VendorFormData;
  onSubmit: (data: VendorFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function VendorForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: VendorFormProps) {
  const [formData, setFormData] = useState<VendorFormData>(
    initialData || {
      name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    }
  );

  const [errors, setErrors] = useState<Partial<Record<keyof VendorFormData, string>>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof VendorFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof VendorFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Vendor name is required";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        {/* Name */}
        <div>
          <label className="flex items-center gap-2 mb-2 text-sm font-medium text-foreground">
            <Building2 className="h-4 w-4" />
            Vendor Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={cn(
              "h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
              errors.name ? "border-destructive" : "border-border"
            )}
            placeholder="Enter vendor name"
            required
          />
          {errors.name && (
            <p className="mt-1 text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="flex items-center gap-2 mb-2 text-sm font-medium text-foreground">
            <Mail className="h-4 w-4" />
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={cn(
              "h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
              errors.email ? "border-destructive" : "border-border"
            )}
            placeholder="vendor@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="flex items-center gap-2 mb-2 text-sm font-medium text-foreground">
            <Phone className="h-4 w-4" />
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="(555) 123-4567"
          />
        </div>

        {/* Address */}
        <div>
          <label className="flex items-center gap-2 mb-2 text-sm font-medium text-foreground">
            <MapPin className="h-4 w-4" />
            Address
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="123 Main St, City, State 12345"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="flex items-center gap-2 mb-2 text-sm font-medium text-foreground">
            <FileText className="h-4 w-4" />
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            placeholder="Additional notes about this vendor..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="h-4 w-4" />
          {isLoading ? "Saving..." : "Save Vendor"}
        </button>
      </div>
    </form>
  );
}

