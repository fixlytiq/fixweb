"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X, Check } from "lucide-react";
import { mockCustomers, mockStores, type TicketStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";

type InspectionStatus = "YES" | "NO" | "NA";

interface InspectionItem {
  label: string;
  preRepair: InspectionStatus;
  postRepair: InspectionStatus;
}

const inspectionItems: InspectionItem[] = [
  { label: "LCD Damage", preRepair: "NA", postRepair: "NA" },
  { label: "Frame / Back Glass Cracked / Bent", preRepair: "NA", postRepair: "NA" },
  { label: "Frame / Back Glass Scratched", preRepair: "NA", postRepair: "NA" },
  { label: "Front Facing Camera", preRepair: "NA", postRepair: "NA" },
  { label: "Rear Facing Camera", preRepair: "NA", postRepair: "NA" },
  { label: "Home button/Power button", preRepair: "NA", postRepair: "NA" },
  { label: "Fingerprint Scanner", preRepair: "NA", postRepair: "NA" },
  { label: "Face ID", preRepair: "NA", postRepair: "NA" },
  { label: "Charging Port", preRepair: "NA", postRepair: "NA" },
  { label: "Power / Volume / Vibration Buttons", preRepair: "NA", postRepair: "NA" },
  { label: "Ear Speaker / Sensor", preRepair: "NA", postRepair: "NA" },
  { label: "External Speaker", preRepair: "NA", postRepair: "NA" },
  { label: "Battery Needs Servicing", preRepair: "NA", postRepair: "NA" },
  { label: "Water / Liquid Damage", preRepair: "NA", postRepair: "NA" },
  { label: "Missing Screws/Plates", preRepair: "NA", postRepair: "NA" },
];

export default function NewTicketPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inspectionData, setInspectionData] = useState<InspectionItem[]>(inspectionItems);
  
  const [formData, setFormData] = useState({
    location: "",
    customerName: "",
    contactNumber: "",
    alternateNumber: "",
    date: new Date().toISOString().split("T")[0],
    deviceInfo: "",
    service: "",
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      console.log("Ticket created:", { formData, inspectionData });
      router.push("/tickets");
    }, 1000);
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
            <div className="flex items-center gap-2">
              <label htmlFor="location" className="text-sm font-medium text-foreground">
                LOCATION:
              </label>
              <select
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select Location</option>
                {mockStores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
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
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">
                Device is unable to be tested prior to repair
              </p>
              <div className="flex gap-4">
                {["YES", "NO", "NA"].map((option) => (
                  <label key={option} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="deviceUnableToTestPre"
                      value={option}
                      checked={formData.deviceUnableToTestPre === option}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">{option}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">
                Device is unable to be tested post to repair
              </p>
              <div className="flex gap-4">
                {["YES", "NO", "NA"].map((option) => (
                  <label key={option} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="deviceUnableToTestPost"
                      value={option}
                      checked={formData.deviceUnableToTestPost === option}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pre-Repair and Post-Repair Device Inspection */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Pre-Repair and Post-Repair Device Inspection
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="border-r border-border bg-muted/50 p-2 text-left text-xs font-semibold text-foreground">
                    Component / Condition
                  </th>
                  <th colSpan={3} className="border-r border-border bg-muted/50 p-2 text-center text-xs font-semibold text-foreground">
                    Pre-Repair Device Inspection
                  </th>
                  <th colSpan={3} className="bg-muted/50 p-2 text-center text-xs font-semibold text-foreground">
                    Post-Repair Device Inspection
                  </th>
                </tr>
                <tr className="border-b border-border bg-muted/30">
                  <th className="border-r border-border"></th>
                  <th className="border-r border-border p-2 text-center text-xs font-medium text-foreground">
                    Yes / Working
                  </th>
                  <th className="border-r border-border p-2 text-center text-xs font-medium text-foreground">
                    No / Not Working
                  </th>
                  <th className="border-r border-border p-2 text-center text-xs font-medium text-foreground">
                    N/A
                  </th>
                  <th className="border-r border-border p-2 text-center text-xs font-medium text-foreground">
                    Yes / Working
                  </th>
                  <th className="border-r border-border p-2 text-center text-xs font-medium text-foreground">
                    No / Not Working
                  </th>
                  <th className="p-2 text-center text-xs font-medium text-foreground">N/A</th>
                </tr>
              </thead>
              <tbody>
                {inspectionData.map((item, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/30">
                    <td className="border-r border-border p-2 text-sm font-medium text-foreground">
                      {item.label}
                    </td>
                    {/* Pre-Repair */}
                    <td className="border-r border-border p-2 text-center">
                      <input
                        type="radio"
                        name={`pre-${index}`}
                        checked={item.preRepair === "YES"}
                        onChange={() => handleInspectionChange(index, "preRepair", "YES")}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="border-r border-border p-2 text-center">
                      <input
                        type="radio"
                        name={`pre-${index}`}
                        checked={item.preRepair === "NO"}
                        onChange={() => handleInspectionChange(index, "preRepair", "NO")}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="border-r border-border p-2 text-center">
                      <input
                        type="radio"
                        name={`pre-${index}`}
                        checked={item.preRepair === "NA"}
                        onChange={() => handleInspectionChange(index, "preRepair", "NA")}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                    </td>
                    {/* Post-Repair */}
                    <td className="border-r border-border p-2 text-center">
                      <input
                        type="radio"
                        name={`post-${index}`}
                        checked={item.postRepair === "YES"}
                        onChange={() => handleInspectionChange(index, "postRepair", "YES")}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="border-r border-border p-2 text-center">
                      <input
                        type="radio"
                        name={`post-${index}`}
                        checked={item.postRepair === "NO"}
                        onChange={() => handleInspectionChange(index, "postRepair", "NO")}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="radio"
                        name={`post-${index}`}
                        checked={item.postRepair === "NA"}
                        onChange={() => handleInspectionChange(index, "postRepair", "NA")}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
                <strong>Customer Acknowledgment:</strong> All of the information here (including the Pre-Repair Inspection) 
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
            disabled={isSubmitting || !formData.customerName || !formData.contactNumber || !formData.waiverAcknowledged}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50",
              isSubmitting && "cursor-not-allowed"
            )}
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Creating..." : "Create Ticket & Waiver"}
          </button>
        </div>
      </form>
    </div>
  );
}
