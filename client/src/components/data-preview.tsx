import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CsvUpload } from "@shared/schema";

interface DataPreviewProps {
  csvData: CsvUpload;
}

export default function DataPreview({ csvData }: DataPreviewProps) {
  const previewRows = csvData.data.slice(0, 100);
  const remainingRows = Math.max(0, csvData.data.length - 100);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const estimatedSize = formatBytes(JSON.stringify(csvData.data).length);

  return (
    <section className="mb-8">
      <Card className="shadow-material-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-medium text-gray-900 flex items-center">
                <svg className="w-5 h-5 text-material-blue mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                CSV Data Preview
              </CardTitle>
              <p className="text-gray-600 mt-1">Showing first 100 rows of your dataset</p>
            </div>
            <div className="text-sm text-gray-500" data-testid="text-file-info">
              <span>{csvData.filename}</span> • <span>{estimatedSize}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  {csvData.headers.map((header, index) => (
                    <TableHead key={index} className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, index) => (
                  <TableRow key={index} className={index % 2 === 1 ? 'bg-gray-50' : ''} data-testid={`row-data-${index}`}>
                    {csvData.headers.map((header, colIndex) => (
                      <TableCell key={colIndex} className="text-sm text-gray-900 whitespace-nowrap">
                        {row[header] || ''}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {remainingRows > 0 && (
                  <TableRow>
                    <TableCell colSpan={csvData.headers.length} className="text-center text-sm text-gray-500 py-4">
                      ... and <span className="font-medium" data-testid="text-remaining-rows">{remainingRows.toLocaleString()}</span> more rows
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
