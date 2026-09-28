import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Link,
    useLocation,
    useNavigate,
} from "react-router-dom";

import "../style/Header.css";

import geekaLogo from "../assets/logo.png";

import { useCart } from "../hooks/useCart";


/* =========================================================
   LOGO
========================================================= */

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


/* =========================================================
   SEARCH ICON
========================================================= */

function SearchIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <circle
                cx="11"
                cy="11"
                r="6.5"
            />

            <path d="M16 16L21 21" />
        </svg>
    );
}


/* =========================================================
   CLOSE ICON
========================================================= */

function CloseIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="M6 6L18 18" />
            <path d="M18 6L6 18" />
        </svg>
    );
}


/* =========================================================
   ACCOUNT ICON
========================================================= */

function AccountIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <circle
                cx="12"
                cy="8"
                r="3.5"
            />

            <path d="M5 21c.8-4 3.1-6 7-6s6.2 2 7 6" />
        </svg>
    );
}


/* =========================================================
   WISHLIST ICON
========================================================= */

function HeartIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z" />
        </svg>
    );
}


/* =========================================================
   BAG ICON
========================================================= */

function BagIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="M5 8h14l-1 13H6L5 8Z" />

            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
    );
}


/* =========================================================
   HEADER
========================================================= */

export default function Header() {

    const location = useLocation();

    const navigate = useNavigate();

    const searchInputRef = useRef(null);


    /*
    |--------------------------------------------------------------------------
    | SHARED CART
    |--------------------------------------------------------------------------
    */

    const {
        cartCount,
    } = useCart();


    /*
    |--------------------------------------------------------------------------
    | SEARCH STATE
    |--------------------------------------------------------------------------
    */

    const [searchOpen, setSearchOpen] =
        useState(false);

    const [
        searchValue,
        setSearchValue,
    ] = useState("");


    /*
    |--------------------------------------------------------------------------
    | WISHLIST STATE
    |--------------------------------------------------------------------------
    */

    const [
        wishlistCount,
        setWishlistCount,
    ] = useState(0);


    /*
    |--------------------------------------------------------------------------
    | CURRENT ROUTE
    |--------------------------------------------------------------------------
    */

    const isHome =
        location.pathname === "/" ||
        location.pathname === "";

    const isShop =
        location.pathname === "/shop" ||
        location.pathname.startsWith(
            "/shop/"
        );

    const isAbout =
        location.pathname === "/about" ||
        location.pathname.startsWith(
            "/about/"
        );

    const isContact =
        location.pathname === "/contact" ||
        location.pathname.startsWith(
            "/contact/"
        );

    const isCart =
        location.pathname === "/cart";

    const isProfile =
        location.pathname === "/profile";


    /*
    |--------------------------------------------------------------------------
    | WISHLIST SECTION
    |--------------------------------------------------------------------------
    */

    const isWishlist =
        isProfile &&
        new URLSearchParams(
            location.search
        ).get("section") === "wishlist";


    /*
    |--------------------------------------------------------------------------
    | READ WISHLIST
    |--------------------------------------------------------------------------
    */

    function updateWishlistCount() {

        try {

            const saved =
                localStorage.getItem(
                    "geeka-wishlist"
                );

            const parsed =
                saved
                    ? JSON.parse(saved)
                    : [];

            setWishlistCount(
                Array.isArray(parsed)
                    ? parsed.length
                    : 0
            );

        } catch {

            setWishlistCount(0);

        }
    }


    useEffect(() => {

        updateWishlistCount();

        function handleWishlistStorage() {
            updateWishlistCount();
        }

        window.addEventListener(
            "storage",
            handleWishlistStorage
        );

        window.addEventListener(
            "geeka-wishlist-updated",
            handleWishlistStorage
        );

        return () => {

            window.removeEventListener(
                "storage",
                handleWishlistStorage
            );

            window.removeEventListener(
                "geeka-wishlist-updated",
                handleWishlistStorage
            );

        };

    }, []);


    /*
    |--------------------------------------------------------------------------
    | READ SEARCH FROM URL
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const params =
            new URLSearchParams(
                location.search
            );

        const query =
            params.get("search") || "";

        setSearchValue(query);

        /*
        | On Shop the search bar is always visible.
        | On other pages the search remains closed.
        */

        if (isShop) {

            setSearchOpen(true);

            setTimeout(() => {

                searchInputRef.current?.focus();

            }, 0);

        } else {

            setSearchOpen(false);

        }

    }, [
        location.pathname,
        location.search,
        isShop,
    ]);


    /*
    |--------------------------------------------------------------------------
    | OPEN SEARCH
    |--------------------------------------------------------------------------
    */

    function openSearch() {

        setSearchOpen(true);

        setTimeout(() => {

            searchInputRef.current?.focus();

        }, 0);

    }


    /*
    |--------------------------------------------------------------------------
    | CLOSE SEARCH
    |--------------------------------------------------------------------------
    */

    function closeSearch() {

        setSearchOpen(false);

        setSearchValue("");

    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE SHOP SEARCH
    |--------------------------------------------------------------------------
    |
    | The search value is written directly into the Shop URL.
    | Shop.jsx reads ?search= and applies the exact same
    | product filtering logic.
    |
    */

    function handleSearchChange(event) {

        const value =
            event.target.value;

        setSearchValue(value);

        if (!isShop) {

            return;

        }

        const trimmedValue =
            value.trim();

        if (!trimmedValue) {

            navigate(
                "/shop",
                {
                    replace: true,
                }
            );

            return;

        }

        navigate(
            `/shop?search=${encodeURIComponent(
                trimmedValue
            )}`,
            {
                replace: true,
            }
        );

    }


    /*
    |--------------------------------------------------------------------------
    | RUN SEARCH
    |--------------------------------------------------------------------------
    */

    function handleSearchSubmit(event) {

        event.preventDefault();

        const query =
            searchValue.trim();

        if (!query) {

            navigate(
                "/shop",
                {
                    replace: true,
                }
            );

            return;

        }

        navigate(
            `/shop?search=${encodeURIComponent(
                query
            )}`
        );

        setSearchOpen(true);

    }


    /*
    |--------------------------------------------------------------------------
    | SEARCH KEYBOARD
    |--------------------------------------------------------------------------
    */

    function handleSearchKeyDown(event) {

        if (event.key === "Escape") {

            if (isShop) {

                navigate(
                    "/shop",
                    {
                        replace: true,
                    }
                );

                return;

            }

            closeSearch();

            return;
        }

        if (
            event.key === "Enter"
        ) {

            handleSearchSubmit(event);

        }

    }


    /*
    |--------------------------------------------------------------------------
    | CLOSE SEARCH WHEN CLICKING OUTSIDE
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        /*
        | Do not close the search on Shop.
        | The Shop search is permanently visible.
        */

        if (
            !searchOpen ||
            isShop
        ) {

            return undefined;

        }

        function handleOutsideClick(event) {

            if (
                !event.target.closest(
                    ".header-search-wrapper"
                )
            ) {

                if (
                    !searchValue.trim()
                ) {

                    closeSearch();

                }

            }

        }

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        return () => {

            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );

        };

    }, [
        searchOpen,
        searchValue,
        isShop,
    ]);


    /*
    |--------------------------------------------------------------------------
    | WISHLIST NAVIGATION
    |--------------------------------------------------------------------------
    */

    function goToWishlist() {

        navigate(
            "/profile?section=wishlist"
        );

    }


    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <header className="site-header">

            {/* =================================================
                LOGO
            ================================================== */}

            <Link
                to="/"
                className="header-logo-link"
                aria-label="Go to Geeka home"
            >
                <Logo />
            </Link>


            {/* =================================================
                NAVIGATION
            ================================================== */}

            <nav className="main-navigation">

                <Link
                    to="/"
                    className={
                        isHome
                            ? "navigation-active"
                            : ""
                    }
                >
                    Home
                </Link>


                <Link
                    to="/shop"
                    className={`navigation-shop ${isShop
                            ? "navigation-active"
                            : ""
                        }`}
                >

                    <span>
                        Shop
                    </span>

                    <span className="navigation-arrow">
                        ⌄
                    </span>

                </Link>


                <Link
                    to="/about"
                    className={
                        isAbout
                            ? "navigation-active"
                            : ""
                    }
                >
                    About Us
                </Link>


                <Link
                    to="/contact"
                    className={
                        isContact
                            ? "navigation-active"
                            : ""
                    }
                >
                    Contact
                </Link>

            </nav>


            {/* =================================================
                ACTIONS
            ================================================== */}

            <div className="header-actions">


                {/* =============================================
                    SEARCH
                ============================================== */}

                <div
                    className={`header-search-wrapper ${searchOpen
                            ? "search-expanded"
                            : ""
                        } ${isShop
                            ? "shop-header-search"
                            : ""
                        }`}
                >

                    {searchOpen ? (

                        <form
                            className="header-search-expanded"
                            onSubmit={
                                handleSearchSubmit
                            }
                        >

                            <SearchIcon />

                            <input
                                ref={
                                    searchInputRef
                                }
                                type="search"
                                value={
                                    searchValue
                                }
                                onChange={
                                    handleSearchChange
                                }
                                onKeyDown={
                                    handleSearchKeyDown
                                }
                                placeholder="Search products..."
                                aria-label="Search products"
                            />


                            {searchValue && (

                                <button
                                    type="button"
                                    className="header-search-clear"
                                    onClick={() => {

                                        setSearchValue("");

                                        if (isShop) {

                                            navigate(
                                                "/shop",
                                                {
                                                    replace: true,
                                                }
                                            );

                                        } else {

                                            closeSearch();

                                        }

                                    }}
                                    aria-label="Clear search"
                                >
                                    <CloseIcon />
                                </button>

                            )}

                        </form>

                    ) : (

                        <button
                            type="button"
                            className="header-search-button"
                            onClick={
                                openSearch
                            }
                            aria-label="Search"
                        >
                            <SearchIcon />
                        </button>

                    )}

                </div>


                {/* =============================================
                    WISHLIST
                ============================================== */}

                <button
                    type="button"
                    className={`header-wishlist ${isWishlist
                            ? "header-wishlist-active"
                            : ""
                        }`}
                    onClick={
                        goToWishlist
                    }
                    aria-label="Wishlist"
                >

                    <HeartIcon />

                    {wishlistCount > 0 && (

                        <span className="header-wishlist-count">
                            {wishlistCount}
                        </span>

                    )}

                </button>


                {/* =============================================
                    ACCOUNT
                ============================================== */}

                <Link
                    to="/login"
                    className="header-account-link"
                    aria-label="Account"
                >
                    <AccountIcon />
                </Link>


                {/* =============================================
                    CART
                ============================================== */}

                <Link
                    to="/cart"
                    className={`header-bag ${isCart
                            ? "header-bag-active"
                            : ""
                        }`}
                    aria-label="Shopping bag"
                >

                    <BagIcon />

                    <span className="header-bag-count">
                        {cartCount}
                    </span>

                </Link>

            </div>


            {/* =================================================
                MOBILE MENU
            ================================================== */}

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