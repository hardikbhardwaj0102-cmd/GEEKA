import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "../style/ProductCatalog.css";

import {
    getDefaultPurchasableVariant,
    getProductCards,
    getProductsPage,
} from "../services/productService";

import { addCartItem } from "../services/cartService";

const WISHLIST_KEY = "geeka-wishlist";
const PRODUCTS_TO_SHOW = 8;
const SLIDE_INTERVAL = 2200;
const SLIDE_TRANSITION = "520ms ease";

/* =========================================================
   WISHLIST
========================================================= */

function readWishlist() {
    try {
        const parsed = JSON.parse(
            localStorage.getItem(WISHLIST_KEY) || "[]"
        );

        if (!Array.isArray(parsed)) return [];

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
            WISHLIST_KEY,
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

function getProductId(product) {
    return String(product?.id ?? "").trim();
}

function getImageUrl(image) {
    if (typeof image === "string") {
        return image.trim();
    }

    if (!image || typeof image !== "object") {
        return "";
    }

    return String(
        image.image_url ??
        image.imageUrl ??
        image.url ??
        image.src ??
        image.image ??
        image.file ??
        image.image_file ??
        ""
    ).trim();
}

/*
 * Collect the product's primary image and gallery images.
 * Supports the common image fields used by Geeka's catalogue.
 */
function getProductImages(product) {
    const detail = product?.detail ?? {};

    const detailImages = Array.isArray(detail.images)
        ? detail.images
        : [];

    const productImages = Array.isArray(product?.images)
        ? product.images
        : [];

    const galleryImages = Array.isArray(product?.gallery)
        ? product.gallery
        : [];

    const sortedDetailImages = [...detailImages]
        .filter((image) => {
            if (!image || typeof image !== "object") {
                return true;
            }

            return (
                image.is_active !== false &&
                image.active !== false &&
                image.is_deleted !== true
            );
        })
        .sort((a, b) => {
            const orderA = Number(
                a?.sort_order ?? a?.position ?? a?.order ?? 0
            );
            const orderB = Number(
                b?.sort_order ?? b?.position ?? b?.order ?? 0
            );

            return orderA - orderB;
        });

    const candidates = [
        product?.displayImage,
        ...sortedDetailImages,
        ...productImages,
        ...galleryImages,
    ];

    const uniqueImages = [];
    const seen = new Set();

    for (const candidate of candidates) {
        const url = getImageUrl(candidate);

        if (url && !seen.has(url)) {
            seen.add(url);
            uniqueImages.push(url);
        }
    }

    return uniqueImages;
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
                strokeWidth="1.35"
                strokeLinecap="round"
            />
            <path
                d="m13 6 6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <path
                d="M6 6 18 18"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
            />
            <path
                d="M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
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

function BagCheckIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <path
                d="M6.5 8.5h11l1 11h-13l1-11Z"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinejoin="round"
            />
            <path
                d="M9 8.5V6a3 3 0 0 1 6 0v2.5"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
            />
            <path
                d="m9.5 13 2 2 3.5-3.5"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/* =========================================================
   PRODUCT CATALOG
========================================================= */

export default function ProductCatalog({
    products: productsProp = null,
}) {
    const navigate = useNavigate();
    const timerRef = useRef(null);

    const [products, setProducts] = useState([]);
    const [activeCategory, setActiveCategory] = useState("ALL");
    const [wishlist, setWishlist] = useState(readWishlist);
    const [toast, setToast] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Hover slideshow state
    const [hoveredProductId, setHoveredProductId] = useState(null);
    const [slideIndex, setSlideIndex] = useState(0);

    /* =====================================================
       LOAD PRODUCTS
    ===================================================== */

    useEffect(() => {
        let active = true;

        async function load() {
            setLoading(true);
            setError("");

            try {
                let baseProducts = [];

                if (Array.isArray(productsProp)) {
                    baseProducts = productsProp.slice(
                        0,
                        PRODUCTS_TO_SHOW
                    );
                } else {
                    const response = await getProductsPage();

                    baseProducts = Array.isArray(response?.results)
                        ? response.results.slice(0, PRODUCTS_TO_SHOW)
                        : [];
                }

                const cards = await getProductCards(baseProducts);

                if (!active) return;

                setProducts(Array.isArray(cards) ? cards : []);
            } catch (requestError) {
                if (!active) return;

                setProducts([]);
                setError(
                    requestError?.message ||
                    "Unable to load the product catalogue."
                );
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            active = false;

            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [productsProp]);

    /* =====================================================
       PRELOAD GALLERY IMAGES
    ===================================================== */

    useEffect(() => {
        products.forEach((product) => {
            getProductImages(product).forEach((url) => {
                const image = new Image();
                image.src = url;
            });
        });
    }, [products]);

    /* =====================================================
       HOVER SLIDESHOW
    ===================================================== */

    useEffect(() => {
        if (!hoveredProductId) return undefined;

        const product = products.find(
            (item) => getProductId(item) === hoveredProductId
        );

        const images = getProductImages(product);

        if (images.length <= 1) return undefined;

        const interval = setInterval(() => {
            setSlideIndex((current) => (current + 1) % images.length);
        }, SLIDE_INTERVAL);

        return () => clearInterval(interval);
    }, [hoveredProductId, products]);

    const startSlideshow = (product) => {
        const id = getProductId(product);
        const images = getProductImages(product);

        if (!id || images.length <= 1) return;

        setHoveredProductId(id);
        setSlideIndex(0);
    };

    const stopSlideshow = () => {
        setHoveredProductId(null);
        setSlideIndex(0);
    };

    /* =====================================================
       CATEGORIES
    ===================================================== */

    const categories = useMemo(() => {
        const values = products
            .map((product) => product?.categoryName)
            .filter(Boolean);

        return [
            "ALL",
            ...new Map(
                values.map((value) => [
                    value.toLowerCase(),
                    value,
                ])
            ).values(),
        ];
    }, [products]);

    /* =====================================================
       FILTERED PRODUCTS
    ===================================================== */

    const visibleProducts = useMemo(() => {
        if (activeCategory === "ALL") return products;

        return products.filter(
            (product) =>
                product?.categoryName?.toLowerCase() ===
                activeCategory.toLowerCase()
        );
    }, [activeCategory, products]);

    /* =====================================================
       TOAST
    ===================================================== */

    const showToast = (message) => {
        setToast(message);

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            setToast("");
        }, 2600);
    };

    /* =====================================================
       WISHLIST
    ===================================================== */

    const toggleWishlist = (id) => {
        if (!id) return;

        setWishlist((current) => {
            const next = current.includes(id)
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
       ADD TO BAG
    ===================================================== */

    const handleAddToBag = async (product) => {
        if (!product) return;

        const variant = getDefaultPurchasableVariant(
            product?.detail
        );

        if (
            !variant?.id ||
            variant?.in_stock !== true ||
            Number(variant?.stock) < 1
        ) {
            navigate(
                `/product/${encodeURIComponent(getProductId(product))}`
            );
            return;
        }

        try {
            await addCartItem(variant.id, 1);
            showToast(`${product.name} ADDED TO BAG`);
        } catch (requestError) {
            showToast(
                requestError?.message ||
                "Unable to add this item to bag."
            );
        }
    };

    /* =====================================================
       PRODUCT NAVIGATION
    ===================================================== */

    const openProduct = (product) => {
        const id = getProductId(product);

        if (!id) {
            navigate("/shop");
            return;
        }

        navigate(`/product/${encodeURIComponent(id)}`);
    };

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <section className="catalog-section">
            <div className="catalog-container">

                {/* HEADER */}

                <header className="catalog-header">
                    <div className="catalog-header-main">
                        <div className="catalog-eyebrow">
                            <span />
                            CURATED STORE EDIT
                        </div>

                        <h2>
                            <span>Shop</span>{" "}
                            <em>the collection.</em>
                        </h2>

                        <p>
                            Explore published pieces from the
                            Geeka catalogue, with pricing and
                            availability controlled by the store.
                        </p>
                    </div>

                    <div className="catalog-header-side">
                        <div className="catalog-count">
                            <strong>{products.length}</strong>
                            <span>LOADED</span>
                        </div>

                        <div className="catalog-header-note">
                            PUBLISHED PRODUCTS
                        </div>
                    </div>
                </header>

                {/* CATEGORY NAVIGATION */}

                <nav
                    className="catalog-navigation"
                    aria-label="Product categories"
                >
                    <div className="catalog-category-list">
                        {categories.map((category) => (
                            <button
                                type="button"
                                key={category}
                                className={
                                    activeCategory === category
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setActiveCategory(category)
                                }
                            >
                                {category === "ALL"
                                    ? "ALL"
                                    : category}
                            </button>
                        ))}
                    </div>

                    <span className="catalog-navigation-label">
                        GEEKA CATALOGUE
                    </span>
                </nav>

                {/* PRODUCT CONTENT */}

                {loading ? (
                    <div className="catalog-grid">
                        {Array.from({
                            length: PRODUCTS_TO_SHOW,
                        }).map((_, index) => (
                            <div
                                className="catalog-card catalog-card-skeleton"
                                key={index}
                            >
                                <div className="catalog-skeleton-image" />

                                <div className="catalog-skeleton-info">
                                    <span />
                                    <span />
                                    <span />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="catalog-empty">
                        <span>ERROR</span>
                        <h3>Catalogue unavailable.</h3>
                        <p>{error}</p>

                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                        >
                            TRY AGAIN
                            <ArrowIcon />
                        </button>
                    </div>
                ) : visibleProducts.length === 0 ? (
                    <div className="catalog-empty">
                        <span>EMPTY</span>
                        <h3>No products in this category.</h3>

                        <p>
                            The catalogue does not contain
                            published products in this selection.
                        </p>

                        <button
                            type="button"
                            onClick={() => setActiveCategory("ALL")}
                        >
                            VIEW ALL
                            <ArrowIcon />
                        </button>
                    </div>
                ) : (
                    <div className="catalog-grid">
                        {visibleProducts.map((product, index) => {
                            const id = getProductId(product);
                            const wishlisted = wishlist.includes(id);
                            const images = getProductImages(product);
                            const price = product?.price;
                            const purchasable = Boolean(
                                product?.isPurchasable
                            );

                            const isHovered = hoveredProductId === id;
                            const currentSlide = isHovered
                                ? slideIndex % Math.max(images.length, 1)
                                : 0;

                            return (
                                <article
                                    className="catalog-card"
                                    key={id}
                                >
                                    {/* PRODUCT IMAGE + SLIDESHOW */}

                                    <div
                                        className="catalog-image-wrap"
                                        onClick={() => openProduct(product)}
                                        onMouseEnter={() =>
                                            startSlideshow(product)
                                        }
                                        onMouseLeave={stopSlideshow}
                                        onFocus={() =>
                                            startSlideshow(product)
                                        }
                                        onBlur={stopSlideshow}
                                        role="link"
                                        tabIndex={0}
                                        onKeyDown={(event) => {
                                            if (
                                                event.key === "Enter" ||
                                                event.key === " "
                                            ) {
                                                event.preventDefault();
                                                openProduct(product);
                                            }
                                        }}
                                        style={{
                                            position: "relative",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {images.length > 0 ? (
                                            images.map((image, imageIndex) => (
                                                <img
                                                    key={`${image}-${imageIndex}`}
                                                    className="catalog-image"
                                                    src={image}
                                                    alt={
                                                        product?.name
                                                            ? `${product.name} - image ${imageIndex + 1}`
                                                            : "Geeka product"
                                                    }
                                                    loading={
                                                        index < 4
                                                            ? "eager"
                                                            : "lazy"
                                                    }
                                                    draggable="false"
                                                    style={{
                                                        position:
                                                            images.length > 1
                                                                ? "absolute"
                                                                : "relative",
                                                        inset:
                                                            images.length > 1
                                                                ? 0
                                                                : "auto",
                                                        width: "100%",
                                                        height:
                                                            images.length > 1
                                                                ? "100%"
                                                                : "auto",
                                                        objectFit: "cover",
                                                        opacity:
                                                            imageIndex === currentSlide
                                                                ? 1
                                                                : 0,
                                                        transition: `opacity ${SLIDE_TRANSITION}`,
                                                        pointerEvents: "none",
                                                        zIndex:
                                                            imageIndex === currentSlide
                                                                ? 1
                                                                : 0,
                                                    }}
                                                />
                                            ))
                                        ) : (
                                            <div className="catalog-image-placeholder">
                                                <span>GEEKA</span>
                                            </div>
                                        )}

                                        <span className="catalog-product-number">
                                            {String(index + 1).padStart(2, "0")}
                                        </span>

                                        <span className="catalog-product-badge">
                                            {purchasable
                                                ? "AVAILABLE"
                                                : "SOLD OUT"}
                                        </span>

                                        {/* WISHLIST BUTTON */}

                                        <button
                                            type="button"
                                            className={`catalog-wishlist ${wishlisted ? "active" : ""
                                                }`}
                                            onClick={(event) => {
                                                event.preventDefault();
                                                event.stopPropagation();
                                                toggleWishlist(id);
                                            }}
                                            aria-label={
                                                wishlisted
                                                    ? "Remove from wishlist"
                                                    : "Add to wishlist"
                                            }
                                            aria-pressed={wishlisted}
                                        >
                                            <HeartIcon filled={wishlisted} />
                                        </button>

                                        {/* SLIDE INDICATORS */}

                                        {images.length > 1 && isHovered && (
                                            <div
                                                className="catalog-slide-indicators"
                                                aria-hidden="true"
                                                style={{
                                                    position: "absolute",
                                                    left: "50%",
                                                    bottom: "12px",
                                                    transform: "translateX(-50%)",
                                                    zIndex: 3,
                                                    display: "flex",
                                                    gap: "5px",
                                                    alignItems: "center",
                                                    pointerEvents: "none",
                                                }}
                                            >
                                                {images.map((_, dotIndex) => (
                                                    <span
                                                        key={dotIndex}
                                                        style={{
                                                            display: "block",
                                                            width:
                                                                dotIndex === currentSlide
                                                                    ? "17px"
                                                                    : "5px",
                                                            height: "4px",
                                                            borderRadius: "10px",
                                                            background:
                                                                dotIndex === currentSlide
                                                                    ? "#ffffff"
                                                                    : "rgba(255,255,255,0.55)",
                                                            transition:
                                                                "width 220ms ease",
                                                            boxShadow:
                                                                "0 1px 4px rgba(0,0,0,0.15)",
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* PRODUCT DETAILS */}

                                    <div className="catalog-info">
                                        <div className="catalog-meta">
                                            <span>
                                                {product?.categoryName ||
                                                    "COLLECTION"}
                                            </span>

                                            {!purchasable && (
                                                <span>OUT OF STOCK</span>
                                            )}
                                        </div>

                                        <h3>
                                            <Link
                                                to={`/product/${encodeURIComponent(id)}`}
                                            >
                                                {product?.name}
                                            </Link>
                                        </h3>

                                        <div className="catalog-bottom">
                                            <div className="catalog-price-area">
                                                <strong className="catalog-price">
                                                    {price === null ||
                                                        price === undefined
                                                        ? "PRICE ON REQUEST"
                                                        : `FROM ${formatPrice(
                                                            price,
                                                            product?.currency ||
                                                            "INR"
                                                        )}`}
                                                </strong>
                                            </div>

                                            {/* ADD TO BAG */}

                                            <button
                                                type="button"
                                                className="catalog-quick-add"
                                                onClick={() =>
                                                    handleAddToBag(product)
                                                }
                                            >
                                                {purchasable && <BagCheckIcon />}

                                                {purchasable
                                                    ? "ADD TO BAG"
                                                    : "VIEW PRODUCT"}
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* CATALOGUE FOOTER */}

                <footer className="catalog-footer">
                    <div className="catalog-footer-left">
                        <span>{visibleProducts.length} SHOWN</span>

                        <p>
                            More products are available
                            in the full Geeka shop.
                        </p>
                    </div>

                    <div className="catalog-footer-center">
                        <div className="catalog-footer-line" />
                        <span>NEWEST FIRST</span>
                        <div className="catalog-footer-line" />
                    </div>

                    <Link to="/shop" className="catalog-footer-button">
                        VIEW SHOP
                        <ArrowIcon />
                    </Link>
                </footer>
            </div>

            {/* BAG NOTIFICATION */}

            {toast && (
                <div
                    className="catalog-bag-toast"
                    role="status"
                    aria-live="polite"
                >
                    <div className="catalog-bag-toast-icon">
                        <BagCheckIcon />
                    </div>

                    <div className="catalog-bag-toast-content">
                        <strong>GEEKA BAG</strong>
                        <span>{toast}</span>
                    </div>

                    <button
                        type="button"
                        className="catalog-bag-toast-close"
                        onClick={() => setToast("")}
                        aria-label="Close notification"
                    >
                        <CloseIcon />
                    </button>
                </div>
            )}
        </section>
    );
}
