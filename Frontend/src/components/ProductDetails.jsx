import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Link,
    useNavigate,
    useParams,
} from "react-router-dom";

import "../style/ProductDetails.css";

import Header from "./Header";

import {
    getProductById,
    getProductCards,
    getProducts,
} from "../services/productService";

import { useCart } from "../hooks/useCart";


const WISHLIST_KEY =
    "geeka-wishlist";


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
| ICONS
|--------------------------------------------------------------------------
*/

function ArrowIcon({
    direction = "right",
}) {
    const isLeft =
        direction ===
        "left";

    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
        >
            {isLeft ? (
                <>
                    <path
                        d="M19 12H5"
                        stroke="currentColor"
                        strokeWidth="1.35"
                        strokeLinecap="round"
                    />

                    <path
                        d="m11 6-6 6 6 6"
                        stroke="currentColor"
                        strokeWidth="1.35"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </>
            ) : (
                <>
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
                </>
            )}
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


function MinusIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
        >
            <path
                d="M5 12h14"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
            />
        </svg>
    );
}


function InfoIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
        >
            <circle
                cx="12"
                cy="12"
                r="8.5"
                stroke="currentColor"
                strokeWidth="1.35"
            />

            <path
                d="M12 10.5v5"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
            />

            <circle
                cx="12"
                cy="7.5"
                r="0.8"
                fill="currentColor"
            />
        </svg>
    );
}


function BagIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
        >
            <path
                d="M5 8h14l-1 13H6L5 8Z"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinejoin="round"
            />

            <path
                d="M9 8V6a3 3 0 0 1 6 0v2"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
            />
        </svg>
    );
}


function getProductId(product) {
    return String(
        product?.id ?? ""
    ).trim();
}


/*
|--------------------------------------------------------------------------
| PRODUCT DETAILS
|--------------------------------------------------------------------------
*/

export default function ProductDetails() {
    const {
        productId,
    } = useParams();

    const navigate =
        useNavigate();

    /*
    |--------------------------------------------------------------------------
    | CART
    |--------------------------------------------------------------------------
    */

    const {
        addItem,
    } = useCart();


    /*
    |--------------------------------------------------------------------------
    | PRODUCT STATE
    |--------------------------------------------------------------------------
    */

    const [
        product,
        setProduct,
    ] = useState(null);

    const [
        relatedProducts,
        setRelatedProducts,
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
        activeImage,
        setActiveImage,
    ] = useState(0);

    const [
        quantity,
        setQuantity,
    ] = useState(1);

    const [
        wishlist,
        setWishlist,
    ] = useState(
        readWishlist
    );

    const [
        selectedAttributes,
        setSelectedAttributes,
    ] = useState({});

    const [
        toast,
        setToast,
    ] = useState("");

    const [
        adding,
        setAdding,
    ] = useState(false);


    /*
    |--------------------------------------------------------------------------
    | SCROLL TOP
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "auto",
        });
    }, [productId]);


    /*
    |--------------------------------------------------------------------------
    | LOAD PRODUCT
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        let active = true;

        async function load() {
            setLoading(true);

            setError("");

            setProduct(null);

            setRelatedProducts([]);

            setActiveImage(0);

            setQuantity(1);

            setSelectedAttributes({});

            try {
                /*
                |--------------------------------------------------------------------------
                | Product detail comes directly from Django.
                |--------------------------------------------------------------------------
                */

                const detail =
                    await getProductById(
                        productId
                    );

                if (!active) {
                    return;
                }

                setProduct(
                    detail
                );


                /*
                |--------------------------------------------------------------------------
                | Select a sensible initial active variant.
                |--------------------------------------------------------------------------
                */

                const variants =
                    Array.isArray(
                        detail?.variants
                    )
                        ? detail.variants
                        : [];

                const initialVariant =
                    variants.find(
                        (
                            variant
                        ) =>
                            variant?.is_active ===
                            true &&
                            variant?.in_stock ===
                            true &&
                            Number(
                                variant?.stock
                            ) >
                            0
                    ) ||
                    variants.find(
                        (
                            variant
                        ) =>
                            variant?.is_active ===
                            true
                    ) ||
                    null;


                if (
                    initialVariant
                ) {
                    const initialSelection =
                        {};

                    initialVariant.attributes?.forEach(
                        (
                            attribute
                        ) => {
                            if (
                                attribute?.attribute &&
                                attribute?.value
                            ) {
                                initialSelection[
                                    attribute.attribute
                                ] =
                                    attribute.value;
                            }
                        }
                    );

                    setSelectedAttributes(
                        initialSelection
                    );
                }


                /*
                |--------------------------------------------------------------------------
                | Related products
                |--------------------------------------------------------------------------
                */

                const publicProducts =
                    await getProducts();

                const candidates =
                    Array.isArray(
                        publicProducts
                    )
                        ? publicProducts
                            .filter(
                                (
                                    item
                                ) =>
                                    getProductId(
                                        item
                                    ) !==
                                    getProductId(
                                        detail
                                    )
                            )
                            .slice(
                                0,
                                6
                            )
                        : [];

                const cards =
                    await getProductCards(
                        candidates
                    );

                if (active) {
                    setRelatedProducts(
                        cards.slice(
                            0,
                            6
                        )
                    );
                }
            } catch (
            requestError
            ) {
                if (!active) {
                    return;
                }

                setError(
                    requestError?.status ===
                        404
                        ? "This product is not publicly available."
                        : requestError?.message ||
                        "Unable to load this product."
                );
            } finally {
                if (active) {
                    setLoading(
                        false
                    );
                }
            }
        }


        if (productId) {
            load();
        } else {
            setLoading(
                false
            );

            setError(
                "A product ID is required."
            );
        }


        return () => {
            active = false;
        };
    }, [
        productId,
    ]);


    /*
    |--------------------------------------------------------------------------
    | ATTRIBUTE GROUPS
    |--------------------------------------------------------------------------
    */

    const attributeGroups =
        useMemo(() => {
            const groups =
                new Map();

            product?.variants
                ?.filter(
                    (
                        variant
                    ) =>
                        variant?.is_active ===
                        true
                )
                .forEach(
                    (
                        variant
                    ) => {
                        variant?.attributes?.forEach(
                            (
                                attribute
                            ) => {
                                if (
                                    !attribute?.attribute ||
                                    !attribute?.value
                                ) {
                                    return;
                                }

                                if (
                                    !groups.has(
                                        attribute.attribute
                                    )
                                ) {
                                    groups.set(
                                        attribute.attribute,
                                        new Set()
                                    );
                                }

                                groups
                                    .get(
                                        attribute.attribute
                                    )
                                    .add(
                                        attribute.value
                                    );
                            }
                        );
                    }
                );

            return Array.from(
                groups.entries()
            ).map(
                ([
                    name,
                    values,
                ]) => ({
                    name,
                    values:
                        Array.from(
                            values
                        ),
                })
            );
        }, [
            product,
        ]);


    /*
    |--------------------------------------------------------------------------
    | SELECTED VARIANT
    |--------------------------------------------------------------------------
    */

    const selectedVariant =
        useMemo(() => {
            if (
                !product?.variants?.length
            ) {
                return null;
            }

            const activeVariants =
                product.variants.filter(
                    (
                        variant
                    ) =>
                        variant?.is_active ===
                        true
                );

            if (
                !attributeGroups.length
            ) {
                return (
                    activeVariants.find(
                        (
                            variant
                        ) =>
                            variant?.in_stock ===
                            true &&
                            Number(
                                variant?.stock
                            ) >
                            0
                    ) ||
                    activeVariants[0] ||
                    null
                );
            }

            const completeSelection =
                attributeGroups.every(
                    (
                        group
                    ) =>
                        selectedAttributes[
                        group.name
                        ]
                );

            if (
                !completeSelection
            ) {
                return null;
            }

            return (
                activeVariants.find(
                    (
                        variant
                    ) => {
                        return (
                            variant.attributes?.every(
                                (
                                    attribute
                                ) =>
                                    selectedAttributes[
                                    attribute.attribute
                                    ] ===
                                    attribute.value
                            ) &&
                            attributeGroups.every(
                                (
                                    group
                                ) =>
                                    variant.attributes?.some(
                                        (
                                            attribute
                                        ) =>
                                            attribute.attribute ===
                                            group.name &&
                                            attribute.value ===
                                            selectedAttributes[
                                            group.name
                                            ]
                                    )
                            )
                        );
                    }
                ) ||
                null
            );
        }, [
            attributeGroups,
            product,
            selectedAttributes,
        ]);


    /*
    |--------------------------------------------------------------------------
    | GALLERY
    |--------------------------------------------------------------------------
    */

    const galleryImages =
        Array.isArray(
            product?.images
        )
            ? product.images
            : [];

    const currentImage =
        galleryImages[
        activeImage
        ] || null;


    /*
    |--------------------------------------------------------------------------
    | CURRENT VARIANT DATA
    |--------------------------------------------------------------------------
    */

    const currentPrice =
        selectedVariant?.price ??
        null;

    const currency =
        selectedVariant?.currency ||
        "INR";

    const stock =
        Number(
            selectedVariant?.stock ??
            0
        );

    const stockAvailable =
        Boolean(
            selectedVariant?.is_active &&
            selectedVariant?.in_stock &&
            stock > 0
        );


    /*
    |--------------------------------------------------------------------------
    | KEEP QUANTITY VALID WHEN VARIANT CHANGES
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (
            !stockAvailable
        ) {
            setQuantity(1);
            return;
        }

        setQuantity(
            (current) =>
                Math.min(
                    Math.max(
                        1,
                        current
                    ),
                    stock
                )
        );
    }, [
        selectedVariant?.id,
        stockAvailable,
        stock,
    ]);


    /*
    |--------------------------------------------------------------------------
    | WISHLIST
    |--------------------------------------------------------------------------
    */

    const toggleWishlist = () => {
        const id =
            getProductId(
                product
            );

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
    | ADD TO CART
    |--------------------------------------------------------------------------
    |
    | ProductDetails uses the same cartStore as the rest of the website.
    |
    | cartStore -> cartService -> Django
    |--------------------------------------------------------------------------
    */

    const addToCart =
        async (
            goToCart = false
        ) => {
            if (
                !selectedVariant ||
                !stockAvailable ||
                adding
            ) {
                return;
            }

            setAdding(
                true
            );

            setToast("");

            try {
                /*
                |--------------------------------------------------------------------------
                | IMPORTANT
                |--------------------------------------------------------------------------
                | Use cartStore instead of calling cartService directly.
                |--------------------------------------------------------------------------
                */

                await addItem(
                    product,
                    selectedVariant,
                    quantity
                );

                if (
                    goToCart
                ) {
                    navigate(
                        "/cart"
                    );

                    return;
                }

                setToast(
                    quantity > 1
                        ? `${quantity} ITEMS ADDED TO BAG`
                        : "ITEM ADDED TO BAG"
                );
            } catch (
            requestError
            ) {
                setToast(
                    requestError?.message ||
                    "Unable to add this item to bag."
                );
            } finally {
                setAdding(
                    false
                );
            }
        };


    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    if (loading) {
        return (
            <>
                <Header />

                <main className="product-details-page">

                    <div className="product-loading">

                        <div className="product-loading-content">

                            <div className="product-loading-gallery" />

                            <div className="product-loading-main">

                                <div className="product-loading-line" />
                                <div className="product-loading-line" />
                                <div className="product-loading-line" />

                            </div>

                        </div>

                    </div>

                </main>
            </>
        );
    }


    /*
    |--------------------------------------------------------------------------
    | ERROR
    |--------------------------------------------------------------------------
    */

    if (
        error ||
        !product
    ) {
        return (
            <>
                <Header />

                <main className="product-details-page">

                    <div className="product-not-found">

                        <span>
                            PRODUCT
                        </span>

                        <h1>
                            {
                                error ||
                                "Product not found."
                            }
                        </h1>

                        <p>
                            The requested product is
                            not currently available
                            from the public catalogue.
                        </p>

                        <Link to="/shop">
                            BACK TO SHOP{" "}
                            <ArrowIcon />
                        </Link>

                    </div>

                </main>
            </>
        );
    }


    /*
    |--------------------------------------------------------------------------
    | MAIN
    |--------------------------------------------------------------------------
    */

    return (
        <>
            <Header />

            <main className="product-details-page">

                <div className="product-ambient ambient-one" />
                <div className="product-ambient ambient-two" />
                <div className="product-ambient ambient-three" />
                <div className="product-ambient ambient-four" />


                {/* =====================================================
                    BREADCRUMB
                   ===================================================== */}

                <div className="product-breadcrumb-wrap">

                    <div className="product-breadcrumb">

                        <Link to="/">
                            Home
                        </Link>

                        <span>/</span>

                        <Link to="/shop">
                            Shop
                        </Link>

                        <span>/</span>

                        <span>
                            {
                                product.categoryName ||
                                "Collection"
                            }
                        </span>

                        <span>/</span>

                        <strong>
                            {
                                product.name
                            }
                        </strong>

                    </div>

                </div>


                {/* =====================================================
                    MAIN PRODUCT
                   ===================================================== */}

                <section className="product-main">

                    {/* =================================================
                        GALLERY
                       ================================================= */}

                    <div className="product-gallery">

                        <div className="product-gallery-heading">

                            <span>
                                PRODUCT GALLERY
                            </span>

                            <div>

                                <span className="gallery-new-label">
                                    PUBLISHED
                                </span>

                                <span
                                    className={
                                        product.is_purchasable
                                            ? "gallery-stock-label"
                                            : "gallery-stock-label out-stock"
                                    }
                                >
                                    {product.is_purchasable
                                        ? "AVAILABLE"
                                        : "SOLD OUT"}
                                </span>

                            </div>

                        </div>


                        <div className="product-gallery-body">

                            {galleryImages.length >
                                1 && (
                                    <div className="product-thumbnails">

                                        {galleryImages.map(
                                            (
                                                image,
                                                index
                                            ) => (
                                                <button
                                                    type="button"
                                                    key={
                                                        image.id ||
                                                        `${image.image_url}-${index}`
                                                    }
                                                    className={
                                                        activeImage ===
                                                            index
                                                            ? "active"
                                                            : ""
                                                    }
                                                    onClick={() =>
                                                        setActiveImage(
                                                            index
                                                        )
                                                    }
                                                    aria-label={`Show product image ${index +
                                                        1
                                                        }`}
                                                >
                                                    {image.image_url ? (
                                                        <img
                                                            src={
                                                                image.image_url
                                                            }
                                                            alt={`${product.name} ${index +
                                                                1
                                                                }`}
                                                        />
                                                    ) : (
                                                        <span>
                                                            {
                                                                index +
                                                                1
                                                            }
                                                        </span>
                                                    )}
                                                </button>
                                            )
                                        )}

                                    </div>
                                )}


                            <div className="product-main-image">

                                <div className="product-main-image-inner">

                                    {currentImage?.image_url ? (
                                        <img
                                            className="product-main-photo"
                                            src={
                                                currentImage.image_url
                                            }
                                            alt={
                                                product.name
                                            }
                                        />
                                    ) : (
                                        <div className="product-image-placeholder">

                                            <span>
                                                GEEKA
                                            </span>

                                        </div>
                                    )}

                                    <div className="product-image-shade" />


                                    <span
                                        className={
                                            stockAvailable
                                                ? "product-main-badge"
                                                : "product-main-sold"
                                        }
                                    >
                                        {stockAvailable
                                            ? "READY TO SHIP"
                                            : "CURRENTLY UNAVAILABLE"}
                                    </span>


                                    {galleryImages.length >
                                        0 && (
                                            <span className="product-image-index">

                                                {String(
                                                    activeImage +
                                                    1
                                                ).padStart(
                                                    2,
                                                    "0"
                                                )}

                                                {" / "}

                                                {String(
                                                    galleryImages.length
                                                ).padStart(
                                                    2,
                                                    "0"
                                                )}

                                            </span>
                                        )}

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        PRODUCT INFORMATION
                       ================================================= */}

                    <aside className="product-main-information">

                        <div className="product-status-row">

                            <span>
                                {
                                    product.categoryName ||
                                    "Collection"
                                }
                            </span>

                            <span
                                className={
                                    stockAvailable
                                        ? "in-stock"
                                        : "out-stock"
                                }
                            >
                                {stockAvailable
                                    ? `${stock} IN STOCK`
                                    : "OUT OF STOCK"}
                            </span>

                        </div>


                        <div className="product-title-wrap">

                            <div>

                                <p className="product-eyebrow">
                                    GEEKA ORIGINAL
                                </p>

                                <h1>
                                    {
                                        product.name
                                    }
                                </h1>

                            </div>


                            <button
                                type="button"
                                className={`product-main-wishlist ${wishlist.includes(
                                    getProductId(
                                        product
                                    )
                                )
                                    ? "active"
                                    : ""
                                    }`}
                                onClick={
                                    toggleWishlist
                                }
                                aria-label={
                                    wishlist.includes(
                                        getProductId(
                                            product
                                        )
                                    )
                                        ? "Remove from wishlist"
                                        : "Add to wishlist"
                                }
                                aria-pressed={wishlist.includes(
                                    getProductId(
                                        product
                                    )
                                )}
                            >
                                <HeartIcon
                                    filled={wishlist.includes(
                                        getProductId(
                                            product
                                        )
                                    )}
                                />
                            </button>

                        </div>


                        <div className="product-price-row">

                            <strong>

                                {currentPrice ===
                                    null
                                    ? "SELECT OPTIONS"
                                    : formatPrice(
                                        currentPrice,
                                        currency
                                    )}

                            </strong>


                            {selectedVariant?.is_low_stock &&
                                stockAvailable && (
                                    <span className="product-discount">
                                        LOW STOCK
                                    </span>
                                )}

                        </div>


                        {/* =================================================
                            DESCRIPTION
                           ================================================= */}

                        <div className="product-description-block">

                            <span>
                                ABOUT THIS PIECE
                            </span>

                            <p>
                                {
                                    product.description ||
                                    "This product does not currently have a description in the catalogue."
                                }
                            </p>

                        </div>


                        {/* =================================================
                            VARIANT PICKER
                           ================================================= */}

                        {attributeGroups.length >
                            0 && (
                                <div className="product-variant-picker">

                                    {attributeGroups.map(
                                        (
                                            group
                                        ) => (
                                            <div
                                                className="product-variant-group"
                                                key={
                                                    group.name
                                                }
                                            >

                                                <div className="product-variant-heading">

                                                    <strong>
                                                        {
                                                            group.name
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            selectedAttributes[
                                                            group.name
                                                            ] ||
                                                            "SELECT"
                                                        }
                                                    </span>

                                                </div>


                                                <div className="product-variant-values">

                                                    {group.values.map(
                                                        (
                                                            value
                                                        ) => {

                                                            const selected =
                                                                selectedAttributes[
                                                                group.name
                                                                ] ===
                                                                value;


                                                            const exists =
                                                                product.variants.some(
                                                                    (
                                                                        variant
                                                                    ) =>
                                                                        variant?.is_active ===
                                                                        true &&
                                                                        variant?.attributes?.some(
                                                                            (
                                                                                attribute
                                                                            ) =>
                                                                                attribute?.attribute ===
                                                                                group.name &&
                                                                                attribute?.value ===
                                                                                value
                                                                        )
                                                                );


                                                            return (
                                                                <button
                                                                    type="button"
                                                                    key={
                                                                        value
                                                                    }
                                                                    className={
                                                                        selected
                                                                            ? "selected"
                                                                            : ""
                                                                    }
                                                                    disabled={
                                                                        !exists
                                                                    }
                                                                    onClick={() =>
                                                                        setSelectedAttributes(
                                                                            (
                                                                                current
                                                                            ) => ({
                                                                                ...current,
                                                                                [group.name]:
                                                                                    value,
                                                                            })
                                                                        )
                                                                    }
                                                                >
                                                                    {
                                                                        value
                                                                    }
                                                                </button>
                                                            );
                                                        }
                                                    )}

                                                </div>

                                            </div>
                                        )
                                    )}


                                    {!selectedVariant && (
                                        <p className="product-variant-help">
                                            Select the available options to choose a product variant.
                                        </p>
                                    )}

                                </div>
                            )}


                        {/* =================================================
                            SKU
                           ================================================= */}

                        {selectedVariant && (
                            <div className="product-variant-sku">

                                <span>
                                    SKU
                                </span>

                                <strong>
                                    {
                                        selectedVariant.sku ||
                                        "—"
                                    }
                                </strong>

                            </div>
                        )}


                        {/* =================================================
                            QUANTITY
                           ================================================= */}

                        <div className="product-quantity-section">

                            <div>

                                <span>
                                    Quantity
                                </span>

                                <small>
                                    {stockAvailable
                                        ? `${stock} available`
                                        : "Select an available variant"}
                                </small>

                            </div>


                            <div className="product-quantity">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setQuantity(
                                            (
                                                value
                                            ) =>
                                                Math.max(
                                                    1,
                                                    value -
                                                    1
                                                )
                                        )
                                    }
                                    disabled={
                                        !selectedVariant ||
                                        quantity <=
                                        1
                                    }
                                    aria-label="Decrease quantity"
                                >
                                    <MinusIcon />
                                </button>


                                <strong>
                                    {
                                        quantity
                                    }
                                </strong>


                                <button
                                    type="button"
                                    onClick={() =>
                                        setQuantity(
                                            (
                                                value
                                            ) =>
                                                Math.min(
                                                    Math.max(
                                                        1,
                                                        stock ||
                                                        1
                                                    ),
                                                    value +
                                                    1
                                                )
                                        )
                                    }
                                    disabled={
                                        !stockAvailable ||
                                        quantity >=
                                        stock
                                    }
                                    aria-label="Increase quantity"
                                >
                                    <PlusIcon />
                                </button>

                            </div>

                        </div>


                        {/* =================================================
                            PURCHASE BUTTONS
                           ================================================= */}

                        <div className="product-purchase-actions">

                            <button
                                type="button"
                                className="product-add-button"
                                disabled={
                                    !stockAvailable ||
                                    adding
                                }
                                onClick={() =>
                                    addToCart(
                                        false
                                    )
                                }
                            >

                                <BagIcon />

                                {adding
                                    ? "ADDING..."
                                    : "ADD TO BAG"}

                            </button>


                            <button
                                type="button"
                                className="product-buy-button"
                                disabled={
                                    !stockAvailable ||
                                    adding
                                }
                                onClick={() =>
                                    addToCart(
                                        true
                                    )
                                }
                            >
                                BUY NOW{" "}
                                <ArrowIcon />
                            </button>

                        </div>


                        {/* =================================================
                            BENEFITS
                           ================================================= */}

                        <div className="product-benefits">

                            <div className="product-info-row">

                                <div className="product-info-icon">
                                    <BagIcon />
                                </div>

                                <div>

                                    <strong>
                                        LIVE INVENTORY
                                    </strong>

                                    <span>
                                        Availability is read from the selected backend variant.
                                    </span>

                                </div>

                            </div>


                            <div className="product-info-row">

                                <div className="product-info-icon">
                                    <InfoIcon />
                                </div>

                                <div>

                                    <strong>
                                        SECURE CART
                                    </strong>

                                    <span>
                                        Your selected variant and quantity are sent directly to Django.
                                    </span>

                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            POLICY
                           ================================================= */}

                        <div className="product-policy-strip">

                            <div>
                                <InfoIcon />

                                Product information is supplied
                                by the Geeka catalogue.
                            </div>

                            <div>
                                <InfoIcon />

                                Product images are temporary
                                signed URLs generated by the
                                backend.
                            </div>

                        </div>

                    </aside>

                </section>


                {/* =====================================================
                    LOWER INFORMATION
                   ===================================================== */}

                <section className="product-lower-information">

                    <div className="product-information-layout">

                        <div className="product-specifications">

                            <div className="product-section-heading">

                                <span>
                                    01
                                </span>

                                <h2>
                                    Specifications
                                </h2>

                            </div>


                            {product.variants.length ===
                                0 ? (
                                <p className="product-information-empty">
                                    No active variants have
                                    been published for this product.
                                </p>
                            ) : (
                                <div className="product-highlight-table">

                                    <div className="product-highlight-row">

                                        <span>
                                            Category
                                        </span>

                                        <strong>
                                            {
                                                product.categoryName ||
                                                "—"
                                            }
                                        </strong>

                                    </div>


                                    <div className="product-highlight-row">

                                        <span>
                                            Active variants
                                        </span>

                                        <strong>
                                            {
                                                product.variants.filter(
                                                    (
                                                        variant
                                                    ) =>
                                                        variant?.is_active ===
                                                        true
                                                ).length
                                            }
                                        </strong>

                                    </div>


                                    {selectedVariant?.attributes?.map(
                                        (
                                            attribute
                                        ) => (
                                            <div
                                                className="product-highlight-row"
                                                key={`${attribute.attribute}-${attribute.value}`}
                                            >

                                                <span>
                                                    {
                                                        attribute.attribute
                                                    }
                                                </span>

                                                <strong>
                                                    {
                                                        attribute.value
                                                    }
                                                </strong>

                                            </div>
                                        )
                                    )}


                                    <div className="product-highlight-row">

                                        <span>
                                            SKU
                                        </span>

                                        <strong>
                                            {
                                                selectedVariant?.sku ||
                                                "—"
                                            }
                                        </strong>

                                    </div>

                                </div>
                            )}

                        </div>


                        <div className="product-about">

                            <div className="product-section-heading">

                                <span>
                                    02
                                </span>

                                <h2>
                                    Product information
                                </h2>

                            </div>


                            <div className="product-about-content">

                                <p>
                                    {
                                        product.description ||
                                        "No additional product information has been provided in the backend catalogue."
                                    }
                                </p>


                                <div className="product-faq-item">

                                    <strong>
                                        Variant pricing
                                    </strong>

                                    <span>
                                        Prices shown on this page
                                        are taken from the selected
                                        active variant returned by
                                        Django.
                                    </span>

                                </div>


                                <div className="product-faq-item">

                                    <strong>
                                        Stock
                                    </strong>

                                    <span>
                                        Inventory and purchasability
                                        are controlled by the backend
                                        and may change between visits.
                                    </span>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    RELATED PRODUCTS
                   ===================================================== */}

                {relatedProducts.length >
                    0 && (
                        <section className="product-related">

                            <div className="product-related-header">

                                <div>

                                    <span className="about-label">
                                        YOU MAY ALSO LIKE
                                    </span>

                                    <h2>
                                        More from Geeka
                                    </h2>

                                </div>


                                <div className="product-related-arrows">

                                    <button
                                        type="button"
                                        onClick={() => {
                                            document
                                                .querySelector(
                                                    ".product-related-grid"
                                                )
                                                ?.scrollBy(
                                                    {
                                                        left: -330,
                                                        behavior:
                                                            "smooth",
                                                    }
                                                );
                                        }}
                                        aria-label="Previous related products"
                                    >
                                        <ArrowIcon
                                            direction="left"
                                        />
                                    </button>


                                    <button
                                        type="button"
                                        onClick={() => {
                                            document
                                                .querySelector(
                                                    ".product-related-grid"
                                                )
                                                ?.scrollBy(
                                                    {
                                                        left: 330,
                                                        behavior:
                                                            "smooth",
                                                    }
                                                );
                                        }}
                                        aria-label="Next related products"
                                    >
                                        <ArrowIcon />
                                    </button>

                                </div>

                            </div>


                            <div className="product-related-grid">

                                {relatedProducts.map(
                                    (
                                        related
                                    ) => {

                                        const id =
                                            getProductId(
                                                related
                                            );

                                        return (
                                            <article
                                                className="product-related-card"
                                                key={
                                                    id
                                                }
                                            >

                                                <Link
                                                    to={`/product/${encodeURIComponent(
                                                        id
                                                    )}`}
                                                    className="product-related-image"
                                                >

                                                    {related.displayImage ? (
                                                        <img
                                                            src={
                                                                related.displayImage
                                                            }
                                                            alt={
                                                                related.name
                                                            }
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="product-image-placeholder">

                                                            <span>
                                                                GEEKA
                                                            </span>

                                                        </div>
                                                    )}

                                                </Link>


                                                <div className="product-related-info">

                                                    <span>
                                                        {
                                                            related.categoryName ||
                                                            "COLLECTION"
                                                        }
                                                    </span>

                                                    <h3>
                                                        {
                                                            related.name
                                                        }
                                                    </h3>

                                                    <strong>

                                                        {related.price ===
                                                            null
                                                            ? "PRICE ON REQUEST"
                                                            : `FROM ${formatPrice(
                                                                related.price,
                                                                related.currency ||
                                                                "INR"
                                                            )}`}

                                                    </strong>

                                                </div>

                                            </article>
                                        );
                                    }
                                )}

                            </div>

                        </section>
                    )}

            </main>


            {/* =====================================================
                TOAST
               ===================================================== */}

            {toast && (
                <div
                    className="product-detail-toast"
                    role="status"
                >

                    <span className="product-detail-toast-icon">
                        <BagIcon />
                    </span>

                    <span>
                        {
                            toast
                        }
                    </span>

                </div>
            )}

        </>
    );
}