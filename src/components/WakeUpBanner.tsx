import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWakeUpStatus } from "@/hooks/useWakeUpStatus";
import { Loader2, Clock, Database } from "lucide-react";

export function WakeUpBanner() {
  const { isWakingUp, isUsingMockData, currentMessage, formattedCountdown } =
    useWakeUpStatus();

  if (!isWakingUp) {
    return null;
  }

  return (
    <Alert className="relative overflow-hidden border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50 mb-4 animate-in slide-in-from-top-2 fade-in-50 duration-300">
      <div className="flex items-start gap-3">
        <Loader2 className="h-4 w-4 mt-0.5 animate-spin text-amber-600" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="font-semibold text-amber-800 dark:text-amber-200">
                Backend server waking up
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded">
              {formattedCountdown}
            </div>
          </div>

          <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
            <div className="space-y-1">
              <p className="font-medium animate-pulse">{currentMessage}</p>

              {isUsingMockData && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-amber-100 dark:bg-amber-900/50 rounded border border-amber-200 dark:border-amber-800">
                  <Database className="h-3 w-3 text-amber-600" />
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    Showing sample data while server wakes up
                  </span>
                </div>
              )}

              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                The server will be ready in {formattedCountdown}. Page will
                refresh automatically when ready.
              </p>
            </div>
          </AlertDescription>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-200 dark:bg-amber-800">
        <div
          className="h-full bg-amber-500 dark:bg-amber-400 transition-all duration-100 ease-linear"
          style={{
            width: `${((parseInt(formattedCountdown.split(":")[0]) * 60 + parseInt(formattedCountdown.split(":")[1])) / 120) * 100}%`,
          }}
        />
      </div>
    </Alert>
  );
}
