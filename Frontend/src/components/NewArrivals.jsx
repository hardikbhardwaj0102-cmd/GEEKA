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

import "../style/NewArrivals.css";

import {
    getProducts,
} from "../services/productService";

import {
    useCart,
} from "../hooks/useCart";


/* =========================================================
   STORAGE
========================================================= */

const WISHLIST_STORAGE_KEY = "geeka-wishlist";


/* =========================================================
   PAGINATION
========================================================= */

const PRODUCTS_PER_PAGE = 4;


/* =========================================================
   HELPERS
========================================================= */

function getProductId(product) {

    if (!product) {
        return "";
    }


    return String(
        product?.id ??
        product?.productId ??
        product?._id ??
        product?.uuid ??
        ""
    ).trim();

}


function normalizeWishlistIds(value) {

    if (!Array.isArray(value)) {
        return [];
    }


    const ids =
        value
            .map((item) => {

                if (
                    item !== null &&
                    typeof item === "object"
                ) {

                    return (
                        item?.id ??
                        item?.productId ??
                        item?._id ??
                        item?.uuid ??
                        ""
                    );

                }


                return item;

            })
            .map((id) =>
                String(
                    id ?? ""
                ).trim()
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
                WISHLIST_STORAGE_KEY
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

    } catch (error) {

        console.error(
            "GEEKA WISHLIST READ ERROR:",
            error
        );


        return [];

    }

}


function writeWishlist(items) {

    try {

        const normalized =
            normalizeWishlistIds(
                items
            );


        localStorage.setItem(
            WISHLIST_STORAGE_KEY,
            JSON.stringify(
                normalized
            )
        );

    } catch (error) {

        console.error(
            "GEEKA WISHLIST WRITE ERROR:",
            error
        );

    }

}


function wishlistSignature(items) {

    return normalizeWishlistIds(
        items
    )
        .sort()
        .join("|");

}


function formatPrice(value) {

    const amount =
        Number(
            value || 0
        );


    return `₹${amount.toLocaleString(
        "en-IN"
    )}`;

}


/* =========================================================
   ICONS
========================================================= */

function ArrowIcon() {

    return (

        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >

            <path d="M5 12h13" />

            <path d="m13 6 6 6-6 6" />

        </svg>

    );

}


function LeftArrowIcon() {

    return (

        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >

            <path d="M19 12H5" />

            <path d="m11 6-6 6 6 6" />

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
            className={
                filled
                    ? "filled"
                    : ""
            }
        >

            <path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z" />

        </svg>

    );

}


function CloseIcon() {

    return (

        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >

            <path d="M6 6 18 18" />

            <path d="M18 6 6 18" />

        </svg>

    );

}


function BagCheckIcon() {

    return (

        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >

            <path d="M6.5 8.5h11l1 11h-13l1-11Z" />

            <path d="M9 8.5V6a3 3 0 0 1 6 0v2.5" />

            <path d="m9.5 13 2 2 3.5-3.5" />

        </svg>

    );

}


/* =========================================================
   PRODUCT CARD
========================================================= */

function NewArrivalCard({
    product,
    isWishlisted,
    onToggleWishlist,
    onQuickView,
    onAddToCart,
    onShopProduct,
}) {

    function handleImageNavigation() {

        onShopProduct(
            product
        );

    }


    function handleImageKeyDown(
        event
    ) {

        if (
            event.key === "Enter" ||
            event.key === " "
        ) {

            event.preventDefault();

            onShopProduct(
                product
            );

        }

    }


    return (

        <article className="new-arrival-card">

            {/* =================================================
                IMAGE
            ================================================== */}

            <div
                className="new-arrival-image"
                onClick={
                    handleImageNavigation
                }
                onKeyDown={
                    handleImageKeyDown
                }
                role="link"
                tabIndex={0}
                aria-label={`View ${product?.name || "product"} details`}
            >

                {product.image ? (

                    <img
                        src={product.image}
                        alt={
                            product.name ||
                            "Geeka product"
                        }
                        loading="lazy"
                    />

                ) : (

                    <div className="new-arrival-image-placeholder">

                        <span>
                            GEEKA
                        </span>

                    </div>

                )}


                {/* =================================================
                    IMAGE TOP
                ================================================== */}

                <div
                    className="new-arrival-image-top"
                    onClick={(event) => {

                        event.stopPropagation();

                    }}
                    onKeyDown={(event) => {

                        event.stopPropagation();

                    }}
                >

                    <span className="new-arrival-label">

                        NEW

                    </span>


                    {/* =================================================
                        WISHLIST
                    ================================================== */}

                    <button
                        type="button"
                        className={`new-arrival-heart ${isWishlisted
                                ? "active"
                                : ""
                            }`}
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
                        aria-label={
                            isWishlisted
                                ? `Remove ${product.name} from wishlist`
                                : `Add ${product.name} to wishlist`
                        }
                        aria-pressed={
                            isWishlisted
                        }
                    >

                        <HeartIcon
                            filled={
                                isWishlisted
                            }
                        />

                    </button>

                </div>


                {/* =================================================
                    QUICK VIEW
                ================================================== */}

                <button
                    type="button"
                    className="new-arrival-quick-view"
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

                    QUICK VIEW

                    <ArrowIcon />

                </button>

            </div>


            {/* =================================================
                DETAILS
            ================================================== */}

            <div className="new-arrival-details">

                <div className="new-arrival-meta">

                    <span>

                        {
                            product.category ||
                            "COLLECTION"
                        }

                    </span>


                    {product.inStock === false && (

                        <span className="new-arrival-sold">

                            SOLD OUT

                        </span>

                    )}

                </div>


                <h3>

                    <Link
                        to={`/product/${encodeURIComponent(
                            getProductId(
                                product
                            )
                        )}`}
                        style={{
                            color: "inherit",
                            textDecoration: "none",
                            cursor: "pointer",
                        }}
                    >

                        {
                            product.name
                        }

                    </Link>

                </h3>


                <div className="new-arrival-bottom">

                    <div className="new-arrival-price">

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


                    <button
                        type="button"
                        className="new-arrival-shop"
                        onClick={() =>
                            onShopProduct(
                                product
                            )
                        }
                    >

                        SHOP

                        <ArrowIcon />

                    </button>

                </div>


                {/* =================================================
                    ADD TO BAG
                ================================================== */}

                <button
                    type="button"
                    className="new-arrival-add"
                    disabled={
                        product.inStock === false
                    }
                    onClick={() =>
                        onAddToCart(
                            product
                        )
                    }
                >

                    {
                        product.inStock === false
                            ? "SOLD OUT"
                            : "ADD TO BAG"
                    }

                </button>

            </div>

        </article>

    );

}


/* =========================================================
   NEW ARRIVALS
========================================================= */

export default function NewArrivals() {

    const navigate =
        useNavigate();


    /* =====================================================
       PRODUCTS
    ===================================================== */

    const [
        products,
        setProducts,
    ] = useState([]);


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        error,
        setError,
    ] = useState("");


    /* =====================================================
       PAGINATION
    ===================================================== */

    const [
        currentPage,
        setCurrentPage,
    ] = useState(1);


    /* =====================================================
       WISHLIST
    ===================================================== */

    const [
        wishlist,
        setWishlist,
    ] = useState(
        readWishlist
    );


    /* =====================================================
       QUICK VIEW
    ===================================================== */

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
       CART
    ===================================================== */

    const {
        addItem,
    } = useCart();


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
            setTimeout(() => {

                setBagToast(
                    null
                );

                bagToastTimerRef.current =
                    null;

            }, 3000);

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
            setTimeout(() => {

                setWishlistToast(
                    null
                );

                wishlistToastTimerRef.current =
                    null;

            }, 3000);

    }


    /* =====================================================
       LOAD PRODUCTS
    ===================================================== */

    useEffect(() => {

        let active = true;


        async function loadProducts() {

            setLoading(true);
            setError("");


            try {

                const items =
                    await getProducts();


                if (!active) {
                    return;
                }


                const backendProducts =
                    Array.isArray(items)
                        ? items
                        : [];


                const newProducts =
                    backendProducts.filter(
                        (product) =>
                            Boolean(
                                product?.isNew
                            )
                    );


                setProducts(
                    newProducts
                );

            } catch (err) {

                if (!active) {
                    return;
                }


                console.error(
                    "GEEKA NEW ARRIVALS ERROR:",
                    err
                );


                setProducts([]);


                setError(
                    "Unable to load new arrivals."
                );

            } finally {

                if (active) {

                    setLoading(false);

                }

            }

        }


        loadProducts();


        return () => {

            active = false;

        };

    }, []);


    /* =====================================================
       TOTAL PAGES
    ===================================================== */

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                products.length /
                PRODUCTS_PER_PAGE
            )
        );


    /* =====================================================
       KEEP PAGE VALID
    ===================================================== */

    useEffect(() => {

        setCurrentPage(
            (current) => {

                if (
                    current >
                    totalPages
                ) {

                    return totalPages;

                }


                return current;

            }
        );

    }, [
        totalPages,
    ]);


    /* =====================================================
       CURRENT PAGE PRODUCTS
    ===================================================== */

    const currentProducts =
        useMemo(() => {

            const start =
                (currentPage - 1) *
                PRODUCTS_PER_PAGE;


            const end =
                start +
                PRODUCTS_PER_PAGE;


            return products.slice(
                start,
                end
            );

        }, [
            products,
            currentPage,
        ]);


    /* =====================================================
       WISHLIST SYNC
    ===================================================== */

    useEffect(() => {

        function syncWishlist() {

            const nextWishlist =
                readWishlist();


            setWishlist(
                (currentWishlist) => {

                    const currentSignature =
                        wishlistSignature(
                            currentWishlist
                        );


                    const nextSignature =
                        wishlistSignature(
                            nextWishlist
                        );


                    if (
                        currentSignature ===
                        nextSignature
                    ) {

                        return currentWishlist;

                    }


                    return nextWishlist;

                }
            );

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
            getProductId(
                product
            );


        if (!productId) {

            console.error(
                "GEEKA WISHLIST ERROR: Product has no ID.",
                product
            );

            return;

        }


        const currentWishlist =
            readWishlist();


        const exists =
            currentWishlist.includes(
                productId
            );


        let updatedWishlist;


        if (exists) {

            updatedWishlist =
                currentWishlist.filter(
                    (id) =>
                        id !==
                        productId
                );

        } else {

            updatedWishlist = [
                ...currentWishlist,
                productId,
            ];

        }


        writeWishlist(
            updatedWishlist
        );


        setWishlist(
            updatedWishlist
        );


        window.dispatchEvent(
            new Event(
                "geeka-wishlist-updated"
            )
        );


        showWishlistToast(
            product,
            !exists
        );

    }


    /* =====================================================
       ADD TO CART
    ===================================================== */

    function handleAddToCart(
        product
    ) {

        if (
            !product ||
            product.inStock === false
        ) {

            return;

        }


        addItem(
            product
        );


        showBagToast(
            product
        );

    }


    /* =====================================================
       SHOP PRODUCT
    ===================================================== */

    function handleShopProduct(
        product
    ) {

        if (!product) {

            navigate(
                "/shop"
            );

            return;

        }


        const productId =
            getProductId(
                product
            );


        if (productId) {

            navigate(
                `/product/${encodeURIComponent(
                    productId
                )}`
            );

            return;

        }


        navigate(
            "/shop"
        );

    }


    /* =====================================================
       CHANGE PAGE
    ===================================================== */

    function changePage(
        page
    ) {

        const safePage =
            Math.max(
                1,
                Math.min(
                    page,
                    totalPages
                )
            );


        if (
            safePage ===
            currentPage
        ) {

            return;

        }


        setCurrentPage(
            safePage
        );


        const section =
            document.getElementById(
                "new-arrivals"
            );


        window.scrollTo({

            top:
                section?.offsetTop ??
                0,

            behavior:
                "smooth",

        });

    }


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
       RENDER
    ===================================================== */

    return (

        <section
            className="new-arrivals-section"
            id="new-arrivals"
        >

            {/* =================================================
                HEADER
            ================================================== */}

            <div className="new-arrivals-header">

                <div className="new-arrivals-heading">

                    <span className="new-arrivals-eyebrow">

                        THE LATEST EDIT

                    </span>


                    <h2>
                        New Arrivals
                    </h2>


                    <p>

                        Fresh pieces, thoughtful details,
                        and the newest additions to Geeka.

                    </p>

                </div>

            </div>


            {/* =================================================
                CONTENT
            ================================================== */}

            {loading ? (

                <div className="new-arrivals-loading">

                    <div className="new-arrivals-loading-line" />


                    <div className="new-arrivals-loading-grid">

                        <div />
                        <div />
                        <div />
                        <div />

                    </div>

                </div>

            ) : error ? (

                <div className="new-arrivals-empty">

                    <span>
                        COLLECTION
                    </span>


                    <h3>
                        Unable to load new arrivals
                    </h3>


                    <p>
                        Please try again in a moment.
                    </p>


                    <button
                        type="button"
                        onClick={() =>
                            window.location.reload()
                        }
                    >

                        RETRY

                        <ArrowIcon />

                    </button>

                </div>

            ) : products.length === 0 ? (

                <div className="new-arrivals-empty">

                    <span>
                        COMING SOON
                    </span>


                    <h3>
                        New pieces are on the way.
                    </h3>


                    <p>
                        Check back soon for the latest
                        Geeka arrivals.
                    </p>


                    <Link
                        to="/shop"
                        className="new-arrivals-empty-link"
                    >

                        EXPLORE SHOP

                        <ArrowIcon />

                    </Link>

                </div>

            ) : (

                <>

                    {/* =================================================
                        PRODUCT GRID
                    ================================================== */}

                    <div className="new-arrivals-grid">

                        {currentProducts.map(
                            (product) => {

                                const productId =
                                    getProductId(
                                        product
                                    );


                                const isWishlisted =
                                    wishlist.includes(
                                        productId
                                    );


                                return (

                                    <NewArrivalCard
                                        key={
                                            productId
                                        }
                                        product={
                                            product
                                        }
                                        isWishlisted={
                                            isWishlisted
                                        }
                                        onToggleWishlist={
                                            toggleWishlist
                                        }
                                        onQuickView={
                                            setQuickView
                                        }
                                        onAddToCart={
                                            handleAddToCart
                                        }
                                        onShopProduct={
                                            handleShopProduct
                                        }
                                    />

                                );

                            }
                        )}

                    </div>


                    {/* =================================================
                        PAGINATION
                    ================================================== */}

                    {totalPages > 1 && (

                        <div className="new-arrivals-pagination">

                            <button
                                type="button"
                                className="new-arrivals-page-arrow"
                                onClick={() =>
                                    changePage(
                                        currentPage - 1
                                    )
                                }
                                disabled={
                                    currentPage ===
                                    1
                                }
                                aria-label="Previous page"
                            >

                                <LeftArrowIcon />

                            </button>


                            <div className="new-arrivals-page-numbers">

                                {Array.from(
                                    {
                                        length:
                                            totalPages,
                                    },
                                    (_, index) => {

                                        const page =
                                            index + 1;


                                        return (

                                            <button
                                                key={
                                                    page
                                                }
                                                type="button"
                                                className={
                                                    currentPage ===
                                                        page
                                                        ? "active"
                                                        : ""
                                                }
                                                onClick={() =>
                                                    changePage(
                                                        page
                                                    )
                                                }
                                                aria-label={`Go to page ${page}`}
                                                aria-current={
                                                    currentPage ===
                                                        page
                                                        ? "page"
                                                        : undefined
                                                }
                                            >

                                                {
                                                    String(
                                                        page
                                                    ).padStart(
                                                        2,
                                                        "0"
                                                    )
                                                }

                                            </button>

                                        );

                                    }
                                )}

                            </div>


                            <button
                                type="button"
                                className="new-arrivals-page-arrow"
                                onClick={() =>
                                    changePage(
                                        currentPage + 1
                                    )
                                }
                                disabled={
                                    currentPage ===
                                    totalPages
                                }
                                aria-label="Next page"
                            >

                                <ArrowIcon />

                            </button>

                        </div>

                    )}


                    {/* =================================================
                        PAGE STATUS
                    ================================================== */}

                    {totalPages > 1 && (

                        <div className="new-arrivals-page-status">

                            <span>

                                {
                                    String(
                                        currentPage
                                    ).padStart(
                                        2,
                                        "0"
                                    )
                                }

                            </span>


                            <div />


                            <span>

                                {
                                    String(
                                        totalPages
                                    ).padStart(
                                        2,
                                        "0"
                                    )
                                }

                            </span>

                        </div>

                    )}

                </>

            )}


            {/* =================================================
                QUICK VIEW
            ================================================== */}

            {quickView && (

                <div
                    className="new-arrival-quick-overlay"
                    onClick={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {

                            setQuickView(
                                null
                            );

                        }

                    }}
                >

                    <div className="new-arrival-quick-modal">

                        <button
                            type="button"
                            className="new-arrival-quick-close"
                            onClick={() =>
                                setQuickView(
                                    null
                                )
                            }
                            aria-label="Close quick view"
                        >

                            <CloseIcon />

                        </button>


                        <div className="new-arrival-quick-image">

                            {quickView.image ? (

                                <img
                                    src={
                                        quickView.image
                                    }
                                    alt={
                                        quickView.name ||
                                        "Geeka product"
                                    }
                                />

                            ) : (

                                <div className="new-arrival-image-placeholder">

                                    <span>
                                        GEEKA
                                    </span>

                                </div>

                            )}

                        </div>


                        <div className="new-arrival-quick-content">

                            <span className="new-arrival-quick-category">

                                {
                                    quickView.category ||
                                    "COLLECTION"
                                }

                            </span>


                            <h3>

                                {
                                    quickView.name
                                }

                            </h3>


                            <div className="new-arrival-quick-price">

                                <strong>

                                    {
                                        formatPrice(
                                            quickView.price
                                        )
                                    }

                                </strong>


                                {quickView.oldPrice && (

                                    <del>

                                        {
                                            formatPrice(
                                                quickView.oldPrice
                                            )
                                        }

                                    </del>

                                )}

                            </div>


                            {quickView.description && (

                                <p>

                                    {
                                        quickView.description
                                    }

                                </p>

                            )}


                            <div className="new-arrival-quick-actions">

                                <button
                                    type="button"
                                    className="new-arrival-quick-add"
                                    disabled={
                                        quickView.inStock ===
                                        false
                                    }
                                    onClick={() => {

                                        handleAddToCart(
                                            quickView
                                        );

                                        setQuickView(
                                            null
                                        );

                                    }}
                                >

                                    {
                                        quickView.inStock ===
                                            false
                                            ? "SOLD OUT"
                                            : "ADD TO BAG"
                                    }

                                    <ArrowIcon />

                                </button>


                                <button
                                    type="button"
                                    className="new-arrival-quick-shop"
                                    onClick={() => {

                                        setQuickView(
                                            null
                                        );

                                        handleShopProduct(
                                            quickView
                                        );

                                    }}
                                >

                                    VIEW IN SHOP

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}


            {/* =================================================
                WISHLIST TOAST
            ================================================== */}

            {wishlistToast && (

                <div
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    style={{
                        position: "fixed",
                        right: "22px",
                        bottom: "104px",
                        zIndex: 99999,
                        width: "min(360px, calc(100vw - 32px))",
                        background: "#1f1b17",
                        color: "#f8f3eb",
                        border: "1px solid rgba(255,255,255,0.14)",
                        borderRadius: "14px",
                        padding: "16px 18px",
                        boxShadow:
                            "0 18px 45px rgba(0,0,0,0.22)",
                        display: "flex",
                        alignItems: "center",
                        gap: "13px",
                        boxSizing: "border-box",
                    }}
                >

                    <div
                        style={{
                            width: "38px",
                            height: "38px",
                            minWidth: "38px",
                            borderRadius: "50%",
                            background: "#f3e7d5",
                            color: "#332a22",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >

                        <HeartIcon
                            filled={
                                wishlistToast.added
                            }
                        />

                    </div>


                    <div
                        style={{
                            flex: 1,
                            minWidth: 0,
                        }}
                    >

                        <div
                            style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                marginBottom: "4px",
                            }}
                        >

                            {
                                wishlistToast.added
                                    ? "Added to Wishlist"
                                    : "Removed from Wishlist"
                            }

                        </div>


                        <div
                            style={{
                                fontSize: "13px",
                                lineHeight: 1.45,
                                color: "rgba(248,243,235,0.74)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >

                            {
                                wishlistToast.name
                            }

                        </div>

                    </div>


                    <button
                        type="button"
                        onClick={
                            closeWishlistToast
                        }
                        aria-label="Close wishlist notification"
                        style={{
                            border: "none",
                            background: "transparent",
                            color: "rgba(248,243,235,0.58)",
                            width: "28px",
                            height: "28px",
                            minWidth: "28px",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                        }}
                    >

                        <CloseIcon />

                    </button>

                </div>

            )}


            {/* =================================================
                ADDED TO BAG TOAST
            ================================================== */}

            {bagToast && (

                <div
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    style={{
                        position: "fixed",
                        right: "22px",
                        bottom: "22px",
                        zIndex: 99999,
                        width: "min(360px, calc(100vw - 32px))",
                        background: "#1f1b17",
                        color: "#f8f3eb",
                        border: "1px solid rgba(255,255,255,0.14)",
                        borderRadius: "14px",
                        padding: "16px 18px",
                        boxShadow:
                            "0 18px 45px rgba(0,0,0,0.22)",
                        display: "flex",
                        alignItems: "center",
                        gap: "13px",
                        boxSizing: "border-box",
                    }}
                >

                    <div
                        style={{
                            width: "38px",
                            height: "38px",
                            minWidth: "38px",
                            borderRadius: "50%",
                            background: "#f3e7d5",
                            color: "#332a22",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >

                        <BagCheckIcon />

                    </div>


                    <div
                        style={{
                            flex: 1,
                            minWidth: 0,
                        }}
                    >

                        <div
                            style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                marginBottom: "4px",
                            }}
                        >

                            Added to Bag

                        </div>


                        <div
                            style={{
                                fontSize: "13px",
                                lineHeight: 1.45,
                                color: "rgba(248,243,235,0.74)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >

                            {
                                bagToast.name
                            }

                        </div>

                    </div>


                    <button
                        type="button"
                        onClick={
                            closeBagToast
                        }
                        aria-label="Close notification"
                        style={{
                            border: "none",
                            background: "transparent",
                            color: "rgba(248,243,235,0.58)",
                            width: "28px",
                            height: "28px",
                            minWidth: "28px",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                        }}
                    >

                        <CloseIcon />

                    </button>

                </div>

            )}

        </section>

    );

}