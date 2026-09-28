import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import "../style/ProductCatalog.css";

import ethnicImage from "../assets/Ethical.png";
import jewelleryImage from "../assets/jwel.png";
import creativeImage from "../assets/Hand.png";

import {
    useCart,
} from "../hooks/useCart";


/* =========================================================
   STORAGE
========================================================= */

const WISHLIST_KEY = "geeka-wishlist";


/* =========================================================
   DEMO PRODUCTS
========================================================= */

const demoProducts = [
    {
        id: "demo-1",
        name: "Meera Embroidered Kurta Set",
        category: "ETHNIC WEAR",
        price: 1899,
        image: ethnicImage,
        badge: "NEW",
    },
    {
        id: "demo-2",
        name: "Lotus Pearl Drop Earrings",
        category: "JEWELLERY",
        price: 799,
        image: jewelleryImage,
        badge: "NEW",
    },
    {
        id: "demo-3",
        name: "Handwoven Crochet Tote",
        category: "CREATIVE",
        price: 1299,
        image: creativeImage,
    },
    {
        id: "demo-4",
        name: "Riya Printed Anarkali",
        category: "ETHNIC WEAR",
        price: 2199,
        image: ethnicImage,
    },
    {
        id: "demo-5",
        name: "Aarohi Layered Necklace",
        category: "JEWELLERY",
        price: 999,
        image: jewelleryImage,
        badge: "LIMITED",
    },
    {
        id: "demo-6",
        name: "Petal Crochet Mini Bag",
        category: "CREATIVE",
        price: 1099,
        image: creativeImage,
    },
    {
        id: "demo-7",
        name: "Anaya Co-ord Set",
        category: "ETHNIC WEAR",
        price: 2399,
        image: ethnicImage,
    },
    {
        id: "demo-8",
        name: "Maya Floral Earrings",
        category: "JEWELLERY",
        price: 649,
        image: jewelleryImage,
    },
];


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


function LeftArrowIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
        >
            <path
                d="M19 12H5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
            />

            <path
                d="m11 6-6 6 6 6"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
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
   WISHLIST HELPERS
========================================================= */

function getWishlistId(item) {

    if (
        item !== null &&
        typeof item === "object"
    ) {

        return String(
            item?.id ??
            item?.productId ??
            item?._id ??
            item?.uuid ??
            ""
        ).trim();

    }

    return String(
        item ?? ""
    ).trim();

}


function normalizeWishlistIds(value) {

    if (!Array.isArray(value)) {
        return [];
    }


    const ids =
        value
            .map(
                getWishlistId
            )
            .filter(Boolean);


    return [
        ...new Set(ids),
    ];

}


function readWishlist() {

    try {

        const saved =
            localStorage.getItem(
                WISHLIST_KEY
            );


        if (!saved) {
            return [];
        }


        const parsed =
            JSON.parse(
                saved
            );


        return normalizeWishlistIds(
            parsed
        );

    } catch {

        return [];

    }

}


function saveWishlist(items) {

    try {

        const normalized =
            normalizeWishlistIds(
                items
            );


        localStorage.setItem(
            WISHLIST_KEY,
            JSON.stringify(
                normalized
            )
        );

    } catch {
        // Ignore localStorage errors.
    }

}


function getWishlistSignature(items) {

    return normalizeWishlistIds(
        items
    )
        .sort()
        .join("|");

}


function notifyWishlistChanged() {

    window.dispatchEvent(
        new Event(
            "geeka-wishlist-updated"
        )
    );

}


/* =========================================================
   PRODUCT HELPERS
========================================================= */

function getProductImage(product) {

    if (!product) {
        return "";
    }


    if (product.image) {
        return product.image;
    }


    if (product.image_url) {
        return product.image_url;
    }


    if (product.thumbnail) {
        return product.thumbnail;
    }


    if (
        Array.isArray(
            product.images
        ) &&
        product.images.length > 0
    ) {

        const first =
            product.images[0];


        if (
            typeof first ===
            "string"
        ) {

            return first;

        }


        if (first?.url) {
            return first.url;
        }


        if (first?.image_url) {
            return first.image_url;
        }

    }


    return "";
}


function formatPrice(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "";

    }


    const amount =
        Number(value);


    if (
        Number.isFinite(
            amount
        )
    ) {

        return `₹${amount.toLocaleString(
            "en-IN"
        )}`;

    }


    return String(
        value
    );

}


/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({
    product,
    index,
    wishlisted,
    added,
    onToggleWishlist,
    onQuickView,
    onAddToBag,
    onViewProduct,
}) {

    const image =
        getProductImage(
            product
        );


    const productName =
        product?.name ||
        "Geeka Product";


    return (

        <article
            className="catalog-card"
        >

            {/* =================================================
                IMAGE
            ================================================= */}

            <div
                className="catalog-image-wrap"
                role="button"
                tabIndex={0}
                onClick={() =>
                    onViewProduct(
                        product
                    )
                }
                onKeyDown={(event) => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        onViewProduct(
                            product
                        );

                    }

                }}
            >

                {image ? (

                    <img
                        src={image}
                        alt={
                            productName
                        }
                        className="catalog-image"
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


                {/* PRODUCT NUMBER */}

                <span className="catalog-product-number">

                    {
                        String(
                            index + 1
                        ).padStart(
                            2,
                            "0"
                        )
                    }

                </span>


                {/* BADGE */}

                {product?.badge && (

                    <span className="catalog-product-badge">

                        {
                            String(
                                product.badge
                            ).toUpperCase()
                        }

                    </span>

                )}


                {/* WISHLIST */}

                <button
                    type="button"
                    className={`catalog-wishlist ${wishlisted
                            ? "active"
                            : ""
                        }`}
                    aria-pressed={
                        wishlisted
                    }
                    aria-label={
                        wishlisted
                            ? `Remove ${productName} from wishlist`
                            : `Add ${productName} to wishlist`
                    }
                    onPointerDown={(event) => {

                        event.preventDefault();
                        event.stopPropagation();

                    }}
                    onClick={(event) => {

                        event.preventDefault();
                        event.stopPropagation();

                        onToggleWishlist(
                            product
                        );

                    }}
                >

                    <HeartIcon
                        filled={
                            wishlisted
                        }
                    />

                </button>


                {/* QUICK VIEW */}

                <button
                    type="button"
                    className="catalog-image-hover"
                    onPointerDown={(event) => {

                        event.preventDefault();
                        event.stopPropagation();

                    }}
                    onClick={(event) => {

                        event.preventDefault();
                        event.stopPropagation();

                        onQuickView(
                            product
                        );

                    }}
                >

                    <span>
                        QUICK VIEW
                    </span>

                    <ArrowIcon />

                </button>

            </div>


            {/* =================================================
                PRODUCT INFO
            ================================================= */}

            <div className="catalog-info">

                <div className="catalog-meta">

                    <span>
                        {
                            product?.category ||
                            "COLLECTION"
                        }
                    </span>


                    {product?.isNew && (

                        <span className="catalog-new">

                            NEW ARRIVAL

                        </span>

                    )}

                </div>


                <h3
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                        onViewProduct(
                            product
                        )
                    }
                    onKeyDown={(event) => {

                        if (
                            event.key ===
                            "Enter"
                        ) {

                            onViewProduct(
                                product
                            );

                        }

                    }}
                >

                    {
                        productName
                    }

                </h3>


                <div className="catalog-bottom">

                    <div className="catalog-price-area">

                        <strong className="catalog-price">

                            {
                                formatPrice(
                                    product?.price
                                )
                            }

                        </strong>


                        {product?.oldPrice && (

                            <del className="catalog-old-price">

                                {
                                    formatPrice(
                                        product.oldPrice
                                    )
                                }

                            </del>

                        )}

                    </div>


                    <button
                        type="button"
                        className={`catalog-add ${added
                                ? "added"
                                : ""
                            }`}
                        disabled={
                            product?.inStock ===
                            false
                        }
                        onClick={(event) => {

                            event.preventDefault();
                            event.stopPropagation();

                            onAddToBag(
                                product
                            );

                        }}
                    >

                        <span>

                            {
                                product?.inStock ===
                                    false

                                    ? "SOLD OUT"

                                    : added
                                        ? "ADDED"
                                        : "ADD TO BAG"
                            }

                        </span>


                        {product?.inStock !==
                            false && (

                                <ArrowIcon />

                            )}

                    </button>

                </div>

            </div>

        </article>
    );
}


/* =========================================================
   QUICK VIEW
========================================================= */

function QuickView({
    product,
    onClose,
    onAddToBag,
    onViewProduct,
}) {

    if (!product) {
        return null;
    }


    const image =
        getProductImage(
            product
        );


    return (

        <div
            className="catalog-quick-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Product quick view"
            onClick={(event) => {

                if (
                    event.target ===
                    event.currentTarget
                ) {

                    onClose();

                }

            }}
        >

            <div
                className="catalog-quick-modal"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >

                {/* CLOSE */}

                <button
                    type="button"
                    className="catalog-quick-close"
                    onClick={
                        onClose
                    }
                    aria-label="Close quick view"
                >

                    <CloseIcon />

                </button>


                {/* PRODUCT IMAGE */}

                <div className="catalog-quick-image">

                    {image ? (

                        <img
                            src={image}
                            alt={
                                product.name ||
                                "Geeka product"
                            }
                        />

                    ) : (

                        <div className="catalog-image-placeholder">

                            <span>
                                GEEKA
                            </span>

                        </div>

                    )}

                </div>


                {/* PRODUCT CONTENT */}

                <div className="catalog-quick-content">

                    <span className="catalog-quick-category">

                        {
                            product.category ||
                            "COLLECTION"
                        }

                    </span>


                    <h3>

                        {
                            product.name ||
                            "Geeka Product"
                        }

                    </h3>


                    <div className="catalog-quick-price">

                        <strong>

                            {
                                formatPrice(
                                    product.price
                                )
                            }

                        </strong>


                        {product.oldPrice && (

                            <del>

                                {
                                    formatPrice(
                                        product.oldPrice
                                    )
                                }

                            </del>

                        )}

                    </div>


                    {product.description && (

                        <p>

                            {
                                product.description
                            }

                        </p>

                    )}


                    <div className="catalog-quick-actions">

                        <button
                            type="button"
                            className="catalog-quick-add"
                            disabled={
                                product.inStock ===
                                false
                            }
                            onClick={() => {

                                onAddToBag(
                                    product
                                );

                                onClose();

                            }}
                        >

                            {
                                product.inStock ===
                                    false

                                    ? "SOLD OUT"

                                    : "ADD TO BAG"
                            }


                            {product.inStock !==
                                false && (

                                    <ArrowIcon />

                                )}

                        </button>


                        <button
                            type="button"
                            className="catalog-quick-shop"
                            onClick={() => {

                                onClose();

                                onViewProduct(
                                    product
                                );

                            }}
                        >

                            VIEW IN SHOP

                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
}


/* =========================================================
   PRODUCT CATALOG
========================================================= */

export default function ProductCatalog({
    products = [],
}) {

    const navigate =
        useNavigate();


    const {
        addItem,
    } = useCart();


    /* =====================================================
       STATE
    ===================================================== */

    const [
        activeCategory,
        setActiveCategory,
    ] = useState(
        "ALL"
    );


    const [
        wishlist,
        setWishlist,
    ] = useState(
        readWishlist
    );


    const [
        addedProducts,
        setAddedProducts,
    ] = useState({});


    const [
        quickView,
        setQuickView,
    ] = useState(null);


    /* =====================================================
       BAG TOAST
    ===================================================== */

    const [
        bagToast,
        setBagToast,
    ] = useState(null);


    const bagToastTimerRef =
        useRef(null);


    /* =====================================================
       WISHLIST TOAST
    ===================================================== */

    const [
        wishlistToast,
        setWishlistToast,
    ] = useState(null);


    const wishlistToastTimerRef =
        useRef(null);


    /* =====================================================
       CLEAN TOAST TIMERS
    ===================================================== */

    useEffect(() => {

        return () => {

            if (
                bagToastTimerRef.current
            ) {

                clearTimeout(
                    bagToastTimerRef.current
                );

            }


            if (
                wishlistToastTimerRef.current
            ) {

                clearTimeout(
                    wishlistToastTimerRef.current
                );

            }

        };

    }, []);


    /* =====================================================
       SHOW BAG TOAST
    ===================================================== */

    function showBagToast(product) {

        if (
            bagToastTimerRef.current
        ) {

            clearTimeout(
                bagToastTimerRef.current
            );

        }


        setBagToast({

            name:
                product?.name ||
                "Product",

        });


        bagToastTimerRef.current =
            window.setTimeout(
                () => {

                    setBagToast(
                        null
                    );

                    bagToastTimerRef.current =
                        null;

                },
                3000
            );

    }


    /* =====================================================
       SHOW WISHLIST TOAST
    ===================================================== */

    function showWishlistToast(
        product,
        added
    ) {

        if (
            wishlistToastTimerRef.current
        ) {

            clearTimeout(
                wishlistToastTimerRef.current
            );

        }


        setWishlistToast({

            name:
                product?.name ||
                "Product",

            added:
                Boolean(
                    added
                ),

        });


        wishlistToastTimerRef.current =
            window.setTimeout(
                () => {

                    setWishlistToast(
                        null
                    );

                    wishlistToastTimerRef.current =
                        null;

                },
                3000
            );

    }


    /* =====================================================
       DISPLAY PRODUCTS
    ===================================================== */

    const displayProducts =
        Array.isArray(
            products
        ) &&
            products.length > 0

            ? products

            : demoProducts;


    /* =====================================================
       CATEGORIES
    ===================================================== */

    const categories =
        useMemo(() => {

            const unique =
                new Set();


            displayProducts.forEach(
                (product) => {

                    if (
                        product?.category
                    ) {

                        unique.add(
                            String(
                                product.category
                            )
                                .trim()
                                .toUpperCase()
                        );

                    }

                }
            );


            return [

                "ALL",

                ...Array.from(
                    unique
                ),

            ];

        }, [
            displayProducts,
        ]);


    /* =====================================================
       FILTERED PRODUCTS
    ===================================================== */

    const filteredProducts =
        useMemo(() => {

            if (
                activeCategory ===
                "ALL"
            ) {

                return displayProducts;

            }


            return displayProducts.filter(
                (product) =>
                    String(
                        product?.category ||
                        ""
                    )
                        .trim()
                        .toUpperCase() ===
                    activeCategory
            );

        }, [
            displayProducts,
            activeCategory,
        ]);


    /* =====================================================
       WISHLIST EXTERNAL SYNC
    ===================================================== */

    useEffect(() => {

        function handleWishlistUpdate() {

            const nextWishlist =
                readWishlist();


            setWishlist(
                (currentWishlist) => {

                    if (
                        getWishlistSignature(
                            currentWishlist
                        ) ===
                        getWishlistSignature(
                            nextWishlist
                        )
                    ) {

                        return currentWishlist;

                    }


                    return nextWishlist;

                }
            );

        }


        window.addEventListener(
            "storage",
            handleWishlistUpdate
        );


        window.addEventListener(
            "geeka-wishlist-updated",
            handleWishlistUpdate
        );


        return () => {

            window.removeEventListener(
                "storage",
                handleWishlistUpdate
            );


            window.removeEventListener(
                "geeka-wishlist-updated",
                handleWishlistUpdate
            );

        };

    }, []);


    /* =====================================================
       TOGGLE WISHLIST
    ===================================================== */

    function toggleWishlist(
        product
    ) {

        if (!product) {
            return;
        }


        const productId =
            getWishlistId(
                product
            );


        if (!productId) {

            console.error(
                "GEEKA WISHLIST ERROR: Product has no ID.",
                product
            );

            return;

        }


        /*
         * Always read the latest localStorage value.
         */

        const currentWishlist =
            readWishlist();


        const exists =
            currentWishlist.includes(
                productId
            );


        const updatedWishlist =
            exists

                ? currentWishlist.filter(
                    (id) =>
                        id !==
                        productId
                )

                : [
                    ...currentWishlist,
                    productId,
                ];


        /*
         * Save first.
         */

        saveWishlist(
            updatedWishlist
        );


        /*
         * Update current component.
         */

        setWishlist(
            updatedWishlist
        );


        /*
         * Notify NewArrivals/Profile/etc.
         */

        notifyWishlistChanged();


        /*
         * IMPORTANT:
         * Show wishlist notification AFTER the action
         * has actually been processed.
         */

        showWishlistToast(
            product,
            !exists
        );

    }


    /* =====================================================
       CHECK WISHLIST
    ===================================================== */

    function isWishlisted(
        product
    ) {

        const productId =
            getWishlistId(
                product
            );


        if (!productId) {
            return false;
        }


        return wishlist.includes(
            productId
        );

    }


    /* =====================================================
       ADD TO BAG
    ===================================================== */

    function handleAddToBag(
        product
    ) {

        if (
            !product ||
            product.inStock ===
            false
        ) {

            return;

        }


        addItem(
            product
        );


        const productId =
            getWishlistId(
                product
            );


        if (productId) {

            setAddedProducts(
                (current) => ({

                    ...current,

                    [productId]:
                        true,

                })
            );


            window.setTimeout(
                () => {

                    setAddedProducts(
                        (current) => {

                            const updated = {
                                ...current,
                            };


                            delete updated[
                                productId
                            ];


                            return updated;

                        }
                    );

                },
                1600
            );

        }


        showBagToast(
            product
        );

    }


    /* =====================================================
       VIEW PRODUCT
    ===================================================== */

    function handleViewProduct(
        product
    ) {

        if (!product) {

            navigate(
                "/shop"
            );

            return;

        }


        if (
            product?.name
        ) {

            navigate(
                `/shop?search=${encodeURIComponent(
                    product.name
                )}`
            );

            return;

        }


        navigate(
            "/shop"
        );

    }


    /* =====================================================
       SHOP ALL
    ===================================================== */

    function handleViewAll() {

        navigate(
            "/shop"
        );

    }


    /* =====================================================
       QUICK VIEW BODY LOCK
    ===================================================== */

    useEffect(() => {

        if (!quickView) {

            return;

        }


        const previousOverflow =
            document.body.style.overflow;


        document.body.style.overflow =
            "hidden";


        return () => {

            document.body.style.overflow =
                previousOverflow;

        };

    }, [
        quickView,
    ]);


    /* =====================================================
       ESC TO CLOSE
    ===================================================== */

    useEffect(() => {

        if (!quickView) {

            return;

        }


        function handleEscape(
            event
        ) {

            if (
                event.key ===
                "Escape"
            ) {

                setQuickView(
                    null
                );

            }

        }


        window.addEventListener(
            "keydown",
            handleEscape
        );


        return () => {

            window.removeEventListener(
                "keydown",
                handleEscape
            );

        };

    }, [
        quickView,
    ]);


    /* =====================================================
       CLOSE BAG TOAST
    ===================================================== */

    function closeBagToast() {

        if (
            bagToastTimerRef.current
        ) {

            clearTimeout(
                bagToastTimerRef.current
            );

            bagToastTimerRef.current =
                null;

        }


        setBagToast(
            null
        );

    }


    /* =====================================================
       CLOSE WISHLIST TOAST
    ===================================================== */

    function closeWishlistToast() {

        if (
            wishlistToastTimerRef.current
        ) {

            clearTimeout(
                wishlistToastTimerRef.current
            );

            wishlistToastTimerRef.current =
                null;

        }


        setWishlistToast(
            null
        );

    }


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <section
            className="catalog-section"
            id="products"
        >

            <div className="catalog-container">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="catalog-header">

                    <div className="catalog-header-main">

                        <div className="catalog-eyebrow">

                            <span />

                            GEEKA COLLECTION

                        </div>


                        <h2>

                            Everything

                            <em>
                                Geeka.
                            </em>

                        </h2>


                        <p>

                            A considered collection of
                            fashion, jewellery and handmade
                            pieces created for everyday
                            expression.

                        </p>

                    </div>

                </div>


                {/* =================================================
                    CATEGORY NAVIGATION
                ================================================= */}

                <div className="catalog-navigation">

                    <div className="catalog-category-list">

                        {categories.map(
                            (category) => (

                                <button
                                    key={
                                        category
                                    }
                                    type="button"
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

                                    {
                                        category ===
                                            "ALL"

                                            ? "ALL PIECES"

                                            : category
                                    }

                                </button>

                            )
                        )}

                    </div>


                    <div className="catalog-navigation-label">

                        EXPLORE THE EDIT

                    </div>

                </div>


                {/* =================================================
                    PRODUCTS
                ================================================= */}

                {filteredProducts.length >
                    0 ? (

                    <div className="catalog-grid">

                        {filteredProducts.map(
                            (
                                product,
                                index
                            ) => {

                                const id =
                                    String(
                                        product?.id ??
                                        product?.productId ??
                                        product?._id ??
                                        product?.uuid ??
                                        `product-${index}`
                                    );


                                return (

                                    <ProductCard
                                        key={
                                            id
                                        }
                                        product={
                                            product
                                        }
                                        index={
                                            index
                                        }
                                        wishlisted={
                                            isWishlisted(
                                                product
                                            )
                                        }
                                        added={
                                            Boolean(
                                                addedProducts[
                                                getWishlistId(
                                                    product
                                                )
                                                ]
                                            )
                                        }
                                        onToggleWishlist={
                                            toggleWishlist
                                        }
                                        onQuickView={
                                            setQuickView
                                        }
                                        onAddToBag={
                                            handleAddToBag
                                        }
                                        onViewProduct={
                                            handleViewProduct
                                        }
                                    />

                                );

                            }
                        )}

                    </div>

                ) : (

                    <div className="catalog-empty">

                        <span>
                            COLLECTION
                        </span>


                        <h3>
                            Nothing here yet.
                        </h3>


                        <p>

                            This collection is waiting
                            for its next beautiful piece.

                        </p>


                        <button
                            type="button"
                            onClick={() =>
                                setActiveCategory(
                                    "ALL"
                                )
                            }
                        >

                            VIEW ALL PIECES

                            <ArrowIcon />

                        </button>

                    </div>

                )}


                {/* =================================================
                    FOOTER
                ================================================= */}

                {filteredProducts.length >
                    0 && (

                        <div className="catalog-footer">

                            <div className="catalog-footer-left">

                                <span>
                                    THE GEEKA EDIT
                                </span>


                                <p>

                                    Designed for the everyday,
                                    chosen for the moments that
                                    deserve a little more.

                                </p>

                            </div>


                            <div className="catalog-footer-center">

                                <div className="catalog-footer-line" />


                                <span>

                                    {
                                        String(
                                            filteredProducts.length
                                        ).padStart(
                                            2,
                                            "0"
                                        )
                                    }

                                </span>

                            </div>


                            <button
                                type="button"
                                className="catalog-footer-button"
                                onClick={
                                    handleViewAll
                                }
                            >

                                <span>
                                    EXPLORE COLLECTION
                                </span>

                                <ArrowIcon />

                            </button>

                        </div>

                    )}

            </div>


            {/* =================================================
                QUICK VIEW
            ================================================= */}

            <QuickView
                product={
                    quickView
                }
                onClose={() =>
                    setQuickView(
                        null
                    )
                }
                onAddToBag={
                    handleAddToBag
                }
                onViewProduct={
                    handleViewProduct
                }
            />


            {/* =================================================
                WISHLIST TOAST
            ================================================= */}

            {wishlistToast && (

                <div
                    className="catalog-wishlist-toast"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >

                    <div className="catalog-wishlist-toast-icon">

                        <HeartIcon
                            filled={
                                wishlistToast.added
                            }
                        />

                    </div>


                    <div className="catalog-wishlist-toast-content">

                        <strong>

                            {
                                wishlistToast.added
                                    ? "ADDED TO WISHLIST"
                                    : "REMOVED FROM WISHLIST"
                            }

                        </strong>


                        <span>

                            {
                                wishlistToast.name
                            }

                        </span>

                    </div>


                    <button
                        type="button"
                        className="catalog-wishlist-toast-close"
                        onClick={
                            closeWishlistToast
                        }
                        aria-label="Close wishlist notification"
                    >

                        <CloseIcon />

                    </button>

                </div>

            )}


            {/* =================================================
                BAG TOAST
            ================================================= */}

            {bagToast && (

                <div
                    className="catalog-bag-toast"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >

                    <div className="catalog-bag-toast-icon">

                        <BagCheckIcon />

                    </div>


                    <div className="catalog-bag-toast-content">

                        <strong>
                            ADDED TO BAG
                        </strong>


                        <span>
                            {
                                bagToast.name
                            }
                        </span>

                    </div>


                    <button
                        type="button"
                        className="catalog-bag-toast-close"
                        onClick={
                            closeBagToast
                        }
                        aria-label="Close bag notification"
                    >

                        <CloseIcon />

                    </button>

                </div>

            )}

        </section>
    );
}