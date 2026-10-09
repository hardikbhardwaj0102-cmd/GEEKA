import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "../style/NewArrivals.css";

import {
    getDefaultPurchasableVariant,
    getProductCards,
    getProductsPage,
} from "../services/productService";

import { useCart } from "../hooks/useCart";

const WISHLIST_STORAGE_KEY = "geeka-wishlist";
const PRODUCTS_PER_PAGE = 4;

/* =========================================================
   WISHLIST
========================================================= */

function readWishlist() {
    try {
        const parsed = JSON.parse(
            localStorage.getItem(WISHLIST_STORAGE_KEY) || "[]"
        );

        if (!Array.isArray(parsed)) {
            return [];
        }

        return [
            ...new Set(
                parsed
                    .map((item) =>
                        typeof item === "object" && item !== null
                            ? item?.id ??
                            item?.productId ??
                            item?._id ??
                            item?.uuid
                            : item
                    )
                    .map((id) => String(id ?? "").trim())
                    .filter(Boolean)
            ),
        ];
    } catch {
        return [];
    }
}

function writeWishlist(items) {
    try {
        localStorage.setItem(
            WISHLIST_STORAGE_KEY,
            JSON.stringify([
                ...new Set(
                    items
                        .map((id) => String(id).trim())
                        .filter(Boolean)
                ),
            ])
        );
    } catch {
        // Ignore localStorage failures.
    }
}

/* =========================================================
   HELPERS
========================================================= */

function formatPrice(value, currency = "INR") {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "PRICE ON REQUEST";
    }

    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
        }).format(amount);
    } catch {
        return `₹${amount.toLocaleString("en-IN")}`;
    }
}

function productId(product) {
    return String(product?.id ?? "").trim();
}

/* =========================================================
   ICONS
========================================================= */

function ArrowIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <path
                d="M5 12h13"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
            />
            <path
                d="m13 6 6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function HeartIcon({ filled = false }) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <path
                d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z"
                fill={filled ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
            />
        </svg>
    );
}

/* =========================================================
   NEW ARRIVALS
========================================================= */

export default function NewArrivals() {
    const navigate = useNavigate();
    const { addItem } = useCart();
    const toastTimerRef = useRef(null);

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState("");
    const [wishlist, setWishlist] = useState(readWishlist);

    /* =====================================================
       LOAD PRODUCTS
    ===================================================== */

    const loadPage = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getProductsPage();

            const results = Array.isArray(response?.results)
                ? response.results
                : [];

            const firstProducts = results.slice(
                0,
                PRODUCTS_PER_PAGE
            );

            const cards = await getProductCards(firstProducts);

            setProducts(Array.isArray(cards) ? cards : []);
        } catch (requestError) {
            setError(
                requestError?.message ||
                "Unable to load the latest products from Geeka."
            );

            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {
        loadPage();

        return () => {
            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    /* =====================================================
       WISHLIST
    ===================================================== */

    const toggleWishlist = (id) => {
        if (!id) {
            return;
        }

        setWishlist((current) => {
            const exists = current.includes(id);

            const next = exists
                ? current.filter((item) => item !== id)
                : [...current, id];

            writeWishlist(next);

            window.dispatchEvent(
                new CustomEvent("geeka-wishlist-updated")
            );

            return next;
        });
    };

    /* =====================================================
       TOAST
    ===================================================== */

    const showToast = (message) => {
        setToast(message);

        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }

        toastTimerRef.current = setTimeout(
            () => setToast(""),
            2600
        );
    };

    /* =====================================================
       ADD TO CART
    ===================================================== */

    const addToCart = async (product) => {
        const variant = getDefaultPurchasableVariant(
            product?.detail
        );

        if (
            !variant?.id ||
            variant?.is_active !== true ||
            variant?.in_stock !== true ||
            Number(variant?.stock) < 1
        ) {
            navigate(
                `/product/${encodeURIComponent(productId(product))}`
            );

            return;
        }

        try {
            await addItem(product, variant, 1);

            showToast("ITEM ADDED TO BAG");
        } catch (requestError) {
            showToast(
                requestError?.message ||
                "Unable to add this item to bag."
            );
        }
    };

    /* =====================================================
       ERROR STATE
    ===================================================== */

    if (error) {
        return (
            <section className="new-arrivals-section">
                <div className="new-arrivals-header">
                    <div className="new-arrivals-heading">
                        <span className="new-arrivals-eyebrow">
                            LATEST EDIT
                        </span>

                        <h2>New Arrivals</h2>

                        <p>{error}</p>
                    </div>
                </div>

                <div className="new-arrivals-empty">
                    <p>
                        We could not load the latest products right now.
                    </p>

                    <button type="button" onClick={loadPage}>
                        TRY AGAIN <ArrowIcon />
                    </button>
                </div>
            </section>
        );
    }

    /* =====================================================
       MAIN UI
    ===================================================== */

    return (
        <section className="new-arrivals-section">
            <div className="new-arrivals-header">
                <div className="new-arrivals-heading">
                    <span className="new-arrivals-eyebrow">
                        LATEST EDIT
                    </span>

                    <h2>New Arrivals</h2>

                    <p>
                        Freshly published pieces from the Geeka catalogue,
                        displayed in the order supplied by the store backend.
                    </p>
                </div>
            </div>

            {/* LOADING */}

            {loading ? (
                <div className="new-arrivals-loading-grid">
                    {Array.from({
                        length: PRODUCTS_PER_PAGE,
                    }).map((_, index) => (
                        <div
                            className="new-arrivals-loading"
                            key={index}
                        >
                            <div className="new-arrivals-loading-line" />
                        </div>
                    ))}
                </div>
            ) : products.length === 0 ? (
                /* EMPTY */

                <div className="new-arrivals-empty">
                    <p>
                        No published products are available yet.
                    </p>

                    <Link
                        className="new-arrivals-empty-link"
                        to="/shop"
                    >
                        OPEN SHOP <ArrowIcon />
                    </Link>
                </div>
            ) : (
                <>
                    {/* PRODUCT GRID */}

                    <div className="new-arrivals-grid">
                        {products.map((product) => {
                            const id = productId(product);

                            const category =
                                product?.categoryName ||
                                product?.category?.name ||
                                "COLLECTION";

                            const wishlisted = wishlist.includes(id);
                            const image = product?.displayImage || "";
                            const price = product?.price;
                            const currency = product?.currency || "INR";
                            const detail = product?.detail;

                            const purchasable =
                                detail?.is_purchasable === true;

                            const hasStock =
                                Array.isArray(detail?.variants) &&
                                detail.variants.some(
                                    (variant) =>
                                        variant?.is_active === true &&
                                        variant?.in_stock === true &&
                                        Number(variant?.stock) > 0
                                );

                            return (
                                <article
                                    className="new-arrival-card"
                                    key={id}
                                >
                                    {/* PRODUCT IMAGE */}

                                    <div className="new-arrival-image">
                                        <Link
                                            to={`/product/${encodeURIComponent(id)}`}
                                        >
                                            {image ? (
                                                <img
                                                    src={image}
                                                    alt={product.name}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="new-arrival-image-placeholder">
                                                    GEEKA
                                                </div>
                                            )}
                                        </Link>

                                        <div className="new-arrival-image-top">
                                            <span className="new-arrival-label">
                                                NEW
                                            </span>

                                            <button
                                                type="button"
                                                className="new-arrival-heart"
                                                onClick={() =>
                                                    toggleWishlist(id)
                                                }
                                                aria-label={
                                                    wishlisted
                                                        ? "Remove from wishlist"
                                                        : "Add to wishlist"
                                                }
                                                aria-pressed={wishlisted}
                                            >
                                                <HeartIcon
                                                    filled={wishlisted}
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    {/* PRODUCT DETAILS */}

                                    <div className="new-arrival-details">
                                        <div className="new-arrival-meta">
                                            <span>{category}</span>

                                            {(!purchasable || !hasStock) && (
                                                <span className="new-arrival-sold">
                                                    SOLD OUT
                                                </span>
                                            )}
                                        </div>

                                        <h3>
                                            <Link
                                                to={`/product/${encodeURIComponent(id)}`}
                                            >
                                                {product.name}
                                            </Link>
                                        </h3>

                                        <div className="new-arrival-bottom">
                                            <div className="new-arrival-price">
                                                <strong>
                                                    {price === null ||
                                                        price === undefined
                                                        ? "PRICE ON REQUEST"
                                                        : `FROM ${formatPrice(
                                                            price,
                                                            currency
                                                        )}`}
                                                </strong>
                                            </div>

                                            <button
                                                type="button"
                                                className="new-arrival-add"
                                                disabled={!detail}
                                                onClick={() =>
                                                    addToCart(product)
                                                }
                                            >
                                                {purchasable && hasStock
                                                    ? "ADD TO BAG"
                                                    : "VIEW PRODUCT"}

                                                {purchasable && hasStock && (
                                                    <PlusIcon />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    {/* VIEW ALL */}

                    <div className="new-arrivals-footer">
                        <Link
                            className="new-arrivals-footer-button"
                            to="/shop"
                        >
                            VIEW ALL NEW ARRIVALS <ArrowIcon />
                        </Link>
                    </div>

                    {/* CART NOTIFICATION */}

                    {toast && (
                        <div
                            className="new-arrival-toast"
                            role="status"
                        >
                            {toast}
                        </div>
                    )}
                </>
            )}
        </section>
    );
}