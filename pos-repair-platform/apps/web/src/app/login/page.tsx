"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogIn, Mail, Lock, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [storeEmail, setStoreEmail] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await login(storeEmail, pin);
      // Navigation will happen automatically in the auth context
    } catch (err: any) {
      console.error("Login error:", err);
      
      // Provide more helpful error messages
      let errorMessage = "Failed to login. Please check your store email and PIN.";
      
      if (err.message?.includes("Unable to connect to the server")) {
        errorMessage = "Unable to connect to the backend server. Please ensure the backend is running on http://localhost:3000";
      } else if (err.message?.includes("Store not found")) {
        errorMessage = "Store not found. Please check your store email.";
      } else if (err.message?.includes("Invalid PIN")) {
        errorMessage = "Invalid PIN. Please try again.";
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
          <p className="mt-2 text-muted-foreground">Sign in to your store</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
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
                  value={storeEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setStoreEmail(e.target.value);
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="store@example.com"
                />
              </div>
            </div>

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
                  autoComplete="current-password"
                  required
                  minLength={4}
                  maxLength={8}
                  value={pin}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setPin(e.target.value);
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="••••"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                4-8 digit PIN
              </p>
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
              "Signing in..."
            ) : (
              <span className="flex items-center justify-center gap-2">
                <LogIn className="h-4 w-4" />
                Sign in
              </span>
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don't have a store?{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
