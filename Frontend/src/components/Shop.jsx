import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../style/Shop.css";

import Header from "./Header";
import { useCart } from "../hooks/useCart";
import { getProducts } from "../services/productService";

import shopBanner from "../assets/top-banner.jpg";
function formatPrice(price) {
    return `₹${price.toLocaleString("en-IN")}`;
}

function SearchIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.8" cy="10.8" r="6.2" />
            <path d="M15.5 15.5 21 21" />
        </svg>
    );
}

function HeartIcon({ filled = false }) {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={filled ? "filled" : ""}
        >
            <path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6 18 18M18 6 6 18" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}

function FilterIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M7 12h10M10 17h4" />
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h13M13 6l6 6-6 6" />
        </svg>
    );
}

function ProductCard({
    product,
    isWishlisted,
    onToggleWishlist,
    onQuickView,
    onAddToCart,
}) {
    return (
        <article className="shop-product-card">

            <div className="shop-product-image">

                <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                />

                {product.isNew && (
                    <span className="shop-product-new">
                        NEW
                    </span>
                )}

                <button
                    type="button"
                    className={`shop-product-heart ${isWishlisted ? "active" : ""
                        }`}
                    onClick={() =>
                        onToggleWishlist(product.id)
                    }
                    aria-label={
                        isWishlisted
                            ? `Remove ${product.name} from wishlist`
                            : `Add ${product.name} to wishlist`
                    }
                >
                    <HeartIcon filled={isWishlisted} />
                </button>

                <div className="shop-image-actions">
                    <button
                        type="button"
                        onClick={() =>
                            onQuickView(product)
                        }
                    >
                        QUICK VIEW
                    </button>
                </div>

            </div>


            <div className="shop-product-info">

                <span className="shop-product-category">
                    {product.category}
                </span>

                <h3>
                    {product.name}
                </h3>

                <div className="shop-product-price">

                    <strong>
                        {formatPrice(product.price)}
                    </strong>

                    {product.oldPrice && (
                        <del>
                            {formatPrice(product.oldPrice)}
                        </del>
                    )}

                </div>

                <button
                    type="button"
                    className="shop-add-cart"
                    disabled={!product.inStock}
                    onClick={() =>
                        onAddToCart(product)
                    }
                >
                    {product.inStock
                        ? "ADD TO CART"
                        : "SOLD OUT"}

                    {product.inStock && (
                        <PlusIcon />
                    )}
                </button>

            </div>

        </article>
    );
}

export default function Shop() {

    const [category, setCategory] = useState("All");
    const [search, setSearch] = useState("");

    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(2500);

    const [newOnly, setNewOnly] = useState(false);
    const [stockOnly, setStockOnly] = useState(false);

    const [sortBy, setSortBy] = useState("featured");

    const [wishlist, setWishlist] = useState(() => {
        try {
            const saved =
                localStorage.getItem("geeka-wishlist");

            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [quickView, setQuickView] = useState(null);

    const [mobileFilters, setMobileFilters] =
        useState(false);

    const [cartMessage, setCartMessage] =
        useState(false);

    const { addItem, cartCount } = useCart();

    const [products, setProducts] = useState([]);

    useEffect(() => {
        let active = true;

        async function loadProducts() {
            try {
                const items = await getProducts();

                if (active) {
                    setProducts(Array.isArray(items) ? items : []);
                }
            } catch {
                if (active) {
                    setProducts([]);
                }
            }
        }

        loadProducts();

        return () => {
            active = false;
        };
    }, []);

    const categories = useMemo(() => {
        const uniqueCategories = [
            ...new Set(
                products
                    .map((product) => product.category)
                    .filter(Boolean)
            ),
        ];

        return ["All", ...uniqueCategories];
    }, [products]);


    useEffect(() => {
        localStorage.setItem(
            "geeka-wishlist",
            JSON.stringify(wishlist)
        );

        window.dispatchEvent(
            new Event("geeka-wishlist-updated")
        );
    }, [wishlist]);



    useEffect(() => {

        document.body.style.overflow =
            mobileFilters || quickView
                ? "hidden"
                : "";

        return () => {
            document.body.style.overflow = "";
        };

    }, [mobileFilters, quickView]);


    useEffect(() => {

        if (!cartMessage) return;

        const timer = setTimeout(() => {
            setCartMessage(false);
        }, 2200);

        return () => clearTimeout(timer);

    }, [cartMessage]);


    const filteredProducts = useMemo(() => {

        const query = search
            .trim()
            .toLowerCase();

        const results = products.filter(
            (product) => {

                const matchesCategory =
                    category === "All" ||
                    product.category === category;

                const matchesSearch =
                    !query ||
                    product.name
                        .toLowerCase()
                        .includes(query) ||
                    product.category
                        .toLowerCase()
                        .includes(query);

                const matchesPrice =
                    product.price >= minPrice &&
                    product.price <= maxPrice;

                const matchesNew =
                    !newOnly || product.isNew;

                const matchesStock =
                    !stockOnly ||
                    product.inStock;

                return (
                    matchesCategory &&
                    matchesSearch &&
                    matchesPrice &&
                    matchesNew &&
                    matchesStock
                );
            }
        );


        return [...results].sort(
            (a, b) => {

                switch (sortBy) {

                    case "newest":
                        return (
                            Number(b.isNew) -
                            Number(a.isNew)
                        );

                    case "price-low":
                        return (
                            a.price -
                            b.price
                        );

                    case "price-high":
                        return (
                            b.price -
                            a.price
                        );

                    case "name":
                        return a.name.localeCompare(
                            b.name
                        );

                    case "featured":
                    default:
                        return (
                            Number(b.featured) -
                            Number(a.featured)
                        );
                }
            }
        );

    }, [
        category,
        search,
        minPrice,
        maxPrice,
        newOnly,
        stockOnly,
        sortBy,
        products,
    ]);


    const clearFilters = () => {

        setCategory("All");
        setSearch("");
        setMinPrice(0);
        setMaxPrice(2500);
        setNewOnly(false);
        setStockOnly(false);
        setSortBy("featured");

    };


    const toggleWishlist = (productId) => {

        setWishlist((current) =>

            current.includes(productId)

                ? current.filter(
                    (id) =>
                        id !== productId
                )

                : [
                    ...current,
                    productId,
                ]

        );
    };


    const addToCart = (product) => {
        addItem(product);
        setCartMessage(true);
    };


    const categoryCount = (
        selectedCategory
    ) => {

        if (selectedCategory === "All") {
            return products.length;
        }

        return products.filter(
            (product) =>
                product.category ===
                selectedCategory
        ).length;
    };


    const hasFilters =
        category !== "All" ||
        minPrice !== 0 ||
        maxPrice !== 2500 ||
        newOnly ||
        stockOnly ||
        search.trim() !== "";


    return (
        <>
            {/* =====================================================
                SAME GEEKA NAVBAR
                This is your existing Header component.
            ====================================================== */}

            <Header />


            {/* =====================================================
                SHOP PAGE
            ====================================================== */}

            <main className="shop-page">


                {/* =================================================
                    SHOP HERO BANNER
                ================================================== */}

                <section className="shop-banner">

                    <img
                        src={shopBanner}
                        alt="Geeka collection"
                        className="top-banner-image"
                    />


                    <div className="shop-banner-content">

                        <span className="shop-banner-eyebrow">
                            The Geeka Edit.
                        </span>


                        <h1>
                            Made to be
                            <br />
                            yours.
                        </h1>


                        <p>
                            Discover thoughtfully chosen
                            ethnic wear, jewellery and
                            handmade creations designed
                            for everyday expression.
                        </p>

                    </div>

                </section>


                {/* =================================================
                    SHOP CONTAINER
                ================================================== */}

                <section className="shop-container">


                    {/* TOOLBAR */}

                    <div className="shop-toolbar">

                        <div className="shop-search-box">

                            <SearchIcon />

                            <input
                                type="text"
                                value={search}
                                placeholder="Search products..."
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                            />

                            {search && (

                                <button
                                    type="button"
                                    className="clear-search"
                                    onClick={() =>
                                        setSearch("")
                                    }
                                >
                                    <CloseIcon />
                                </button>

                            )}

                        </div>


                        <div className="shop-toolbar-right">

                            <button
                                type="button"
                                className="mobile-filter-btn"
                                onClick={() =>
                                    setMobileFilters(true)
                                }
                            >
                                <FilterIcon />
                                FILTER
                            </button>


                            <span className="showing-count">

                                Showing 1 -{" "}
                                {
                                    filteredProducts.length
                                }{" "}
                                of{" "}
                                {products.length}{" "}
                                products

                            </span>


                            <div className="sort-box">

                                <label htmlFor="sort">
                                    SORT BY:
                                </label>


                                <select
                                    id="sort"
                                    value={sortBy}
                                    onChange={(event) =>
                                        setSortBy(
                                            event.target.value
                                        )
                                    }
                                >

                                    <option value="featured">
                                        Featured
                                    </option>

                                    <option value="newest">
                                        Newest
                                    </option>

                                    <option value="price-low">
                                        Price: Low → High
                                    </option>

                                    <option value="price-high">
                                        Price: High → Low
                                    </option>

                                    <option value="name">
                                        Name
                                    </option>

                                </select>

                            </div>

                        </div>

                    </div>


                    {/* ACTIVE FILTERS */}

                    {hasFilters && (

                        <div className="active-filter-row">

                            <span>
                                FILTERS:
                            </span>


                            {category !== "All" && (

                                <button
                                    type="button"
                                    onClick={() =>
                                        setCategory(
                                            "All"
                                        )
                                    }
                                >
                                    {category}

                                    <CloseIcon />

                                </button>

                            )}


                            {search && (

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearch("")
                                    }
                                >
                                    Search: {search}

                                    <CloseIcon />

                                </button>

                            )}


                            {(minPrice > 0 ||
                                maxPrice < 2500) && (

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMinPrice(0);
                                            setMaxPrice(2500);
                                        }}
                                    >
                                        {formatPrice(
                                            minPrice
                                        )}
                                        {" - "}
                                        {formatPrice(
                                            maxPrice
                                        )}

                                        <CloseIcon />

                                    </button>

                                )}


                            {newOnly && (

                                <button
                                    type="button"
                                    onClick={() =>
                                        setNewOnly(false)
                                    }
                                >
                                    New Arrivals

                                    <CloseIcon />

                                </button>

                            )}


                            {stockOnly && (

                                <button
                                    type="button"
                                    onClick={() =>
                                        setStockOnly(false)
                                    }
                                >
                                    In Stock

                                    <CloseIcon />

                                </button>

                            )}


                            <button
                                type="button"
                                className="clear-all"
                                onClick={
                                    clearFilters
                                }
                            >
                                CLEAR ALL
                            </button>

                        </div>

                    )}


                    {/* =================================================
                        MAIN SHOP
                    ================================================== */}

                    <div className="shop-main-layout">


                        {/* SIDEBAR */}

                        <aside className="shop-filters">


                            <div className="filter-block">

                                <h2>
                                    Category
                                </h2>


                                <div className="filter-category-list">

                                    {categories.map(
                                        (item) => (

                                            <button
                                                key={item}
                                                type="button"
                                                className={
                                                    category ===
                                                        item
                                                        ? "active"
                                                        : ""
                                                }
                                                onClick={() =>
                                                    setCategory(
                                                        item
                                                    )
                                                }
                                            >

                                                <span>
                                                    {item}
                                                </span>

                                                <span>
                                                    {categoryCount(
                                                        item
                                                    )}
                                                </span>

                                            </button>

                                        )
                                    )}

                                </div>

                            </div>


                            <div className="filter-block">

                                <h2>
                                    Price Range
                                </h2>


                                <div className="price-values">

                                    <span>
                                        {formatPrice(
                                            minPrice
                                        )}
                                    </span>

                                    <span>
                                        {formatPrice(
                                            maxPrice
                                        )}
                                    </span>

                                </div>


                                <div className="range-container">

                                    <input
                                        type="range"
                                        min="0"
                                        max="2500"
                                        step="50"
                                        value={
                                            minPrice
                                        }
                                        onChange={(event) => {

                                            const value =
                                                Number(
                                                    event
                                                        .target
                                                        .value
                                                );

                                            setMinPrice(
                                                Math.min(
                                                    value,
                                                    maxPrice
                                                )
                                            );

                                        }}
                                    />


                                    <input
                                        type="range"
                                        min="0"
                                        max="2500"
                                        step="50"
                                        value={
                                            maxPrice
                                        }
                                        onChange={(event) => {

                                            const value =
                                                Number(
                                                    event
                                                        .target
                                                        .value
                                                );

                                            setMaxPrice(
                                                Math.max(
                                                    value,
                                                    minPrice
                                                )
                                            );

                                        }}
                                    />

                                </div>

                            </div>


                            <div className="filter-block">

                                <h2>
                                    Availability
                                </h2>


                                <label className="filter-option">

                                    <input
                                        type="checkbox"
                                        checked={
                                            stockOnly
                                        }
                                        onChange={(event) =>
                                            setStockOnly(
                                                event
                                                    .target
                                                    .checked
                                            )
                                        }
                                    />

                                    <span className="fake-checkbox" />

                                    <span>
                                        Availability
                                    </span>

                                </label>


                                <label className="filter-option">

                                    <input
                                        type="checkbox"
                                        checked={
                                            newOnly
                                        }
                                        onChange={(event) =>
                                            setNewOnly(
                                                event
                                                    .target
                                                    .checked
                                            )
                                        }
                                    />

                                    <span className="fake-checkbox" />

                                    <span>
                                        New Arrivals
                                    </span>

                                </label>

                            </div>


                            {hasFilters && (

                                <button
                                    type="button"
                                    className="reset-filters"
                                    onClick={
                                        clearFilters
                                    }
                                >
                                    RESET FILTERS
                                </button>

                            )}

                        </aside>


                        {/* PRODUCTS */}

                        <div className="shop-products-area">

                            {filteredProducts.length >
                                0 ? (

                                <div className="shop-product-grid">

                                    {filteredProducts.map(
                                        (product) => (

                                            <ProductCard
                                                key={
                                                    product.id
                                                }
                                                product={
                                                    product
                                                }
                                                isWishlisted={wishlist.includes(
                                                    product.id
                                                )}
                                                onToggleWishlist={
                                                    toggleWishlist
                                                }
                                                onQuickView={
                                                    setQuickView
                                                }
                                                onAddToCart={
                                                    addToCart
                                                }
                                            />

                                        )
                                    )}

                                </div>

                            ) : (

                                <div className="shop-empty">

                                    <div className="empty-search-icon">
                                        <SearchIcon />
                                    </div>


                                    <h2>
                                        No products found
                                    </h2>


                                    <p>
                                        No products match your
                                        search. Try different
                                        keywords or filters.
                                    </p>


                                    <button
                                        type="button"
                                        onClick={
                                            clearFilters
                                        }
                                    >
                                        CLEAR FILTERS

                                        <ArrowIcon />

                                    </button>

                                </div>

                            )}

                        </div>

                    </div>

                </section>


                {/* =================================================
                    MOBILE FILTER
                ================================================== */}

                {mobileFilters && (

                    <div
                        className="mobile-filter-overlay"
                        onClick={(event) => {

                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                setMobileFilters(
                                    false
                                );
                            }

                        }}
                    >

                        <div className="mobile-filter-panel">


                            <div className="mobile-filter-head">

                                <div>

                                    <span>
                                        REFINE
                                    </span>

                                    <h2>
                                        Filters
                                    </h2>

                                </div>


                                <button
                                    type="button"
                                    onClick={() =>
                                        setMobileFilters(
                                            false
                                        )
                                    }
                                >
                                    <CloseIcon />
                                </button>

                            </div>


                            <div className="mobile-filter-body">


                                <div className="filter-block">

                                    <h2>
                                        Category
                                    </h2>


                                    <div className="filter-category-list">

                                        {categories.map(
                                            (item) => (

                                                <button
                                                    key={
                                                        item
                                                    }
                                                    type="button"
                                                    className={
                                                        category ===
                                                            item
                                                            ? "active"
                                                            : ""
                                                    }
                                                    onClick={() =>
                                                        setCategory(
                                                            item
                                                        )
                                                    }
                                                >

                                                    <span>
                                                        {
                                                            item
                                                        }
                                                    </span>

                                                    <span>
                                                        {categoryCount(
                                                            item
                                                        )}
                                                    </span>

                                                </button>

                                            )
                                        )}

                                    </div>

                                </div>


                                <div className="filter-block">

                                    <h2>
                                        Price Range
                                    </h2>


                                    <div className="price-values">

                                        <span>
                                            {formatPrice(
                                                minPrice
                                            )}
                                        </span>

                                        <span>
                                            {formatPrice(
                                                maxPrice
                                            )}
                                        </span>

                                    </div>


                                    <div className="range-container">

                                        <input
                                            type="range"
                                            min="0"
                                            max="2500"
                                            step="50"
                                            value={
                                                minPrice
                                            }
                                            onChange={(event) => {

                                                const value =
                                                    Number(
                                                        event
                                                            .target
                                                            .value
                                                    );

                                                setMinPrice(
                                                    Math.min(
                                                        value,
                                                        maxPrice
                                                    )
                                                );

                                            }}
                                        />


                                        <input
                                            type="range"
                                            min="0"
                                            max="2500"
                                            step="50"
                                            value={
                                                maxPrice
                                            }
                                            onChange={(event) => {

                                                const value =
                                                    Number(
                                                        event
                                                            .target
                                                            .value
                                                    );

                                                setMaxPrice(
                                                    Math.max(
                                                        value,
                                                        minPrice
                                                    )
                                                );

                                            }}
                                        />

                                    </div>

                                </div>


                                <div className="filter-block">

                                    <h2>
                                        Availability
                                    </h2>


                                    <label className="filter-option">

                                        <input
                                            type="checkbox"
                                            checked={
                                                stockOnly
                                            }
                                            onChange={(event) =>
                                                setStockOnly(
                                                    event
                                                        .target
                                                        .checked
                                                )
                                            }
                                        />

                                        <span className="fake-checkbox" />

                                        <span>
                                            Availability
                                        </span>

                                    </label>


                                    <label className="filter-option">

                                        <input
                                            type="checkbox"
                                            checked={
                                                newOnly
                                            }
                                            onChange={(event) =>
                                                setNewOnly(
                                                    event
                                                        .target
                                                        .checked
                                                )
                                            }
                                        />

                                        <span className="fake-checkbox" />

                                        <span>
                                            New Arrivals
                                        </span>

                                    </label>

                                </div>

                            </div>


                            <div className="mobile-filter-footer">

                                <button
                                    type="button"
                                    onClick={
                                        clearFilters
                                    }
                                >
                                    CLEAR
                                </button>


                                <button
                                    type="button"
                                    className="apply-mobile-filter"
                                    onClick={() =>
                                        setMobileFilters(
                                            false
                                        )
                                    }
                                >
                                    SHOW{" "}
                                    {
                                        filteredProducts.length
                                    }{" "}
                                    products
                                </button>

                            </div>

                        </div>

                    </div>

                )}


                {/* =================================================
                    QUICK VIEW
                ================================================== */}

                {quickView && (

                    <div
                        className="quick-view-overlay"
                        onClick={(event) => {

                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                setQuickView(null);
                            }

                        }}
                    >

                        <div className="quick-view-modal">


                            <button
                                type="button"
                                className="quick-view-close"
                                onClick={() =>
                                    setQuickView(null)
                                }
                            >
                                <CloseIcon />
                            </button>


                            <div className="quick-view-image">

                                <img
                                    src={
                                        quickView.image
                                    }
                                    alt={
                                        quickView.name
                                    }
                                />

                            </div>


                            <div className="quick-view-content">

                                <span>
                                    {
                                        quickView.category
                                    }
                                </span>


                                <h2>
                                    {
                                        quickView.name
                                    }
                                </h2>


                                <div className="quick-view-price">

                                    <strong>
                                        {formatPrice(
                                            quickView.price
                                        )}
                                    </strong>

                                    {quickView.oldPrice && (

                                        <del>
                                            {formatPrice(
                                                quickView.oldPrice
                                            )}
                                        </del>

                                    )}

                                </div>


                                <p>
                                    {
                                        quickView.description
                                    }
                                </p>


                                <button
                                    type="button"
                                    className="quick-view-add"
                                    onClick={() => {

                                        addToCart(
                                            quickView
                                        );

                                        setQuickView(
                                            null
                                        );

                                    }}
                                >
                                    ADD TO CART

                                    <ArrowIcon />

                                </button>

                            </div>

                        </div>

                    </div>

                )}


                {/* =================================================
                    CART MESSAGE
                ================================================== */}

                {cartMessage && (

                    <div className="cart-message">

                        <span>
                            Added to your bag
                        </span>


                        <strong>
                            {cartCount}
                        </strong>


                        <button
                            type="button"
                            onClick={() =>
                                setCartMessage(
                                    false
                                )
                            }
                        >
                            ×
                        </button>

                    </div>

                )}

            </main>
        </>
    );
}