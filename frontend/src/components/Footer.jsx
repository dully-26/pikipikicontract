import { Mail, Phone } from 'lucide-react';

// TODO: Replace these with your real social media URLs
const socialLinks = {
  facebook: 'https://facebook.com/yourpage',
  instagram: 'https://instagram.com/yourpage',
  twitter: 'https://twitter.com/yourpage',
  linkedin: 'https://linkedin.com/company/yourpage',
  whatsapp: 'https://wa.me/255789980351',
};

// Simple inline SVG icons for brand platforms (lucide-react no longer ships these)
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.891h-2.33v6.987C18.343 21.128 22 16.991 22 12z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.256 1.216.6 1.772 1.153a4.908 4.908 0 011.153 1.772c.247.637.415 1.363.465 2.428.05 1.066.06 1.405.06 4.122s-.01 3.056-.06 4.122c-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772 4.915 4.915 0 01-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.05-1.405.06-4.122.06s-3.056-.01-4.122-.06c-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12s.01-3.056.06-4.122c.05-1.065.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.01 9.283 2 12 2zm0 1.802c-2.67 0-2.987.01-4.04.059-.976.045-1.505.207-1.858.344-.466.181-.8.398-1.15.748-.35.35-.566.683-.747 1.15-.137.352-.3.881-.344 1.857-.048 1.053-.059 1.37-.059 4.04s.01 2.987.059 4.04c.045.976.207 1.505.344 1.858.181.466.397.8.748 1.15.35.35.683.566 1.15.747.352.137.881.3 1.857.344 1.052.048 1.37.059 4.04.059s2.987-.01 4.04-.059c.976-.045 1.505-.207 1.858-.344.466-.181.8-.398 1.15-.748.35-.35.566-.683.747-1.15.137-.352.3-.881.344-1.857.048-1.053.059-1.37.059-4.04s-.01-2.987-.059-4.04c-.045-.976-.207-1.505-.344-1.858a3.09 3.09 0 00-.748-1.15 3.096 3.096 0 00-1.15-.747c-.352-.137-.881-.3-1.857-.344-1.053-.048-1.37-.059-4.04-.059zm0 4.594a5.604 5.604 0 110 11.208 5.604 5.604 0 010-11.208zm0 1.802a3.802 3.802 0 100 7.604 3.802 3.802 0 000-7.604zm5.723-1.999a1.31 1.31 0 11-2.62 0 1.31 1.31 0 012.62 0z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.446-2.136 2.94v5.666H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const WhatsappIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12.001 2.006c-5.524 0-9.998 4.474-9.998 9.997 0 1.764.463 3.489 1.343 5.003l-1.425 5.204 5.32-1.395a9.99 9.99 0 004.76 1.213h.004c5.524 0 9.997-4.474 9.997-9.997 0-2.67-1.04-5.181-2.929-7.07a9.933 9.933 0 00-7.07-2.929l-.002-.026zm0 18.19h-.003a8.153 8.153 0 01-4.157-1.14l-.298-.177-3.155.827.842-3.076-.194-.316a8.15 8.15 0 01-1.25-4.312c0-4.513 3.673-8.185 8.19-8.185a8.14 8.14 0 015.79 2.4 8.14 8.14 0 012.396 5.795c0 4.513-3.674 8.184-8.19 8.184h.03z"/>
  </svg>
);

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-col">
          <div className="footer-brand">🏍️ MotoContract</div>
          <p className="footer-tagline">
            Rent, contract, and buy motorcycles safely — all in one trusted platform.
          </p>
          <div className="footer-socials">
            <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <FacebookIcon />
            </a>
            <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <InstagramIcon />
            </a>
            <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter / X">
              <TwitterIcon />
            </a>
            <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <LinkedinIcon />
            </a>
            <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <WhatsappIcon />
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Quick Links</h4>
          <a href="/">Home</a>
          <a href="/login">Login</a>
          <a href="/register">Create Account</a>
        </div>

        <div className="footer-col">
          <h4>Contact Us</h4>
          <a href="mailto:Mtemabdul61@gmail.com" className="footer-contact-item">
            <Mail size={15} /> Mtemabdul61@gmail.com .....Maestro
          
          </a>
          <a href="tel:+255789980351" className="footer-contact-item">
            <Phone size={15} /> 0789 980 351
          </a>
          <a href="tel:+255762680351" className="footer-contact-item">
            <Phone size={15} /> 0762 680 351
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} MotoContract System. All rights reserved.</p>
      </div>
    </footer>
  );
}