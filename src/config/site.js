// Central SEO / site configuration.
// If the production domain changes, update SITE_URL here only.
export const SITE_URL = "https://www.rabbiglobalacademy.com";
export const SITE_NAME = "Rabbi Global Academy";
export const DEFAULT_TITLE = "Rabbi Global Academy — Learn From Master";
export const DEFAULT_DESCRIPTION =
  "Rabbi Global Academy — Karnataka's premier institution for Abacus, Vedic Mathematics, and cognitive development. 17+ years of excellence across 40+ centers.";
export const DEFAULT_OG_IMAGE = "/images/rabbi-logo.jpeg";

// Contact details (single source of truth).
export const PHONE_NUMBER = "+91 96868 01874";
export const WHATSAPP_NUMBER = "919686801874"; // digits only, country code first
export const WHATSAPP_DEFAULT_MESSAGE =
  "Hi, I'm interested in Rabbi Global Academy programs. Please share the details.";

// Build a click-to-chat link that opens WhatsApp with a pre-filled message.
export function whatsappLink(message = WHATSAPP_DEFAULT_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Build a "share to WhatsApp" link (opens the contact picker) with given text.
export function whatsappShareLink(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export const SOCIAL_LINKS = [
  "https://www.instagram.com/rabbiglobalacademy/",
  "https://www.facebook.com/rabbiacademyblr/",
  "https://www.youtube.com/@RabbiGlobalAcademy",
  "https://www.linkedin.com/in/rabbi-academy-64175a281/",
];

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: SITE_NAME,
  alternateName: "Rabbi Academy",
  url: SITE_URL,
  logo: `${SITE_URL}/images/rabbi-logo.jpeg`,
  description: DEFAULT_DESCRIPTION,
  foundingDate: "2008",
  sameAs: SOCIAL_LINKS,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Bengaluru",
    addressRegion: "Karnataka",
    addressCountry: "IN",
  },
  areaServed: "IN",
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
};

function courseEntity(name, description) {
  return {
    "@type": "Course",
    name,
    description,
    provider: {
      "@type": "EducationalOrganization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function courseJsonLd(name, description) {
  return { "@context": "https://schema.org", ...courseEntity(name, description) };
}

export function courseListJsonLd(courses) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: courses.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: courseEntity(c.name, c.description),
    })),
  };
}
