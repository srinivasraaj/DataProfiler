import { type ProfilingRequest, type ProfilingResult } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  processProfilingRequest(request: ProfilingRequest): Promise<ProfilingResult>;
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
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/,
      /^\d{2}\/\d{2}\/\d{4}$/,
      /^\d{4}\/\d{2}\/\d{2}$/,
      /^\d{2}-\d{2}-\d{4}$/,
    ];
    
    return datePatterns.some(pattern => pattern.test(value.trim())) || !isNaN(Date.parse(value));
  }

  private analyzeDateColumns(data: any[], dateColumns: string[]) {
    return dateColumns.map(column => {
      const dates = data
        .map(row => row[column])
        .filter(val => val && !isNaN(Date.parse(val)))
        .map(val => new Date(val))
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
      const dateRange = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        column,
        minDate: minDate.toISOString().split('T')[0],
        maxDate: maxDate.toISOString().split('T')[0],
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
}

export const storage = new MemStorage();
