import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CsvUpload, ProfilingOptions, ProfilingResult } from "@shared/schema";

interface ProcessingIndicatorProps {
  csvData: CsvUpload;
  options: ProfilingOptions;
  onComplete: (result: ProfilingResult) => void;
}

const processingSteps = [
  { key: 'rowCount', label: 'Row count analysis' },
  { key: 'nullValues', label: 'Null value analysis' },
  { key: 'duplicates', label: 'Duplicate detection' },
  { key: 'dataSize', label: 'Data size calculation' },
  { key: 'columnCount', label: 'Column count analysis' },
  { key: 'dateColumns', label: 'Date column detection' },
  { key: 'dateRange', label: 'Date range analysis' },
  { key: 'distinctValues', label: 'Distinct values analysis' },
  { key: 'delimiter', label: 'Delimiter detection' },
  { key: 'uniqueKey', label: 'Unique key analysis' },
];

export default function ProcessingIndicator({ csvData, options, onComplete }: ProcessingIndicatorProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { toast } = useToast();

  const profilingMutation = useMutation({
    mutationFn: async ({ csvData, options }: { csvData: CsvUpload; options: ProfilingOptions }) => {
      const response = await apiRequest('POST', '/api/profile', {
        csvData,
        options,
      });
      return response.json();
    },
    onSuccess: (result: ProfilingResult) => {
      setCurrentStepIndex(enabledSteps.length);
      setTimeout(() => {
        onComplete(result);
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: "Processing Failed",
        description: error.message || "An error occurred while processing your data.",
        variant: "destructive",
      });
    },
  });

  const enabledSteps = processingSteps.filter(step => options[step.key as keyof ProfilingOptions]);

  useEffect(() => {
    if (enabledSteps.length === 0) return;

    // Start processing
    profilingMutation.mutate({ csvData, options });

    // Simulate progress through enabled steps
    const stepInterval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < enabledSteps.length - 1) {
          return prev + 1;
        }
        clearInterval(stepInterval);
        return prev;
      });
    }, 800);

    return () => clearInterval(stepInterval);
  }, [csvData, options, enabledSteps.length]);

  const getStepStatus = (index: number) => {
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'processing';
    return 'pending';
  };

  return (
    <section className="mb-8">
      <Card className="shadow-material-2">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 border-4 border-material-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Processing Your Data...</h3>
          <p className="text-gray-600 mb-6">Running selected profiling analyses on your CSV data</p>
          
          {/* Progress Steps */}
          <div className="space-y-2 max-w-md mx-auto">
            {enabledSteps.map((step, index) => {
              const status = getStepStatus(index);
              
              return (
                <div
                  key={step.key}
                  className="flex items-center justify-center space-x-3 text-sm"
                  data-testid={`step-${step.key}`}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    status === 'completed' 
                      ? 'bg-material-success' 
                      : status === 'processing'
                      ? 'border-2 border-material-blue animate-pulse'
                      : 'border-2 border-gray-300'
                  }`}>
                    {status === 'completed' && (
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className={
                    status === 'completed' 
                      ? 'text-gray-700' 
                      : status === 'processing'
                      ? 'text-material-blue font-medium'
                      : 'text-gray-500'
                  }>
                    {status === 'completed' && `${step.label} completed`}
                    {status === 'processing' && `Processing ${step.label}...`}
                    {status === 'pending' && `${step.label} pending`}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
