"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, AlertCircle, X } from "lucide-react";
import { ticketsApi, type TicketStatus, type CreateTicketDto } from "@/lib/api/tickets";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

type InspectionStatus = "GOOD" | "DAMAGED" | "NA";

interface InspectionItem {
  label: string;
  preRepair: InspectionStatus;
  postRepair: InspectionStatus;
}

const inspectionItems: InspectionItem[] = [
  { label: "LCD", preRepair: "NA", postRepair: "NA" },
  { label: "Frame / Back Glass", preRepair: "NA", postRepair: "NA" },
  { label: "Front Facing Camera", preRepair: "NA", postRepair: "NA" },
  { label: "Rear Facing Camera", preRepair: "NA", postRepair: "NA" },
  { label: "Home button/Power button", preRepair: "NA", postRepair: "NA" },
  { label: "Fingerprint Scanner", preRepair: "NA", postRepair: "NA" },
  { label: "Face ID", preRepair: "NA", postRepair: "NA" },
  { label: "Charging Port", preRepair: "NA", postRepair: "NA" },
  { label: "Power / Volume / Vibration Buttons", preRepair: "NA", postRepair: "NA" },
  { label: "Ear Speaker / Sensor", preRepair: "NA", postRepair: "NA" },
  { label: "External Speaker", preRepair: "NA", postRepair: "NA" },
  { label: "Battery", preRepair: "NA", postRepair: "NA" },
  { label: "Water / Liquid Indicator", preRepair: "NA", postRepair: "NA" },
  { label: "Screws/Plates", preRepair: "NA", postRepair: "NA" },
];

export default function NewTicketPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inspectionData, setInspectionData] = useState<InspectionItem[]>(inspectionItems);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.warn('NewTicketPage: User not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);
  
  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Don't render form if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }
  
  const [formData, setFormData] = useState({
    customerName: "",
    contactNumber: "",
    alternateNumber: "",
    date: new Date().toISOString().split("T")[0],
    deviceInfo: "",
    service: "",
    description: "", // Added description field
    imeiSerialNo: "",
    passcode: "",
    price: "",
    receiptNo: "",
    balanceDue: "",
    modeOfPayment: "",
    specialOrderDueDate: "",
    deviceUnableToTestPre: "",
    deviceUnableToTestPost: "",
    whereToFindDevice: "",
    waiverAcknowledged: false,
    status: "RECEIVED" as TicketStatus,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.waiverAcknowledged) {
      alert("Please acknowledge the liability waiver to continue");
      return;
    }

    setIsSubmitting(true);

    try {
      // Build the ticket title from device info and service
      const title = formData.deviceInfo && formData.service
        ? `${formData.deviceInfo} - ${formData.service}`
        : formData.deviceInfo || formData.service || "New Repair Ticket";

      // Build description from form data
      const descriptionParts: string[] = [];
      if (formData.deviceInfo) descriptionParts.push(`Device: ${formData.deviceInfo}`);
      if (formData.service) descriptionParts.push(`Service: ${formData.service}`);
      if (formData.imeiSerialNo) descriptionParts.push(`IMEI/Serial: ${formData.imeiSerialNo}`);
      if (formData.customerName) descriptionParts.push(`Customer: ${formData.customerName}`);
      if (formData.contactNumber) descriptionParts.push(`Contact: ${formData.contactNumber}`);
      if (formData.description) descriptionParts.push(`\n${formData.description}`);
      
      const description = descriptionParts.join("\n");

      // Create ticket DTO
      const createTicketDto: CreateTicketDto = {
        title,
        description: description || undefined,
        status: formData.status as TicketStatus,
        estimatedCost: formData.price ? parseFloat(formData.price) : undefined,
      };

      // Verify we have authentication before creating ticket
      if (!isAuthenticated || !user) {
        alert("You must be logged in to create a ticket. Redirecting to login...");
        router.push('/login');
        return;
      }

      // Debug: Log token status before making request
      if (process.env.NODE_ENV === 'development') {
        const token = localStorage.getItem('auth_token');
        console.log('Creating ticket with auth:', {
          isAuthenticated,
          hasUser: !!user,
          hasToken: !!token,
          tokenLength: token?.length,
        });
      }

      // Create the ticket
      const ticket = await ticketsApi.create(createTicketDto);
      
      // TODO: Save inspection data and waiver to ticket (when backend supports it)
      // For now, we'll just create the ticket with basic info
      
      // Redirect to the ticket detail page
      router.push(`/tickets/${ticket.id}`);
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      
      // Handle unauthorized error - redirect to login
      if (error.statusCode === 401 || error.message === "Unauthorized") {
        alert("Your session has expired. Please log in again.");
        router.push('/login');
        return;
      }
      
      alert(error.message || "Failed to create ticket. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleInspectionChange = (
    index: number,
    type: "preRepair" | "postRepair",
    value: InspectionStatus
  ) => {
    setInspectionData((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [type]: value } : item
      )
    );
  };

  const getInspectionButtonClass = (status: InspectionStatus, currentStatus: InspectionStatus) => {
    if (status !== currentStatus) {
      return "bg-background text-muted-foreground hover:bg-accent";
    }
    
    switch (status) {
      case "GOOD":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "DAMAGED":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      case "NA":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const calculateTax = (amount: number) => amount * 0.08;
  const price = parseFloat(formData.price || "0");
  const tax = calculateTax(price);
  const total = price + tax;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/tickets"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Customer Device Information Sheet
              </h1>
              <p className="mt-1 text-muted-foreground">And Liability Waiver</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="status" className="text-sm font-medium text-foreground">
                  STATUS:
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="RECEIVED">Received</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="AWAITING_PARTS">Awaiting Parts</option>
                  <option value="READY">Ready</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer and Device Information - Two Column Layout */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-foreground mb-1">
                  CUSTOMER NAME:
                </label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  required
                  value={formData.customerName}
                  onChange={handleChange}
                  className="h-9 w-full rounded border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="contactNumber" className="block text-sm font-medium text-foreground mb-1">
                  CONTACT NUMBER:
                </label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  required
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="h-9 w-full rounded border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="deviceInfo" className="block text-sm font-medium text-foreground mb-1">
                  DEVICE INFO.:
                </label>
                <input
                  type="text"
                  id="deviceInfo"
                  name="deviceInfo"
                  value={formData.deviceInfo}
                  onChange={handleChange}
                  placeholder="e.g., iPhone 14 Pro Max"
                  className="h-9 w-full rounded border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="service" className="block text-sm font-medium text-foreground mb-1">
                  SERVICE:
                </label>
                <input
                  type="text"
                  id="service"
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  placeholder="e.g., Screen Repair"
                  className="h-9 w-full rounded border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="imeiSerialNo" className="block text-sm font-medium text-foreground mb-1">
                  IMEI / SR. NO.:
                </label>
                <input
                  type="text"
                  id="imeiSerialNo"
                  name="imeiSerialNo"
                  value={formData.imeiSerialNo}
                  onChange={handleChange}
                  className="h-9 w-full rounded border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="modeOfPayment" className="block text-sm font-medium text-foreground mb-1">
                  MODE OF PAYMENT:
                </label>
                <select
                  id="modeOfPayment"
                  name="modeOfPayment"
                  value={formData.modeOfPayment}
                  onChange={handleChange}
                  className="h-9 w-full rounded border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select Payment Method</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="CREDIT">Credit</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="specialOrderDueDate" className="block text-sm font-medium text-foreground mb-1">
                  SPECIAL ORDER DUE DATE:
                </label>
                <input
                  type="date"
                  id="specialOrderDueDate"
                  name="specialOrderDueDate"
                  value={formData.specialOrderDueDate}
                  onChange={handleChange}
                  className="h-9 w-full rounded border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-foreground mb-1">
                  DATE:
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  className="h-9 w-full rounded border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="alternateNumber" className="block text-sm font-medium text-foreground mb-1">
                  ALTERNATE NUMBER:
                </label>
                <input
                  type="tel"
                  id="alternateNumber"
                  name="alternateNumber"
                  value={formData.alternateNumber}
                  onChange={handleChange}
                  className="h-9 w-full rounded border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="passcode" className="block text-sm font-medium text-foreground mb-1">
                  PASSCODE:
                </label>
                <input
                  type="text"
                  id="passcode"
                  name="passcode"
                  value={formData.passcode}
                  onChange={handleChange}
                  className="h-9 w-full rounded border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-foreground mb-1">
                  PRICE:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    id="price"
                    name="price"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    className="h-9 flex-1 rounded border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-xs text-muted-foreground">(Plus Tax)</span>
                </div>
              </div>

              <div>
                <label htmlFor="receiptNo" className="block text-sm font-medium text-foreground mb-1">
                  RECEIPT NO.:
                </label>
                <input
                  type="text"
                  id="receiptNo"
                  name="receiptNo"
                  value={formData.receiptNo}
                  onChange={handleChange}
                  className="h-9 w-full rounded border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="balanceDue" className="block text-sm font-medium text-foreground mb-1">
                  BALANCE DUE:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    id="balanceDue"
                    name="balanceDue"
                    step="0.01"
                    min="0"
                    value={formData.balanceDue}
                    onChange={handleChange}
                    className="h-9 flex-1 rounded border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-xs text-muted-foreground">(Plus Tax)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warranty and Special Conditions */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Warranty & Special Conditions</h2>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Aftermarket part:</span>
              <span className="text-muted-foreground">(3 day warranty on ghost touch)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">PREMIUM PART:</span>
              <span className="text-muted-foreground">(30 days manufacturing warranty)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Dead on Arrival / Liquid Damage / Disabled / Backglass:</span>
              <span className="font-semibold text-destructive">NO WARRANTY</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Reservice Diagnostics:</span>
              <span className="font-semibold text-destructive">NO WARRANTY</span>
            </div>
            <div className="col-span-2">
              <span className="font-medium text-foreground">(No refunds on special orders)</span>
            </div>
          </div>
        </div>

        {/* Device Testing Status */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Device Testing Status</h2>
          <div className={formData.status === "COMPLETED" ? "grid gap-6 md:grid-cols-2" : ""}>
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">
                Device is able to be tested prior to repair
              </p>
              <div className="flex gap-2">
                {["YES", "NO", "NA"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, deviceUnableToTestPre: option }))}
                    className={cn(
                      "flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                      formData.deviceUnableToTestPre === option
                        ? option === "YES"
                          ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-600"
                          : option === "NO"
                          ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-600"
                          : "border-gray-500 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
                        : "border-border bg-background text-foreground hover:bg-accent"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            {formData.status === "COMPLETED" && (
              <div>
                <p className="mb-3 text-sm font-medium text-foreground">
                  Device is able to be tested post to repair
                </p>
                <div className="flex gap-2">
                  {["YES", "NO", "NA"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, deviceUnableToTestPost: option }))}
                      className={cn(
                        "flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                        formData.deviceUnableToTestPost === option
                          ? option === "YES"
                            ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-600"
                            : option === "NO"
                            ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-600"
                            : "border-gray-500 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
                          : "border-border bg-background text-foreground hover:bg-accent"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pre-Repair Device Inspection */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Pre-Repair Device Inspection
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="border-r border-border bg-muted/50 p-2 text-left text-xs font-semibold text-foreground">
                    Component
                  </th>
                  <th colSpan={3} className="bg-muted/50 p-2 text-center text-xs font-semibold text-foreground">
                    Pre-Repair Device Inspection
                  </th>
                </tr>
                <tr className="border-b border-border bg-muted/30">
                  <th className="border-r border-border"></th>
                  <th className="border-r border-border p-2 text-center text-xs font-medium text-foreground">
                    GOOD
                  </th>
                  <th className="border-r border-border p-2 text-center text-xs font-medium text-foreground">
                    DAMAGED
                  </th>
                  <th className="p-2 text-center text-xs font-medium text-foreground">
                    N/A
                  </th>
                </tr>
              </thead>
              <tbody>
                {inspectionData.map((item, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/30">
                    <td className="border-r border-border p-2 text-sm font-medium text-foreground">
                      {item.label}
                    </td>
                    {/* Pre-Repair */}
                    <td className="border-r border-border p-2">
                      <button
                        type="button"
                        onClick={() => handleInspectionChange(index, "preRepair", "GOOD")}
                        className={cn(
                          "w-full rounded px-2 py-1.5 text-xs font-medium transition-colors",
                          getInspectionButtonClass("GOOD", item.preRepair)
                        )}
                      >
                        GOOD
                      </button>
                    </td>
                    <td className="border-r border-border p-2">
                      <button
                        type="button"
                        onClick={() => handleInspectionChange(index, "preRepair", "DAMAGED")}
                        className={cn(
                          "w-full rounded px-2 py-1.5 text-xs font-medium transition-colors",
                          getInspectionButtonClass("DAMAGED", item.preRepair)
                        )}
                      >
                        DAMAGED
                      </button>
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => handleInspectionChange(index, "preRepair", "NA")}
                        className={cn(
                          "w-full rounded px-2 py-1.5 text-xs font-medium transition-colors",
                          getInspectionButtonClass("NA", item.preRepair)
                        )}
                      >
                        N/A
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Post-Repair Device Inspection - Only shown when status is COMPLETED */}
        {formData.status === "COMPLETED" && (
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Post-Repair Device Inspection
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="border-r border-border bg-muted/50 p-2 text-left text-xs font-semibold text-foreground">
                      Component
                    </th>
                    <th colSpan={3} className="bg-muted/50 p-2 text-center text-xs font-semibold text-foreground">
                      Post-Repair Device Inspection
                    </th>
                  </tr>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="border-r border-border"></th>
                    <th className="border-r border-border p-2 text-center text-xs font-medium text-foreground">
                      GOOD
                    </th>
                    <th className="border-r border-border p-2 text-center text-xs font-medium text-foreground">
                      DAMAGED
                    </th>
                    <th className="p-2 text-center text-xs font-medium text-foreground">
                      N/A
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inspectionData.map((item, index) => (
                    <tr key={index} className="border-b border-border hover:bg-muted/30">
                      <td className="border-r border-border p-2 text-sm font-medium text-foreground">
                        {item.label}
                      </td>
                      {/* Post-Repair */}
                      <td className="border-r border-border p-2">
                        <button
                          type="button"
                          onClick={() => handleInspectionChange(index, "postRepair", "GOOD")}
                          className={cn(
                            "w-full rounded px-2 py-1.5 text-xs font-medium transition-colors",
                            getInspectionButtonClass("GOOD", item.postRepair)
                          )}
                        >
                          GOOD
                        </button>
                      </td>
                      <td className="border-r border-border p-2">
                        <button
                          type="button"
                          onClick={() => handleInspectionChange(index, "postRepair", "DAMAGED")}
                          className={cn(
                            "w-full rounded px-2 py-1.5 text-xs font-medium transition-colors",
                            getInspectionButtonClass("DAMAGED", item.postRepair)
                          )}
                        >
                          DAMAGED
                        </button>
                      </td>
                      <td className="p-2">
                        <button
                          type="button"
                          onClick={() => handleInspectionChange(index, "postRepair", "NA")}
                          className={cn(
                            "w-full rounded px-2 py-1.5 text-xs font-medium transition-colors",
                            getInspectionButtonClass("NA", item.postRepair)
                          )}
                        >
                          N/A
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Liability Waiver Section */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Liability Waiver</h2>
          
          <div className="mb-4">
            <label htmlFor="whereToFindDevice" className="block text-sm font-medium text-foreground mb-2">
              Where can I find the device:
            </label>
            <input
              type="text"
              id="whereToFindDevice"
              name="whereToFindDevice"
              value={formData.whereToFindDevice}
              onChange={handleChange}
              className="h-9 w-full rounded border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="mb-4 space-y-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <p className="text-foreground">
              <strong>Initial: ______</strong> I certify that I am the owner of the device described in this document. 
              In the event that I am found not to be the true owner of this device, I assume all liability for any 
              claim made as a result of the repair services rendered by Fixlytiq.
            </p>
            <p className="text-foreground">
              Fixlytiq does not assume any liability or warranty in the event that the manufacturer warranties are voided. 
              Fixlytiq offers no verbal or written warranty, either expressed or implied, regarding the success of this technical support.
            </p>
            <p className="text-foreground">
              I authorize Fixlytiq affiliates to perform repairs, acknowledge Fixlytiq is not an authorized service dealer, 
              and that parts may not be original. I am responsible for backing up my device, and Fixlytiq is not responsible 
              for data loss, hardware, or software failure.
            </p>
            <p className="text-foreground">
              I agree to release, indemnify, and hold Fixlytiq and its affiliates harmless from any claims or damages arising 
              from repair work and agree not to take legal action.
            </p>
            <p className="text-foreground">
              <strong>Service Fees:</strong> I agree to pay a non-refundable device service fee regardless of service performed, 
              including for DOA, water damage, or large devices. No refunds for services including deposits for parts or special orders.
            </p>
            <p className="text-foreground">
              <strong>Premium Screens:</strong> Premium screens have a 30 days manufacturing warranty with a valid receipt. 
              Fixlytiq gives no guarantee/warranty for DOA, water-damaged, motherboard/manufacturing, or software issues.
            </p>
          </div>

          <div className="mb-4">
            <p className="mb-2 text-sm text-muted-foreground">
              (Signature and initials below must be of a Parent or Guardian if the customer is under the age of 18)
            </p>
            <p className="text-sm text-muted-foreground">
              Please be advised that this device is being repaired by an independently owned and operated store.
            </p>
          </div>

          <div className="mb-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="waiverAcknowledged"
                checked={formData.waiverAcknowledged}
                onChange={handleChange}
                required
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">
                <strong>Customer Acknowledgment (Pre-Repair):</strong> All of the information here (including the Pre-Repair Inspection) 
                is 100% correct to the best of my knowledge. By checking this box, I acknowledge that I have read and 
                agree to the above Terms and Conditions.
              </span>
            </label>
          </div>
        </div>

        {/* Pricing Summary */}
        {formData.price && (
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Pricing Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium text-foreground">${price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (8%):</span>
                <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 border-t border-border pt-6">
          <Link
            href="/tickets"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent"
          >
            <X className="h-4 w-4" />
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !formData.waiverAcknowledged || (!formData.deviceInfo && !formData.service)}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50",
              isSubmitting && "cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create Ticket & Waiver
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
