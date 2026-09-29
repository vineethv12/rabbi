import { Link } from "react-router-dom";
import { AppLayout } from "@/components/shared/AppLayout";
import { Seo } from "@/components/shared/Seo";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
export function Privacy() {
  return <AppLayout>
      <Seo
        title="Privacy Policy"
        description="How Rabbi Global Academy collects, uses, and protects your personal information."
        path="/privacy"
      />
      <section
        className="relative overflow-hidden text-white py-20"
        style={{ background: "linear-gradient(135deg, #142d50 0%, #0f2745 55%, #173861 100%)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.08),_transparent_40%)]" />
        <div className="absolute -left-16 top-10 w-72 h-72 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-80 h-80 rounded-full bg-sky-300/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-1 left-0 w-full overflow-hidden leading-none pointer-events-none">
          <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="w-full h-16 fill-background">
            <path d="M0,80 C300,0 900,80 1200,0 L1200,80 Z" />
          </svg>
        </div>
        <div className="container px-4 relative z-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-5 py-2 text-secondary text-xs font-bold uppercase tracking-widest backdrop-blur-sm mb-6">
            <ShieldCheck className="h-3.5 w-3.5" /> Legal & Privacy
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4 leading-tight">
            Privacy <span className="text-secondary">Policy</span>
          </h1>
          <p className="text-white/70 text-lg">
            We are committed to protecting the privacy of our students, parents, and partners.
          </p>
          <p className="text-white/45 text-sm mt-3">Last Updated: October 15, 2024</p>
        </div>
      </section>

      <div className="container px-4 py-16 max-w-6xl mx-auto flex flex-col md:flex-row gap-12">
        {
    /* Table of contents sticky sidebar */
  }
        <aside className="md:w-1/4 hidden md:block">
          <div className="sticky top-28 bg-white p-6 rounded-xl border border-border shadow-sm">
            <h3 className="font-serif font-bold text-primary mb-4">Contents</h3>
            <ul className="space-y-3 text-sm text-foreground font-medium">
              <li><a href="#intro" className="hover:text-secondary transition-colors">1. Introduction</a></li>
              <li><a href="#collect" className="hover:text-secondary transition-colors">2. Information We Collect</a></li>
              <li><a href="#use" className="hover:text-secondary transition-colors">3. How We Use Information</a></li>
              <li><a href="#sharing" className="hover:text-secondary transition-colors">4. Sharing & Disclosure</a></li>
              <li><a href="#cookies" className="hover:text-secondary transition-colors">5. Cookies & Tracking</a></li>
              <li><a href="#retention" className="hover:text-secondary transition-colors">6. Data Retention</a></li>
              <li><a href="#children" className="hover:text-secondary transition-colors text-primary font-bold">7. Children's Privacy</a></li>
              <li><a href="#rights" className="hover:text-secondary transition-colors">8. Your Rights</a></li>
              <li><a href="#security" className="hover:text-secondary transition-colors">9. Data Security</a></li>
              <li><a href="#thirdparty" className="hover:text-secondary transition-colors">10. Third-Party Services</a></li>
              <li><a href="#changes" className="hover:text-secondary transition-colors">11. Changes to Policy</a></li>
              <li><a href="#contact" className="hover:text-secondary transition-colors">12. Contact Us</a></li>
            </ul>
          </div>
        </aside>

        {
    /* Policy Body */
  }
        <div className="md:w-3/4 space-y-10 text-foreground leading-relaxed">
          <section id="intro">
            <h2 className="text-2xl font-serif font-bold text-primary mb-4">1. Introduction</h2>
            <p>Welcome to Rabbi Global Academy ("we", "our", or "us"). We are committed to protecting the privacy and security of our students, parents, franchise partners, and website visitors. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, enroll in our programs, or interact with our centers across Karnataka and India.</p>
          </section>

          <section id="collect">
            <h2 className="text-2xl font-serif font-bold text-primary mb-4">2. Information We Collect</h2>
            <p className="mb-3">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4 text-foreground">
              <li><strong>Parent/Guardian Information:</strong> Names, email addresses, phone numbers, and physical addresses collected during inquiry or enrollment.</li>
              <li><strong>Student Information:</strong> Names, age, grade level, school, and academic performance history strictly for enrollment and progress tracking.</li>
              <li><strong>Payment Information:</strong> Financial data processed securely through our payment partners (we do not store full credit card details).</li>
              <li><strong>Franchise Inquiry Data:</strong> Business details, investment capacity, and professional background for prospective partners.</li>
            </ul>
            <p>We may also automatically collect certain technical data when you visit our website, such as IP addresses, browser types, and usage patterns to improve our digital services.</p>
          </section>

          <section id="use">
            <h2 className="text-2xl font-serif font-bold text-primary mb-4">3. How We Use Your Information</h2>
            <p>The information we collect is primarily used to provide and improve our educational services. Specifically, we use your data to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Process enrollments and manage student accounts.</li>
              <li>Communicate with parents regarding student progress, attendance, and center updates.</li>
              <li>Evaluate franchise inquiries and facilitate business partnerships.</li>
              <li>Send administrative notices, invoices, and payment receipts.</li>
              <li>Improve our curriculum, teaching methodologies, and website experience.</li>
            </ul>
          </section>

          <section id="sharing">
            <h2 className="text-2xl font-serif font-bold text-primary mb-4">4. Sharing & Disclosure</h2>
            <p>We do not sell, rent, or trade your personal information to third parties for marketing purposes. We may share data only under the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>With Franchise Centers:</strong> Information is shared with the specific local center where the student is enrolled.</li>
              <li><strong>Service Providers:</strong> With trusted third-party vendors who assist us in operating our website, conducting our business, or processing payments, under strict confidentiality agreements.</li>
              <li><strong>Legal Compliance:</strong> When required by law, court order, or governmental regulation in India.</li>
            </ul>
          </section>

          <section id="cookies">
            <h2 className="text-2xl font-serif font-bold text-primary mb-4">5. Cookies & Tracking</h2>
            <p>Our website uses cookies and similar tracking technologies to enhance user experience, analyze site traffic, and understand where our audience originates. You can set your browser to refuse all or some browser cookies, but this may affect the functionality of certain website features.</p>
          </section>

          <section id="retention">
            <h2 className="text-2xl font-serif font-bold text-primary mb-4">6. Data Retention</h2>
            <p>We retain personal information only for as long as necessary to fulfill the educational or business purposes for which it was collected, comply with our legal obligations, resolve disputes, and enforce our agreements. Student progress records are archived securely to allow for re-enrollment or certification verifications in the future.</p>
          </section>

          <section id="children" className="bg-primary/5 p-6 rounded-xl border border-primary/10">
            <h2 className="text-2xl font-serif font-bold text-primary mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-secondary rounded-full inline-block" />
              7. Children's Privacy
            </h2>
            <p>As an educational institution, protecting children's privacy is our highest priority. We do not knowingly collect personal information directly from children under the age of 13 online. All enrollments and data submissions must be made by a parent or legal guardian. Student profiles, photographs, and achievements are never published publicly on our website or social media without explicit written consent from the parents.</p>
          </section>

          <section id="rights">
            <h2 className="text-2xl font-serif font-bold text-primary mb-4">8. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to access, correct, update, or request deletion of your personal information. Parents have full rights to access their child's records. To exercise these rights, please contact your local center head or email our administration team directly.</p>
          </section>

          <section id="security">
            <h2 className="text-2xl font-serif font-bold text-primary mb-4">9. Data Security</h2>
            <p>We implement appropriate technical and organizational security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, please be aware that no method of transmission over the internet or electronic storage is 100% secure.</p>
          </section>

          <section id="thirdparty">
            <h2 className="text-2xl font-serif font-bold text-primary mb-4">10. Third-Party Services</h2>
            <p>Our website may contain links to external sites (such as educational portals or payment gateways). We are not responsible for the privacy practices or the content of these third-party websites. We encourage you to read their respective privacy policies.</p>
          </section>

          <section id="changes">
            <h2 className="text-2xl font-serif font-bold text-primary mb-4">11. Changes to This Policy</h2>
            <p>We may update our Privacy Policy periodically to reflect changes in our practices or regulatory requirements. We will notify you of any significant changes by posting the new policy on this page with an updated "Last Updated" date.</p>
          </section>

          <section id="contact">
            <h2 className="text-2xl font-serif font-bold text-primary mb-4">12. Contact Us</h2>
            <p>If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:</p>
            <div className="bg-muted/50 p-6 rounded-xl mt-4 space-y-2">
              <p><strong>Rabbi Global Academy HQ</strong></p>
              <p>105, 1st Cross Rd, behind Petra Nilaya Convent, Kannuru, Bengaluru, Chikkagubbi, Karnataka 560077</p>
              <p><strong>Email:</strong> privacy@rabbiglobalacademy.com</p>
              <p><strong>Phone:</strong> +91 98450 12345</p>
            </div>
            
            <div className="mt-12 text-center">
              <Separator className="mb-8" />
              <p className="mb-4 text-primary font-medium">Need to speak with us directly?</p>
              <Button asChild className="bg-primary hover:bg-primary/90 text-white rounded-full px-8">
                <Link to="/contact">Go to Contact Page</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>;
}
