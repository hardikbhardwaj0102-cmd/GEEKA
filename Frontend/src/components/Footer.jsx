import "../style/Footer.css";

function Logo() {
    return (
        <div className="footer-brand-logo">
            <div className="footer-brand-mark">
                G
                <span>❧</span>
            </div>

            <div className="footer-brand-tagline">
                Fashion · Jewellery · Crochet
            </div>
        </div>
    );
}

export default function Footer() {
    return (
        <footer className="site-footer" id="contact">
            <div className="footer-main">
                <div className="footer-brand-column">
                    <Logo />

                    <p>
                        Curated fashion, timeless jewellery and beautiful handmade
                        creations.
                    </p>
                </div>

                <div className="footer-column">
                    <h3>SHOP</h3>

                    <a href="#collections">Ethnic Wear</a>
                    <a href="#collections">Jewellery</a>
                    <a href="#collections">Creative</a>
                    <a href="#new-arrivals">New Arrivals</a>
                </div>

                <div className="footer-column">
                    <h3>COMPANY</h3>

                    <a href="#about">About Us</a>
                    <a href="#contact">Contact</a>
                    <a href="#shipping">Shipping</a>
                    <a href="#returns">Returns</a>
                </div>

                <div className="footer-column">
                    <h3>CONNECT</h3>

                    <a href="#instagram">Instagram</a>
                    <a href="#facebook">Facebook</a>
                    <a href="#whatsapp">WhatsApp</a>
                </div>
            </div>

            <div className="footer-bottom">
                <p>© 2026. All rights reserved.</p>

                <div>
                    <a href="#privacy">Privacy Policy</a>
                    <a href="#terms">Terms &amp; Conditions</a>
                </div>
            </div>
        </footer>
    );
}