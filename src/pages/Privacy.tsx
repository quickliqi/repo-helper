import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';

export default function Privacy() {
  return (
    <MainLayout>
      <div className="bg-background min-h-screen">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-8">
            <h1 className="font-display text-3xl font-bold text-foreground">
              Privacy Policy
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
                <h2 className="text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
                <p className="text-muted-foreground">
                  DealMatch ("we," "our," or "us") is committed to protecting your privacy. This Privacy 
                  Policy explains how we collect, use, disclose, and safeguard your information when you 
                  use our real estate marketplace platform. Please read this policy carefully.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">2. Information We Collect</h2>
                
                <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Personal Information</h3>
                <p className="text-muted-foreground mb-2">We may collect the following personal information:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Name, email address, phone number</li>
                  <li>Company name and business information</li>
                  <li>City, state, and location data</li>
                  <li>Profile photos and biographical information</li>
                  <li>Government-issued ID documents for verification</li>
                  <li>Payment and billing information</li>
                </ul>

                <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Usage Information</h3>
                <p className="text-muted-foreground mb-2">We automatically collect:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Device information and browser type</li>
                  <li>IP address and location data</li>
                  <li>Pages visited and features used</li>
                  <li>Time spent on the platform</li>
                  <li>Referring websites and search terms</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-2">We use collected information to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Provide and maintain our Service</li>
                  <li>Process transactions and send related information</li>
                  <li>Verify user identity and prevent fraud</li>
                  <li>Match properties with buyer criteria</li>
                  <li>Send notifications about matches and updates</li>
                  <li>Respond to customer service requests</li>
                  <li>Improve and personalize user experience</li>
                  <li>Analyze usage patterns and trends</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. Information Sharing</h2>
                <p className="text-muted-foreground mb-2">We may share your information with:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li><strong>Other Users:</strong> Your profile information and listings are visible to other users as necessary for the Service to function</li>
                  <li><strong>Service Providers:</strong> Third parties that help us operate the Service (payment processors, email services, hosting providers)</li>
                  <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental authority</li>
                  <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                  <li><strong>With Your Consent:</strong> For any other purpose with your explicit consent</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Security</h2>
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational security measures to protect your 
                  personal information. This includes encryption of data in transit and at rest, secure 
                  authentication systems, and regular security assessments. However, no method of 
                  transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. Data Retention</h2>
                <p className="text-muted-foreground">
                  We retain your personal information for as long as your account is active or as needed 
                  to provide you services. We may retain certain information as required by law or for 
                  legitimate business purposes, such as resolving disputes and enforcing our agreements.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Your Rights</h2>
                <p className="text-muted-foreground mb-2">Depending on your location, you may have the right to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Access the personal information we hold about you</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of your personal information</li>
                  <li>Object to or restrict certain processing</li>
                  <li>Data portability (receive your data in a structured format)</li>
                  <li>Withdraw consent where processing is based on consent</li>
                  <li>Lodge a complaint with a supervisory authority</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  To exercise these rights, please contact us at privacy@dealmatch.com.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">8. Cookies and Tracking</h2>
                <p className="text-muted-foreground">
                  We use cookies and similar tracking technologies to enhance your experience, analyze 
                  usage, and provide personalized content. You can control cookie settings through your 
                  browser preferences. Note that disabling cookies may affect the functionality of certain 
                  features.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">9. Third-Party Services</h2>
                <p className="text-muted-foreground">
                  Our Service may contain links to third-party websites or integrate with third-party 
                  services. We are not responsible for the privacy practices of these third parties. 
                  We encourage you to review the privacy policies of any third-party services you access.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">10. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our Service is not intended for individuals under 18 years of age. We do not knowingly 
                  collect personal information from children. If we become aware that we have collected 
                  information from a child under 18, we will take steps to delete such information.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">11. California Privacy Rights</h2>
                <p className="text-muted-foreground">
                  California residents have additional rights under the California Consumer Privacy Act 
                  (CCPA), including the right to know what personal information is collected, the right 
                  to delete personal information, and the right to opt-out of the sale of personal 
                  information. We do not sell personal information.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">12. International Transfers</h2>
                <p className="text-muted-foreground">
                  Your information may be transferred to and processed in countries other than your 
                  country of residence. These countries may have different data protection laws. By 
                  using our Service, you consent to such transfers.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">13. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of any changes 
                  by posting the new policy on this page and updating the "Last updated" date. You are 
                  advised to review this policy periodically for any changes.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">14. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy or our data practices, please 
                  contact us at:
                </p>
                <ul className="list-none text-muted-foreground mt-2 space-y-1">
                  <li>Email: privacy@dealmatch.com</li>
                  <li>Address: DealMatch Inc., 123 Main Street, Wilmington, DE 19801</li>
                </ul>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
