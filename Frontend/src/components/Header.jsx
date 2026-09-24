import { Link } from "react-router-dom";
import "../style/Header.css";

function Logo() {
    return (
        <div className="brand-logo">
            <div className="brand-logo-mark">
                G
                <span className="brand-logo-flower">❧</span>
            </div>

            <div className="brand-logo-tagline">
                Fashion <span>·</span> Jewellery <span>·</span> Crochet
            </div>
        </div>
    );
}

function SearchIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16L21 21" />
        </svg>
    );
}

function AccountIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 21c.8-4 3.1-6 7-6s6.2 2 7 6" />
        </svg>
    );
}

function BagIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 8h14l-1 13H6L5 8Z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
    );
}

export default function Header() {
    return (
        <header className="site-header">
            {/* LOGO */}
            <Link to="/" className="header-logo-link">
                <Logo />
            </Link>

            {/* NAVIGATION */}
            <nav className="main-navigation">
                <Link to="/" className="navigation-active">
                    Home
                </Link>

                <Link to="/shop" className="navigation-shop">
                    Shop
                    <span>⌄</span>
                </Link>

                <Link to="/about">
                    About Us
                </Link>

                <Link to="/contact">
                    Contact
                </Link>
            </nav>

            {/* ACTIONS */}
            <div className="header-actions">

                {/* SEARCH */}
                <button type="button" aria-label="Search">
                    <SearchIcon />
                </button>

                {/* ACCOUNT → LOGIN */}
                <Link
                    to="/login"
                    className="header-account-link"
                    aria-label="Account"
                >
                    <AccountIcon />
                </Link>

                {/* BAG */}
                <button
                    type="button"
                    className="header-bag"
                    aria-label="Shopping bag"
                >
                    <BagIcon />
                    <span>0</span>
                </button>

            </div>

            {/* MOBILE MENU */}
            <button
                type="button"
                className="mobile-menu-button"
                aria-label="Open navigation"
            >
                <span />
                <span />
                <span />
            </button>
        </header>
    );
}