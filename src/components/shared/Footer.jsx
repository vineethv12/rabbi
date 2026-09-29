import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Youtube, MapPin, Phone, Mail, ArrowRight, GraduationCap } from "lucide-react";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Courses Offered", href: "/courses" },
  { label: "About Us", href: "/about" },
  { label: "Our Franchises", href: "/franchises" },
  { label: "Learn Abacus Videos", href: "/learn-abacus" },
  { label: "Gallery", href: "/gallery" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Contact Us", href: "/contact" },
];

const programs = [
  { label: "Abacus Foundation", href: "/courses?category=Abacus" },
  { label: "Vedic Mathematics", href: "/courses?category=Vedic+Maths" },
  { label: "Abacus Tutor Training", href: "/courses?category=Abacus+Tutor+Training" },
  { label: "Vedic Maths Tutor Training", href: "/courses?category=Vedic+Maths+Tutor+Training" },
  { label: "Franchise Program", href: "/franchises" },
  { label: "National Championship", href: "/" },
];

const socials = [
  { icon: Facebook, href: "https://www.facebook.com/rabbiacademyblr/", label: "Facebook" },
  { icon: Instagram, href: "https://www.instagram.com/rabbiglobalacademy/", label: "Instagram" },
  { icon: Linkedin, href: "https://www.linkedin.com/in/rabbi-academy-64175a281/", label: "LinkedIn" },
  { icon: Youtube, href: "https://www.youtube.com/@RabbiGlobalAcademy", label: "YouTube" },
];

function FooterHeading({ children }) {
  return (
    <h3 className="text-white font-serif font-bold text-base mb-5 flex items-center gap-2.5">
      <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
      {children}
      <span className="flex-1 h-px bg-white/10" />
    </h3>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main footer columns */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

            {/* Col 1: Brand */}
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-5 group">
                <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform flex-shrink-0 overflow-hidden">
                  <img
                    src="/images/rabbi-logo-transparent.webp"
                    alt="Rabbi Global Academy"
                    className="h-full w-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div>
                  <p className="font-serif font-bold text-lg leading-tight text-white">RABBI GLOBAL ACADEMY</p>
                  <p className="text-xs text-secondary font-semibold tracking-widest uppercase mt-0.5">Learn From Master</p>
                </div>
              </Link>
              <p className="text-white text-sm leading-relaxed mb-5">
                Empowering young minds with world-class Abacus and Vedic Mathematics. Over 17 years of excellence in skill-based education across Karnataka.
              </p>
              <div className="flex items-center gap-3">
                {socials.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary transition-colors duration-200"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <FooterHeading>Quick Links</FooterHeading>
              <ul className="space-y-2.5">
                {quickLinks.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="text-white hover:text-secondary transition-colors text-sm flex items-center gap-2 group"
                    >
                      <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-secondary shrink-0" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Programs */}
            <div>
              <FooterHeading>Our Programs</FooterHeading>
              <ul className="space-y-2.5">
                {programs.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="text-white hover:text-secondary transition-colors text-sm flex items-center gap-2 group"
                    >
                      <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-secondary shrink-0" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Contact */}
            <div>
              <FooterHeading>Contact Us</FooterHeading>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-white">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-secondary" />
                  </div>
                  <span className="leading-relaxed">Rabbi Global Academy<br />105, 1st Cross Rd, behind Petra Nilaya Convent, Kannuru, Bengaluru, Chikkagubbi,<br />Karnataka 560077</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-white">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <a href="tel:+919686801874" className="hover:text-secondary transition-colors block">+91 96868 01874</a>
                    <a href="tel:+917676539595" className="hover:text-secondary transition-colors block">+91 7676539595</a>
                  </div>
                </li>
                <li className="flex items-center gap-3 text-sm text-white">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-secondary" />
                  </div>
                  <a href="mailto:info@rabbiglobalacademy.com" className="hover:text-secondary transition-colors">info@rabbiglobalacademy.com</a>
                </li>
              </ul>

            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white">
          <p>© {year} Rabbi Global Academy. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
