import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import "../style/NewArrivals.css";

import {
    getDefaultPurchasableVariant,
    getProductCards,
    getProductsPage,
} from "../services/productService";

import { useCart } from "../hooks/useCart";


const WISHLIST_STORAGE_KEY =
    "geeka-wishlist";

const PRODUCTS_PER_PAGE = 4;


/*
|--------------------------------------------------------------------------
| WISHLIST
|--------------------------------------------------------------------------
*/

function readWishlist() {
    try {
        const parsed =
            JSON.parse(
                localStorage.getItem(
                    WISHLIST_STORAGE_KEY
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
            WISHLIST_STORAGE_KEY,
            JSON.stringify([
                ...new Set(
                    items
                        .map((id) =>
                            String(
                                id
                            ).trim()
                        )
                        .filter(Boolean)
                ),
            ])
        );
    } catch {
        // Ignore localStorage failures.
    }
}


/*
|--------------------------------------------------------------------------
| PRICE
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| PRODUCT ID
|--------------------------------------------------------------------------
*/

function productId(product) {
    return String(
        product?.id ?? ""
    ).trim();
}


/*
|--------------------------------------------------------------------------
| ICONS
|--------------------------------------------------------------------------
*/

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


function EyeIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
        >
            <path
                d="M2.8 12s3.5-5.4 9.2-5.4S21.2 12 21.2 12s-3.5 5.4-9.2 5.4S2.8 12 2.8 12Z"
                stroke="currentColor"
                strokeWidth="1.35"
            />

            <circle
                cx="12"
                cy="12"
                r="2.5"
                stroke="currentColor"
                strokeWidth="1.35"
            />
        </svg>
    );
}


function PlusIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
        >
            <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
            />
        </svg>
    );
}


/*
|--------------------------------------------------------------------------
| NEW ARRIVALS
|--------------------------------------------------------------------------
*/

export default function NewArrivals() {
    const navigate =
        useNavigate();

    const {
        addItem,
    } = useCart();


    /*
    |--------------------------------------------------------------------------
    | TOAST
    |--------------------------------------------------------------------------
    */

    const toastTimerRef =
        useRef(null);


    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

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

    const [
        quickView,
        setQuickView,
    ] = useState(null);

    const [
        toast,
        setToast,
    ] = useState("");

    const [
        wishlist,
        setWishlist,
    ] = useState(
        readWishlist
    );


    /*
    |--------------------------------------------------------------------------
    | LOAD PRODUCTS
    |--------------------------------------------------------------------------
    |
    | The backend controls the public catalogue visibility and ordering.
    | We display the first four products from that response in this
    | homepage section.
    |--------------------------------------------------------------------------
    */

    const loadPage =
        async () => {
            setLoading(true);
            setError("");

            try {
                const response =
                    await getProductsPage();

                const results =
                    Array.isArray(
                        response?.results
                    )
                        ? response.results
                        : [];

                const firstProducts =
                    results.slice(
                        0,
                        PRODUCTS_PER_PAGE
                    );

                const cards =
                    await getProductCards(
                        firstProducts
                    );

                setProducts(
                    Array.isArray(
                        cards
                    )
                        ? cards
                        : []
                );
            } catch (
            requestError
            ) {
                setError(
                    requestError?.message ||
                    "Unable to load the latest products from Geeka."
                );

                setProducts([]);
            } finally {
                setLoading(false);
            }
        };


    /*
    |--------------------------------------------------------------------------
    | INITIAL LOAD
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        loadPage();

        return () => {
            if (
                toastTimerRef.current
            ) {
                clearTimeout(
                    toastTimerRef.current
                );
            }
        };
    }, []);


    /*
    |--------------------------------------------------------------------------
    | WISHLIST
    |--------------------------------------------------------------------------
    */

    const toggleWishlist = (
        id
    ) => {
        if (!id) {
            return;
        }

        setWishlist(
            (current) => {
                const exists =
                    current.includes(
                        id
                    );

                const next =
                    exists
                        ? current.filter(
                            (
                                item
                            ) =>
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


    /*
    |--------------------------------------------------------------------------
    | TOAST
    |--------------------------------------------------------------------------
    */

    const showToast = (
        message
    ) => {
        setToast(message);

        if (
            toastTimerRef.current
        ) {
            clearTimeout(
                toastTimerRef.current
            );
        }

        toastTimerRef.current =
            setTimeout(
                () =>
                    setToast(
                        ""
                    ),
                2600
            );
    };


    /*
    |--------------------------------------------------------------------------
    | ADD TO CART
    |--------------------------------------------------------------------------
    |
    | Important:
    |
    | NewArrivals -> useCart() -> cartStore -> cartService -> Django
    |
    | We do NOT call cartService directly here.
    |--------------------------------------------------------------------------
    */

    const addToCart =
        async (product) => {
            const variant =
                getDefaultPurchasableVariant(
                    product?.detail
                );

            /*
            |--------------------------------------------------------------------------
            | No available variant
            |--------------------------------------------------------------------------
            */

            if (
                !variant?.id ||
                variant?.is_active !==
                true ||
                variant?.in_stock !==
                true ||
                Number(
                    variant?.stock
                ) < 1
            ) {
                navigate(
                    `/product/${encodeURIComponent(
                        productId(
                            product
                        )
                    )}`
                );

                return;
            }

            try {
                await addItem(
                    product,
                    variant,
                    1
                );

                showToast(
                    "ITEM ADDED TO BAG"
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


    /*
    |--------------------------------------------------------------------------
    | ERROR STATE
    |--------------------------------------------------------------------------
    */

    if (error) {
        return (
            <section className="new-arrivals-section">

                <div className="new-arrivals-header">

                    <div className="new-arrivals-heading">

                        <span className="new-arrivals-eyebrow">
                            LATEST EDIT
                        </span>

                        <h2>
                            New Arrivals
                        </h2>

                        <p>
                            {error}
                        </p>

                    </div>

                </div>


                <div className="new-arrivals-empty">

                    <p>
                        We could not load the
                        latest products right now.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            loadPage()
                        }
                    >
                        TRY AGAIN{" "}
                        <ArrowIcon />
                    </button>

                </div>

            </section>
        );
    }


    /*
    |--------------------------------------------------------------------------
    | MAIN UI
    |--------------------------------------------------------------------------
    */

    return (
        <section className="new-arrivals-section">

            <div className="new-arrivals-header">

                <div className="new-arrivals-heading">

                    <span className="new-arrivals-eyebrow">
                        LATEST EDIT
                    </span>

                    <h2>
                        New Arrivals
                    </h2>

                    <p>
                        Freshly published pieces from the Geeka catalogue,
                        displayed in the order supplied by the store backend.
                    </p>

                </div>

            </div>


            {/* =====================================================
                LOADING
               ===================================================== */}

            {loading ? (
                <div className="new-arrivals-loading-grid">

                    {Array.from(
                        {
                            length:
                                PRODUCTS_PER_PAGE,
                        }
                    ).map(
                        (
                            _,
                            index
                        ) => (
                            <div
                                className="new-arrivals-loading"
                                key={index}
                            >
                                <div className="new-arrivals-loading-line" />
                            </div>
                        )
                    )}

                </div>
            ) : products.length ===
                0 ? (

                /* =====================================================
                   EMPTY
                   ===================================================== */

                <div className="new-arrivals-empty">

                    <p>
                        No published products
                        are available yet.
                    </p>

                    <Link
                        className="new-arrivals-empty-link"
                        to="/shop"
                    >
                        OPEN SHOP{" "}
                        <ArrowIcon />
                    </Link>

                </div>

            ) : (
                <>

                    {/* =================================================
                        PRODUCT GRID
                       ================================================= */}

                    <div className="new-arrivals-grid">

                        {products.map(
                            (
                                product
                            ) => {
                                const id =
                                    productId(
                                        product
                                    );

                                const category =
                                    product?.categoryName ||
                                    product?.category?.name ||
                                    "COLLECTION";

                                const wishlisted =
                                    wishlist.includes(
                                        id
                                    );

                                const image =
                                    product?.displayImage ||
                                    "";

                                const price =
                                    product?.price;

                                const currency =
                                    product?.currency ||
                                    "INR";

                                const detail =
                                    product?.detail;

                                const purchasable =
                                    detail?.is_purchasable ===
                                    true;

                                const hasStock =
                                    Array.isArray(
                                        detail?.variants
                                    ) &&
                                    detail.variants.some(
                                        (
                                            variant
                                        ) =>
                                            variant?.is_active ===
                                            true &&
                                            variant?.in_stock ===
                                            true &&
                                            Number(
                                                variant?.stock
                                            ) > 0
                                    );


                                return (
                                    <article
                                        className="new-arrival-card"
                                        key={id}
                                    >

                                        {/* =================================
                                            IMAGE
                                           ================================= */}

                                        <div className="new-arrival-image">

                                            <Link
                                                to={`/product/${encodeURIComponent(
                                                    id
                                                )}`}
                                            >

                                                {image ? (
                                                    <img
                                                        src={
                                                            image
                                                        }
                                                        alt={
                                                            product.name
                                                        }
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
                                                        toggleWishlist(
                                                            id
                                                        )
                                                    }
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

                                            </div>


                                            <button
                                                type="button"
                                                className="new-arrival-quick-view"
                                                onClick={() =>
                                                    setQuickView(
                                                        product
                                                    )
                                                }
                                            >
                                                <EyeIcon />{" "}
                                                QUICK VIEW
                                            </button>

                                        </div>


                                        {/* =================================
                                            DETAILS
                                           ================================= */}

                                        <div className="new-arrival-details">

                                            <div className="new-arrival-meta">

                                                <span>
                                                    {
                                                        category
                                                    }
                                                </span>

                                                {(!purchasable ||
                                                    !hasStock) && (
                                                        <span className="new-arrival-sold">
                                                            SOLD OUT
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
                                                        product.name
                                                    }
                                                </Link>

                                            </h3>


                                            <div className="new-arrival-bottom">

                                                <div className="new-arrival-price">

                                                    <strong>
                                                        {price ===
                                                            null ||
                                                            price ===
                                                            undefined
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
                                                    disabled={
                                                        !detail
                                                    }
                                                    onClick={() =>
                                                        addToCart(
                                                            product
                                                        )
                                                    }
                                                >
                                                    {purchasable &&
                                                        hasStock
                                                        ? "ADD TO BAG"
                                                        : "VIEW PRODUCT"}

                                                    {purchasable &&
                                                        hasStock && (
                                                            <PlusIcon />
                                                        )}
                                                </button>

                                            </div>

                                        </div>

                                    </article>
                                );
                            }
                        )}

                    </div>


                    <div className="new-arrivals-footer">

                        <Link
                            className="new-arrivals-footer-button"
                            to="/shop"
                        >
                            VIEW ALL NEW ARRIVALS
                            <ArrowIcon />
                        </Link>

                    </div>


                    {/* =================================================
                        TOAST
                       ================================================= */}

                    {toast && (
                        <div
                            className="new-arrival-toast"
                            role="status"
                        >
                            {
                                toast
                            }
                        </div>
                    )}

                </>
            )}


            {/* =====================================================
                QUICK VIEW
               ===================================================== */}

            {quickView && (
                <div
                    className="new-arrival-quick-overlay"
                    role="dialog"
                    aria-modal="true"
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

                            <div className="new-arrival-quick-image-frame">

                                {quickView.displayImage ? (
                                    <img
                                        className="new-arrival-quick-product-image"
                                        src={
                                            quickView.displayImage
                                        }
                                        alt={
                                            quickView.name ||
                                            "Geeka product"
                                        }
                                    />
                                ) : (
                                    <div className="new-arrival-image-placeholder">
                                        GEEKA
                                    </div>
                                )}

                            </div>

                        </div>


                        <div className="new-arrival-quick-content">

                            <span className="new-arrival-quick-category">
                                {
                                    quickView.categoryName ||
                                    quickView.category?.name ||
                                    "COLLECTION"
                                }
                            </span>


                            <h3>
                                {
                                    quickView.name
                                }
                            </h3>


                            <div className="new-arrival-quick-price">

                                {quickView.price ===
                                    null ||
                                    quickView.price ===
                                    undefined
                                    ? "PRICE ON REQUEST"
                                    : `FROM ${formatPrice(
                                        quickView.price,
                                        quickView.currency ||
                                        "INR"
                                    )}`}

                            </div>


                            <p>
                                {
                                    quickView.detail
                                        ?.description ||
                                    "Product details are available on the product page."
                                }
                            </p>


                            <div className="new-arrival-quick-actions">

                                <button
                                    type="button"
                                    className="new-arrival-quick-add"
                                    onClick={async () =>
                                        addToCart(
                                            quickView
                                        )
                                    }
                                >
                                    {quickView.detail
                                        ?.is_purchasable ===
                                        true &&
                                        Array.isArray(
                                            quickView
                                                ?.detail
                                                ?.variants
                                        ) &&
                                        quickView.detail.variants.some(
                                            (
                                                variant
                                            ) =>
                                                variant?.is_active ===
                                                true &&
                                                variant?.in_stock ===
                                                true &&
                                                Number(
                                                    variant?.stock
                                                ) > 0
                                        )
                                        ? "ADD TO BAG"
                                        : "VIEW PRODUCT"}
                                </button>


                                <button
                                    type="button"
                                    className="new-arrival-quick-shop"
                                    onClick={() =>
                                        navigate(
                                            `/product/${encodeURIComponent(
                                                productId(
                                                    quickView
                                                )
                                            )}`
                                        )
                                    }
                                >
                                    SHOP PRODUCT{" "}
                                    <ArrowIcon />
                                </button>

                            </div>

                        </div>

                    </div>

                </div>
            )}

        </section>
    );
}