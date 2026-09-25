import "../style/Footer.css";

function Logo() {
    return (
        <div className="footer-brand-logo">
            <div className="footer-brand-mark">
                G
                <span>❧</span>
            </div>

            <div className="footer-brand-tagline">
                FASHION · JEWELLERY · CROCHET
            </div>
        </div>
    );

}

function InstagramIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" className="icon-fill" />
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
            <path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.6 4.2 1.6 6L0 24l6.4-1.8a11.8 11.8 0 0 0 5.7 1.5h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.2-3.5-8.4ZM12.1 20.1h-.1c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.8 1.1 1.1-3.7-.2-.4a8.2 8.2 0 0 1-1.3-4.5c0-5 4.1-9.1 9.1-9.1 2.4 0 4.7.9 6.4 2.7a9 9 0 0 1 2.7 6.4c0 5-4.1 9.1-9.1 9.1Zm5-6.8c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.7.9-.8 1.1-.2.2-.3.2-.6.1-1.6-.8-2.7-1.5-3.8-3.4-.3-.5.3-.5.8-1.7.1-.2.1-.4 0-.6-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.8 0 1.7 1.2 3.3 1.4 3.5.2.2 2.4 3.7 5.8 5.2.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 1.7-.7 1.9-1.3.2-.6.2-1.1.1-1.3-.1-.1-.3-.2-.6-.3Z" />
        </svg>
    );
}

export default function Footer() {
    return (
        <footer className="site-footer" id="contact">

            <div className="footer-newsletter">

                <div className="footer-newsletter-content">
                    <span className="footer-eyebrow">
                        STAY IN THE LOOP
                    </span>

                    <h2>
                        Little things,
                        <br />
                        made beautifully.
                    </h2>

                    <p>
                        Discover new collections, handmade pieces and
                        special updates from Geeka.
                    </p>
                </div>
            </div>


            <div className="footer-divider" />


            <div className="footer-main">

                <div className="footer-brand-column">

                    <Logo />

                    <p>
                        Curated ethnic wear, timeless jewellery and
                        thoughtful handmade creations — made for those
                        who appreciate beauty in the little things.
                    </p>

                    <div className="footer-socials">

                        <a href="#instagram" aria-label="Instagram">
                            <InstagramIcon />
                        </a>

                        <a href="#facebook" aria-label="Facebook">
                            <FacebookIcon />
                        </a>

                        <a href="#whatsapp" aria-label="WhatsApp">
                            <WhatsappIcon />
                        </a>

                    </div>

                </div>


                <div className="footer-column">

                    <h3>SHOP</h3>

                    <a href="#collections">Ethnic Wear</a>
                    <a href="#collections">Jewellery</a>
                    <a href="#collections">Crochet</a>
                    <a href="#new-arrivals">New Arrivals</a>

                </div>


                <div className="footer-column">

                    <h3>HELP</h3>

                    <a href="#shipping">Shipping & Delivery</a>
                    <a href="#returns">Returns & Exchanges</a>
                    <a href="#contact">Contact Us</a>
                    <a href="#faq">FAQs</a>

                </div>


                <div className="footer-column">

                    <h3>GEEKA</h3>

                    <a href="#about">Our Story</a>
                    <a href="#about">Craftsmanship</a>
                    <a href="#collections">Collections</a>
                    <a href="#contact">Get in Touch</a>

                </div>

            </div>


            <div className="footer-bottom">

                <p>
                    © 2026 GEEKA. ALL RIGHTS RESERVED.
                </p>

                <div className="footer-legal">
                    <a href="#privacy">Privacy Policy</a>
                    <a href="#terms">Terms & Conditions</a>
                </div>

            </div>

        </footer>
    );

}