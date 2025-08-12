// src/components/DocumentManager.tsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { makeApiRequest, apiConfig } from '@/config/apiConfig';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DocumentAttachment {
    id: number;
    leave_id: number;
    original_name: string;
    file_data: string;
    file_type: string;
    uploaded_at: string;
}

interface DocumentManagerProps {
    userRole: 'manager' | 'admin' | 'CD';
}

export const DocumentManager = ({ userRole }: DocumentManagerProps) => {
    const [documents, setDocuments] = useState<DocumentAttachment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await makeApiRequest(apiConfig.endpoints.leaveDocuments, {
                method: 'GET'
            });

            const data = await response.json();
            console.log('Document fetch response:', data);

            if (data && data.success && Array.isArray(data.documents)) {
                setDocuments(data.documents);
            } else {
                toast.error(data?.message ? `Failed to fetch documents: ${data.message}` : 'Failed to fetch documents');
            }
        } catch (error: any) {
            console.error('Error fetching documents:', error);
            const errorMessage = error.message || 'Failed to fetch documents. Network error or server issue.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const downloadDocument = async (document: DocumentAttachment) => {
        try {
            const downloadUrl = `${apiConfig.endpoints.leaveDocuments}/${document.id}/download`;

            const response = await makeApiRequest(downloadUrl, {
                method: 'GET',
                responseType: 'blob' // IMPORTANT: Request blob response
            });

            const blob = await response.blob();
            const fileURL = window.URL.createObjectURL(blob);

            // Use document.file_type for content type check
            const isDisplayable = document.file_type.includes('pdf') || document.file_type.includes('image') || document.file_type.includes('text');

            if (isDisplayable) {
                window.open(fileURL, '_blank');
                toast.success(`Opening "${document.original_name}" in new tab.`);
            } else {
                const link = window.document.createElement('a');
                link.href = fileURL;
                link.download = document.original_name;
                window.document.body.appendChild(link);
                link.click();
                window.document.body.removeChild(link);
                toast.success('Document downloaded successfully');
            }

            window.URL.revokeObjectURL(fileURL); // Clean up the object URL

        } catch (error: any) {
            console.error('Error downloading document:', error);
            const errorMessage = error.message || 'Failed to download document. Please try again.';
            toast.error(errorMessage);
        }
    };

    useEffect(() => {
        if (userRole === 'admin' || userRole === 'manager' || userRole === 'CD') {
            fetchDocuments();
        } else {
            setLoading(false);
            toast.error("You don't have permission to view documents.");
        }
    }, [userRole]);

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
                                        <TableHead>Original Name</TableHead>
                                        <TableHead>File Type</TableHead>
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
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    <span className="font-medium">{doc.original_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{doc.file_type}</TableCell>
                                            <TableCell className="text-sm">
                                                {doc.uploaded_at ? format(new Date(doc.uploaded_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => downloadDocument(doc)}
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