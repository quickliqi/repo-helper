import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';

export default function Terms() {
  return (
    <MainLayout>
      <div className="bg-background min-h-screen">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-8">
            <h1 className="font-display text-3xl font-bold text-foreground">
              Terms of Service
            </h1>
            <p className="text-muted-foreground mt-2">
              Last updated: January 1, 2026
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="prose prose-sm dark:prose-invert max-w-none pt-6 space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing or using DealMatch ("the Service"), you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use the Service. We reserve the right to 
                  update these terms at any time, and your continued use of the Service constitutes acceptance 
                  of any changes.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">2. Description of Service</h2>
                <p className="text-muted-foreground">
                  DealMatch is a real estate marketplace platform that connects wholesalers with investors. 
                  The Service provides tools for posting property deals, creating buy boxes, matching deals 
                  with buyer criteria, and facilitating connections between parties. We do not provide real 
                  estate, legal, or financial advice.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. User Accounts</h2>
                <p className="text-muted-foreground mb-2">
                  To use certain features of the Service, you must create an account. You agree to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Maintain and promptly update your account information</li>
                  <li>Maintain the security of your password and account</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. Identity Verification</h2>
                <p className="text-muted-foreground">
                  Users may be required to complete identity verification to access certain features. 
                  By submitting verification documents, you confirm that all information provided is 
                  accurate and that you have the legal right to provide such documents. We reserve the 
                  right to reject or revoke verification status at our discretion.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. User Conduct</h2>
                <p className="text-muted-foreground mb-2">You agree not to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Post false, misleading, or fraudulent property listings</li>
                  <li>Misrepresent your identity or qualifications</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Use the Service for any illegal purpose</li>
                  <li>Attempt to gain unauthorized access to the Service or other accounts</li>
                  <li>Interfere with or disrupt the Service or servers</li>
                  <li>Scrape, harvest, or collect user information without consent</li>
                  <li>Use automated systems to access the Service without permission</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. Property Listings</h2>
                <p className="text-muted-foreground">
                  Users who post property listings represent and warrant that they have the legal right 
                  to market such properties, all information is accurate to the best of their knowledge, 
                  and the listing complies with all applicable laws and regulations. DealMatch does not 
                  verify the accuracy of listings and is not responsible for any misrepresentations.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Fees and Payments</h2>
                <p className="text-muted-foreground">
                  Certain features of the Service require payment. All fees are non-refundable unless 
                  otherwise stated. We reserve the right to change our pricing at any time. Subscription 
                  fees are billed in advance on a recurring basis. You are responsible for providing 
                  valid payment information and for all charges incurred under your account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">8. Intellectual Property</h2>
                <p className="text-muted-foreground">
                  The Service and its original content, features, and functionality are owned by DealMatch 
                  and are protected by intellectual property laws. You retain ownership of content you 
                  submit but grant us a license to use, display, and distribute such content in connection 
                  with the Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">9. Disclaimer of Warranties</h2>
                <p className="text-muted-foreground">
                  THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE 
                  THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE. WE ARE NOT RESPONSIBLE 
                  FOR THE CONDUCT OF USERS OR THE ACCURACY OF PROPERTY LISTINGS. ANY TRANSACTIONS 
                  BETWEEN USERS ARE SOLELY BETWEEN THOSE PARTIES.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">10. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, DEALMATCH SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                  INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR 
                  REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, 
                  OR OTHER INTANGIBLE LOSSES.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">11. Indemnification</h2>
                <p className="text-muted-foreground">
                  You agree to indemnify and hold harmless DealMatch and its officers, directors, employees, 
                  and agents from any claims, damages, losses, liabilities, and expenses arising from your 
                  use of the Service or violation of these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">12. Termination</h2>
                <p className="text-muted-foreground">
                  We may terminate or suspend your account and access to the Service immediately, without 
                  prior notice, for any reason, including breach of these Terms. Upon termination, your 
                  right to use the Service will immediately cease.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">13. Governing Law</h2>
                <p className="text-muted-foreground">
                  These Terms shall be governed by the laws of the State of Delaware, without regard to 
                  its conflict of law provisions. Any disputes shall be resolved in the courts of Delaware.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">14. Contact Information</h2>
                <p className="text-muted-foreground">
                  If you have any questions about these Terms, please contact us at legal@dealmatch.com.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
