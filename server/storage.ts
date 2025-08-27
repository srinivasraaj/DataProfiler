import { type ProfilingRequest, type ProfilingResult, type DataCleaningRequest, type DataCleaningResult, type TransformationRule } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  processProfilingRequest(request: ProfilingRequest): Promise<ProfilingResult>;
  processDataCleaning(request: DataCleaningRequest): Promise<DataCleaningResult>;
}

export class MemStorage implements IStorage {
  constructor() {}

  async processProfilingRequest(request: ProfilingRequest): Promise<ProfilingResult> {
    const { csvData, options } = request;
    const result: ProfilingResult = {
      generatedAt: new Date().toISOString(),
    };

    // Row Count Analysis
    if (options.rowCount) {
      result.rowCount = csvData.data.length;
    }

    // Column Count Analysis
    if (options.columnCount) {
      result.columnCount = csvData.headers.length;
    }

    // Data Size Analysis
    if (options.dataSize) {
      const dataString = JSON.stringify(csvData.data);
      const sizeInBytes = new Blob([dataString]).size;
      result.dataSize = this.formatBytes(sizeInBytes);
    }

    // Delimiter Detection (mock - would need original CSV text)
    if (options.delimiter) {
      result.delimiter = ","; // Default assumption for CSV
    }

    // Date Columns Detection
    if (options.dateColumns) {
      result.dateColumns = this.detectDateColumns(csvData.data, csvData.headers);
    }

    // Date Range Analysis
    if (options.dateRange) {
      const dateColumns = result.dateColumns || this.detectDateColumns(csvData.data, csvData.headers);
      result.dateAnalysis = this.analyzeDateColumns(csvData.data, dateColumns);
    }

    // Null Values Analysis
    if (options.nullValues) {
      result.nullAnalysis = this.analyzeNullValues(csvData.data, csvData.headers);
    }

    // Duplicate Rows Detection
    if (options.duplicates) {
      result.duplicateRows = this.findDuplicateRows(csvData.data);
    }

    // Distinct Values Analysis
    if (options.distinctValues && options.selectedColumns.length > 0) {
      result.distinctValues = this.analyzeDistinctValues(csvData.data, options.selectedColumns);
    }

    // Unique Key Analysis
    if (options.uniqueKey) {
      result.uniqueKeyAnalysis = this.analyzeUniqueKeys(csvData.data, csvData.headers);
    }

    return result;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private detectDateColumns(data: any[], headers: string[]): string[] {
  const dateColumns: string[] = [];

  for (const header of headers) {
    let dateCount = 0;
    const sampleSize = Math.min(10, data.length);

    // Skip columns that are obviously not dates based on their name
    const headerLower = header.toLowerCase();
    if (
      headerLower.includes("id") ||
      headerLower.includes("code") ||
      headerLower.includes("number") ||
      headerLower.includes("count")
    ) {
      continue;
    }

    for (let i = 0; i < sampleSize; i++) {
      const value = data[i][header];
      if (value && this.isDateLike(value.toString())) {
        dateCount++;
      }
    }

    if (dateCount / sampleSize > 0.5) {
      dateColumns.push(header);
    }
  }

  return dateColumns;
}

private isDateLike(value: string): boolean {
  if (!value) return false;

  // Only consider reasonably long strings (avoid integers like "12345")
  if (/^\d+$/.test(value.trim())) {
    return false;
  }

  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,   // 2023-12-31
    /^\d{2}\/\d{2}\/\d{4}$/, // 31/12/2023
    /^\d{4}\/\d{2}\/\d{2}$/, // 2023/12/31
    /^\d{2}-\d{2}-\d{4}$/,   // 31-12-2023
  ];

  return (
    datePatterns.some((pattern) => pattern.test(value.trim())) ||
    !isNaN(Date.parse(value))
  );
}

private analyzeDateColumns(data: any[], dateColumns: string[]) {
  return dateColumns.map((column) => {
    const dates = data
      .map((row) => row[column])
      .filter((val) => val && !isNaN(Date.parse(val)))
      .map((val) => new Date(val))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length === 0) {
      return {
        column,
        minDate: null,
        maxDate: null,
        dateRange: null,
      };
    }

    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];
    const dateRange = Math.ceil(
      (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      column,
      minDate: minDate.toISOString().split("T")[0],
      maxDate: maxDate.toISOString().split("T")[0],
      dateRange,
    };
  });
}

  private analyzeNullValues(data: any[], headers: string[]) {
    return headers.map(column => {
      const nullCount = data.filter(row => 
        row[column] === null || 
        row[column] === undefined || 
        row[column] === '' || 
        row[column] === 'null' ||
        row[column] === 'NULL'
      ).length;
      
      const percentage = (nullCount / data.length) * 100;
      
      let status: 'Clean' | 'Needs Attention' | 'Critical';
      if (percentage === 0) status = 'Clean';
      else if (percentage < 10) status = 'Needs Attention';
      else status = 'Critical';

      return {
        column,
        nullCount,
        percentage: parseFloat(percentage.toFixed(2)),
        status,
      };
    });
  }

  private findDuplicateRows(data: any[]) {
    const rowMap = new Map<string, number[]>();
    
    data.forEach((row, index) => {
      const rowString = JSON.stringify(row);
      if (!rowMap.has(rowString)) {
        rowMap.set(rowString, []);
      }
      rowMap.get(rowString)!.push(index);
    });

    const duplicates = [];
    for (const [rowString, indices] of rowMap.entries()) {
      if (indices.length > 1) {
        duplicates.push({
          rowIndices: indices,
          data: JSON.parse(rowString),
          count: indices.length,
        });
      }
    }

    return duplicates;
  }

  private analyzeDistinctValues(data: any[], columns: string[]) {
    return columns.map(column => {
      const valueMap = new Map<string, number>();
      
      data.forEach(row => {
        const value = row[column]?.toString() || 'NULL';
        valueMap.set(value, (valueMap.get(value) || 0) + 1);
      });

      const values = Array.from(valueMap.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);

      return {
        column,
        values,
      };
    });
  }

  private analyzeUniqueKeys(data: any[], headers: string[]) {
    return headers.map(column => {
      const uniqueValues = new Set();
      data.forEach(row => {
        const value = row[column];
        if (value !== null && value !== undefined && value !== '') {
          uniqueValues.add(value.toString());
        }
      });

      const uniqueCount = uniqueValues.size;
      const totalCount = data.length;
      const percentage = (uniqueCount / totalCount) * 100;
      const isUniqueKey = percentage === 100;

      return {
        column,
        uniqueCount,
        totalCount,
        percentage: parseFloat(percentage.toFixed(2)),
        isUniqueKey,
      };
    });
  }

  async processDataCleaning(request: DataCleaningRequest): Promise<DataCleaningResult> {
    const { csvData, transformationRules, outputDelimiter } = request;
    let cleanedData = [...csvData.data];
    let headers = [...csvData.headers];
    const appliedTransformations: string[] = [];
    let rowsRemoved = 0;
    const transformationSummary: Record<string, any> = {};

    // Apply transformations in order
    for (const rule of transformationRules) {
      const result = this.applyTransformation(cleanedData, headers, rule);
      cleanedData = result.data;
      headers = result.headers;
      rowsRemoved += result.rowsRemoved || 0;
      appliedTransformations.push(result.description);
      transformationSummary[rule.id] = result.summary;
    }

    return {
      cleanedData,
      headers,
      appliedTransformations,
      rowsRemoved,
      transformationSummary,
    };
  }

  private applyTransformation(
    data: any[],
    headers: string[],
    rule: TransformationRule
  ): {
    data: any[];
    headers: string[];
    rowsRemoved?: number;
    description: string;
    summary: any;
  } {
    const { column, type, parameters } = rule;

    switch (type) {
      case 'date_format':
        return this.transformDateFormat(data, headers, column, parameters);
      case 'timestamp_format':
        return this.transformTimestampFormat(data, headers, column, parameters);
      case 'number_format':
        return this.transformNumberFormat(data, headers, column, parameters);
      case 'remove_duplicates':
        return this.removeDuplicates(data, headers);
      case 'subset_column':
        return this.subsetColumn(data, headers, column, parameters);
      case 'replace_nulls':
        return this.replaceNulls(data, headers, column, parameters);
      case 'coalesce':
        return this.coalesceColumns(data, headers, column, parameters);
      case 'text_manipulation':
        return this.manipulateText(data, headers, column, parameters);
      default:
        return {
          data,
          headers,
          description: `Unknown transformation type: ${type}`,
          summary: {},
        };
    }
  }

  private transformDateFormat(data: any[], headers: string[], column: string, params: any) {
  const { targetFormat = 'YYYY-MM-DD' } = params;
  let transformedCount = 0;

  const newData = data.map(row => {
    if (row[column] && row[column].trim() !== '') {
      const parsed = this.parseDate(row[column]);  // ✅ custom parser
      if (parsed) {
        row[column] = this.formatDate(parsed, targetFormat);
        transformedCount++;
      }
    }
    return row;
  });

  return {
    data: newData,
    headers,
    description: `Transformed ${transformedCount} dates in column '${column}' to format '${targetFormat}'`,
    summary: { transformedCount, targetFormat },
  };
}

// Parses DD-MM-YYYY or DD/MM/YYYY into Date
private parseDate(value: string): Date | null {
  const parts = value.split(/[-/]/); // works for "-" or "/"
  if (parts.length === 3) {
    const [day, month, year] = parts.map(p => parseInt(p, 10));
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month - 1, day);
    }
  }
  return null; // invalid format
}

private formatDate(date: Date, format: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day);
}


  private transformTimestampFormat(data: any[], headers: string[], column: string, params: any) {
    const { targetFormat = 'YYYY-MM-DD HH:mm:ss' } = params;
    let transformedCount = 0;

    const newData = data.map(row => {
      if (row[column] && row[column] !== '') {
        const timestamp = this.parseTimestamp(row[column]);
        if (timestamp && !isNaN(timestamp.getTime())) {
          row[column] = this.formatTimestamp(timestamp, targetFormat);
          transformedCount++;
        }
      }
      return row;
    });

    return {
      data: newData,
      headers,
      description: `Transformed ${transformedCount} timestamps in column '${column}' to format '${targetFormat}'`,
      summary: { transformedCount, targetFormat },
    };
  }

  private parseTimestamp(value: string | number): Date | null {
    // Try different timestamp formats
    if (typeof value === 'number' || (!isNaN(Number(value)) && String(value).length >= 10)) {
      // Unix timestamp (seconds or milliseconds)
      const num = Number(value);
      if (num > 1000000000) { // Reasonable timestamp check
        // If it's in seconds, convert to milliseconds
        const timestamp = num < 10000000000 ? num * 1000 : num;
        return new Date(timestamp);
      }
    }
    
    // Handle string timestamps - normalize format before parsing
    if (typeof value === 'string') {
      // Handle DD-MM-YYYY HH:mm format (add seconds if missing)
      const ddmmyyyyPattern = /^(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})$/;
      const match = value.match(ddmmyyyyPattern);
      if (match) {
        const [, day, month, year, hour, minute] = match;
        // Construct ISO format string: YYYY-MM-DDTHH:mm:ss
        const isoString = `${year}-${month}-${day}T${hour.padStart(2, '0')}:${minute}:00`;
        return new Date(isoString);
      }
      
      // Handle other DD-MM-YYYY HH:mm:ss format
      const ddmmyyyyWithSecondsPattern = /^(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/;
      const matchWithSeconds = value.match(ddmmyyyyWithSecondsPattern);
      if (matchWithSeconds) {
        const [, day, month, year, hour, minute, second] = matchWithSeconds;
        const isoString = `${year}-${month}-${day}T${hour.padStart(2, '0')}:${minute}:${second}`;
        return new Date(isoString);
      }
    }
    
    // Try ISO format or other date formats
    const date = new Date(value);
    return !isNaN(date.getTime()) ? date : null;
  }

  private formatTimestamp(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    switch (format) {
      case 'unix':
        return String(Math.floor(date.getTime() / 1000));
      case 'iso':
        return date.toISOString();
      case 'YYYY-MM-DD HH:mm:ss':
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      case 'DD/MM/YYYY HH:mm:ss':
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
      case 'MM/DD/YYYY HH:mm:ss':
        return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
      case 'YYYY-MM-DD HH:mm':
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      default:
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
  }

  private transformNumberFormat(data: any[], headers: string[], column: string, params: any) {
    const { operation = 'integer' } = params;
    let transformedCount = 0;

    const newData = data.map(row => {
      if (row[column] && row[column] !== '' && !isNaN(Number(row[column]))) {
        const num = Number(row[column]);
        switch (operation) {
          case 'integer':
            row[column] = Math.round(num);
            break;
          case 'ceiling':
            row[column] = Math.ceil(num);
            break;
          case 'floor':
            row[column] = Math.floor(num);
            break;
          case 'decimal':
            row[column] = parseFloat(num.toFixed(params.decimalPlaces || 2));
            break;
        }
        transformedCount++;
      }
      return row;
    });

    return {
      data: newData,
      headers,
      description: `Applied ${operation} operation to ${transformedCount} values in column '${column}'`,
      summary: { transformedCount, operation },
    };
  }

  private removeDuplicates(data: any[], headers: string[]) {
    const seen = new Set();
    const uniqueData = [];
    let duplicateCount = 0;

    for (const row of data) {
      const rowString = JSON.stringify(row);
      if (!seen.has(rowString)) {
        seen.add(rowString);
        uniqueData.push(row);
      } else {
        duplicateCount++;
      }
    }

    return {
      data: uniqueData,
      headers,
      rowsRemoved: duplicateCount,
      description: `Removed ${duplicateCount} duplicate rows`,
      summary: { duplicateCount, uniqueRows: uniqueData.length },
    };
  }

  private subsetColumn(data: any[], headers: string[], column: string, params: any) {
    const { startIndex = 0, length } = params;
    let transformedCount = 0;

    const newData = data.map(row => {
      if (row[column] && typeof row[column] === 'string') {
        const originalValue = row[column];
        row[column] = length 
          ? originalValue.substring(startIndex, startIndex + length)
          : originalValue.substring(startIndex);
        transformedCount++;
      }
      return row;
    });

    return {
      data: newData,
      headers,
      description: `Extracted substring from ${transformedCount} values in column '${column}'`,
      summary: { transformedCount, startIndex, length },
    };
  }

  private replaceNulls(data: any[], headers: string[], column: string, params: any) {
    const { replacementValue = '' } = params;
    let replacedCount = 0;

    const newData = data.map(row => {
      if (row[column] === null || row[column] === undefined || row[column] === '' || row[column] === 'null') {
        row[column] = replacementValue;
        replacedCount++;
      }
      return row;
    });

    return {
      data: newData,
      headers,
      description: `Replaced ${replacedCount} null values in column '${column}' with '${replacementValue}'`,
      summary: { replacedCount, replacementValue },
    };
  }

  private coalesceColumns(data: any[], headers: string[], column: string, params: any) {
    const { fallbackColumns = [], defaultValue = '' } = params;
    let coalescedCount = 0;

    const newData = data.map(row => {
      if (!row[column] || row[column] === '' || row[column] === null) {
        let valueFound = false;
        
        // First try fallback columns
        for (const fallbackCol of fallbackColumns) {
          if (row[fallbackCol] && row[fallbackCol] !== '' && row[fallbackCol] !== null) {
            row[column] = row[fallbackCol];
            coalescedCount++;
            valueFound = true;
            break;
          }
        }
        
        // If no fallback column had a value, use default value
        if (!valueFound && defaultValue !== '') {
          row[column] = defaultValue;
          coalescedCount++;
        }
      }
      return row;
    });

    return {
      data: newData,
      headers,
      description: `Coalesced ${coalescedCount} values in column '${column}' using fallback columns${defaultValue ? ` and default value '${defaultValue}'` : ''}`,
      summary: { coalescedCount, fallbackColumns, defaultValue },
    };
  }

  private manipulateText(data: any[], headers: string[], column: string, params: any) {
    const { operation = 'add', text = '', position = 'end', searchText = '' } = params;
    let transformedCount = 0;

    console.log('Text manipulation params:', params); // Debug log

    const newData = data.map(row => {
      if (row[column] && typeof row[column] === 'string') {
        const originalValue = row[column];
        let newValue = originalValue;
        
        switch (operation) {
          case 'add':
            newValue = position === 'start' ? text + originalValue : originalValue + text;
            break;
          case 'remove':
            // Create regex to handle special characters properly
            const removePattern = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            newValue = originalValue.replace(new RegExp(removePattern, 'g'), '');
            break;
          case 'replace':
            // Create regex to handle special characters properly
            const searchPattern = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            newValue = originalValue.replace(new RegExp(searchPattern, 'g'), text);
            console.log(`Replacing "${searchText}" with "${text}" in "${originalValue}" -> "${newValue}"`); // Debug log
            break;
        }
        
        if (newValue !== originalValue) {
          row[column] = newValue;
          transformedCount++;
        }
      }
      return row;
    });

    return {
      data: newData,
      headers,
      description: `Applied text ${operation} to ${transformedCount} values in column '${column}'${operation === 'replace' ? ` (replaced "${searchText}" with "${text}")` : ''}`,
      summary: { transformedCount, operation, text, position, searchText },
    };
  }
}

export const storage = new MemStorage();
