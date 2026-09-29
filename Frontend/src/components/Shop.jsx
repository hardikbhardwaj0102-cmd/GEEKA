import {
    useLayoutEffect,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Link,
    useLocation,
    useNavigate,
} from "react-router-dom";

import "../style/Shop.css";

import Header from "./Header";

import {
    useCart,
} from "../hooks/useCart";

import {
    getProducts,
} from "../services/productService";

import shopBanner from "../assets/top-banner.jpg";


/* =========================================================
   COLLECTION FILTER CONFIGURATION
========================================================= */

const COLLECTION_FILTERS = {
    ethnic: {
        label: "Ethnic Wear",

        categories: [
            "Ethnic Wear",
            "Kurti & Kurta Sets",
            "Sarees",
            "Anarkali",
            "Co-ord Sets",
        ],
    },

    jewellery: {
        label: "Jewellery",

        categories: [
            "Jewellery",
            "Earrings",
            "Necklaces",
            "Rings",
            "Bracelets",
            "Jewelry",
        ],
    },

    creative: {
        label: "Creative",

        categories: [
            "Creative",
            "Crochet Bags",
            "Keychains",
            "Hair Accessories",
            "Home Décor",
            "Home Decor",
        ],
    },
};


/* =========================================================
   NORMALIZE CATEGORY
========================================================= */

function normalizeCategory(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase();

}


/* =========================================================
   GET PRODUCT ID
========================================================= */

function getProductId(
    product
) {

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


/* =========================================================
   COLLECTION MATCH
========================================================= */

function productBelongsToCollection(
    product,
    collectionId
) {

    if (
        !collectionId ||
        !COLLECTION_FILTERS[
        collectionId
        ]
    ) {

        return true;

    }


    const collection =
        COLLECTION_FILTERS[
        collectionId
        ];


    const productCategory =
        normalizeCategory(
            product.category
        );


    const collectionCategories =
        collection.categories.map(
            normalizeCategory
        );


    /* =========================================================
       CATEGORY MATCH
    ========================================================= */

    if (
        collectionCategories.includes(
            productCategory
        )
    ) {

        return true;

    }


    /* =========================================================
       BACKEND COLLECTION FIELD
    ========================================================= */

    const productCollection =
        normalizeCategory(
            product.collection
        );


    const productCollectionId =
        normalizeCategory(
            product.collectionId
        );


    if (
        productCollection ===
        normalizeCategory(
            collection.label
        ) ||
        productCollection ===
        normalizeCategory(
            collectionId
        ) ||
        productCollectionId ===
        normalizeCategory(
            collectionId
        )
    ) {

        return true;

    }


    return false;

}


/* =========================================================
   PRICE FORMAT
========================================================= */

function formatPrice(
    price
) {

    const amount =
        Number(
            price || 0
        );


    return `₹${amount.toLocaleString(
        "en-IN"
    )}`;

}


/* =========================================================
   SEARCH ICON
========================================================= */

function SearchIcon() {

    return (

        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >

            <circle
                cx="10.8"
                cy="10.8"
                r="6.2"
            />

            <path
                d="M15.5 15.5 21 21"
            />

        </svg>

    );

}


/* =========================================================
   HEART ICON
========================================================= */

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


/* =========================================================
   CLOSE ICON
========================================================= */

function CloseIcon() {

    return (

        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >

            <path d="M6 6 18 18M18 6 6 18" />

        </svg>

    );

}


/* =========================================================
   PLUS ICON
========================================================= */

function PlusIcon() {

    return (

        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >

            <path d="M12 5v14M5 12h14" />

        </svg>

    );

}


/* =========================================================
   FILTER ICON
========================================================= */

function FilterIcon() {

    return (

        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >

            <path d="M4 7h16M7 12h10M10 17h4" />

        </svg>

    );

}


/* =========================================================
   ARROW ICON
========================================================= */

function ArrowIcon() {

    return (

        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >

            <path d="M5 12h13M13 6l6 6-6 6" />

        </svg>

    );

}


/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({
    product,
    isWishlisted,
    onToggleWishlist,
    onQuickView,
    onAddToCart,
}) {

    const navigate =
        useNavigate();


    const productId =
        getProductId(
            product
        );


    const productName =
        product?.name ||
        "Geeka Product";


    /* =====================================================
       OPEN PRODUCT DETAILS
    ===================================================== */

    function handleProductClick() {

        if (!productId) {
            return;
        }


        navigate(
            `/product/${encodeURIComponent(
                productId
            )}`
        );

    }


    /* =====================================================
       KEYBOARD NAVIGATION
    ===================================================== */

    function handleCardKeyDown(
        event
    ) {

        if (
            event.key ===
            "Enter" ||
            event.key ===
            " "
        ) {

            event.preventDefault();

            handleProductClick();

        }

    }


    return (

        <article
            className="shop-product-card"
            onClick={
                handleProductClick
            }
            onKeyDown={
                handleCardKeyDown
            }
            role="link"
            tabIndex={
                productId
                    ? 0
                    : -1
            }
            aria-label={
                `View ${productName}`
            }
        >

            {/* =================================================
                IMAGE
            ================================================== */}

            <div className="shop-product-image">

                <img
                    src={
                        product.image
                    }
                    alt={
                        productName
                    }
                    loading="lazy"
                />


                {product.isNew && (

                    <span className="shop-product-new">

                        NEW

                    </span>

                )}


                {/* =================================================
                    WISHLIST
                    STOP CARD NAVIGATION
                ================================================== */}

                <button
                    type="button"
                    className={`shop-product-heart ${isWishlisted
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
                            productId
                        );

                    }}
                    aria-label={
                        isWishlisted
                            ? `Remove ${productName} from wishlist`
                            : `Add ${productName} to wishlist`
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


                {/* =================================================
                    QUICK VIEW
                    STOP CARD NAVIGATION
                ================================================== */}

                <div
                    className="shop-image-actions"
                    onClick={(event) =>
                        event.stopPropagation()
                    }
                >

                    <button
                        type="button"
                        onPointerDown={(event) => {

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

                    </button>

                </div>

            </div>


            {/* =================================================
                PRODUCT INFORMATION
            ================================================== */}

            <div
                className="shop-product-info"
                onClick={(event) => {

                    /*
                     * The information area itself should
                     * navigate through the card click.
                     * The button below explicitly stops it.
                     */

                    event.stopPropagation();

                    handleProductClick();

                }}
            >

                <span className="shop-product-category">

                    {
                        product.category ||
                        "COLLECTION"
                    }

                </span>


                {/* =================================================
                    PRODUCT NAME
                ================================================== */}

                {productId ? (

                    <h3>

                        <Link
                            to={`/product/${encodeURIComponent(
                                productId
                            )}`}
                            className="shop-product-name-link"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            {
                                productName
                            }

                        </Link>

                    </h3>

                ) : (

                    <h3>

                        {
                            productName
                        }

                    </h3>

                )}


                {/* =================================================
                    PRICE
                ================================================== */}

                <div
                    className="shop-product-price"
                    onClick={(event) =>
                        event.stopPropagation()
                    }
                >

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


                {/* =================================================
                    ADD TO CART
                ================================================== */}

                <button
                    type="button"
                    className="shop-add-cart"
                    disabled={
                        !product.inStock
                    }
                    onPointerDown={(event) => {

                        event.preventDefault();

                        event.stopPropagation();

                    }}
                    onClick={(event) => {

                        event.preventDefault();

                        event.stopPropagation();

                        onAddToCart(
                            product
                        );

                    }}
                >

                    {
                        product.inStock
                            ? "ADD TO CART"
                            : "SOLD OUT"
                    }


                    {product.inStock && (

                        <PlusIcon />

                    )}

                </button>

            </div>

        </article>

    );

}


/* =========================================================
   SHOP
========================================================= */

export default function Shop() {

    const location =
        useLocation();


    const navigate =
        useNavigate();


    /* =====================================================
       ALWAYS START SHOP AT TOP
    ===================================================== */

    useLayoutEffect(() => {

        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "auto",
        });

    }, [
        location.pathname,
    ]);


    /* =====================================================
       FILTER STATE
    ===================================================== */

    const [
        category,
        setCategory,
    ] = useState(
        "All"
    );


    /* =====================================================
       URL PARAMETERS
    ===================================================== */

    const urlParams =
        useMemo(
            () =>
                new URLSearchParams(
                    location.search
                ),
            [
                location.search,
            ]
        );


    /* =====================================================
       COLLECTION
    ===================================================== */

    const collectionFilter =
        urlParams.get(
            "collection"
        ) || "";


    const activeCollection =
        COLLECTION_FILTERS[
        collectionFilter
        ] || null;


    /* =====================================================
       SEARCH
    ===================================================== */

    const search =
        urlParams.get(
            "search"
        ) || "";


    /* =====================================================
       PRICE
    ===================================================== */

    const [
        minPrice,
        setMinPrice,
    ] = useState(
        0
    );


    const [
        maxPrice,
        setMaxPrice,
    ] = useState(
        2500
    );


    /* =====================================================
       OTHER FILTERS
    ===================================================== */

    const [
        newOnly,
        setNewOnly,
    ] = useState(
        false
    );


    const [
        stockOnly,
        setStockOnly,
    ] = useState(
        false
    );


    /* =====================================================
       SORT
    ===================================================== */

    const [
        sortBy,
        setSortBy,
    ] = useState(
        "featured"
    );


    /* =====================================================
       WISHLIST
    ===================================================== */

    const [
        wishlist,
        setWishlist,
    ] = useState(() => {

        try {

            const saved =
                localStorage.getItem(
                    "geeka-wishlist"
                );


            if (!saved) {
                return [];
            }


            const parsed =
                JSON.parse(
                    saved
                );


            if (!Array.isArray(
                parsed
            )) {

                return [];

            }


            return parsed
                .map(
                    (item) => {

                        if (
                            item !== null &&
                            typeof item ===
                            "object"
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
                )
                .filter(Boolean);

        } catch {

            return [];

        }

    });


    /* =====================================================
       QUICK VIEW
    ===================================================== */

    const [
        quickView,
        setQuickView,
    ] = useState(
        null
    );


    /* =====================================================
       MOBILE FILTERS
    ===================================================== */

    const [
        mobileFilters,
        setMobileFilters,
    ] = useState(
        false
    );


    /* =====================================================
       CART MESSAGE
    ===================================================== */

    const [
        cartMessage,
        setCartMessage,
    ] = useState(
        false
    );


    /* =====================================================
       CART
    ===================================================== */

    const {
        addItem,
        cartCount,
    } = useCart();


    /* =====================================================
       PRODUCTS
    ===================================================== */

    const [
        products,
        setProducts,
    ] = useState(
        []
    );


    /* =====================================================
       LOAD PRODUCTS
    ===================================================== */

    useEffect(() => {

        let active =
            true;


        async function loadProducts() {

            try {

                const items =
                    await getProducts();


                if (active) {

                    setProducts(
                        Array.isArray(
                            items
                        )
                            ? items
                            : []
                    );

                }

            } catch {

                if (active) {

                    setProducts(
                        []
                    );

                }

            }

        }


        loadProducts();


        return () => {

            active =
                false;

        };

    }, []);


    /* =====================================================
       CATEGORIES
    ===================================================== */

    const categories =
        useMemo(() => {

            const uniqueCategories =
                [
                    ...new Set(
                        products
                            .map(
                                (product) =>
                                    product.category
                            )
                            .filter(Boolean)
                    ),
                ];


            return [
                "All",
                ...uniqueCategories,
            ];

        }, [
            products,
        ]);


    /* =====================================================
       SAVE WISHLIST
    ===================================================== */

    useEffect(() => {

        localStorage.setItem(
            "geeka-wishlist",
            JSON.stringify(
                wishlist
            )
        );


        window.dispatchEvent(
            new Event(
                "geeka-wishlist-updated"
            )
        );

    }, [
        wishlist,
    ]);


    /* =====================================================
       BODY OVERFLOW
    ===================================================== */

    useEffect(() => {

        document.body.style.overflow =
            mobileFilters ||
                quickView
                ? "hidden"
                : "";


        return () => {

            document.body.style.overflow =
                "";

        };

    }, [
        mobileFilters,
        quickView,
    ]);


    /* =====================================================
       CART MESSAGE
    ===================================================== */

    useEffect(() => {

        if (!cartMessage) {
            return;
        }


        const timer =
            setTimeout(
                () => {

                    setCartMessage(
                        false
                    );

                },
                2200
            );


        return () =>
            clearTimeout(
                timer
            );

    }, [
        cartMessage,
    ]);


    /* =====================================================
       FILTERED PRODUCTS
    ===================================================== */

    const filteredProducts =
        useMemo(() => {

            const query =
                search
                    .trim()
                    .toLowerCase();


            const results =
                products.filter(
                    (product) => {

                        const matchesCategory =
                            category ===
                            "All" ||
                            product.category ===
                            category;


                        const matchesCollection =
                            productBelongsToCollection(
                                product,
                                collectionFilter
                            );


                        const productName =
                            String(
                                product.name ||
                                ""
                            ).toLowerCase();


                        const productCategory =
                            String(
                                product.category ||
                                ""
                            ).toLowerCase();


                        const matchesSearch =
                            !query ||
                            productName.includes(
                                query
                            ) ||
                            productCategory.includes(
                                query
                            );


                        const matchesPrice =
                            Number(
                                product.price
                            ) >=
                            minPrice &&
                            Number(
                                product.price
                            ) <=
                            maxPrice;


                        const matchesNew =
                            !newOnly ||
                            Boolean(
                                product.isNew
                            );


                        const matchesStock =
                            !stockOnly ||
                            Boolean(
                                product.inStock
                            );


                        return (
                            matchesCategory &&
                            matchesCollection &&
                            matchesSearch &&
                            matchesPrice &&
                            matchesNew &&
                            matchesStock
                        );

                    }
                );


            return [
                ...results,
            ].sort(
                (a, b) => {

                    switch (
                    sortBy
                    ) {

                        case "newest":

                            return (
                                Number(
                                    b.isNew
                                ) -
                                Number(
                                    a.isNew
                                )
                            );


                        case "price-low":

                            return (
                                Number(
                                    a.price
                                ) -
                                Number(
                                    b.price
                                )
                            );


                        case "price-high":

                            return (
                                Number(
                                    b.price
                                ) -
                                Number(
                                    a.price
                                )
                            );


                        case "name":

                            return String(
                                a.name ||
                                ""
                            ).localeCompare(
                                String(
                                    b.name ||
                                    ""
                                )
                            );


                        case "featured":

                        default:

                            return (
                                Number(
                                    b.featured
                                ) -
                                Number(
                                    a.featured
                                )
                            );

                    }

                }
            );

        }, [
            category,
            collectionFilter,
            search,
            minPrice,
            maxPrice,
            newOnly,
            stockOnly,
            sortBy,
            products,
        ]);


    /* =====================================================
       CATEGORY CHANGE
    ===================================================== */

    function handleCategoryChange(
        item
    ) {

        setCategory(
            item
        );


        if (
            collectionFilter
        ) {

            const params =
                new URLSearchParams(
                    location.search
                );


            params.delete(
                "collection"
            );


            const nextQuery =
                params.toString();


            navigate(
                nextQuery
                    ? `/shop?${nextQuery}`
                    : "/shop"
            );

        }

    }


    /* =====================================================
       CLEAR FILTERS
    ===================================================== */

    function clearFilters() {

        setCategory(
            "All"
        );


        setMinPrice(
            0
        );


        setMaxPrice(
            2500
        );


        setNewOnly(
            false
        );


        setStockOnly(
            false
        );


        setSortBy(
            "featured"
        );


        navigate(
            "/shop"
        );

    }


    /* =====================================================
       CLEAR SEARCH
    ===================================================== */

    function clearSearch() {

        const params =
            new URLSearchParams(
                location.search
            );


        params.delete(
            "search"
        );


        const nextQuery =
            params.toString();


        navigate(
            nextQuery
                ? `/shop?${nextQuery}`
                : "/shop"
        );

    }


    /* =====================================================
       WISHLIST
    ===================================================== */

    function toggleWishlist(
        productId
    ) {

        const normalizedId =
            String(
                productId
            ).trim();


        if (!normalizedId) {
            return;
        }


        setWishlist(
            (current) => {

                return current.includes(
                    normalizedId
                )

                    ? current.filter(
                        (id) =>
                            id !==
                            normalizedId
                    )

                    : [
                        ...current,
                        normalizedId,
                    ];

            }
        );

    }


    /* =====================================================
       ADD TO CART
    ===================================================== */

    function addToCart(
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


        setCartMessage(
            true
        );

    }


    /* =====================================================
       CATEGORY COUNT
    ===================================================== */

    function categoryCount(
        selectedCategory
    ) {

        if (
            selectedCategory ===
            "All"
        ) {

            return products.length;

        }


        return products.filter(
            (product) =>
                product.category ===
                selectedCategory
        ).length;

    }


    /* =====================================================
       HAS FILTERS
    ===================================================== */

    const hasFilters =
        category !==
        "All" ||
        Boolean(
            collectionFilter
        ) ||
        minPrice !==
        0 ||
        maxPrice !==
        2500 ||
        newOnly ||
        stockOnly ||
        search.trim() !==
        "";


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <>

            {/* =================================================
                NAVBAR
            ================================================== */}

            <Header />


            {/* =================================================
                SHOP PAGE
            ================================================== */}

            <main className="shop-page">


                {/* =================================================
                    SHOP HERO BANNER
                ================================================== */}

                <section className="shop-banner">

                    <img
                        src={
                            shopBanner
                        }
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


                    {/* =================================================
                        TOOLBAR
                    ================================================== */}

                    <div className="shop-toolbar">

                        <div className="shop-toolbar-right">

                            <button
                                type="button"
                                className="mobile-filter-btn"
                                onClick={() =>
                                    setMobileFilters(
                                        true
                                    )
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

                                {
                                    products.length
                                }{" "}

                                products

                            </span>


                            <div className="sort-box">

                                <label htmlFor="sort">

                                    SORT BY:

                                </label>


                                <select
                                    id="sort"
                                    value={
                                        sortBy
                                    }
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


                    {/* =================================================
                        ACTIVE FILTERS
                    ================================================== */}

                    {hasFilters && (

                        <div className="active-filter-row">

                            <span>
                                FILTERS:
                            </span>


                            {activeCollection && (

                                <button
                                    type="button"
                                    onClick={() => {

                                        const params =
                                            new URLSearchParams(
                                                location.search
                                            );


                                        params.delete(
                                            "collection"
                                        );


                                        const nextQuery =
                                            params.toString();


                                        navigate(
                                            nextQuery
                                                ? `/shop?${nextQuery}`
                                                : "/shop"
                                        );

                                    }}
                                >

                                    {
                                        activeCollection.label
                                    }

                                    <CloseIcon />

                                </button>

                            )}


                            {category !==
                                "All" && (

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleCategoryChange(
                                                "All"
                                            )
                                        }
                                    >

                                        {
                                            category
                                        }

                                        <CloseIcon />

                                    </button>

                                )}


                            {search && (

                                <button
                                    type="button"
                                    onClick={
                                        clearSearch
                                    }
                                >

                                    Search:
                                    {" "}
                                    {
                                        search
                                    }

                                    <CloseIcon />

                                </button>

                            )}


                            {(
                                minPrice >
                                0 ||
                                maxPrice <
                                2500
                            ) && (

                                    <button
                                        type="button"
                                        onClick={() => {

                                            setMinPrice(
                                                0
                                            );


                                            setMaxPrice(
                                                2500
                                            );

                                        }}
                                    >

                                        {
                                            formatPrice(
                                                minPrice
                                            )
                                        }

                                        {" - "}

                                        {
                                            formatPrice(
                                                maxPrice
                                            )
                                        }

                                        <CloseIcon />

                                    </button>

                                )}


                            {newOnly && (

                                <button
                                    type="button"
                                    onClick={() =>
                                        setNewOnly(
                                            false
                                        )
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
                                        setStockOnly(
                                            false
                                        )
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


                        {/* =================================================
                            SIDEBAR
                        ================================================== */}

                        <aside className="shop-filters">


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
                                                    handleCategoryChange(
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
                                                    {
                                                        categoryCount(
                                                            item
                                                        )
                                                    }
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
                                        {
                                            formatPrice(
                                                minPrice
                                            )
                                        }
                                    </span>


                                    <span>
                                        {
                                            formatPrice(
                                                maxPrice
                                            )
                                        }
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
                                                    event.target.value
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
                                                    event.target.value
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
                                                event.target.checked
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
                                                event.target.checked
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


                        {/* =================================================
                            PRODUCTS
                        ================================================== */}

                        <div className="shop-products-area">

                            {filteredProducts.length >
                                0 ? (

                                <div className="shop-product-grid">

                                    {filteredProducts.map(
                                        (product) => {

                                            const productId =
                                                getProductId(
                                                    product
                                                );


                                            return (

                                                <ProductCard
                                                    key={
                                                        productId
                                                    }
                                                    product={
                                                        product
                                                    }
                                                    isWishlisted={
                                                        wishlist.includes(
                                                            productId
                                                        )
                                                    }
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

                                            );

                                        }
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
                                                        handleCategoryChange(
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
                                                        {
                                                            categoryCount(
                                                                item
                                                            )
                                                        }
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
                                            {
                                                formatPrice(
                                                    minPrice
                                                )
                                            }
                                        </span>


                                        <span>
                                            {
                                                formatPrice(
                                                    maxPrice
                                                )
                                            }
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
                                                        event.target.value
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
                                                        event.target.value
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
                                                    event.target.checked
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
                                                    event.target.checked
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

                                setQuickView(
                                    null
                                );

                            }

                        }}
                    >

                        <div
                            className="quick-view-modal"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >


                            <button
                                type="button"
                                className="quick-view-close"
                                onClick={() =>
                                    setQuickView(
                                        null
                                    )
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


                                <p>
                                    {
                                        quickView.description
                                    }
                                </p>


                                <button
                                    type="button"
                                    className="quick-view-add"
                                    onClick={(event) => {

                                        event.stopPropagation();

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
                            {
                                cartCount
                            }
                        </strong>


                        <button
                            type="button"
                            onClick={() =>
                                setCartMessage(
                                    false
                                )
                            }
                            aria-label="Close cart notification"
                        >

                            ×

                        </button>

                    </div>

                )}

            </main>

        </>

    );

} 