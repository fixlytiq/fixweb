"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ticketsApi } from "@/lib/api/tickets";

interface PostRepairFormProps {
  ticketId: string;
  onSuccess?: () => void;
}

export function PostRepairForm({ ticketId, onSuccess }: PostRepairFormProps) {
  const [formData, setFormData] = useState({
    deviceCondition: "",
    customerSatisfaction: "",
    warrantyPeriod: "",
    warrantyNotes: "",
    followUpRequired: false,
    followUpNotes: "",
    additionalNotes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Create a note with all post-repair information
      const noteContent = `POST-REPAIR FORM COMPLETED

Device Condition: ${formData.deviceCondition || "N/A"}
Customer Satisfaction: ${formData.customerSatisfaction || "N/A"}
Warranty Period: ${formData.warrantyPeriod || "N/A"}
${formData.warrantyNotes ? `Warranty Notes: ${formData.warrantyNotes}` : ""}
Follow-up Required: ${formData.followUpRequired ? "Yes" : "No"}
${formData.followUpNotes ? `Follow-up Notes: ${formData.followUpNotes}` : ""}
${formData.additionalNotes ? `Additional Notes: ${formData.additionalNotes}` : ""}`;

      const createdNote = await ticketsApi.addNote(ticketId, {
        body: noteContent,
        visibility: "INTERNAL",
      });

      console.log("Post-repair form note created:", createdNote);

      setSuccess(true);
      if (onSuccess) {
        console.log("Calling onSuccess callback to refresh notes");
        onSuccess();
      }

      // Reset form after a delay
      setTimeout(() => {
        setFormData({
          deviceCondition: "",
          customerSatisfaction: "",
          warrantyPeriod: "",
          warrantyNotes: "",
          followUpRequired: false,
          followUpNotes: "",
          additionalNotes: "",
        });
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Error submitting post-repair form:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response,
        status: err.status,
        statusCode: err.statusCode,
      });
      
      // Extract error message from response if available
      let errorMessage = "Failed to submit post-repair form";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-medium text-green-900 dark:text-green-200">
              Post-Repair Form Submitted Successfully
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              The information has been saved to the ticket notes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        Post-Repair Form
      </h2>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-900 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Device Condition and Customer Satisfaction */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="space-y-4">
            {/* Device Condition */}
            <div>
              <label
                htmlFor="deviceCondition"
                className="block text-sm font-medium text-foreground mb-1"
              >
                DEVICE CONDITION AFTER REPAIR:
              </label>
              <select
                id="deviceCondition"
                name="deviceCondition"
                value={formData.deviceCondition}
                onChange={handleChange}
                className="h-9 w-full rounded border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select condition...</option>
                <option value="Excellent">Excellent - Like new</option>
                <option value="Good">Good - Minor cosmetic wear</option>
                <option value="Fair">Fair - Some wear visible</option>
                <option value="Poor">Poor - Significant wear</option>
              </select>
            </div>

            {/* Customer Satisfaction */}
            <div>
              <label
                htmlFor="customerSatisfaction"
                className="block text-sm font-medium text-foreground mb-1"
              >
                CUSTOMER SATISFACTION:
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, customerSatisfaction: rating.toString() }))}
                    className={cn(
                      "flex-1 rounded border px-4 py-2 text-sm font-medium transition-colors",
                      formData.customerSatisfaction === rating.toString()
                        ? "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-600"
                        : "border-border bg-background text-foreground hover:bg-accent"
                    )}
                  >
                    {rating} {rating === 1 ? "Star" : "Stars"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Warranty Information */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Warranty Information</h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="warrantyPeriod"
                className="block text-sm font-medium text-foreground mb-1"
              >
                WARRANTY PERIOD:
              </label>
              <select
                id="warrantyPeriod"
                name="warrantyPeriod"
                value={formData.warrantyPeriod}
                onChange={handleChange}
                className="h-9 w-full rounded border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select warranty period...</option>
                <option value="30 days">30 days</option>
                <option value="60 days">60 days</option>
                <option value="90 days">90 days</option>
                <option value="6 months">6 months</option>
                <option value="1 year">1 year</option>
                <option value="No warranty">No warranty</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="warrantyNotes"
                className="block text-sm font-medium text-foreground mb-1"
              >
                WARRANTY NOTES:
              </label>
              <textarea
                id="warrantyNotes"
                name="warrantyNotes"
                value={formData.warrantyNotes}
                onChange={handleChange}
                rows={3}
                placeholder="Any specific warranty terms or conditions..."
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Follow-up */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Follow-up</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="followUpRequired"
                name="followUpRequired"
                checked={formData.followUpRequired}
                onChange={handleChange}
                className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring"
              />
              <label
                htmlFor="followUpRequired"
                className="text-sm font-medium text-foreground"
              >
                Follow-up required
              </label>
            </div>

            {formData.followUpRequired && (
              <div>
                <label
                  htmlFor="followUpNotes"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  FOLLOW-UP NOTES:
                </label>
                <textarea
                  id="followUpNotes"
                  name="followUpNotes"
                  value={formData.followUpNotes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="What follow-up is needed?"
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Additional Notes</h2>
          <div>
            <label
              htmlFor="additionalNotes"
              className="block text-sm font-medium text-foreground mb-1"
            >
              ADDITIONAL NOTES:
            </label>
            <textarea
              id="additionalNotes"
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleChange}
              rows={4}
              placeholder="Any additional information about the repair completion..."
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Customer Acknowledgment */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Customer Acknowledgment</h2>
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-foreground">
            <p className="leading-relaxed">
              <strong>Customer acknowledgement:</strong> I agree that I have received my device in working condition, after the repair performed on my device and no chargeback of any kind will be made on my behalf whatsoever, I have been explained clearly about the condition of my device. Also, if it was mentioned to me if my device was liquid damaged, backglass broken, cracked screen, frame bent/damaged, DOA and phone unavailable screen, IFIXANDREPAIR or their affiliates shall not be liable for any claims of any kind.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4 border-t border-border pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50",
              isSubmitting && "cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Submit Post-Repair Form
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

