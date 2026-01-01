import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Shield, 
  Upload, 
  FileCheck, 
  Loader2, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  Camera,
  CreditCard,
  FileText,
  User
} from 'lucide-react';

type DocumentType = 'drivers_license' | 'passport';

const DOCUMENT_TYPES: { value: DocumentType; label: string; icon: React.ReactNode }[] = [
  { value: 'drivers_license', label: "Driver's License", icon: <CreditCard className="h-5 w-5" /> },
  { value: 'passport', label: 'Passport', icon: <FileText className="h-5 w-5" /> },
];

export default function Verify() {
  const { user, profile, role, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [documentType, setDocumentType] = useState<DocumentType>('drivers_license');
  const [frontIdFile, setFrontIdFile] = useState<File | null>(null);
  const [backIdFile, setBackIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [frontIdPreview, setFrontIdPreview] = useState<string | null>(null);
  const [backIdPreview, setBackIdPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<{ status: string; created_at: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      checkExistingRequest();
    }
  }, [user?.id]);

  const checkExistingRequest = async () => {
    if (!user?.id) return;

    const { data } = await supabase
      .from('verification_requests')
      .select('status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setExistingRequest(data);
    setIsLoading(false);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    type: 'front' | 'back' | 'selfie'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be less than 10MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'front') {
        setFrontIdFile(file);
        setFrontIdPreview(reader.result as string);
      } else if (type === 'back') {
        setBackIdFile(file);
        setBackIdPreview(reader.result as string);
      } else {
        setSelfieFile(file);
        setSelfiePreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { error: uploadError } = await supabase.storage
      .from('verification-documents')
      .upload(path, file, { upsert: true });

    if (uploadError) throw uploadError;

    return path;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to verify your identity');
      return;
    }

    if (!frontIdFile) {
      toast.error('Please upload the front of your ID');
      return;
    }

    if (!backIdFile && documentType === 'drivers_license') {
      toast.error('Please upload the back of your ID');
      return;
    }

    if (!selfieFile) {
      toast.error('Please upload a selfie holding your ID');
      return;
    }

    setIsSubmitting(true);
    try {
      const timestamp = Date.now();
      
      // Upload front of ID
      const frontPath = `${user.id}/${timestamp}-front.${frontIdFile.name.split('.').pop()}`;
      const frontUrl = await uploadFile(frontIdFile, frontPath);
      
      // Upload back of ID (if driver's license)
      let backUrl: string | undefined;
      if (backIdFile) {
        const backPath = `${user.id}/${timestamp}-back.${backIdFile.name.split('.').pop()}`;
        backUrl = await uploadFile(backIdFile, backPath);
      }
      
      // Upload selfie holding ID
      const selfiePath = `${user.id}/${timestamp}-selfie.${selfieFile.name.split('.').pop()}`;
      const selfieUrl = await uploadFile(selfieFile, selfiePath);

      // Combine front and back URLs for document_url field
      const documentUrl = backUrl ? `${frontUrl}|${backUrl}` : frontUrl;

      const { error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          document_type: documentType,
          document_url: documentUrl,
          selfie_url: selfieUrl,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Verification request submitted successfully');
      await refreshProfile();
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast.error('Failed to submit verification request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  // Already verified
  if (profile?.verification_status === 'approved' || profile?.is_verified) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-6">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">You're Verified!</h1>
          <p className="text-muted-foreground mb-6">
            Your identity has been verified. You have full access to all platform features.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Pending request
  if (existingRequest?.status === 'pending') {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 p-6">
              <Clock className="h-12 w-12 text-yellow-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Verification Pending</h1>
          <p className="text-muted-foreground mb-6">
            Your verification request is being reviewed. This usually takes 1-2 business days.
            We'll notify you once your verification is complete.
          </p>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </MainLayout>
    );
  }

  const isFormComplete = frontIdFile && selfieFile && (documentType === 'passport' || backIdFile);

  return (
    <MainLayout>
      <div className="bg-background min-h-screen">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="font-display text-3xl font-bold text-foreground">
                Identity Verification
              </h1>
            </div>
            <p className="text-muted-foreground">
              Complete verification to access all platform features
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Rejected alert */}
            {existingRequest?.status === 'rejected' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Previous Request Rejected</AlertTitle>
                <AlertDescription>
                  Your previous verification was not approved. Please ensure your documents are clear, valid, and that your selfie clearly shows you holding your ID.
                </AlertDescription>
              </Alert>
            )}

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Requirements</CardTitle>
                <CardDescription>
                  To verify your identity, you'll need to provide the following:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">1</div>
                    <div>
                      <p className="font-medium">Front of your ID</p>
                      <p className="text-muted-foreground">Clear photo of the front of your driver's license or passport</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">2</div>
                    <div>
                      <p className="font-medium">Back of your ID</p>
                      <p className="text-muted-foreground">Clear photo of the back of your driver's license (not required for passport)</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">3</div>
                    <div>
                      <p className="font-medium">Selfie holding your ID</p>
                      <p className="text-muted-foreground">Photo of yourself holding your ID next to your face</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Document Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Select Document Type
                </CardTitle>
                <CardDescription>
                  Choose the type of government-issued ID you'll upload
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={documentType} 
                  onValueChange={(v) => setDocumentType(v as DocumentType)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {DOCUMENT_TYPES.map((doc) => (
                    <Label
                      key={doc.value}
                      htmlFor={doc.value}
                      className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                        documentType === doc.value 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value={doc.value} id={doc.value} />
                      {doc.icon}
                      <span>{doc.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Document Uploads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Documents
                </CardTitle>
                <CardDescription>
                  Upload clear photos of your ID and selfie
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Front of ID */}
                <div>
                  <Label className="block mb-2 font-medium">
                    Front of {documentType === 'passport' ? 'Passport' : "Driver's License"} *
                  </Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    {frontIdPreview ? (
                      <div className="space-y-4">
                        <img 
                          src={frontIdPreview} 
                          alt="Front of ID" 
                          className="max-h-48 mx-auto rounded-lg"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setFrontIdFile(null);
                            setFrontIdPreview(null);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'front')}
                        />
                        <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload front of ID
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG up to 10MB
                        </p>
                      </label>
                    )}
                  </div>
                </div>

                {/* Back of ID (for driver's license only) */}
                {documentType === 'drivers_license' && (
                  <div>
                    <Label className="block mb-2 font-medium">
                      Back of Driver's License *
                    </Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                      {backIdPreview ? (
                        <div className="space-y-4">
                          <img 
                            src={backIdPreview} 
                            alt="Back of ID" 
                            className="max-h-48 mx-auto rounded-lg"
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setBackIdFile(null);
                              setBackIdPreview(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'back')}
                          />
                          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload back of ID
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG up to 10MB
                          </p>
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* Selfie holding ID */}
                <div>
                  <Label className="block mb-2 font-medium">
                    Selfie Holding Your ID *
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Take a clear photo of yourself holding your ID next to your face. Make sure both your face and the ID are clearly visible.
                  </p>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    {selfiePreview ? (
                      <div className="space-y-4">
                        <img 
                          src={selfiePreview} 
                          alt="Selfie with ID" 
                          className="max-h-48 mx-auto rounded-lg"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelfieFile(null);
                            setSelfiePreview(null);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'selfie')}
                        />
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <User className="h-10 w-10 text-muted-foreground" />
                          <span className="text-muted-foreground">+</span>
                          <CreditCard className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Click to upload selfie holding your ID
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG up to 10MB
                        </p>
                      </label>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button 
              size="lg" 
              className="w-full" 
              onClick={handleSubmit}
              disabled={isSubmitting || !isFormComplete}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Submit for Verification
                </>
              )}
            </Button>

            {!isFormComplete && (
              <p className="text-sm text-center text-destructive">
                Please upload all required documents to submit
              </p>
            )}

            <p className="text-xs text-center text-muted-foreground">
              Your documents are encrypted and securely stored. They will only be used for verification purposes.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
