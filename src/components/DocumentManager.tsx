import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
// Assuming makeApiRequest is a wrapper around fetch or axios that handles headers, etc.
import { makeApiRequest } from '@/config/apiConfig';
import { toast } from 'sonner';
import { format } from 'date-fns';

// REVISED: Add mime_type, employee_name, department_name to the interface
interface DocumentAttachment {
    id: number;
    leave_id: number;
    original_name: string; // This will map to file_name from backend for display
    file_name: string; // The alias from backend for display
    mime_type: string; // Crucial for handling downloads/previews
    uploaded_at: string;
    employee_name: string; // From backend join
    department_name: string; // From backend join
    employee_id: number; // From backend join
}

interface DocumentManagerProps {
    userRole: 'manager' | 'admin';
    // You'll likely need to pass the user's department_name here for managers
    // or ensure makeApiRequest adds the auth token which carries this info.
    // For now, assuming userRole is sufficient and auth token handles internal checks.
}

export const DocumentManager = ({ userRole }: DocumentManagerProps) => {
    const [documents, setDocuments] = useState<DocumentAttachment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await makeApiRequest('/api/leave-documents', { // Adjusted endpoint as per previous backend code
                method: 'GET'
            });

            // MakeApiRequest should handle json() parsing if it's a JSON response
            // The backend's /leave-documents endpoint returns JSON directly
            const data = await response.json();
            console.log('Document fetch response:', data); // Debugging

            // The backend returns an array of documents directly, not an object with { success: true, documents: [...] }
            if (Array.isArray(data)) {
                setDocuments(data);
            } else {
                // Handle cases where backend might send an error object instead of array
                toast.error(data?.message ? `Failed to fetch documents: ${data.message}` : 'Failed to fetch documents');
            }
        } catch (error: any) {
            console.error('Error fetching documents:', error);
            const errorMessage = error.response?.data?.message || 'Failed to fetch documents. Network error or server issue.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // REVISED: This function now handles direct binary responses from the backend
    const downloadDocument = async (document: DocumentAttachment) => {
        try {
            const response = await makeApiRequest(`/api/leave-documents/${document.id}/download`, { // Adjusted endpoint
                method: 'GET',
                responseType: 'blob' // IMPORTANT: Tell makeApiRequest to expect a blob, not JSON
                                    // You'll need to modify makeApiRequest to support this.
                                    // If makeApiRequest uses fetch, you'd check response.blob()
                                    // If makeApiRequest uses axios, this option is standard.
            });

            // Check if the request was successful
            if (!response.ok) { // For fetch API, check 'ok' status
                // Attempt to read error message if it's JSON
                const errorText = await response.text();
                let errorMessage = `Failed to download document: Status ${response.status}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorMessage;
                } catch (e) {
                    // Not JSON, use generic message
                }
                toast.error(errorMessage);
                return;
            }

            // Get the blob data from the response
            const blob = await response.blob();
            const fileURL = window.URL.createObjectURL(blob);

            // Determine if the file should be displayed or downloaded
            const isDisplayable = document.mime_type.includes('pdf') || document.mime_type.includes('image') || document.mime_type.includes('text');

            if (isDisplayable) {
                window.open(fileURL, '_blank');
                toast.success(`Opening "${document.original_name}" in new tab.`);
            } else {
                const link = document.createElement('a');
                link.href = fileURL;
                link.download = document.original_name; // Use original_name for the downloaded file
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success('Document downloaded successfully');
            }

            window.URL.revokeObjectURL(fileURL); // Clean up the object URL

        } catch (error) {
            console.error('Error downloading document:', error);
            toast.error('Failed to download document. Please try again.');
        }
    };


    useEffect(() => {
        // Only fetch if the user has the required role
        if (userRole === 'admin' || userRole === 'manager') {
            fetchDocuments();
        } else {
            setLoading(false);
            toast.error("You don't have permission to view documents.");
        }
    }, [userRole]); // Rerun effect if userRole changes

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading documents...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
                    <p className="text-muted-foreground">
                        View and manage leave request attachments from your team
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Leave Request Documents ({documents.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {documents.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                            <p className="text-muted-foreground">
                                No leave request attachments have been uploaded yet.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Leave ID</TableHead>
                                        <TableHead>Employee</TableHead> {/* NEW */}
                                        <TableHead>Department</TableHead> {/* NEW */}
                                        <TableHead>File Name</TableHead>
                                        <TableHead>Upload Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.map((doc) => (
                                        <TableRow key={doc.id}>
                                            <TableCell className="font-medium">
                                                #{doc.leave_id}
                                            </TableCell>
                                            <TableCell>{doc.employee_name}</TableCell> {/* NEW */}
                                            <TableCell>{doc.department_name}</TableCell> {/* NEW */}
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    <span className="font-medium">{doc.original_name}</span> {/* Use original_name for display */}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {/* Ensure doc.uploaded_at is a valid date string */}
                                                {doc.uploaded_at ? format(new Date(doc.uploaded_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => downloadDocument(doc)} // Pass the whole doc object
                                                    className="flex items-center gap-1"
                                                >
                                                    <Download className="h-3 w-3" />
                                                    Download
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};