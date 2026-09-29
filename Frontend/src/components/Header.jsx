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
import { isAdminUser } from "../admin/services/adminAccess";


/* =========================================================
   API CONFIGURATION
========================================================= */

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://geeka-backend.onrender.com";


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
   USER INITIALS
========================================================= */

function getUserInitials(fullName) {
    if (!fullName?.trim()) {
        return "U";
    }

    const parts =
        fullName
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (parts.length === 1) {
        return parts[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return (
        parts[0].charAt(0) +
        parts[parts.length - 1].charAt(0)
    ).toUpperCase();
}


/* =========================================================
   HEADER
========================================================= */

export default function Header() {

    const location =
        useLocation();

    const navigate =
        useNavigate();

    const searchInputRef =
        useRef(null);


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
    | AUTHENTICATION STATE
    |--------------------------------------------------------------------------
    */

    const [user, setUser] =
        useState(null);

    const [authLoading, setAuthLoading] =
        useState(true);

    const [logoutLoading, setLogoutLoading] =
        useState(false);


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
    | ADMIN ACCESS
    |--------------------------------------------------------------------------
    */

    const showManageStore =
        isAdminUser(user);


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
    | LOAD CURRENT USER
    |--------------------------------------------------------------------------
    */

    async function loadCurrentUser() {

        setAuthLoading(true);

        try {

            const response =
                await fetch(
                    `${API_URL}/api/v1/auth/me/`,
                    {
                        method: "GET",

                        credentials:
                            "include",

                        headers: {
                            Accept:
                                "application/json",
                        },
                    }
                );

            /*
             * Depending on the backend's authentication
             * configuration, an unauthenticated session may
             * return either 401 or 403.
             */

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                setUser(null);

                return;
            }


            let data = {};

            try {

                data =
                    await response.json();

            } catch {

                data = {};

            }


            if (!response.ok) {

                setUser(null);

                return;
            }


            if (
                data?.user
            ) {

                setUser(
                    data.user
                );

            } else {

                setUser(null);

            }

        } catch (error) {

            console.error(
                "Unable to load current user:",
                error
            );

            setUser(null);

        } finally {

            setAuthLoading(false);

        }
    }


    /*
    |--------------------------------------------------------------------------
    | CHECK LOGIN SESSION
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        loadCurrentUser();

        function handleAuthUpdated() {

            loadCurrentUser();

        }

        window.addEventListener(
            "geeka-auth-updated",
            handleAuthUpdated
        );

        return () => {

            window.removeEventListener(
                "geeka-auth-updated",
                handleAuthUpdated
            );

        };

    }, []);


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

        setSearchValue(
            query
        );


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

        if (
            event.key ===
            "Escape"
        ) {

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
            event.key ===
            "Enter"
        ) {

            handleSearchSubmit(
                event
            );

        }

    }


    /*
    |--------------------------------------------------------------------------
    | CLOSE SEARCH WHEN CLICKING OUTSIDE
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        if (
            !searchOpen ||
            isShop
        ) {

            return undefined;
        }


        function handleOutsideClick(
            event
        ) {

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
    | ACCOUNT / PROFILE
    |--------------------------------------------------------------------------
    */

    function goToAccount() {

        if (user) {

            navigate(
                "/profile"
            );

            return;
        }


        navigate(
            "/login"
        );

    }


    /*
    |--------------------------------------------------------------------------
    | LOGOUT
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | 1. Get a fresh CSRF token from the backend.
    | 2. Send that token as X-CSRFToken.
    | 3. Keep credentials: "include".
    | 4. Only clear the frontend user when logout
    |    actually succeeds.
    |--------------------------------------------------------------------------
    */

    async function handleLogout() {

        if (
            logoutLoading
        ) {

            return;
        }


        setLogoutLoading(
            true
        );


        try {

            /*
            |--------------------------------------------------------------------------
            | STEP 1 — GET CSRF TOKEN
            |--------------------------------------------------------------------------
            */

            const csrfResponse =
                await fetch(
                    `${API_URL}/api/v1/auth/csrf/`,
                    {
                        method: "GET",

                        credentials:
                            "include",

                        headers: {
                            Accept:
                                "application/json",
                        },
                    }
                );


            let csrfData = {};


            try {

                csrfData =
                    await csrfResponse.json();

            } catch {

                csrfData = {};

            }


            if (
                !csrfResponse.ok
            ) {

                throw new Error(
                    csrfData?.error ||
                    csrfData?.message ||
                    `Unable to obtain CSRF token (${csrfResponse.status}).`
                );

            }


            const csrfToken =
                csrfData?.csrfToken;


            if (!csrfToken) {

                throw new Error(
                    "The backend did not return a CSRF token."
                );

            }


            /*
            |--------------------------------------------------------------------------
            | STEP 2 — LOGOUT
            |--------------------------------------------------------------------------
            */

            const logoutResponse =
                await fetch(
                    `${API_URL}/api/v1/auth/logout/`,
                    {
                        method: "POST",

                        credentials:
                            "include",

                        headers: {
                            Accept:
                                "application/json",

                            "Content-Type":
                                "application/json",

                            "X-CSRFToken":
                                csrfToken,
                        },
                    }
                );


            let logoutData = {};


            try {

                logoutData =
                    await logoutResponse.json();

            } catch {

                logoutData = {};

            }


            /*
            |--------------------------------------------------------------------------
            | ALREADY LOGGED OUT
            |--------------------------------------------------------------------------
            |
            | If backend says the session is already gone,
            | we can safely treat the account as logged out.
            |--------------------------------------------------------------------------
            */

            if (
                logoutResponse.status ===
                401
            ) {

                setUser(null);

                try {

                    localStorage.removeItem(
                        "geeka-user"
                    );

                    localStorage.removeItem(
                        "geeka-auth"
                    );

                } catch {
                    // Ignore storage errors.
                }


                window.dispatchEvent(
                    new Event(
                        "geeka-auth-updated"
                    )
                );


                navigate(
                    "/login",
                    {
                        replace: true,
                    }
                );

                return;
            }


            /*
            |--------------------------------------------------------------------------
            | LOGOUT FAILED
            |--------------------------------------------------------------------------
            */

            if (
                !logoutResponse.ok
            ) {

                const backendMessage =
                    logoutData?.error ||
                    logoutData?.message ||
                    (
                        logoutData?.errors &&
                        JSON.stringify(
                            logoutData.errors
                        )
                    ) ||
                    `Logout failed with status ${logoutResponse.status}.`;


                console.error(
                    "GEEKA logout failed:",
                    backendMessage
                );


                /*
                | Keep the current session/user intact.
                | We should not tell the frontend that the
                | account is logged out when Django rejected it.
                */

                return;
            }


            /*
            |--------------------------------------------------------------------------
            | SUCCESS — CLEAR FRONTEND CACHE
            |--------------------------------------------------------------------------
            */

            const authKeys = [
                "geeka-auth",
                "geeka-user",
                "access_token",
                "refresh_token",
                "token",
            ];


            authKeys.forEach(
                (key) => {

                    try {

                        localStorage.removeItem(
                            key
                        );

                    } catch {
                        // Ignore storage errors.
                    }

                }
            );


            /*
            |--------------------------------------------------------------------------
            | CLEAR CURRENT USER
            |--------------------------------------------------------------------------
            */

            setUser(null);


            /*
            |--------------------------------------------------------------------------
            | NOTIFY OTHER COMPONENTS
            |--------------------------------------------------------------------------
            */

            window.dispatchEvent(
                new Event(
                    "geeka-auth-updated"
                )
            );


            /*
            |--------------------------------------------------------------------------
            | REDIRECT
            |--------------------------------------------------------------------------
            */

            navigate(
                "/login",
                {
                    replace: true,
                }
            );

        } catch (error) {

            console.error(
                "Logout failed:",
                error
            );

        } finally {

            setLogoutLoading(
                false
            );

        }
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


                {showManageStore && (

                    <Link
                        to="/admin"
                        className={
                            location.pathname.startsWith("/admin")
                                ? "navigation-active navigation-manage-store"
                                : "navigation-manage-store"
                        }
                    >
                        Manage Store
                    </Link>

                )}

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
                    PROFILE / ACCOUNT
                ============================================== */}

                <button
                    type="button"
                    className={`header-account-link ${user
                        ? "header-account-logged-in"
                        : ""
                        } ${isProfile
                            ? "header-account-active"
                            : ""
                        }`}
                    onClick={
                        goToAccount
                    }
                    aria-label={
                        user
                            ? `Open profile for ${user.full_name ||
                            user.email ||
                            "account"
                            }`
                            : "Login"
                    }
                    title={
                        user
                            ? user.full_name ||
                            user.email ||
                            "Profile"
                            : "Login"
                    }
                >

                    {user && !authLoading ? (

                        <span
                            className="header-account-avatar"
                            aria-hidden="true"
                        >
                            {getUserInitials(
                                user.full_name
                            )}
                        </span>

                    ) : (

                        <AccountIcon />

                    )}

                </button>


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