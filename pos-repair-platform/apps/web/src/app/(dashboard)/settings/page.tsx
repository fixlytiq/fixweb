import { User, Building2, Bell, Shield, CreditCard } from "lucide-react";

export default function SettingsPage() {
  const settingsSections = [
    {
      title: "Profile",
      icon: User,
      description: "Manage your personal information and preferences",
    },
    {
      title: "Organization",
      icon: Building2,
      description: "Configure organization and store settings",
    },
    {
      title: "Notifications",
      icon: Bell,
      description: "Set up email and SMS notification preferences",
    },
    {
      title: "Security",
      icon: Shield,
      description: "Manage passwords, 2FA, and security settings",
    },
    {
      title: "Billing",
      icon: CreditCard,
      description: "View invoices and manage payment methods",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              className="group rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg cursor-pointer"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{section.title}</h3>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </div>
          );
        })}
      </div>

      {/* Current User Info */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Account Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Email</label>
            <p className="mt-1 text-sm text-muted-foreground">owner@fixlytiq.com</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Name</label>
            <p className="mt-1 text-sm text-muted-foreground">Admin User</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Role</label>
            <p className="mt-1 text-sm text-muted-foreground">Owner</p>
          </div>
        </div>
      </div>
    </div>
  );
}

