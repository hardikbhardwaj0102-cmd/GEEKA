import { Link, useLocation } from "react-router-dom";
import "../style/Header.css";
import geekaLogo from "../assets/logo.png";

function Logo() {
    return (
        <div className="brand-logo">
            <img
                src={geekaLogo}
                alt="Geeka"
                className="brand-logo-image"
            />
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
    const location = useLocation();

    const isHome =
        location.pathname === "/" ||
        location.pathname === "";

    const isShop =
        location.pathname === "/shop" ||
        location.pathname.startsWith("/shop/");

    const isAbout =
        location.pathname === "/about" ||
        location.pathname.startsWith("/about/");

    const isContact =
        location.pathname === "/contact" ||
        location.pathname.startsWith("/contact/");

    const isCart =
        location.pathname === "/cart";

    return (
        <header className="site-header">

            {/* ================================
                LOGO
            ================================= */}

            <Link
                to="/"
                className="header-logo-link"
                aria-label="Go to Geeka home"
            >
                <Logo />
            </Link>


            {/* ================================
                NAVIGATION
            ================================= */}

            <nav className="main-navigation">

                <Link
                    to="/"
                    className={isHome ? "navigation-active" : ""}
                >
                    Home
                </Link>


                <Link
                    to="/shop"
                    className={`navigation-shop ${isShop ? "navigation-active" : ""
                        }`}
                >
                    <span>Shop</span>
                    <span className="navigation-arrow">⌄</span>
                </Link>


                <Link
                    to="/about"
                    className={isAbout ? "navigation-active" : ""}
                >
                    About Us
                </Link>


                <Link
                    to="/contact"
                    className={isContact ? "navigation-active" : ""}
                >
                    Contact
                </Link>

            </nav>


            {/* ================================
                ACTIONS
            ================================= */}

            <div className="header-actions">

                {/* SEARCH */}

                <button
                    type="button"
                    className="header-search-button"
                    aria-label="Search"
                >
                    <SearchIcon />
                </button>


                {/* ACCOUNT */}

                <Link
                    to="/login"
                    className="header-account-link"
                    aria-label="Account"
                >
                    <AccountIcon />
                </Link>


                {/* CART */}

                <Link
                    to="/cart"
                    className={`header-bag ${isCart ? "header-bag-active" : ""
                        }`}
                    aria-label="Shopping bag"
                >
                    <BagIcon />

                    <span className="header-bag-count">
                        0
                    </span>
                </Link>

            </div>


            {/* ================================
                MOBILE MENU
            ================================= */}

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