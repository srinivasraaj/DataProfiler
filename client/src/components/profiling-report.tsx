import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ProfilingResult, CsvUpload } from "@shared/schema";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ProfilingReportProps {
  reportData: ProfilingResult;
  csvData: CsvUpload;
}

export default function ProfilingReport({ reportData, csvData }: ProfilingReportProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNullValuesBadgeVariant = (status: string) => {
    switch (status) {
      case 'Clean': return 'default';
      case 'Needs Attention': return 'secondary';
      case 'Critical': return 'destructive';
      default: return 'default';
    }
  };

  const exportAsJSON = () => {
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${csvData.filename}_profiling_report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = async () => {
    try {
      // Get the report element
      const reportElement = document.getElementById('profiling-report');
      if (!reportElement) {
        console.error('Report element not found');
        return;
      }

      // Show loading state
      const originalText = document.querySelector('[data-testid="button-export-pdf"]')?.textContent;
      const button = document.querySelector('[data-testid="button-export-pdf"]') as HTMLButtonElement;
      if (button) {
        button.textContent = 'Generating PDF...';
        button.disabled = true;
      }

      // Create canvas from HTML with better options
      const canvas = await html2canvas(reportElement, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: reportElement.scrollWidth,
        height: reportElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add title page
      pdf.setFontSize(20);
      pdf.text('CSV Data Profiling Report', 20, 30);
      pdf.setFontSize(12);
      pdf.text(`File: ${csvData.filename}`, 20, 45);
      pdf.text(`Generated: ${formatDate(reportData.generatedAt)}`, 20, 55);
      pdf.text('Professional Data Engineering Analysis', 20, 65);

      // Add the canvas image
      const imgData = canvas.toDataURL('image/png');
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      pdf.save(`${csvData.filename}_profiling_report.pdf`);

      // Restore button
      if (button && originalText) {
        button.textContent = originalText;
        button.disabled = false;
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Restore button on error
      const button = document.querySelector('[data-testid="button-export-pdf"]') as HTMLButtonElement;
      if (button) {
        button.textContent = 'Export PDF';
        button.disabled = false;
      }
      
      // Fallback to print
      window.print();
    }
  };

  return (
    <section>
      <Card id="profiling-report" className="shadow-material-2">
        <CardHeader>
          <div className="border-b border-gray-200 pb-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-medium text-gray-900 flex items-center">
                  <svg className="w-6 h-6 text-material-blue mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                  Data Profiling Report
                </CardTitle>
                <p className="text-gray-600 mt-1">Comprehensive analysis results for your CSV dataset</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Generated on</div>
                <div className="font-medium text-gray-900" data-testid="text-generated-date">
                  {formatDate(reportData.generatedAt)}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Summary Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {reportData.rowCount !== undefined && (
              <div className="bg-gradient-to-br from-material-blue to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Records</p>
                    <p className="text-2xl font-bold" data-testid="text-row-count">
                      {reportData.rowCount.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            )}

            {reportData.columnCount !== undefined && (
              <div className="bg-gradient-to-br from-material-success to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Total Columns</p>
                    <p className="text-2xl font-bold" data-testid="text-column-count">
                      {reportData.columnCount}
                    </p>
                  </div>
                  <span className="text-2xl">📏</span>
                </div>
              </div>
            )}

            {reportData.dataSize && (
              <div className="bg-gradient-to-br from-material-warning to-yellow-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm font-medium">Data Size</p>
                    <p className="text-2xl font-bold" data-testid="text-data-size">
                      {reportData.dataSize}
                    </p>
                  </div>
                  <span className="text-2xl">💾</span>
                </div>
              </div>
            )}

            {reportData.delimiter && (
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">CSV Delimiter</p>
                    <p className="text-2xl font-bold" data-testid="text-delimiter">
                      {reportData.delimiter}
                    </p>
                  </div>
                  <span className="text-2xl">│</span>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Analysis Sections */}
          <div className="space-y-8">
            
            {/* Null Values Analysis */}
            {reportData.nullAnalysis && (
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="text-material-warning mr-3 text-xl">⚠️</span>
                    Null Values Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-xs font-medium text-gray-500 uppercase">Column Name</TableHead>
                          <TableHead className="text-xs font-medium text-gray-500 uppercase">Null Count</TableHead>
                          <TableHead className="text-xs font-medium text-gray-500 uppercase">Null Percentage</TableHead>
                          <TableHead className="text-xs font-medium text-gray-500 uppercase">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.nullAnalysis.map((item, index) => (
                          <TableRow key={index} className={index % 2 === 1 ? 'bg-gray-50' : ''} data-testid={`null-analysis-${item.column}`}>
                            <TableCell className="font-medium text-gray-900">{item.column}</TableCell>
                            <TableCell className="text-gray-700">{item.nullCount}</TableCell>
                            <TableCell className="text-gray-700">{item.percentage}%</TableCell>
                            <TableCell>
                              <Badge variant={getNullValuesBadgeVariant(item.status)}>
                                {item.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Date Analysis */}
            {(reportData.dateColumns || reportData.dateAnalysis) && (
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="text-material-blue mr-3 text-xl">📅</span>
                    Date Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reportData.dateColumns && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">Date Columns Detected</h5>
                        <ul className="space-y-1 text-sm text-gray-700">
                          {reportData.dateColumns.map((column, index) => (
                            <li key={index} data-testid={`date-column-${column}`}>• {column}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {reportData.dateAnalysis && reportData.dateAnalysis.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">Date Range Analysis</h5>
                        {reportData.dateAnalysis.map((analysis, index) => (
                          <div key={index} className="text-sm text-gray-700 space-y-1 mb-3" data-testid={`date-analysis-${analysis.column}`}>
                            <div><strong>{analysis.column}:</strong></div>
                            {analysis.minDate && <div><strong>Min Date:</strong> {analysis.minDate}</div>}
                            {analysis.maxDate && <div><strong>Max Date:</strong> {analysis.maxDate}</div>}
                            {analysis.dateRange && <div><strong>Date Range:</strong> {analysis.dateRange} days</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Duplicate Rows */}
            {reportData.duplicateRows && reportData.duplicateRows.length > 0 && (
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="text-material-error mr-3 text-xl">📋</span>
                    Duplicate Rows Detection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <span className="text-material-error mr-2 text-xl">⚠️</span>
                        <span className="font-medium text-gray-900">
                          Found <span data-testid="text-duplicate-count">{reportData.duplicateRows.length}</span> groups of duplicate rows
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-xs font-medium text-gray-500 uppercase">Row Indices</TableHead>
                          <TableHead className="text-xs font-medium text-gray-500 uppercase">Sample Data</TableHead>
                          <TableHead className="text-xs font-medium text-gray-500 uppercase">Duplicate Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.duplicateRows.slice(0, 10).map((duplicate, index) => (
                          <TableRow key={index} data-testid={`duplicate-row-${index}`}>
                            <TableCell className="font-medium text-gray-900">
                              {duplicate.rowIndices.join(', ')}
                            </TableCell>
                            <TableCell className="text-gray-700 max-w-xs truncate">
                              {JSON.stringify(duplicate.data).substring(0, 100)}...
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive">
                                {duplicate.count} occurrences
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Distinct Values Analysis */}
            {reportData.distinctValues && reportData.distinctValues.length > 0 && (
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="text-material-blue mr-3 text-xl">🔍</span>
                    Distinct Values Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.distinctValues.map((analysis, index) => (
                      <div key={index} className="bg-blue-50 rounded-lg p-4" data-testid={`distinct-values-${analysis.column}`}>
                        <h5 className="font-medium text-gray-900 mb-3">{analysis.column} - Distinct Values</h5>
                        <div className="flex flex-wrap gap-2">
                          {analysis.values.slice(0, 20).map((value, valueIndex) => (
                            <Badge key={valueIndex} variant="outline" className="bg-white">
                              {value.value} ({value.count})
                            </Badge>
                          ))}
                          {analysis.values.length > 20 && (
                            <Badge variant="outline" className="bg-white">
                              +{analysis.values.length - 20} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Unique Key Analysis */}
            {reportData.uniqueKeyAnalysis && reportData.uniqueKeyAnalysis.length > 0 && (
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="text-material-success mr-3 text-xl">🔑</span>
                    Unique Key Column Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">Potential Unique Keys</h5>
                      <ul className="space-y-2 text-sm">
                        {reportData.uniqueKeyAnalysis.map((analysis, index) => (
                          <li key={index} className="flex items-center space-x-2" data-testid={`unique-key-${analysis.column}`}>
                            <span className={analysis.isUniqueKey ? 'text-material-success text-xl' : 'text-material-error text-xl'}>
                              {analysis.isUniqueKey ? '✅' : '❌'}
                            </span>
                            <span>
                              <strong>{analysis.column}</strong> - {analysis.percentage}% unique 
                              ({analysis.uniqueCount} distinct / {analysis.totalCount} total)
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">Recommendation</h5>
                      <p className="text-sm text-gray-700">
                        {reportData.uniqueKeyAnalysis.find(analysis => analysis.isUniqueKey) ? (
                          <>
                            <strong>{reportData.uniqueKeyAnalysis.find(analysis => analysis.isUniqueKey)?.column}</strong> column 
                            is recommended as the primary unique key with 100% uniqueness across all records.
                          </>
                        ) : (
                          'No perfect unique key found. Consider creating a composite key or adding an ID column.'
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          {/* Export Options */}
          <div className="border-t border-gray-200 pt-6 mt-8">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Export Report</h4>
                <p className="text-sm text-gray-600">Download this analysis in your preferred format</p>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={exportAsPDF}
                  className="bg-material-blue hover:bg-material-blue-dark"
                  data-testid="button-export-pdf"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                  </svg>
                  Export PDF
                </Button>
                <Button
                  onClick={exportAsJSON}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50"
                  data-testid="button-export-json"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Export JSON
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
