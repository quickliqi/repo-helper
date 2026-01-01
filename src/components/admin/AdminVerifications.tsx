import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Search, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Loader2,
  Eye,
  FileText,
  User
} from 'lucide-react';
import { format } from 'date-fns';

interface VerificationRequest {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  selfie_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  profile?: {
    full_name: string;
    email?: string;
  };
  user_role?: {
    role: string;
  };
}

export function AdminVerifications() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('verification_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch profiles and roles separately
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (req) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', req.user_id)
            .maybeSingle();

          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', req.user_id)
            .maybeSingle();

          return {
            ...req,
            profile: profileData,
            user_role: roleData,
          };
        })
      );

      setRequests(requestsWithProfiles as VerificationRequest[]);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      toast.error('Failed to load verification requests');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocumentUrls = async (request: VerificationRequest) => {
    try {
      // Create signed URLs for private bucket
      const { data: docData } = await supabase.storage
        .from('verification-documents')
        .createSignedUrl(request.document_url, 3600); // 1 hour expiry

      setDocumentUrl(docData?.signedUrl || null);

      if (request.selfie_url) {
        const { data: selfieData } = await supabase.storage
          .from('verification-documents')
          .createSignedUrl(request.selfie_url, 3600);
        setSelfieUrl(selfieData?.signedUrl || null);
      }
    } catch (error) {
      console.error('Error loading document URLs:', error);
    }
  };

  const handleReview = async (request: VerificationRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || '');
    setDocumentUrl(null);
    setSelfieUrl(null);
    await loadDocumentUrls(request);
  };

  const handleDecision = async (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      // Update the verification request status
      const { error } = await supabase
        .from('verification_requests')
        .update({
          status,
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // Create in-app notification for the user
      const notificationTitle = status === 'approved' 
        ? 'Verification Approved!' 
        : 'Verification Request Rejected';
      
      const notificationMessage = status === 'approved'
        ? 'Congratulations! Your identity has been verified. You now have full access to all platform features.'
        : `Your verification request was not approved.${adminNotes ? ` Reason: ${adminNotes}` : ' Please review the requirements and submit again.'}`;

      await supabase
        .from('notifications')
        .insert({
          user_id: selectedRequest.user_id,
          title: notificationTitle,
          message: notificationMessage,
          type: 'verification',
        });

      // Send email notification
      try {
        await supabase.functions.invoke('send-verification-email', {
          body: {
            user_id: selectedRequest.user_id,
            status,
            admin_notes: adminNotes || null,
          },
        });
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
        // Don't fail the whole operation if email fails
      }

      toast.success(`Verification ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Error processing verification:', error);
      toast.error('Failed to process verification');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      req.profile?.full_name?.toLowerCase().includes(searchLower) ||
      req.document_type.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-400"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const formatDocumentType = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-colors ${statusFilter === 'all' ? 'border-primary' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">All Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-colors ${statusFilter === 'pending' ? 'border-yellow-500' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {requests.filter(r => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-colors ${statusFilter === 'approved' ? 'border-green-500' : ''}`}
          onClick={() => setStatusFilter('approved')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {requests.filter(r => r.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-colors ${statusFilter === 'rejected' ? 'border-red-500' : ''}`}
          onClick={() => setStatusFilter('rejected')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {requests.filter(r => r.status === 'rejected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Verification Requests
              </CardTitle>
              <CardDescription>Review and approve user identity verifications</CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No verification requests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{request.profile?.full_name || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {request.user_role?.role || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {formatDocumentType(request.document_type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleReview(request)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Review Verification Request
            </DialogTitle>
            <DialogDescription>
              Review the submitted documents and approve or reject the verification
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2 font-medium">{selectedRequest.profile?.full_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Role:</span>
                    <Badge variant="outline" className="ml-2 capitalize">
                      {selectedRequest.user_role?.role}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Document:</span>
                    <span className="ml-2">{formatDocumentType(selectedRequest.document_type)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Submitted:</span>
                    <span className="ml-2">{format(new Date(selectedRequest.created_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Government ID
                  </h4>
                  {documentUrl ? (
                    <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={documentUrl} 
                        alt="ID Document" 
                        className="rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ) : (
                    <div className="bg-muted rounded-lg p-8 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading document...
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Selfie
                  </h4>
                  {selectedRequest.selfie_url ? (
                    selfieUrl ? (
                      <a href={selfieUrl} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={selfieUrl} 
                          alt="Selfie" 
                          className="rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      </a>
                    ) : (
                      <div className="bg-muted rounded-lg p-8 text-center text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Loading selfie...
                      </div>
                    )
                  ) : (
                    <div className="bg-muted rounded-lg p-8 text-center text-muted-foreground">
                      No selfie provided
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <h4 className="font-medium mb-2">Admin Notes</h4>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this verification (optional)..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setSelectedRequest(null)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDecision('rejected')}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                  Reject
                </Button>
                <Button 
                  onClick={() => handleDecision('approved')}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
