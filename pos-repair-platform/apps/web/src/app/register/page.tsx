"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserPlus, Mail, Lock, User, Store, AlertCircle, Phone } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    ownerName: "",
    storeName: "",
    storeEmail: "",
    storePhone: "",
    notificationEmail: "",
    pin: "",
  });
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    // E.164 format: + followed by 1-15 digits
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters except +
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, add it
    if (cleaned && !cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'storePhone') {
      const formatted = formatPhoneNumber(value);
      setFormData((prev) => ({
        ...prev,
        [name]: formatted,
      }));
      
      // Validate phone number
      if (formatted && !validatePhoneNumber(formatted)) {
        setPhoneError('Phone number must be in E.164 format (e.g., +1234567890)');
      } else {
        setPhoneError(null);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
    if (formData.pin !== confirmPin) {
      setError("PINs do not match");
      setIsLoading(false);
      return;
    }

    if (formData.pin.length < 4 || formData.pin.length > 8) {
      setError("PIN must be between 4 and 8 characters");
      setIsLoading(false);
      return;
    }

    // Validate phone number if provided
    if (formData.storePhone && !validatePhoneNumber(formData.storePhone)) {
      setError("Phone number must be in E.164 format (e.g., +1234567890)");
      setIsLoading(false);
      return;
    }

    try {
      await register({
        ownerName: formData.ownerName,
        storeName: formData.storeName,
        storeEmail: formData.storeEmail,
        storePhone: formData.storePhone || undefined,
        notificationEmail: formData.notificationEmail || undefined,
        pin: formData.pin,
      });
      // Navigation will happen automatically in the auth context
    } catch (err: any) {
      console.error("Registration error:", err);

      // Provide more helpful error messages
      let errorMessage = "Failed to register. Please try again.";

      if (err.message?.includes("Unable to connect to the server")) {
        errorMessage =
          "Unable to connect to the backend server. Please ensure the backend is running on http://localhost:3000";
      } else if (err.message?.includes("already in use") || err.message?.includes("email")) {
        errorMessage = "Store email is already in use. Please use a different email.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <span className="text-2xl font-bold">F</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">Fixlytiq</h1>
          <p className="mt-2 text-muted-foreground">Create your store</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            {/* Owner Name */}
            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-foreground">
                Owner Name
              </label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="ownerName"
                  name="ownerName"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.ownerName}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Store Name */}
            <div>
              <label htmlFor="storeName" className="block text-sm font-medium text-foreground">
                Store Name
              </label>
              <div className="relative mt-1">
                <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="storeName"
                  name="storeName"
                  type="text"
                  required
                  value={formData.storeName}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="My Repair Shop"
                />
              </div>
            </div>

            {/* Store Email */}
            <div>
              <label htmlFor="storeEmail" className="block text-sm font-medium text-foreground">
                Store Email
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="storeEmail"
                  name="storeEmail"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.storeEmail}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="store@example.com"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                This will be used to log in to your store
              </p>
            </div>

            {/* Store Phone */}
            <div>
              <label htmlFor="storePhone" className="block text-sm font-medium text-foreground">
                Store Phone Number <span className="text-muted-foreground">(Optional)</span>
              </label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="storePhone"
                  name="storePhone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.storePhone}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={cn(
                    "h-10 w-full rounded-lg border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
                    phoneError 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-border"
                  )}
                  placeholder="+1234567890"
                />
              </div>
              {phoneError ? (
                <p className="mt-1 text-xs text-red-500">{phoneError}</p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  Used to send SMS notifications to customers (E.164 format: +1234567890)
                </p>
              )}
            </div>

            {/* Notification Email */}
            <div>
              <label htmlFor="notificationEmail" className="block text-sm font-medium text-foreground">
                Notification Email <span className="text-muted-foreground">(Optional)</span>
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="notificationEmail"
                  name="notificationEmail"
                  type="email"
                  autoComplete="email"
                  value={formData.notificationEmail}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="notifications@example.com"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Used as sender email for customer notifications (defaults to store email)
              </p>
            </div>

            {/* PIN */}
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-foreground">
                PIN
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="pin"
                  name="pin"
                  type="password"
                  required
                  minLength={4}
                  maxLength={8}
                  value={formData.pin}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="••••"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Must be 4-8 characters
              </p>
            </div>

            {/* Confirm PIN */}
            <div>
              <label htmlFor="confirmPin" className="block text-sm font-medium text-foreground">
                Confirm PIN
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="confirmPin"
                  name="confirmPin"
                  type="password"
                  required
                  minLength={4}
                  maxLength={8}
                  value={confirmPin}
                  onChange={(e) => {
                    setConfirmPin(e.target.value);
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50",
              isLoading && "cursor-not-allowed"
            )}
          >
            {isLoading ? (
              "Creating store..."
            ) : (
              <span className="flex items-center justify-center gap-2">
                <UserPlus className="h-4 w-4" />
                Create store
              </span>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have a store?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
