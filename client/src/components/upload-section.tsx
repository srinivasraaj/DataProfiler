import { useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import type { CsvUpload } from "@shared/schema";

interface UploadSectionProps {
  onFileUploaded: (data: CsvUpload) => void;
}

export default function UploadSection({ onFileUploaded }: UploadSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const processFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      toast({
        title: "File Too Large",
        description: "File size must be under 100MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast({
            title: "CSV Parse Error",
            description: "Failed to parse CSV file. Please check the format.",
            variant: "destructive",
          });
          setIsUploading(false);
          return;
        }

        const csvData: CsvUpload = {
          filename: file.name,
          data: results.data as any[],
          headers: results.meta.fields || [],
        };

        toast({
          title: "File Uploaded Successfully",
          description: `Loaded ${csvData.data.length} rows with ${csvData.headers.length} columns.`,
        });

        onFileUploaded(csvData);
        setIsUploading(false);
      },
      error: (error) => {
        toast({
          title: "Upload Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsUploading(false);
      },
    });
  }, [onFileUploaded, toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  return (
    <section className="mb-8">
      <Card className="shadow-material-2">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-material-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-material-blue" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-medium text-gray-900 mb-2">Upload CSV File for Analysis</h2>
            <p className="text-gray-600 mb-8">Upload your CSV file to start comprehensive data profiling and analysis</p>
            
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-12 transition-colors cursor-pointer ${
                isDragOver 
                  ? 'border-material-blue bg-material-blue bg-opacity-5' 
                  : 'border-gray-300 hover:border-material-blue'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              data-testid="drop-zone"
            >
              <input
                type="file"
                id="csvFile"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
                data-testid="input-file"
              />
              <label htmlFor="csvFile" className="cursor-pointer">
                <svg className="w-16 h-16 text-gray-400 mb-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {isUploading ? 'Processing...' : 'Drop your CSV file here or click to browse'}
                </p>
                <p className="text-sm text-gray-500">Supports CSV files up to 100MB</p>
              </label>
            </div>
            
            {/* Upload Button */}
            <Button
              className="mt-6 bg-material-blue hover:bg-material-blue-dark shadow-material-1 hover:shadow-material-2"
              onClick={() => document.getElementById('csvFile')?.click()}
              disabled={isUploading}
              data-testid="button-upload"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              {isUploading ? 'Processing CSV...' : 'Upload & Process CSV'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
