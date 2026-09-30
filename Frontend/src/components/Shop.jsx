import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "../style/Shop.css";

import Header from "./Header";
import shopBanner from "../assets/top-banner.jpg";

import {
    getAllProducts,
    getProductCards,
} from "../services/productService";

import { addCartItem } from "../services/cartService";

const WISHLIST_KEY = "geeka-wishlist";

function readWishlist() {
    try {
        const parsed = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
        if (!Array.isArray(parsed)) return [];

        return [
            ...new Set(
                parsed
                    .map((item) =>
                        typeof item === "object" && item !== null
                            ? item?.id ?? item?.productId ?? item?._id ?? item?.uuid
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
            JSON.stringify([...new Set(items.map((id) => String(id).trim()).filter(Boolean))])
        );
    } catch {
        // Ignore localStorage failures.
    }
}

function formatPrice(value, currency = "INR") {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return "PRICE ON REQUEST";

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

function categoryName(product) {
    return String(
        product?.categoryName ||
        product?.category?.name ||
        ""
    ).trim();
}

function categorySlug(product) {
    return String(
        product?.categorySlug ||
        product?.category?.slug ||
        ""
    ).trim().toLowerCase();
}

function collectionMatches(product, collection) {
    if (!collection) return true;

    const name = categoryName(product).toLowerCase();
    const slug = categorySlug(product);
    const collectionKey = collection.toLowerCase();

    if (collectionKey === "ethnic") {
        return name.includes("ethnic") || slug.includes("ethnic");
    }

    if (collectionKey === "jewellery") {
        return (
            name.includes("jewel") ||
            name.includes("jewelry") ||
            slug.includes("jewel") ||
            slug.includes("jewelry")
        );
    }

    if (collectionKey === "creative") {
        return (
            name.includes("creative") ||
            name.includes("handmade") ||
            name.includes("crochet") ||
            slug.includes("creative") ||
            slug.includes("handmade") ||
            slug.includes("crochet")
        );
    }

    return true;
}

function ArrowIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <path d="M5 12h13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="m13 6 6 6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.8" cy="10.8" r="6.5" />
            <path d="m16 16 4.2 4.2" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <path d="M6 6 18 18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M18 6 6 18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
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
            />
        </svg>
    );
}

export default function Shop() {
    const location = useLocation();
    const navigate = useNavigate();

    useLayoutEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, [location.pathname]);

    const params = useMemo(
        () => new URLSearchParams(location.search),
        [location.search]
    );

    const search = (params.get("search") || "").trim();
    const requestedCategory = (params.get("category") || "").trim().toLowerCase();
    const collection = (params.get("collection") || "").trim().toLowerCase();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [wishlist, setWishlist] = useState(readWishlist);
    const [sortBy, setSortBy] = useState("featured");
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(100000);
    const [stockOnly, setStockOnly] = useState(false);
    const [quickView, setQuickView] = useState(null);
    const [cartMessage, setCartMessage] = useState("");
    const [mobileFilters, setMobileFilters] = useState(false);

    useEffect(() => {
        let active = true;

        async function load() {
            setLoading(true);
            setError("");

            try {
                const baseProducts = await getAllProducts();
                const cards = await getProductCards(baseProducts);

                if (active) {
                    setProducts(cards);
                }
            } catch (requestError) {
                if (active) {
                    setProducts([]);
                    setError(
                        requestError?.message ||
                        "Unable to load products from the Geeka backend."
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        load();

        return () => {
            active = false;
        };
    }, []);

    const categoryOptions = useMemo(() => {
        const map = new Map();

        products.forEach((product) => {
            const name = categoryName(product);
            const slug = categorySlug(product);

            if (name && slug) {
                map.set(slug, name);
            }
        });

        return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
    }, [products]);

    const prices = useMemo(
        () =>
            products
                .map((product) => Number(product.price))
                .filter((value) => Number.isFinite(value)),
        [products]
    );

    const priceBounds = useMemo(() => {
        if (!prices.length) return { min: 0, max: 0 };
        return {
            min: Math.floor(Math.min(...prices)),
            max: Math.ceil(Math.max(...prices)),
        };
    }, [prices]);

    useEffect(() => {
        if (!prices.length) return;

        setMinPrice(priceBounds.min);
        setMaxPrice(priceBounds.max);
    }, [priceBounds.min, priceBounds.max, prices.length]);

    const selectedCategory = requestedCategory || "all";

    const filteredProducts = useMemo(() => {
        const normalizedSearch = search.toLowerCase();

        const result = products.filter((product) => {
            if (
                selectedCategory !== "all" &&
                categorySlug(product) !== selectedCategory
            ) {
                return false;
            }

            if (!collectionMatches(product, collection)) {
                return false;
            }

            if (normalizedSearch) {
                const haystack = [
                    product.name,
                    categoryName(product),
                    categorySlug(product),
                ]
                    .join(" ")
                    .toLowerCase();

                if (!haystack.includes(normalizedSearch)) {
                    return false;
                }
            }

            const price = Number(product.price);

            if (Number.isFinite(price)) {
                if (price < minPrice || price > maxPrice) return false;
            }

            if (stockOnly && !product.inStock) return false;

            return true;
        });

        if (sortBy === "price-low") {
            result.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
        } else if (sortBy === "price-high") {
            result.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
        } else if (sortBy === "name") {
            result.sort((a, b) => a.name.localeCompare(b.name));
        }

        return result;
    }, [collection, maxPrice, minPrice, products, search, selectedCategory, sortBy, stockOnly]);

    const updateQuery = (key, value) => {
        const next = new URLSearchParams(location.search);

        if (value) {
            next.set(key, value);
        } else {
            next.delete(key);
        }

        navigate(
            {
                pathname: "/shop",
                search: next.toString() ? `?${next.toString()}` : "",
            },
            { replace: true }
        );
    };

    const resetFilters = () => {
        setMinPrice(priceBounds.min);
        setMaxPrice(priceBounds.max);
        setStockOnly(false);
        setSortBy("featured");
        navigate("/shop", { replace: true });
    };

    const toggleWishlist = (id) => {
        if (!id) return;

        setWishlist((current) => {
            const next = current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id];

            writeWishlist(next);
            window.dispatchEvent(new CustomEvent("geeka-wishlist-updated"));
            return next;
        });
    };

    const addToCart = async (product) => {
        const variant = product?.detail?.variants?.find(
            (item) => item.is_active && item.in_stock && Number(item.stock) > 0
        );

        if (!variant) {
            navigate(`/product/${encodeURIComponent(productId(product))}`);
            return;
        }

        try {
            await addCartItem(variant.id, 1);
            setCartMessage(`${product.name} ADDED TO BAG`);
            window.setTimeout(() => setCartMessage(""), 2600);
        } catch (requestError) {
            setCartMessage(requestError?.message || "Unable to add this item to bag.");
            window.setTimeout(() => setCartMessage(""), 3200);
        }
    };

    const activeFilterLabels = [
        selectedCategory !== "all"
            ? categoryOptions.find((item) => item.slug === selectedCategory)?.name || selectedCategory
            : "",
        collection ? collection.toUpperCase() : "",
        search ? `SEARCH: ${search}` : "",
        stockOnly ? "IN STOCK" : "",
    ].filter(Boolean);

    return (
        <>
            <Header />

            <main className="shop-page">
                <section className="shop-banner">
                    <img className="top-banner-image" src={shopBanner} alt="Geeka collection" />
                    <div className="shop-banner-content">
                        <span className="shop-banner-eyebrow">Handpicked for you</span>
                        <h1>Shop the Geeka collection.</h1>
                        <p>
                            Explore the published catalogue, with product availability and variant pricing supplied by the store backend.
                        </p>
                    </div>
                </section>

                <div className="shop-container">
                    <div className="shop-toolbar">
                        <div className="shop-toolbar-right">
                            <span className="showing-count">
                                SHOWING {filteredProducts.length} OF {products.length}
                            </span>

                            <div className="sort-box">
                                <label htmlFor="shop-sort">SORT BY</label>
                                <select
                                    id="shop-sort"
                                    value={sortBy}
                                    onChange={(event) => setSortBy(event.target.value)}
                                >
                                    <option value="featured">Featured</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="name">Name</option>
                                </select>
                            </div>

                            <button
                                type="button"
                                className="mobile-filter-btn"
                                onClick={() => setMobileFilters(true)}
                            >
                                FILTERS
                            </button>
                        </div>
                    </div>

                    {activeFilterLabels.length > 0 && (
                        <div className="active-filter-row">
                            <span>ACTIVE FILTERS</span>
                            {activeFilterLabels.map((label) => (
                                <button
                                    type="button"
                                    key={label}
                                    onClick={() => {
                                        if (label.startsWith("SEARCH:")) {
                                            updateQuery("search", "");
                                        } else if (label === "IN STOCK") {
                                            setStockOnly(false);
                                        } else if (
                                            selectedCategory !== "all" &&
                                            label.toLowerCase() ===
                                            String(
                                                categoryOptions.find(
                                                    (item) => item.slug === selectedCategory
                                                )?.name ||
                                                selectedCategory
                                            ).toLowerCase()
                                        ) {
                                            updateQuery("category", "");
                                        } else if (collection) {
                                            updateQuery("collection", "");
                                        }
                                    }}
                                >
                                    {label} <CloseIcon />
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="shop-main-layout">
                        <aside className="shop-filters">
                            <div className="filter-block">
                                <h2>CATEGORY</h2>
                                <div className="filter-category-list">
                                    <button
                                        type="button"
                                        className={selectedCategory === "all" ? "active" : ""}
                                        onClick={() => updateQuery("category", "")}
                                    >
                                        <span>All Products</span>
                                        <span>{products.length}</span>
                                    </button>

                                    {categoryOptions.map((category) => {
                                        const count = products.filter(
                                            (product) => categorySlug(product) === category.slug
                                        ).length;

                                        return (
                                            <button
                                                key={category.slug}
                                                type="button"
                                                className={selectedCategory === category.slug ? "active" : ""}
                                                onClick={() => updateQuery("category", category.slug)}
                                            >
                                                <span>{category.name}</span>
                                                <span>{count}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="filter-block">
                                <h2>PRICE</h2>
                                <div className="range-container">
                                    <input
                                        type="range"
                                        min={priceBounds.min}
                                        max={Math.max(priceBounds.max, priceBounds.min)}
                                        value={Math.min(minPrice, priceBounds.max)}
                                        onChange={(event) =>
                                            setMinPrice(
                                                Math.min(Number(event.target.value), maxPrice)
                                            )
                                        }
                                    />
                                    <input
                                        type="range"
                                        min={priceBounds.min}
                                        max={Math.max(priceBounds.max, priceBounds.min)}
                                        value={Math.max(maxPrice, priceBounds.min)}
                                        onChange={(event) =>
                                            setMaxPrice(
                                                Math.max(Number(event.target.value), minPrice)
                                            )
                                        }
                                    />
                                </div>
                                <div className="price-values">
                                    <span>{formatPrice(minPrice)}</span>
                                    <span>{formatPrice(maxPrice)}</span>
                                </div>
                            </div>

                            <div className="filter-block">
                                <h2>AVAILABILITY</h2>
                                <label className="filter-option">
                                    <input
                                        type="checkbox"
                                        checked={stockOnly}
                                        onChange={(event) => setStockOnly(event.target.checked)}
                                    />
                                    <span className="fake-checkbox" />
                                    <span>Only show in-stock</span>
                                </label>
                            </div>

                            <button type="button" className="reset-filters" onClick={resetFilters}>
                                RESET FILTERS
                            </button>
                        </aside>

                        <section className="shop-products-area" aria-live="polite">
                            {loading ? (
                                <div className="shop-empty">
                                    <div className="empty-search-icon"><SearchIcon /></div>
                                    <h2>Loading the collection.</h2>
                                    <p>Fetching published products and their current variant information from Django.</p>
                                </div>
                            ) : error ? (
                                <div className="shop-empty">
                                    <div className="empty-search-icon"><SearchIcon /></div>
                                    <h2>Could not load products.</h2>
                                    <p>{error}</p>
                                    <button type="button" onClick={() => window.location.reload()}>
                                        TRY AGAIN <ArrowIcon />
                                    </button>
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="shop-empty">
                                    <div className="empty-search-icon"><SearchIcon /></div>
                                    <h2>No products found.</h2>
                                    <p>
                                        {search
                                            ? `Nothing in the current published catalogue matches “${search}”.`
                                            : "No published products match the current filters."}
                                    </p>
                                    <button type="button" onClick={resetFilters}>
                                        CLEAR FILTERS <ArrowIcon />
                                    </button>
                                </div>
                            ) : (
                                <div className="shop-product-grid">
                                    {filteredProducts.map((product) => {
                                        const id = productId(product);
                                        const wishlisted = wishlist.includes(id);
                                        const detail = product.detail;
                                        const purchasable = Boolean(product.inStock);

                                        return (
                                            <article className="shop-product-card" key={id}>
                                                <div className="shop-product-image">
                                                    <Link to={`/product/${encodeURIComponent(id)}`}>
                                                        {product.displayImage ? (
                                                            <img src={product.displayImage} alt={product.name} loading="lazy" />
                                                        ) : (
                                                            <div className="shop-empty-image-placeholder">GEEKA</div>
                                                        )}
                                                    </Link>

                                                    {purchasable && (
                                                        <span className="shop-product-new">AVAILABLE</span>
                                                    )}

                                                    <button
                                                        type="button"
                                                        className={`shop-product-heart ${wishlisted ? "active" : ""}`}
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            event.stopPropagation();
                                                            toggleWishlist(id);
                                                        }}
                                                        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                                                        aria-pressed={wishlisted}
                                                    >
                                                        <HeartIcon filled={wishlisted} />
                                                    </button>

                                                    <div className="shop-image-actions">
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.preventDefault();
                                                                event.stopPropagation();
                                                                setQuickView(product);
                                                            }}
                                                        >
                                                            QUICK VIEW
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="shop-product-info">
                                                    <span className="shop-product-category">
                                                        {categoryName(product) || "COLLECTION"}
                                                    </span>
                                                    <h3>
                                                        <Link
                                                            to={`/product/${encodeURIComponent(id)}`}
                                                            className="shop-product-name-link"
                                                        >
                                                            {product.name}
                                                        </Link>
                                                    </h3>

                                                    <div className="shop-product-price">
                                                        <strong>
                                                            {product.price === null
                                                                ? "PRICE ON REQUEST"
                                                                : `FROM ${formatPrice(product.price, product.currency || "INR")}`}
                                                        </strong>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="shop-add-cart"
                                                        disabled={!detail}
                                                        onClick={() => addToCart(product)}
                                                    >
                                                        {purchasable ? "ADD TO CART" : "VIEW PRODUCT"}
                                                        {purchasable && <PlusIcon />}
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>

            {mobileFilters && (
                <div className="mobile-filter-overlay" role="dialog" aria-modal="true">
                    <aside className="mobile-filter-panel">
                        <div className="mobile-filter-head">
                            <strong>FILTERS</strong>
                            <button type="button" onClick={() => setMobileFilters(false)} aria-label="Close filters">
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="mobile-filter-body">
                            <div className="filter-block">
                                <h2>CATEGORY</h2>
                                <div className="filter-category-list">
                                    <button
                                        type="button"
                                        className={selectedCategory === "all" ? "active" : ""}
                                        onClick={() => updateQuery("category", "")}
                                    >
                                        <span>All Products</span>
                                        <span>{products.length}</span>
                                    </button>
                                    {categoryOptions.map((category) => (
                                        <button
                                            key={category.slug}
                                            type="button"
                                            className={selectedCategory === category.slug ? "active" : ""}
                                            onClick={() => updateQuery("category", category.slug)}
                                        >
                                            <span>{category.name}</span>
                                            <span>{products.filter((item) => categorySlug(item) === category.slug).length}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="filter-block">
                                <h2>AVAILABILITY</h2>
                                <label className="filter-option">
                                    <input
                                        type="checkbox"
                                        checked={stockOnly}
                                        onChange={(event) => setStockOnly(event.target.checked)}
                                    />
                                    <span className="fake-checkbox" />
                                    <span>Only show in-stock</span>
                                </label>
                            </div>
                        </div>

                        <div className="mobile-filter-footer">
                            <button type="button" className="reset-filters" onClick={resetFilters}>
                                RESET
                            </button>
                            <button type="button" className="apply-mobile-filter" onClick={() => setMobileFilters(false)}>
                                APPLY FILTERS <ArrowIcon />
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            {quickView && (
                <div className="quick-view-overlay" role="dialog" aria-modal="true">
                    <div className="quick-view-modal">
                        <button
                            type="button"
                            className="quick-view-close"
                            onClick={() => setQuickView(null)}
                            aria-label="Close quick view"
                        >
                            <CloseIcon />
                        </button>
                        <div className="quick-view-image">
                            {quickView.displayImage ? (
                                <img src={quickView.displayImage} alt={quickView.name} />
                            ) : (
                                <div className="shop-empty-image-placeholder">GEEKA</div>
                            )}
                        </div>
                        <div className="quick-view-content">
                            <span>{categoryName(quickView) || "COLLECTION"}</span>
                            <h2>{quickView.name}</h2>
                            <div className="quick-view-price">
                                {quickView.price === null
                                    ? "PRICE ON REQUEST"
                                    : `FROM ${formatPrice(quickView.price, quickView.currency || "INR")}`}
                            </div>
                            <p>
                                {quickView.detail?.description ||
                                    "Product details are available on the product page."}
                            </p>
                            <div className="quick-view-actions">
                                <button
                                    type="button"
                                    className="quick-view-add"
                                    onClick={() => addToCart(quickView)}
                                >
                                    {quickView.inStock ? "ADD TO CART" : "VIEW PRODUCT"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/product/${encodeURIComponent(productId(quickView))}`)}
                                >
                                    SHOP PRODUCT <ArrowIcon />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {cartMessage && (
                <div className="cart-message" role="status">
                    {cartMessage}
                </div>
            )}
        </>
    );
}
