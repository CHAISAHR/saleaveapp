
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiConfig } from "@/config/apiConfig";

interface CSVUploaderProps {
  type: 'users' | 'balances' | 'requests';
  onUploadComplete?: () => void;
}

interface UploadResult {
  success: boolean;
  results: {
    successful: number;
    failed: number;
    errors: Array<{ row: number; error: string; data: any }>;
  };
}

export const CSVUploader: React.FC<CSVUploaderProps> = ({ type, onUploadComplete }) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const templates = {
    users: {
      filename: 'users_template.csv',
      headers: ['name', 'email', 'department', 'role', 'password', 'manager_email', 'hire_date'],
      sampleData: [
        ['John Smith', 'john.smith@company.com', 'HR & Ops', 'employee', 'password123', 'manager@company.com', '2024-01-15'],
        ['Jane Doe', 'jane.doe@company.com', 'Finance', 'manager', 'password456', '', '2023-06-01']
      ]
    },
    balances: {
      filename: 'balances_template.csv',
      headers: ['employee_name', 'employee_email', 'department', 'year', 'brought_forward', 'annual', 'annual_used', 'forfeited', 'annual_leave_adjustments', 'sick_used', 'family_used', 'study_used', 'manager_email'],
      sampleData: [
        ['John Smith', 'john.smith@company.com', 'HR & Ops', '2025', '5', '20', '8', '0', '0', '2', '1', '0', 'manager@company.com'],
        ['Jane Doe', 'jane.doe@company.com', 'Finance', '2025', '3', '20', '12', '0', '0', '4', '1', '2', '']
      ]
    },
    requests: {
      filename: 'requests_template.csv',
      headers: ['title', 'detail', 'start_date', 'end_date', 'leave_type', 'requester_email', 'status', 'approver_email'],
      sampleData: [
        ['Annual Leave', 'Family vacation', '2024-12-20', '2024-12-30', 'annual', 'john.smith@company.com', 'approved', 'manager@company.com'],
        ['Sick Leave', 'Medical appointment', '2024-11-15', '2024-11-15', 'sick', 'jane.doe@company.com', 'approved', '']
      ]
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      parseCSV(selectedFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid CSV file.",
        variant: "destructive",
      });
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) return;

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = { _rowNumber: index + 2 }; // +2 because we skip header and array is 0-indexed
        
        headers.forEach((header, i) => {
          row[header] = values[i] === '' ? null : values[i];
        });
        
        return row;
      });

      setHeaders(headers);
      setCsvData(data);
      setUploadResult(null);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = templates[type];
    const csvContent = [
      template.headers.join(','),
      ...template.sampleData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = template.filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file || csvData.length === 0) {
      toast({
        title: "No Data",
        description: "Please select and parse a CSV file first.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const authToken = localStorage.getItem('auth_token');
      const response = await fetch(`${apiConfig.baseURL}/api/bulk-upload/${type}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: csvData })
      });

      const result = await response.json();
      
      if (response.ok) {
        setUploadResult(result);
        toast({
          title: "Upload Complete",
          description: `Successfully processed ${result.results.successful} records. ${result.results.failed} failed.`,
          variant: result.results.failed > 0 ? "destructive" : "default",
        });
        
        if (onUploadComplete) {
          onUploadComplete();
        }
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload CSV data",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const typeLabels = {
    users: 'Users',
    balances: 'Leave Balances',
    requests: 'Leave Requests'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Upload {typeLabels[type]}
        </CardTitle>
        <CardDescription>
          Upload multiple {type} via CSV file. Download the template to see the required format.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button onClick={downloadTemplate} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <div className="flex-1">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>
        </div>

        {csvData.length > 0 && (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Found {csvData.length} records. Showing first 5 rows for preview:
              </AlertDescription>
            </Alert>

            <div className="max-h-60 overflow-auto border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((header, index) => (
                      <TableHead key={index} className="text-xs">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.slice(0, 5).map((row, index) => (
                    <TableRow key={index}>
                      {headers.map((header, cellIndex) => (
                        <TableCell key={cellIndex} className="text-xs">
                          {row[header] || <span className="text-gray-400">-</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Button 
              onClick={handleUpload} 
              className="w-full"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : `Upload ${csvData.length} Records`}
            </Button>
          </div>
        )}

        {uploadResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {uploadResult.results.successful} successful
                </AlertDescription>
              </Alert>
              
              {uploadResult.results.failed > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {uploadResult.results.failed} failed
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {uploadResult.results.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Errors:</h4>
                <div className="max-h-40 overflow-auto space-y-1">
                  {uploadResult.results.errors.map((error, index) => (
                    <Alert key={index} className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-800 text-sm">
                        Row {error.row}: {error.error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
