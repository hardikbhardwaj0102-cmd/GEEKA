import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import "../style/ProductCatalog.css";

import {
    getDefaultPurchasableVariant,
    getProductCards,
    getProductsPage,
} from "../services/productService";

import {
    addCartItem,
} from "../services/cartService";


const WISHLIST_KEY =
    "geeka-wishlist";

const PRODUCTS_TO_SHOW =
    8;


/* =========================================================
   WISHLIST
========================================================= */

function readWishlist() {
    try {
        const parsed =
            JSON.parse(
                localStorage.getItem(
                    WISHLIST_KEY
                ) || "[]"
            );

        if (!Array.isArray(parsed)) {
            return [];
        }

        return [
            ...new Set(
                parsed
                    .map((item) =>
                        typeof item ===
                            "object" &&
                            item !== null
                            ? item?.id ??
                            item?.productId ??
                            item?._id ??
                            item?.uuid
                            : item
                    )
                    .map((id) =>
                        String(
                            id ?? ""
                        ).trim()
                    )
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
            JSON.stringify(
                [
                    ...new Set(
                        items
                            .map((id) =>
                                String(
                                    id
                                ).trim()
                            )
                            .filter(Boolean)
                    ),
                ]
            )
        );
    } catch {
        // Ignore localStorage failures.
    }
}


/* =========================================================
   HELPERS
========================================================= */

function formatPrice(
    value,
    currency = "INR"
) {
    const amount =
        Number(value);

    if (!Number.isFinite(amount)) {
        return "PRICE ON REQUEST";
    }

    try {
        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency,
                maximumFractionDigits: 0,
            }
        ).format(amount);
    } catch {
        return `₹${amount.toLocaleString(
            "en-IN"
        )}`;
    }
}


function getProductId(product) {
    return String(
        product?.id ?? ""
    ).trim();
}


function getProductImages(product) {
    const candidates = [
        product?.displayImage,
        product?.image,
        product?.imageUrl,
        product?.image_url,
        ...(Array.isArray(product?.images) ? product.images : []),
        ...(Array.isArray(product?.gallery) ? product.gallery : []),
        ...(Array.isArray(product?.imageUrls) ? product.imageUrls : []),
        ...(Array.isArray(product?.image_urls) ? product.image_urls : []),
        product?.detail?.displayImage,
        product?.detail?.image,
        product?.detail?.imageUrl,
        product?.detail?.image_url,
        ...(Array.isArray(product?.detail?.images) ? product.detail.images : []),
        ...(Array.isArray(product?.detail?.gallery) ? product.detail.gallery : []),
        ...(Array.isArray(product?.detail?.imageUrls) ? product.detail.imageUrls : []),
        ...(Array.isArray(product?.detail?.image_urls) ? product.detail.image_urls : []),
    ];

    const flattened = candidates.flatMap((item) => {
        if (!item) {
            return [];
        }

        if (typeof item === "string") {
            return [item];
        }

        if (typeof item === "object") {
            return [
                item?.url,
                item?.image,
                item?.imageUrl,
                item?.image_url,
                item?.src,
            ].filter(Boolean);
        }

        return [];
    });

    return [
        ...new Set(
            flattened
                .map((url) => String(url).trim())
                .filter(Boolean)
        ),
    ];
}

function getQuickViewImages(product) {
    const images = getProductImages(product);

    if (images.length) {
        return images;
    }

    return product?.displayImage
        ? [product.displayImage]
        : [];
}


/* =========================================================
   ICONS
========================================================= */

function ArrowIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
        >
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
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
        >
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


function HeartIcon({
    filled = false,
}) {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
        >
            <path
                d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z"
                fill={
                    filled
                        ? "currentColor"
                        : "none"
                }
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
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
        >
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
    const navigate =
        useNavigate();

    const timerRef =
        useRef(null);

    const [
        products,
        setProducts,
    ] = useState([]);

    const [
        activeCategory,
        setActiveCategory,
    ] = useState("ALL");

    const [
        wishlist,
        setWishlist,
    ] = useState(
        readWishlist
    );

    const [
        quickView,
        setQuickView,
    ] = useState(null);

    const [
        quickViewImage,
        setQuickViewImage,
    ] = useState("");

    const [
        toast,
        setToast,
    ] = useState("");

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");


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

                if (
                    Array.isArray(
                        productsProp
                    )
                ) {
                    baseProducts =
                        productsProp.slice(
                            0,
                            PRODUCTS_TO_SHOW
                        );
                } else {
                    const response =
                        await getProductsPage();

                    baseProducts =
                        Array.isArray(
                            response?.results
                        )
                            ? response.results.slice(
                                0,
                                PRODUCTS_TO_SHOW
                            )
                            : [];
                }

                const cards =
                    await getProductCards(
                        baseProducts
                    );

                if (!active) {
                    return;
                }

                setProducts(
                    Array.isArray(cards)
                        ? cards
                        : []
                );
            } catch (
            requestError
            ) {
                if (!active) {
                    return;
                }

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
                clearTimeout(
                    timerRef.current
                );
            }
        };
    }, [
        productsProp,
    ]);


    /* =====================================================
       QUICK VIEW BODY LOCK
    ===================================================== */

    useEffect(() => {
        if (!quickView) {
            setQuickViewImage("");
            return;
        }

        const images = getQuickViewImages(quickView);

        setQuickViewImage(
            images[0] ||
            quickView?.displayImage ||
            ""
        );

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow =
            "hidden";

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setQuickView(null);
            }
        };

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            document.body.style.overflow =
                previousOverflow;

            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [
        quickView,
    ]);


    /* =====================================================
       CATEGORIES
    ===================================================== */

    const categories =
        useMemo(() => {
            const values =
                products
                    .map(
                        (product) =>
                            product?.categoryName
                    )
                    .filter(Boolean);

            return [
                "ALL",
                ...new Map(
                    values.map(
                        (value) => [
                            value.toLowerCase(),
                            value,
                        ]
                    )
                ).values(),
            ];
        }, [
            products,
        ]);


    /* =====================================================
       FILTERED PRODUCTS
    ===================================================== */

    const visibleProducts =
        useMemo(() => {
            if (
                activeCategory ===
                "ALL"
            ) {
                return products;
            }

            return products.filter(
                (product) =>
                    product?.categoryName
                        ?.toLowerCase() ===
                    activeCategory.toLowerCase()
            );
        }, [
            activeCategory,
            products,
        ]);


    /* =====================================================
       TOAST
    ===================================================== */

    const showToast =
        (message) => {
            setToast(message);

            if (
                timerRef.current
            ) {
                clearTimeout(
                    timerRef.current
                );
            }

            timerRef.current =
                setTimeout(
                    () =>
                        setToast(""),
                    2600
                );
        };


    /* =====================================================
       WISHLIST
    ===================================================== */

    const toggleWishlist =
        (id) => {
            if (!id) {
                return;
            }

            setWishlist(
                (current) => {
                    const next =
                        current.includes(
                            id
                        )
                            ? current.filter(
                                (item) =>
                                    item !==
                                    id
                            )
                            : [
                                ...current,
                                id,
                            ];

                    writeWishlist(
                        next
                    );

                    window.dispatchEvent(
                        new CustomEvent(
                            "geeka-wishlist-updated"
                        )
                    );

                    return next;
                }
            );
        };


    /* =====================================================
       ADD TO BAG
    ===================================================== */

    const handleAddToBag =
        async (
            product
        ) => {
            if (!product) {
                return;
            }

            const variant =
                getDefaultPurchasableVariant(
                    product?.detail
                );

            if (
                !variant?.id ||
                variant?.in_stock !==
                true ||
                Number(
                    variant?.stock
                ) < 1
            ) {
                navigate(
                    `/product/${encodeURIComponent(
                        getProductId(
                            product
                        )
                    )}`
                );

                return;
            }

            try {
                await addCartItem(
                    variant.id,
                    1
                );

                showToast(
                    `${product.name} ADDED TO BAG`
                );
            } catch (
            requestError
            ) {
                showToast(
                    requestError?.message ||
                    "Unable to add this item to bag."
                );
            }
        };


    /* =====================================================
       PRODUCT NAVIGATION
    ===================================================== */

    const openProduct =
        (product) => {
            const id =
                getProductId(
                    product
                );

            if (!id) {
                navigate(
                    "/shop"
                );

                return;
            }

            navigate(
                `/product/${encodeURIComponent(
                    id
                )}`
            );
        };


    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <section
            className="catalog-section"
        >
            <div className="catalog-container">

                {/* =================================================
                    HEADER
                ================================================= */}

                <header className="catalog-header">

                    <div className="catalog-header-main">

                        <div className="catalog-eyebrow">

                            <span />

                            CURATED STORE EDIT

                        </div>


                        <h2>
                            <span>
                                Shop
                            </span>

                            {" "}

                            <em>
                                the collection.
                            </em>
                        </h2>


                        <p>
                            Explore published pieces from the
                            Geeka catalogue, with pricing and
                            availability controlled by the store.
                        </p>

                    </div>


                    <div className="catalog-header-side">

                        <div className="catalog-count">

                            <strong>
                                {products.length}
                            </strong>

                            <span>
                                LOADED
                            </span>

                        </div>


                        <div className="catalog-header-note">
                            PUBLISHED PRODUCTS
                        </div>

                    </div>

                </header>


                {/* =================================================
                    CATEGORY NAVIGATION
                ================================================= */}

                <nav
                    className="catalog-navigation"
                    aria-label="Product categories"
                >

                    <div className="catalog-category-list">

                        {categories.map(
                            (category) => (

                                <button
                                    type="button"
                                    key={category}
                                    className={
                                        activeCategory ===
                                            category
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        setActiveCategory(
                                            category
                                        )
                                    }
                                >
                                    {category ===
                                        "ALL"
                                        ? "ALL"
                                        : category}
                                </button>

                            )
                        )}

                    </div>


                    <span className="catalog-navigation-label">
                        GEEKA CATALOGUE
                    </span>

                </nav>


                {/* =================================================
                    CONTENT
                ================================================= */}

                {loading ? (

                    <div className="catalog-grid">

                        {Array.from({
                            length:
                                PRODUCTS_TO_SHOW,
                        }).map(
                            (
                                _,
                                index
                            ) => (
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
                            )
                        )}

                    </div>

                ) : error ? (

                    <div className="catalog-empty">

                        <span>
                            ERROR
                        </span>

                        <h3>
                            Catalogue unavailable.
                        </h3>

                        <p>
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                window.location.reload()
                            }
                        >
                            TRY AGAIN

                            <ArrowIcon />
                        </button>

                    </div>

                ) : visibleProducts.length === 0 ? (

                    <div className="catalog-empty">

                        <span>
                            EMPTY
                        </span>

                        <h3>
                            No products in this category.
                        </h3>

                        <p>
                            The catalogue does not contain
                            published products in this selection.
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                setActiveCategory(
                                    "ALL"
                                )
                            }
                        >
                            VIEW ALL

                            <ArrowIcon />
                        </button>

                    </div>

                ) : (

                    <div className="catalog-grid">

                        {visibleProducts.map(
                            (
                                product,
                                index
                            ) => {

                                const id =
                                    getProductId(
                                        product
                                    );

                                const wishlisted =
                                    wishlist.includes(
                                        id
                                    );

                                const image =
                                    product?.displayImage ||
                                    "";

                                const price =
                                    product?.price;

                                const purchasable =
                                    Boolean(
                                        product?.isPurchasable
                                    );

                                return (

                                    <article
                                        className="catalog-card"
                                        key={id}
                                    >

                                        <div
                                            className="catalog-image-wrap"
                                            onClick={() =>
                                                openProduct(
                                                    product
                                                )
                                            }
                                            role="link"
                                            tabIndex={0}
                                            onKeyDown={(
                                                event
                                            ) => {

                                                if (
                                                    event.key ===
                                                    "Enter" ||
                                                    event.key ===
                                                    " "
                                                ) {
                                                    event.preventDefault();

                                                    openProduct(
                                                        product
                                                    );
                                                }

                                            }}
                                        >

                                            {image ? (

                                                <img
                                                    className="catalog-image"
                                                    src={
                                                        image
                                                    }
                                                    alt={
                                                        product?.name ||
                                                        "Geeka product"
                                                    }
                                                    loading={
                                                        index < 4
                                                            ? "eager"
                                                            : "lazy"
                                                    }
                                                />

                                            ) : (

                                                <div className="catalog-image-placeholder">

                                                    <span>
                                                        GEEKA
                                                    </span>

                                                </div>

                                            )}


                                            <span className="catalog-product-number">
                                                {String(
                                                    index + 1
                                                ).padStart(
                                                    2,
                                                    "0"
                                                )}
                                            </span>


                                            <span className="catalog-product-badge">
                                                {
                                                    purchasable
                                                        ? "AVAILABLE"
                                                        : "SOLD OUT"
                                                }
                                            </span>


                                            <button
                                                type="button"
                                                className={
                                                    `catalog-wishlist ${wishlisted
                                                        ? "active"
                                                        : ""
                                                    }`
                                                }
                                                onClick={(
                                                    event
                                                ) => {

                                                    event.preventDefault();
                                                    event.stopPropagation();

                                                    toggleWishlist(
                                                        id
                                                    );

                                                }}
                                                aria-label={
                                                    wishlisted
                                                        ? "Remove from wishlist"
                                                        : "Add to wishlist"
                                                }
                                                aria-pressed={
                                                    wishlisted
                                                }
                                            >
                                                <HeartIcon
                                                    filled={
                                                        wishlisted
                                                    }
                                                />
                                            </button>


                                            <div className="catalog-quick-actions">

                                                <button
                                                    type="button"
                                                    className="catalog-quick-shop"
                                                    onClick={(
                                                        event
                                                    ) => {

                                                        event.preventDefault();
                                                        event.stopPropagation();

                                                        setQuickView(
                                                            product
                                                        );

                                                        setQuickViewImage(
                                                            getQuickViewImages(
                                                                product
                                                            )[0] ||
                                                            product?.displayImage ||
                                                            ""
                                                        );

                                                    }}
                                                >

                                                    <span>
                                                        QUICK VIEW
                                                    </span>

                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        aria-hidden="true"
                                                    >
                                                        <path
                                                            d="M2.8 12s3.5-5.4 9.2-5.4S21.2 12 21.2 12s-3.5 5.4-9.2 5.4S2.8 12 2.8 12Z"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="1.3"
                                                        />

                                                        <circle
                                                            cx="12"
                                                            cy="12"
                                                            r="2.5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="1.3"
                                                        />
                                                    </svg>

                                                </button>

                                            </div>

                                        </div>


                                        <div className="catalog-info">

                                            <div className="catalog-meta">

                                                <span>
                                                    {
                                                        product?.categoryName ||
                                                        "COLLECTION"
                                                    }
                                                </span>

                                                {!purchasable && (
                                                    <span>
                                                        OUT OF STOCK
                                                    </span>
                                                )}

                                            </div>


                                            <h3>

                                                <Link
                                                    to={`/product/${encodeURIComponent(
                                                        id
                                                    )}`}
                                                >
                                                    {
                                                        product?.name
                                                    }
                                                </Link>

                                            </h3>


                                            <div className="catalog-bottom">

                                                <div className="catalog-price-area">

                                                    <strong className="catalog-price">

                                                        {
                                                            price ===
                                                                null ||
                                                                price ===
                                                                undefined
                                                                ? "PRICE ON REQUEST"
                                                                : `FROM ${formatPrice(
                                                                    price,
                                                                    product?.currency ||
                                                                    "INR"
                                                                )}`
                                                        }

                                                    </strong>

                                                </div>


                                                <button
                                                    type="button"
                                                    className="catalog-quick-add"
                                                    onClick={() =>
                                                        handleAddToBag(
                                                            product
                                                        )
                                                    }
                                                >

                                                    {
                                                        purchasable && (
                                                            <BagCheckIcon />
                                                        )
                                                    }

                                                    {
                                                        purchasable
                                                            ? "ADD TO BAG"
                                                            : "VIEW PRODUCT"
                                                    }

                                                </button>

                                            </div>

                                        </div>

                                    </article>
                                );
                            }
                        )}

                    </div>

                )}


                {/* =================================================
                    FOOTER
                ================================================= */}

                <footer className="catalog-footer">

                    <div className="catalog-footer-left">

                        <span>
                            {visibleProducts.length} SHOWN
                        </span>

                        <p>
                            More products are available
                            in the full Geeka shop.
                        </p>

                    </div>


                    <div className="catalog-footer-center">

                        <div className="catalog-footer-line" />

                        <span>
                            NEWEST FIRST
                        </span>

                        <div className="catalog-footer-line" />

                    </div>


                    <Link
                        to="/shop"
                        className="catalog-footer-button"
                    >
                        VIEW SHOP

                        <ArrowIcon />
                    </Link>

                </footer>

            </div>


            {/* =================================================
                BAG TOAST
            ================================================= */}

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

                        <strong>
                            GEEKA BAG
                        </strong>

                        <span>
                            {toast}
                        </span>

                    </div>


                    <button
                        type="button"
                        className="catalog-bag-toast-close"
                        onClick={() =>
                            setToast("")
                        }
                        aria-label="Close notification"
                    >
                        <CloseIcon />
                    </button>

                </div>

            )}


            {/* =================================================
                QUICK VIEW
            ================================================= */}

            {quickView && (() => {
                const quickImages =
                    getQuickViewImages(
                        quickView
                    );

                const activeImage =
                    quickViewImage ||
                    quickImages[0] ||
                    quickView?.displayImage ||
                    "";

                const quickVariant =
                    getDefaultPurchasableVariant(
                        quickView?.detail
                    );

                const quickPurchasable =
                    Boolean(
                        quickView?.isPurchasable
                    );

                const quickDescription =
                    quickView?.detail
                        ?.description ||
                    quickView?.description ||
                    "Product details are available on the product page.";

                const quickPrice =
                    quickView?.price === null ||
                        quickView?.price === undefined
                        ? "PRICE ON REQUEST"
                        : `FROM ${formatPrice(
                            quickView.price,
                            quickView.currency || "INR"
                        )}`;

                return (
                    <div
                        className="catalog-quick-overlay"
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Quick view for ${quickView?.name || "product"
                            }`}
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                setQuickView(null);
                            }
                        }}
                    >
                        <div
                            className="catalog-quick-modal"
                            onMouseDown={(event) =>
                                event.stopPropagation()
                            }
                        >
                            <button
                                type="button"
                                className="catalog-quick-close"
                                onClick={() =>
                                    setQuickView(null)
                                }
                                aria-label="Close quick view"
                            >
                                <CloseIcon />
                            </button>

                            <div className="catalog-quick-image">
                                <div className="catalog-quick-image-stage">
                                    {activeImage ? (
                                        <img
                                            src={activeImage}
                                            alt={
                                                quickView?.name ||
                                                "Geeka product"
                                            }
                                            className="catalog-quick-product-image"
                                            onError={(event) => {
                                                event.currentTarget.style.display =
                                                    "none";
                                            }}
                                        />
                                    ) : (
                                        <div className="catalog-image-placeholder">
                                            <span>GEEKA</span>
                                        </div>
                                    )}
                                </div>

                                {quickImages.length > 1 && (
                                    <div
                                        className="catalog-quick-thumbnails"
                                        aria-label="Product images"
                                    >
                                        {quickImages.map(
                                            (image, imageIndex) => (
                                                <button
                                                    type="button"
                                                    key={`${image}-${imageIndex}`}
                                                    className={
                                                        activeImage === image
                                                            ? "active"
                                                            : ""
                                                    }
                                                    onClick={() =>
                                                        setQuickViewImage(
                                                            image
                                                        )
                                                    }
                                                    aria-label={`View image ${imageIndex + 1
                                                        }`}
                                                    aria-pressed={
                                                        activeImage === image
                                                    }
                                                >
                                                    <img
                                                        src={image}
                                                        alt=""
                                                        loading="lazy"
                                                    />
                                                </button>
                                            )
                                        )}
                                    </div>
                                )}

                                <span className="catalog-quick-image-count">
                                    {quickImages.length > 1
                                        ? `${Math.max(
                                            quickImages.indexOf(
                                                activeImage
                                            ) + 1,
                                            1
                                        )} / ${quickImages.length}`
                                        : "PRODUCT IMAGE"}
                                </span>
                            </div>

                            <div className="catalog-quick-content">
                                <span className="catalog-quick-category">
                                    {
                                        quickView?.categoryName ||
                                        "COLLECTION"
                                    }
                                </span>

                                <h3>
                                    {
                                        quickView?.name ||
                                        "Geeka Product"
                                    }
                                </h3>

                                <div className="catalog-quick-price">
                                    {quickPrice}
                                </div>

                                <div className="catalog-quick-scroll">
                                    <p>
                                        {quickDescription}
                                    </p>

                                    {quickVariant && (
                                        <div className="catalog-quick-stock">
                                            <span>AVAILABILITY</span>
                                            <strong>
                                                {quickPurchasable
                                                    ? "IN STOCK"
                                                    : "OUT OF STOCK"}
                                            </strong>
                                        </div>
                                    )}
                                </div>

                                <div className="catalog-quick-actions">
                                    <button
                                        type="button"
                                        className="catalog-quick-add"
                                        onClick={() =>
                                            handleAddToBag(
                                                quickView
                                            )
                                        }
                                    >
                                        {quickPurchasable
                                            ? "ADD TO BAG"
                                            : "VIEW PRODUCT"}
                                    </button>

                                    <button
                                        type="button"
                                        className="catalog-quick-shop"
                                        onClick={() =>
                                            openProduct(
                                                quickView
                                            )
                                        }
                                    >
                                        SHOP PRODUCT
                                        <ArrowIcon />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

        </section>
    );
}
