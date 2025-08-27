import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CsvUpload, TransformationRule, DataCleaningResult } from "@shared/schema";
import { nanoid } from "nanoid";

interface DataCleaningProps {
  csvData: CsvUpload;
}

const transformationTypes = [
  { value: 'date_format', label: 'Date Format', icon: '📅' },
  { value: 'timestamp_format', label: 'Timestamp Format', icon: '🕐' },
  { value: 'number_format', label: 'Number Format', icon: '🔢' },
  { value: 'remove_duplicates', label: 'Remove Duplicates', icon: '🗑️' },
  { value: 'subset_column', label: 'Subset Column', icon: '✂️' },
  { value: 'replace_nulls', label: 'Replace NULLs', icon: '🔄' },
  { value: 'coalesce', label: 'Coalesce', icon: '🔗' },
  { value: 'text_manipulation', label: 'Text Manipulation', icon: '✏️' },
];

const dateFormats = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-01-15)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (15/01/2024)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (01/15/2024)' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (15-01-2024)' },
];

const timestampFormats = [
  { value: 'YYYY-MM-DD HH:mm:ss', label: 'YYYY-MM-DD HH:mm:ss (2024-01-15 14:30:45)' },
  { value: 'DD/MM/YYYY HH:mm:ss', label: 'DD/MM/YYYY HH:mm:ss (15/01/2024 14:30:45)' },
  { value: 'MM/DD/YYYY HH:mm:ss', label: 'MM/DD/YYYY HH:mm:ss (01/15/2024 14:30:45)' },
  { value: 'YYYY-MM-DD HH:mm', label: 'YYYY-MM-DD HH:mm (2024-01-15 14:30)' },
  { value: 'unix', label: 'Unix Timestamp (1705332645)' },
  { value: 'iso', label: 'ISO 8601 (2024-01-15T14:30:45.000Z)' },
];

const numberOperations = [
  { value: 'integer', label: 'Convert to Integer' },
  { value: 'ceiling', label: 'Round Up (Ceiling)' },
  { value: 'floor', label: 'Round Down (Floor)' },
  { value: 'decimal', label: 'Set Decimal Places' },
];

const textOperations = [
  { value: 'add', label: 'Add Text' },
  { value: 'remove', label: 'Remove Text' },
  { value: 'replace', label: 'Replace Text' },
];

export default function DataCleaning({ csvData }: DataCleaningProps) {
  const [transformationRules, setTransformationRules] = useState<TransformationRule[]>([]);
  const [cleaningResult, setCleaningResult] = useState<DataCleaningResult | null>(null);
  const [outputDelimiter, setOutputDelimiter] = useState(',');
  const [showPreview, setShowPreview] = useState(true);
  const { toast } = useToast();

  const cleaningMutation = useMutation({
    mutationFn: async ({ csvData, transformationRules, outputDelimiter }: {
      csvData: CsvUpload;
      transformationRules: TransformationRule[];
      outputDelimiter: string;
    }) => {
      const response = await apiRequest('POST', '/api/clean', {
        csvData,
        transformationRules,
        outputDelimiter,
      });
      return response.json();
    },
    onSuccess: (result: DataCleaningResult) => {
      setCleaningResult(result);
      setShowPreview(false);
      toast({
        title: "Data Cleaning Complete",
        description: `Applied ${result.appliedTransformations.length} transformations. ${result.rowsRemoved} rows removed.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Cleaning Failed",
        description: error.message || "An error occurred while cleaning your data.",
        variant: "destructive",
      });
    },
  });

  const addTransformationRule = () => {
    const newRule: TransformationRule = {
      id: nanoid(),
      column: csvData.headers[0],
      type: 'date_format',
      parameters: {},
    };
    setTransformationRules([...transformationRules, newRule]);
  };

  const updateRule = (id: string, updates: Partial<TransformationRule>) => {
    setTransformationRules(rules =>
      rules.map(rule => rule.id === id ? { ...rule, ...updates } : rule)
    );
  };

  const updateRuleParameter = (id: string, key: string, value: any) => {
    setTransformationRules(rules =>
      rules.map(rule => 
        rule.id === id 
          ? { ...rule, parameters: { ...rule.parameters, [key]: value } }
          : rule
      )
    );
  };

  const removeRule = (id: string) => {
    setTransformationRules(rules => rules.filter(rule => rule.id !== id));
  };

  const applyCleaning = () => {
    cleaningMutation.mutate({ csvData, transformationRules, outputDelimiter });
  };

  const downloadCleanedData = () => {
    if (!cleaningResult) return;

    const headers = cleaningResult.headers;
    const rows = cleaningResult.cleanedData.map(row => 
      headers.map(header => row[header] || '')
    );

    const csvContent = [
      headers.join(outputDelimiter),
      ...rows.map(row => row.join(outputDelimiter))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${csvData.filename.replace('.csv', '')}_cleaned.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetCleaning = () => {
    setCleaningResult(null);
    setShowPreview(true);
  };

  const renderRuleParameters = (rule: TransformationRule) => {
    switch (rule.type) {
      case 'date_format':
        return (
          <Select 
            value={rule.parameters.targetFormat || 'YYYY-MM-DD'}
            onValueChange={(value) => updateRuleParameter(rule.id, 'targetFormat', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select date format" />
            </SelectTrigger>
            <SelectContent>
              {dateFormats.map(format => (
                <SelectItem key={format.value} value={format.value}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'timestamp_format':
        return (
          <Select 
            value={rule.parameters.targetFormat || 'YYYY-MM-DD HH:mm:ss'}
            onValueChange={(value) => updateRuleParameter(rule.id, 'targetFormat', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timestamp format" />
            </SelectTrigger>
            <SelectContent>
              {timestampFormats.map(format => (
                <SelectItem key={format.value} value={format.value}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'number_format':
        return (
          <div className="space-y-2">
            <Select 
              value={rule.parameters.operation || 'integer'}
              onValueChange={(value) => updateRuleParameter(rule.id, 'operation', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                {numberOperations.map(op => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {rule.parameters.operation === 'decimal' && (
              <Input
                type="number"
                placeholder="Decimal places"
                value={rule.parameters.decimalPlaces || ''}
                onChange={(e) => updateRuleParameter(rule.id, 'decimalPlaces', parseInt(e.target.value))}
                data-testid={`input-decimal-places-${rule.id}`}
              />
            )}
          </div>
        );

      case 'subset_column':
        return (
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="Start index"
              value={rule.parameters.startIndex || ''}
              onChange={(e) => updateRuleParameter(rule.id, 'startIndex', parseInt(e.target.value))}
              data-testid={`input-start-index-${rule.id}`}
            />
            <Input
              type="number"
              placeholder="Length (optional)"
              value={rule.parameters.length || ''}
              onChange={(e) => updateRuleParameter(rule.id, 'length', parseInt(e.target.value))}
              data-testid={`input-length-${rule.id}`}
            />
          </div>
        );

      case 'replace_nulls':
        return (
          <Input
            placeholder="Replacement value"
            value={rule.parameters.replacementValue || ''}
            onChange={(e) => updateRuleParameter(rule.id, 'replacementValue', e.target.value)}
            data-testid={`input-replacement-${rule.id}`}
          />
        );

      case 'coalesce':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Fallback columns (select multiple):</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto mt-2">
                {csvData.headers.filter(h => h !== rule.column).map(header => (
                  <Label key={header} className="flex items-center space-x-2 text-xs">
                    <input
                      type="checkbox"
                      checked={(rule.parameters.fallbackColumns || []).includes(header)}
                      onChange={(e) => {
                        const current = rule.parameters.fallbackColumns || [];
                        const updated = e.target.checked 
                          ? [...current, header]
                          : current.filter((h: string) => h !== header);
                        updateRuleParameter(rule.id, 'fallbackColumns', updated);
                      }}
                      data-testid={`checkbox-fallback-${rule.id}-${header}`}
                    />
                    <span>{header}</span>
                  </Label>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm">Default value (if no fallback has data):</Label>
              <Input
                placeholder="Enter default value (e.g., 0, N/A, NULL)"
                value={rule.parameters.defaultValue || ''}
                onChange={(e) => updateRuleParameter(rule.id, 'defaultValue', e.target.value)}
                data-testid={`input-default-value-${rule.id}`}
              />
            </div>
          </div>
        );

      case 'text_manipulation':
        return (
          <div className="space-y-2">
            <Select 
              value={rule.parameters.operation || 'add'}
              onValueChange={(value) => updateRuleParameter(rule.id, 'operation', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                {textOperations.map(op => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {rule.parameters.operation === 'add' && (
              <div className="space-y-2">
                <Input
                  placeholder="Text to add"
                  value={rule.parameters.text || ''}
                  onChange={(e) => updateRuleParameter(rule.id, 'text', e.target.value)}
                  data-testid={`input-add-text-${rule.id}`}
                />
                <Select 
                  value={rule.parameters.position || 'end'}
                  onValueChange={(value) => updateRuleParameter(rule.id, 'position', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start">Add at start</SelectItem>
                    <SelectItem value="end">Add at end</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {rule.parameters.operation === 'remove' && (
              <Input
                placeholder="Text to remove"
                value={rule.parameters.text || ''}
                onChange={(e) => updateRuleParameter(rule.id, 'text', e.target.value)}
                data-testid={`input-remove-text-${rule.id}`}
              />
            )}

            {rule.parameters.operation === 'replace' && (
              <div className="space-y-2">
                <Input
                  placeholder="Text to find"
                  value={rule.parameters.searchText || ''}
                  onChange={(e) => updateRuleParameter(rule.id, 'searchText', e.target.value)}
                  data-testid={`input-search-text-${rule.id}`}
                />
                <Input
                  placeholder="Replace with"
                  value={rule.parameters.text || ''}
                  onChange={(e) => updateRuleParameter(rule.id, 'text', e.target.value)}
                  data-testid={`input-replace-text-${rule.id}`}
                />
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const previewRows = showPreview ? csvData.data.slice(0, 50) : (cleaningResult?.cleanedData.slice(0, 50) || []);
  const currentHeaders = showPreview ? csvData.headers : (cleaningResult?.headers || []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-material-2">
        <CardHeader>
          <CardTitle className="text-xl font-medium text-gray-900 flex items-center">
            <svg className="w-5 h-5 text-material-blue mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
            </svg>
            Data Cleaning & Transformation
          </CardTitle>
          <p className="text-gray-600">Transform and clean your CSV data with powerful data manipulation tools</p>
        </CardHeader>
      </Card>

      {/* Transformation Rules */}
      {!cleaningResult && (
        <Card className="shadow-material-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-medium text-gray-900">Transformation Rules</CardTitle>
                <p className="text-gray-600 text-sm">Add and configure data transformation rules</p>
              </div>
              <Button
                onClick={addTransformationRule}
                className="bg-material-blue hover:bg-material-blue-dark"
                data-testid="button-add-rule"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Rule
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {transformationRules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No transformation rules added yet. Click "Add Rule" to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {transformationRules.map((rule, index) => (
                  <Card key={rule.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                        <div>
                          <Label className="text-sm font-medium">Column</Label>
                          <Select 
                            value={rule.column}
                            onValueChange={(value) => updateRule(rule.id, { column: value })}
                          >
                            <SelectTrigger data-testid={`select-column-${rule.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {csvData.headers.map(header => (
                                <SelectItem key={header} value={header}>
                                  {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Transformation</Label>
                          <Select 
                            value={rule.type}
                            onValueChange={(value) => updateRule(rule.id, { type: value as any, parameters: {} })}
                          >
                            <SelectTrigger data-testid={`select-type-${rule.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {transformationTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.icon} {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Parameters</Label>
                          {renderRuleParameters(rule)}
                        </div>

                        <div className="flex items-end">
                          <Button
                            onClick={() => removeRule(rule.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-remove-rule-${rule.id}`}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z M4 5a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM6 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                            </svg>
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {transformationRules.length > 0 && (
              <>
                <Separator className="my-6" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Output Delimiter</Label>
                    <Select value={outputDelimiter} onValueChange={setOutputDelimiter}>
                      <SelectTrigger className="w-32" data-testid="select-delimiter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=",">, (Comma)</SelectItem>
                        <SelectItem value=";">; (Semicolon)</SelectItem>
                        <SelectItem value="|">| (Pipe)</SelectItem>
                        <SelectItem value="\t">Tab</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={applyCleaning}
                    disabled={cleaningMutation.isPending}
                    className="bg-material-success hover:bg-green-600"
                    data-testid="button-apply-cleaning"
                  >
                    {cleaningMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Apply Cleaning
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {cleaningResult && (
        <Card className="shadow-material-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-medium text-gray-900">Cleaning Results</CardTitle>
                <p className="text-gray-600 text-sm">Your data has been successfully cleaned and transformed</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={resetCleaning}
                  variant="outline"
                  data-testid="button-back-to-rules"
                >
                  Back to Rules
                </Button>
                <Button
                  onClick={downloadCleanedData}
                  className="bg-material-blue hover:bg-material-blue-dark"
                  data-testid="button-download-cleaned"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download Cleaned Data
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-material-blue" data-testid="text-transformations-applied">
                  {cleaningResult.appliedTransformations.length}
                </div>
                <div className="text-sm text-gray-600">Transformations Applied</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-material-success" data-testid="text-rows-remaining">
                  {cleaningResult.cleanedData.length.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Rows Remaining</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-material-error" data-testid="text-rows-removed">
                  {cleaningResult.rowsRemoved}
                </div>
                <div className="text-sm text-gray-600">Rows Removed</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Applied Transformations:</h4>
              <div className="space-y-1">
                {cleaningResult.appliedTransformations.map((transform, index) => (
                  <Badge key={index} variant="outline" className="mr-2 mb-1">
                    {transform}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      <Card className="shadow-material-2">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900">
            {showPreview ? 'Original Data Preview' : 'Cleaned Data Preview'}
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Showing first 50 rows • {showPreview ? csvData.data.length : cleaningResult?.cleanedData.length || 0} total rows
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  {currentHeaders.map((header, index) => (
                    <TableHead key={index} className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, index) => (
                  <TableRow key={index} className={index % 2 === 1 ? 'bg-gray-50' : ''} data-testid={`preview-row-${index}`}>
                    {currentHeaders.map((header, colIndex) => (
                      <TableCell key={colIndex} className="text-sm text-gray-900 whitespace-nowrap">
                        {row[header] || ''}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}