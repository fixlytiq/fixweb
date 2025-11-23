"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ticketsApi } from "@/lib/api/tickets";

type InspectionStatus = "GOOD" | "DAMAGED" | "NA";

interface InspectionItem {
  label: string;
  preRepair: InspectionStatus;
}

const inspectionItems: InspectionItem[] = [
  { label: "LCD", preRepair: "NA" },
  { label: "Frame / Back Glass", preRepair: "NA" },
  { label: "Front Facing Camera", preRepair: "NA" },
  { label: "Rear Facing Camera", preRepair: "NA" },
  { label: "Home button/Power button", preRepair: "NA" },
  { label: "Fingerprint Scanner", preRepair: "NA" },
  { label: "Face ID", preRepair: "NA" },
  { label: "Charging Port", preRepair: "NA" },
  { label: "Power / Volume / Vibration Buttons", preRepair: "NA" },
  { label: "Ear Speaker / Sensor", preRepair: "NA" },
  { label: "External Speaker", preRepair: "NA" },
  { label: "Battery", preRepair: "NA" },
  { label: "Water / Liquid Indicator", preRepair: "NA" },
  { label: "Screws/Plates", preRepair: "NA" },
];

interface PreRepairFormProps {
  ticketId: string;
  initialData?: InspectionItem[];
  readOnly?: boolean;
  onSuccess?: () => void;
}

export function PreRepairForm({ ticketId, initialData, readOnly = false, onSuccess }: PreRepairFormProps) {
  const [inspectionData, setInspectionData] = useState<InspectionItem[]>(
    initialData || inspectionItems
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInspectionChange = (
    index: number,
    value: InspectionStatus
  ) => {
    if (readOnly) return;
    
    setInspectionData((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, preRepair: value } : item
      )
    );
  };

  const getInspectionButtonClass = (status: InspectionStatus, currentStatus: InspectionStatus, isDisabled: boolean) => {
    if (isDisabled) {
      // When disabled, still show selected state
      if (status === currentStatus) {
        switch (status) {
          case "GOOD":
            return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 opacity-75";
          case "DAMAGED":
            return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 opacity-75";
          case "NA":
            return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 opacity-75";
        }
      }
      return "bg-background text-muted-foreground opacity-50";
    }
    
    if (status !== currentStatus) {
      return "bg-background text-muted-foreground hover:bg-accent";
    }
    
    switch (status) {
      case "GOOD":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-2 border-green-500";
      case "DAMAGED":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-2 border-red-500";
      case "NA":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-2 border-gray-500";
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Format inspection data as a note
      const inspectionLines = inspectionData.map(item => 
        `${item.label}: ${item.preRepair}`
      ).join('\n');

      const noteContent = `PRE-REPAIR DEVICE INSPECTION

${inspectionLines}`;

      await ticketsApi.addNote(ticketId, {
        body: noteContent,
        visibility: "INTERNAL",
      });

      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Error saving pre-repair form:", err);
      setError(err.message || "Failed to save pre-repair inspection");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Pre-Repair Device Inspection
        </h2>
        {!readOnly && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50",
              isSubmitting && "cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Save Inspection
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-900 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-900 dark:text-green-200">
              Pre-repair inspection saved successfully
            </p>
          </div>
        </div>
      )}

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
                <td className="border-r border-border p-2">
                  <button
                    type="button"
                    onClick={() => handleInspectionChange(index, "GOOD")}
                    disabled={readOnly}
                    className={cn(
                      "w-full rounded px-2 py-1.5 text-xs font-medium transition-colors",
                      getInspectionButtonClass("GOOD", item.preRepair, readOnly),
                      readOnly && "cursor-not-allowed"
                    )}
                  >
                    GOOD
                  </button>
                </td>
                <td className="border-r border-border p-2">
                  <button
                    type="button"
                    onClick={() => handleInspectionChange(index, "DAMAGED")}
                    disabled={readOnly}
                    className={cn(
                      "w-full rounded px-2 py-1.5 text-xs font-medium transition-colors",
                      getInspectionButtonClass("DAMAGED", item.preRepair, readOnly),
                      readOnly && "cursor-not-allowed"
                    )}
                  >
                    DAMAGED
                  </button>
                </td>
                <td className="p-2">
                  <button
                    type="button"
                    onClick={() => handleInspectionChange(index, "NA")}
                    disabled={readOnly}
                    className={cn(
                      "w-full rounded px-2 py-1.5 text-xs font-medium transition-colors",
                      getInspectionButtonClass("NA", item.preRepair, readOnly),
                      readOnly && "cursor-not-allowed"
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
  );
}

