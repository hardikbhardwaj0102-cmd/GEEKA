
import "../style/Footer.css";
import geekaLogo from "../assets/logo.png";

function Logo() {
    return (
        <a href="/" className="footer-brand-logo" aria-label="Geeka home">
            <img
                src={geekaLogo}
                alt="Geeka"
                className="footer-brand-logo-image"
            />
        </a>
    );
}

function InstagramIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle
                cx="17.5"
                cy="6.5"
                r="1"
                className="icon-fill"
            />
        </svg>
    );
}

function FacebookIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 8h3V4h-3c-3.3 0-5 1.9-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.7.3-1 1-1Z" />
        </svg>
    );
}

function WhatsappIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.6 4.2 1.6 6L0 24l6.4-1.8a11.8 11.8 0 0 0 5.7 1.5h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.2-3.5-8.4ZM12.1 20.1h-.1c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.8 1.1 1.1-3.7-.2-.4a8.2 8.2 0 0 1-1.3-4.5c0-5 4.1-9.1 9.1-9.1 2.4 0 4.7.9 6.4 2.7a9 9 0 0 1 2.7 6.4c0 5-4.1 9.1-9.1 9.1Zm5-6.8c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.7.9-.8 1.1-.2.2-.3.2-.6.1-1.6-.8-2.7-1.5-3.8-3.4-.3-.5.3-.5.8-1.7.1-.2.1-.4 0-.6-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.8 0 1.7 1.2 3.3 1.4 3.5.2.2 2.4 3.7 5.8 5.2.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 1.7-.7 1.9-1.3.2-.6.2-1.1.1-1.3-.1-.1-.3-.2-.6-.3Z"
            />
        </svg>
    );
}

function FooterLink({ href, children }) {
    return (
        <a className="footer-link" href={href}>
            {children}
        </a>
    );
}

export default function Footer() {
    return (
        <footer className="site-footer" id="contact">
            {/* ================= NEWSLETTER / BRAND MESSAGE ================= */}
            <div className="footer-newsletter">
                <div className="footer-newsletter-content">
                    <span className="footer-eyebrow">
                        A LITTLE NOTE FROM GEEKA
                    </span>

                    <h2>
                        Little things,
                        <br />
                        <em>made beautifully.</em>
                    </h2>

                    <p>
                        Discover thoughtful ethnic wear, timeless jewellery
                        and handmade treasures created to make everyday
                        moments feel special.
                    </p>
                </div>

                <div className="footer-editorial">
                    <span className="footer-editorial-symbol" aria-hidden="true">
                        ❧
                    </span>

                    <p>
                        Style with meaning.
                        <br />
                        Beauty with a story.
                    </p>

                    <span className="footer-editorial-caption">
                        FASHION · JEWELLERY · CROCHET
                    </span>
                </div>
            </div>

            <div className="footer-divider">
                <span></span>
            </div>

            {/* ================= MAIN FOOTER ================= */}
            <div className="footer-main">
                {/* BRAND */}
                <div className="footer-brand-column">
                    <Logo />

                    <span className="footer-brand-caption">
                        MADE WITH MEANING
                    </span>

                    <p className="footer-brand-description">
                        Curated ethnic wear, timeless jewellery and
                        thoughtful handmade creations — for those who
                        find beauty in the little things.
                    </p>

                    <div className="footer-socials">
                        <a
                            href="#instagram"
                            aria-label="Instagram"
                            title="Instagram"
                        >
                            <InstagramIcon />
                        </a>

                        <a
                            href="#facebook"
                            aria-label="Facebook"
                            title="Facebook"
                        >
                            <FacebookIcon />
                        </a>

                        <a
                            href="#whatsapp"
                            aria-label="WhatsApp"
                            title="WhatsApp"
                        >
                            <WhatsappIcon />
                        </a>
                    </div>
                </div>

                {/* SHOP */}
                <nav className="footer-column" aria-label="Shop">
                    <h3>EXPLORE</h3>

                    <FooterLink href="/shop?category=Ethnic%20Wear">
                        Ethnic Wear
                    </FooterLink>

                    <FooterLink href="/shop?category=Jewellery">
                        Jewellery
                    </FooterLink>

                    <FooterLink href="/shop?category=Creative">
                        Crochet & Handmade
                    </FooterLink>

                    <FooterLink href="/new-arrivals">
                        New Arrivals
                    </FooterLink>
                </nav>

                {/* HELP */}
                <nav className="footer-column" aria-label="Customer support">
                    <h3>HERE TO HELP</h3>

                    <FooterLink href="/contact">
                        Contact Us
                    </FooterLink>

                    <FooterLink href="/contact">
                        Shipping & Delivery
                    </FooterLink>

                    <FooterLink href="/contact">
                        Returns & Exchanges
                    </FooterLink>

                    <FooterLink href="/contact">
                        Frequently Asked Questions
                    </FooterLink>
                </nav>

                {/* ABOUT */}
                <nav className="footer-column" aria-label="About Geeka">
                    <h3>OUR WORLD</h3>

                    <FooterLink href="/about">
                        Our Story
                    </FooterLink>

                    <FooterLink href="/about">
                        Craftsmanship
                    </FooterLink>

                    <FooterLink href="/shop">
                        Our Collections
                    </FooterLink>

                    <FooterLink href="/contact">
                        Get in Touch
                    </FooterLink>
                </nav>
            </div>

            {/* ================= FOOTER BOTTOM ================= */}
            <div className="footer-bottom">
                <p className="footer-copyright">
                    © {new Date().getFullYear()} GEEKA.
                    <span> ALL RIGHTS RESERVED.</span>
                </p>

                <p className="footer-bottom-tagline">
                    Thoughtfully chosen. Beautifully yours.
                </p>

                <div className="footer-legal">
                    <FooterLink href="/privacy-policy">
                        Privacy Policy
                    </FooterLink>

                    <FooterLink href="/terms">
                        Terms & Conditions
                    </FooterLink>
                </div>
            </div>
        </footer>
    );
}
