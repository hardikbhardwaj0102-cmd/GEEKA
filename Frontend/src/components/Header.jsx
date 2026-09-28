import { useEffect, useRef, useState } from "react";
import {
    Link,
    useLocation,
    useNavigate,
} from "react-router-dom";
import "../style/Header.css";

import geekaLogo from "../assets/logo.png";
import { useCart } from "../hooks/useCart";


/*
|--------------------------------------------------------------------------
| BACKEND
|--------------------------------------------------------------------------
*/

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://geeka-backend.onrender.com";


/*
|--------------------------------------------------------------------------
| ICONS
|--------------------------------------------------------------------------
*/

function Logo() {
    return (
        <Link
            to="/"
            className="header-logo"
            aria-label="GEEKA Home"
        >
            <img
                src={geekaLogo}
                alt="GEEKA"
            />
        </Link>
    );
}


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
            <path d="m16 16 4.5 4.5" />
        </svg>
    );
}


function CloseIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="m6 6 12 12" />
            <path d="M18 6 6 18" />
        </svg>
    );
}


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
            <path d="M5 20c.9-4 3.2-6 7-6s6.1 2 7 6" />
        </svg>
    );
}


function HeartIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="M20.8 8.7c0 5.2-8.8 10-8.8 10s-8.8-4.8-8.8-10A4.7 4.7 0 0 1 12 5.6a4.7 4.7 0 0 1 8.8 3.1Z" />
        </svg>
    );
}


function BagIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="M5 8h14l-1 12H6L5 8Z" />
            <path d="M9 8a3 3 0 0 1 6 0" />
        </svg>
    );
}


/*
|--------------------------------------------------------------------------
| USER HELPERS
|--------------------------------------------------------------------------
*/

function getUserInitials(fullName) {
    if (!fullName?.trim()) {
        return "G";
    }

    return (
        fullName
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "G"
    );
}


/*
|--------------------------------------------------------------------------
| HEADER
|--------------------------------------------------------------------------
*/

export default function Header() {
    const location = useLocation();
    const navigate = useNavigate();

    /*
    |--------------------------------------------------------------------------
    | CART
    |--------------------------------------------------------------------------
    */

    const cartState = useCart() || {};

    /*
    |--------------------------------------------------------------------------
    | Support the common shapes your existing useCart hook may expose.
    |--------------------------------------------------------------------------
    */

    const cartItems =
        Array.isArray(cartState.items)
            ? cartState.items
            : Array.isArray(cartState.cartItems)
                ? cartState.cartItems
                : [];

    const cartCount =
        typeof cartState.cartCount === "number"
            ? cartState.cartCount
            : typeof cartState.itemCount === "number"
                ? cartState.itemCount
                : typeof cartState.count === "number"
                    ? cartState.count
                    : cartItems.reduce(
                        (total, item) =>
                            total +
                            Number(
                                item.quantity ?? 1
                            ),
                        0
                    );


    /*
    |--------------------------------------------------------------------------
    | AUTH
    |--------------------------------------------------------------------------
    */

    const [user, setUser] =
        useState(null);

    const [authLoading, setAuthLoading] =
        useState(true);


    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    const [searchOpen, setSearchOpen] =
        useState(false);

    const [searchValue, setSearchValue] =
        useState("");

    const searchInputRef =
        useRef(null);


    /*
    |--------------------------------------------------------------------------
    | WISHLIST
    |--------------------------------------------------------------------------
    */

    const [wishlistCount, setWishlistCount] =
        useState(0);


    /*
    |--------------------------------------------------------------------------
    | LOAD CURRENT USER
    |--------------------------------------------------------------------------
    */

    async function loadCurrentUser() {
        try {
            setAuthLoading(true);

            const response =
                await fetch(
                    `${API_URL}/api/v1/auth/me/`,
                    {
                        method: "GET",
                        credentials: "include",
                        headers: {
                            Accept:
                                "application/json",
                        },
                    }
                );

            if (
                response.status === 401
            ) {
                setUser(null);
                return;
            }

            if (!response.ok) {
                setUser(null);
                return;
            }

            const data =
                await response.json();

            if (data?.user) {
                setUser(
                    data.user
                );
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setAuthLoading(false);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | AUTH SESSION CHECK
    |--------------------------------------------------------------------------
    |
    | Check on initial mount and whenever the route changes.
    | This is important because Header remains mounted while moving
    | from Login -> Home -> Profile.
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        loadCurrentUser();
    }, [location.pathname]);


    /*
    |--------------------------------------------------------------------------
    | AUTH UPDATE EVENT
    |--------------------------------------------------------------------------
    |
    | Login/Profile can notify Header without a full page refresh.
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        function handleAuthUpdate() {
            loadCurrentUser();
        }

        window.addEventListener(
            "geeka-auth-updated",
            handleAuthUpdate
        );

        return () => {
            window.removeEventListener(
                "geeka-auth-updated",
                handleAuthUpdate
            );
        };
    }, []);


    /*
    |--------------------------------------------------------------------------
    | WISHLIST COUNT
    |--------------------------------------------------------------------------
    */

    function loadWishlistCount() {
        try {
            const saved =
                localStorage.getItem(
                    "geeka-wishlist"
                );

            if (!saved) {
                setWishlistCount(0);
                return;
            }

            const parsed =
                JSON.parse(saved);

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
        loadWishlistCount();

        function syncWishlist() {
            loadWishlistCount();
        }

        window.addEventListener(
            "storage",
            syncWishlist
        );

        window.addEventListener(
            "geeka-wishlist-updated",
            syncWishlist
        );

        return () => {
            window.removeEventListener(
                "storage",
                syncWishlist
            );

            window.removeEventListener(
                "geeka-wishlist-updated",
                syncWishlist
            );
        };
    }, []);


    /*
    |--------------------------------------------------------------------------
    | SEARCH URL SYNC
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const params =
            new URLSearchParams(
                location.search
            );

        const urlSearch =
            params.get("search") || "";

        setSearchValue(
            urlSearch
        );

        if (
            location.pathname ===
            "/shop"
        ) {
            setSearchOpen(
                true
            );
        } else {
            setSearchOpen(
                false
            );
        }
    }, [
        location.pathname,
        location.search,
    ]);


    /*
    |--------------------------------------------------------------------------
    | OPEN SEARCH
    |--------------------------------------------------------------------------
    */

    function openSearch() {
        if (
            location.pathname !==
            "/shop"
        ) {
            navigate("/shop");
            return;
        }

        setSearchOpen(true);

        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 50);
    }


    /*
    |--------------------------------------------------------------------------
    | CLOSE SEARCH
    |--------------------------------------------------------------------------
    */

    function closeSearch() {
        setSearchOpen(false);

        const params =
            new URLSearchParams(
                location.search
            );

        params.delete("search");

        const query =
            params.toString();

        navigate(
            query
                ? `${location.pathname}?${query}`
                : location.pathname,
            {
                replace: true,
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | SEARCH CHANGE
    |--------------------------------------------------------------------------
    */

    function handleSearchChange(event) {
        const value =
            event.target.value;

        setSearchValue(value);

        const params =
            new URLSearchParams(
                location.search
            );

        if (value.trim()) {
            params.set(
                "search",
                value
            );
        } else {
            params.delete(
                "search"
            );
        }

        const query =
            params.toString();

        navigate(
            query
                ? `${location.pathname}?${query}`
                : location.pathname,
            {
                replace: true,
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | SEARCH SUBMIT
    |--------------------------------------------------------------------------
    */

    function handleSearchSubmit(event) {
        event.preventDefault();

        const value =
            searchValue.trim();

        const params =
            new URLSearchParams(
                location.search
            );

        if (value) {
            params.set(
                "search",
                value
            );
        } else {
            params.delete(
                "search"
            );
        }

        const query =
            params.toString();

        navigate(
            query
                ? `/shop?${query}`
                : "/shop",
            {
                replace: true,
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | ACCOUNT
    |--------------------------------------------------------------------------
    */

    function handleAccountClick() {
        if (user) {
            navigate("/profile");
        } else {
            navigate("/login");
        }
    }


    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <header className="site-header">

            <div className="header-inner">

                <Logo />


                {searchOpen ? (
                    <form
                        className="header-search-form"
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
                            placeholder="Search products"
                            aria-label="Search products"
                        />

                        <button
                            type="button"
                            className="header-search-close"
                            onClick={
                                closeSearch
                            }
                            aria-label="Close search"
                        >
                            <CloseIcon />
                        </button>

                    </form>
                ) : (
                    <nav className="header-navigation">

                        <Link
                            to="/"
                            className={
                                location.pathname ===
                                    "/"
                                    ? "active"
                                    : ""
                            }
                        >
                            HOME
                        </Link>

                        <Link
                            to="/shop"
                            className={
                                location.pathname ===
                                    "/shop"
                                    ? "active"
                                    : ""
                            }
                        >
                            SHOP
                        </Link>

                        <Link
                            to="/about"
                            className={
                                location.pathname ===
                                    "/about"
                                    ? "active"
                                    : ""
                            }
                        >
                            ABOUT
                        </Link>

                        <Link
                            to="/contact"
                            className={
                                location.pathname ===
                                    "/contact"
                                    ? "active"
                                    : ""
                            }
                        >
                            CONTACT
                        </Link>

                    </nav>
                )}


                <div className="header-actions">

                    {!searchOpen && (
                        <button
                            type="button"
                            className="header-action-button"
                            onClick={
                                openSearch
                            }
                            aria-label="Search"
                        >
                            <SearchIcon />
                        </button>
                    )}


                    <button
                        type="button"
                        className={`header-account-link ${user
                                ? "header-account-logged-in"
                                : ""
                            }`}
                        onClick={
                            handleAccountClick
                        }
                        aria-label={
                            user
                                ? `Open ${user.full_name ||
                                "account"
                                }`
                                : "Login"
                        }
                        title={
                            user
                                ? user.full_name ||
                                user.email ||
                                "Account"
                                : "Login"
                        }
                    >

                        {user && !authLoading ? (
                            <span className="header-account-avatar">
                                {getUserInitials(
                                    user.full_name
                                )}
                            </span>
                        ) : (
                            <AccountIcon />
                        )}

                    </button>


                    <Link
                        to="/profile?section=wishlist"
                        className="header-action-button header-wishlist-link"
                        aria-label="Wishlist"
                    >

                        <HeartIcon />

                        {wishlistCount > 0 && (
                            <span className="header-count">
                                {wishlistCount}
                            </span>
                        )}

                    </Link>


                    <Link
                        to="/cart"
                        className="header-action-button header-cart-link"
                        aria-label="Cart"
                    >

                        <BagIcon />

                        {cartCount > 0 && (
                            <span className="header-count">
                                {cartCount}
                            </span>
                        )}

                    </Link>

                </div>

            </div>

        </header>
    );
}