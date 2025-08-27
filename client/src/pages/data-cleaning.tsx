import { useState } from "react";
import UploadSection from "@/components/upload-section";
import DataCleaning from "@/components/data-cleaning";
import { Link } from "wouter";
import type { CsvUpload } from "@shared/schema";

export default function DataCleaningPage() {
  const [csvData, setCsvData] = useState<CsvUpload | null>(null);

  const handleFileUploaded = (data: CsvUpload) => {
    setCsvData(data);
  };

  const handleStartOver = () => {
    setCsvData(null);
  };

  return (
    <div className="min-h-screen bg-material-surface">
      {/* SEO Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "CSV Data Cleaning - Transform Your Data",
          "description": "Clean and transform your CSV data with powerful tools including text manipulation, date formatting, and data coalescing",
          "url": "https://csv-data-profiler.replit.app/cleaning",
          "mainEntity": {
            "@type": "SoftwareApplication",
            "name": "CSV Data Cleaning Tool",
            "applicationCategory": "Data Cleaning Tool",
            "description": "Professional data cleaning and transformation tool for CSV files"
          }
        })
      }} />
      
      {/* Header */}
      <header className="bg-white shadow-material-1 sticky top-0 z-50" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-material-blue rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-medium text-gray-900">Data Cleaning -Beta</h1>
                <p className="text-sm text-gray-500">Transform and clean your CSV data</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <a className="text-sm text-material-blue hover:text-material-blue-dark font-medium" data-testid="link-profiler">
                  Data Profiler
                </a>
              </Link>
              {csvData && (
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
        {!csvData ? (
          <UploadSection onFileUploaded={handleFileUploaded} />
        ) : (
          <DataCleaning csvData={csvData} />
        )}
      </main>
    </div>
  );
}