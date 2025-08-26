import { useState } from "react";
import UploadSection from "@/components/upload-section";
import DataPreview from "@/components/data-preview";
import ProfilingOptions from "@/components/profiling-options";
import ProcessingIndicator from "@/components/processing-indicator";
import ProfilingReport from "@/components/profiling-report";
import type { CsvUpload, ProfilingOptions as ProfilingOptionsType, ProfilingResult } from "@shared/schema";

type AppState = 'upload' | 'preview' | 'options' | 'processing' | 'report';

export default function Home() {
  const [currentState, setCurrentState] = useState<AppState>('upload');
  const [csvData, setCsvData] = useState<CsvUpload | null>(null);
  const [profilingOptions, setProfilingOptions] = useState<ProfilingOptionsType>({
    rowCount: true,
    dateRange: false,
    distinctValues: false,
    nullValues: true,
    duplicates: true,
    dataSize: true,
    columnCount: true,
    dateColumns: false,
    delimiter: true,
    uniqueKey: false,
    selectedColumns: [],
  });
  const [reportData, setReportData] = useState<ProfilingResult | null>(null);

  const handleFileUploaded = (data: CsvUpload) => {
    setCsvData(data);
    setCurrentState('preview');
    setTimeout(() => setCurrentState('options'), 1000);
  };

  const handleStartProfiling = (options: ProfilingOptionsType) => {
    setProfilingOptions(options);
    setCurrentState('processing');
  };

  const handleProfilingComplete = (result: ProfilingResult) => {
    setReportData(result);
    setCurrentState('report');
  };

  const handleStartOver = () => {
    setCsvData(null);
    setReportData(null);
    setCurrentState('upload');
  };

  return (
    <div className="min-h-screen bg-material-surface">
      {/* Header */}
      <header className="bg-white shadow-material-1 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-material-blue rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-medium text-gray-900">CSV Data Profiler</h1>
                <p className="text-sm text-gray-500">Professional Data Engineering Tool</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {currentState !== 'upload' && (
                <button
                  onClick={handleStartOver}
                  className="text-sm text-material-blue hover:text-material-blue-dark font-medium"
                  data-testid="button-start-over"
                >
                  Start Over
                </button>
              )}
              <span className="text-sm text-gray-500">No Authentication Required</span>
              <div className="w-8 h-8 bg-material-success rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentState === 'upload' && (
          <UploadSection onFileUploaded={handleFileUploaded} />
        )}
        
        {currentState === 'preview' && csvData && (
          <DataPreview csvData={csvData} />
        )}
        
        {currentState === 'options' && csvData && (
          <ProfilingOptions
            csvData={csvData}
            initialOptions={profilingOptions}
            onStartProfiling={handleStartProfiling}
          />
        )}
        
        {currentState === 'processing' && csvData && (
          <ProcessingIndicator
            csvData={csvData}
            options={profilingOptions}
            onComplete={handleProfilingComplete}
          />
        )}
        
        {currentState === 'report' && reportData && csvData && (
          <ProfilingReport
            reportData={reportData}
            csvData={csvData}
          />
        )}
      </main>
    </div>
  );
}
