import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CsvUpload, ProfilingOptions as ProfilingOptionsType } from "@shared/schema";

interface ProfilingOptionsProps {
  csvData: CsvUpload;
  initialOptions: ProfilingOptionsType;
  onStartProfiling: (options: ProfilingOptionsType) => void;
}

const profilingOptionDefinitions = [
  {
    key: 'rowCount' as keyof ProfilingOptionsType,
    icon: '📊',
    title: 'Row Count',
    description: 'Count total number of records in the CSV',
  },
  {
    key: 'dateRange' as keyof ProfilingOptionsType,
    icon: '📅',
    title: 'Date Range Analysis',
    description: 'Find min/max dates in date columns',
  },
  {
    key: 'distinctValues' as keyof ProfilingOptionsType,
    icon: '🔍',
    title: 'Distinct Values',
    description: 'Show unique values for selected columns',
  },
  {
    key: 'nullValues' as keyof ProfilingOptionsType,
    icon: '⚠️',
    title: 'Null Value Analysis',
    description: 'Count null values per column',
  },
  {
    key: 'duplicates' as keyof ProfilingOptionsType,
    icon: '📋',
    title: 'Duplicate Detection',
    description: 'Identify true duplicate rows',
  },
  {
    key: 'dataSize' as keyof ProfilingOptionsType,
    icon: '💾',
    title: 'Data Size Analysis',
    description: 'Calculate total size of the dataset',
  },
  {
    key: 'columnCount' as keyof ProfilingOptionsType,
    icon: '📏',
    title: 'Column Count',
    description: 'Total number of columns in dataset',
  },
  {
    key: 'dateColumns' as keyof ProfilingOptionsType,
    icon: '📆',
    title: 'Date Column Detection',
    description: 'Identify and list date columns',
  },
  {
    key: 'delimiter' as keyof ProfilingOptionsType,
    icon: '│',
    title: 'Delimiter Detection',
    description: 'Detect CSV delimiter character',
  },
  {
    key: 'uniqueKey' as keyof ProfilingOptionsType,
    icon: '🔑',
    title: 'Unique Key Detection',
    description: 'Find potential unique key columns',
  },
];

export default function ProfilingOptions({ csvData, initialOptions, onStartProfiling }: ProfilingOptionsProps) {
  const [options, setOptions] = useState<ProfilingOptionsType>(initialOptions);

  const handleOptionChange = (key: keyof ProfilingOptionsType, checked: boolean) => {
    setOptions(prev => ({
      ...prev,
      [key]: checked,
    }));
  };

  const handleColumnSelectionChange = (column: string, checked: boolean) => {
    setOptions(prev => ({
      ...prev,
      selectedColumns: checked
        ? [...prev.selectedColumns, column]
        : prev.selectedColumns.filter(col => col !== column),
    }));
  };

  const handleStartProfiling = () => {
    onStartProfiling(options);
  };

  const hasSelectedOptions = Object.entries(options).some(([key, value]) => 
    key !== 'selectedColumns' && value === true
  );

  return (
    <section className="mb-8">
      <Card className="shadow-material-2">
        <CardHeader>
          <CardTitle className="text-xl font-medium text-gray-900 flex items-center">
            <svg className="w-5 h-5 text-material-blue mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
            Select Data Profiling Options
          </CardTitle>
          <p className="text-gray-600 mt-1">Choose which data quality checks and profiling analyses to perform</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {profilingOptionDefinitions.map((option) => (
              <div
                key={option.key}
                className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                  options[option.key]       ? 'border-gray-400 bg-gray-100' 
      : 'border-gray-200 hover:border-material-blue'
                }`}
                onClick={() => handleOptionChange(option.key, !options[option.key])}
                data-testid={`option-${option.key}`}
              >
                <Label className="flex items-start space-x-3 cursor-pointer">
                  <Checkbox
                    checked={options[option.key] as boolean}
                    onCheckedChange={(checked) => handleOptionChange(option.key, checked as boolean)}
                    className="mt-1 data-[state=checked]:bg-material-blue data-[state=checked]:border-material-blue"
                    data-testid={`checkbox-${option.key}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{option.icon}</span>
                      <h4 className="font-medium text-gray-900">{option.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                </Label>
              </div>
            ))}
          </div>

          {/* Column Selection for Distinct Values */}
          {options.distinctValues && (
            <Card className="bg-gray-50 mb-6">
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Column-Specific Analysis</h4>
                <p className="text-sm text-gray-600 mb-4">Select columns for distinct values analysis</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {csvData.headers.map((column) => (
                    <Label key={column} className="flex items-center space-x-2 text-sm">
                      <Checkbox
                        checked={options.selectedColumns.includes(column)}
                        onCheckedChange={(checked) => handleColumnSelectionChange(column, checked as boolean)}
                        className="text-xs data-[state=checked]:bg-material-blue data-[state=checked]:border-material-blue"
                        data-testid={`checkbox-column-${column}`}
                      />
                      <span className="text-gray-700">{column}</span>
                    </Label>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Process Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleStartProfiling}
              disabled={!hasSelectedOptions}
              className="bg-material-blue hover:bg-material-blue-dark shadow-material-1 hover:shadow-material-2"
              data-testid="button-start-profiling"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Start Data Profiling Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
