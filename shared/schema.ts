import { z } from "zod";

export const csvUploadSchema = z.object({
  filename: z.string(),
  data: z.array(z.record(z.string(), z.any())),
  headers: z.array(z.string()),
});

export const profilingOptionsSchema = z.object({
  rowCount: z.boolean().default(true),
  dateRange: z.boolean().default(false),
  distinctValues: z.boolean().default(false),
  nullValues: z.boolean().default(true),
  duplicates: z.boolean().default(true),
  dataSize: z.boolean().default(true),
  columnCount: z.boolean().default(true),
  dateColumns: z.boolean().default(false),
  delimiter: z.boolean().default(true),
  uniqueKey: z.boolean().default(false),
  selectedColumns: z.array(z.string()).default([]),
});

export const profilingRequestSchema = z.object({
  csvData: csvUploadSchema,
  options: profilingOptionsSchema,
});

export const nullAnalysisSchema = z.object({
  column: z.string(),
  nullCount: z.number(),
  percentage: z.number(),
  status: z.enum(['Clean', 'Needs Attention', 'Critical']),
});

export const dateAnalysisSchema = z.object({
  column: z.string(),
  minDate: z.string().nullable(),
  maxDate: z.string().nullable(),
  dateRange: z.number().nullable(),
});

export const duplicateRowSchema = z.object({
  rowIndices: z.array(z.number()),
  data: z.record(z.string(), z.any()),
  count: z.number(),
});

export const distinctValuesSchema = z.object({
  column: z.string(),
  values: z.array(z.object({
    value: z.string(),
    count: z.number(),
  })),
});

export const uniqueKeyAnalysisSchema = z.object({
  column: z.string(),
  uniqueCount: z.number(),
  totalCount: z.number(),
  percentage: z.number(),
  isUniqueKey: z.boolean(),
});

export const profilingResultSchema = z.object({
  rowCount: z.number().optional(),
  columnCount: z.number().optional(),
  dataSize: z.string().optional(),
  delimiter: z.string().optional(),
  dateColumns: z.array(z.string()).optional(),
  dateAnalysis: z.array(dateAnalysisSchema).optional(),
  nullAnalysis: z.array(nullAnalysisSchema).optional(),
  duplicateRows: z.array(duplicateRowSchema).optional(),
  distinctValues: z.array(distinctValuesSchema).optional(),
  uniqueKeyAnalysis: z.array(uniqueKeyAnalysisSchema).optional(),
  generatedAt: z.string(),
});

export type CsvUpload = z.infer<typeof csvUploadSchema>;
export type ProfilingOptions = z.infer<typeof profilingOptionsSchema>;
export type ProfilingRequest = z.infer<typeof profilingRequestSchema>;
export type ProfilingResult = z.infer<typeof profilingResultSchema>;
export type NullAnalysis = z.infer<typeof nullAnalysisSchema>;
export type DateAnalysis = z.infer<typeof dateAnalysisSchema>;
export type DuplicateRow = z.infer<typeof duplicateRowSchema>;
export type DistinctValues = z.infer<typeof distinctValuesSchema>;
export type UniqueKeyAnalysis = z.infer<typeof uniqueKeyAnalysisSchema>;
