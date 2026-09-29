import {
    useEffect,
    useMemo,
    useRef,
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
    getProducts,
} from "../services/productService";

import {
    useCart,
} from "../hooks/useCart";


/* =========================================================
   CONSTANTS
========================================================= */

const WISHLIST_KEY = "geeka-wishlist";


/* =========================================================
   GENERAL HELPERS
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


function getDisplayValue(
    value,
    fallback = ""
) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return fallback;
    }

    if (
        typeof value === "object"
    ) {

        return String(
            value?.name ??
            value?.title ??
            value?.label ??
            value?.value ??
            value?.slug ??
            fallback
        );

    }

    return String(value);

}


function getFirstValue(
    object,
    keys,
    fallback = ""
) {

    if (!object) {
        return fallback;
    }

    for (const key of keys) {

        const value =
            object?.[key];

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {

            return value;

        }

    }

    return fallback;

}


function getNumericValue(
    object,
    keys
) {

    const value =
        getFirstValue(
            object,
            keys,
            null
        );

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;

    }

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : null;

}


/* =========================================================
   PRODUCT ID
========================================================= */

function getComparableProductId(
    product
) {

    return String(
        getProductId(
            product
        )
    ).trim();

}


/* =========================================================
   IMAGES
========================================================= */

function getImageValue(
    item
) {

    if (!item) {
        return "";
    }

    if (
        typeof item ===
        "string"
    ) {

        return item.trim();

    }

    return String(
        item?.url ??
        item?.image_url ??
        item?.imageUrl ??
        item?.src ??
        item?.path ??
        item?.file ??
        item?.image ??
        ""
    ).trim();

}


function addUniqueImage(
    collection,
    value
) {

    const image =
        getImageValue(
            value
        );

    if (
        image &&
        !collection.includes(
            image
        )
    ) {

        collection.push(
            image
        );

    }

}


function getProductImages(
    product
) {

    if (!product) {
        return [];
    }

    const images = [];


    /*
     * Main gallery arrays
     */

    const gallerySources = [
        product?.images,
        product?.gallery,
        product?.productImages,
        product?.product_images,
        product?.imageUrls,
        product?.image_urls,
    ];


    gallerySources.forEach(
        (source) => {

            if (
                !Array.isArray(
                    source
                )
            ) {
                return;
            }

            source.forEach(
                (item) => {

                    addUniqueImage(
                        images,
                        item
                    );

                }
            );

        }
    );


    /*
     * Individual image values
     */

    const individualSources = [
        product?.image_url,
        product?.imageUrl,
        product?.image,
        product?.thumbnail,
    ];


    individualSources.forEach(
        (item) => {

            addUniqueImage(
                images,
                item
            );

        }
    );


    return images;

}


/* =========================================================
   PRICE
========================================================= */

function getCurrentPrice(
    product
) {

    return getFirstValue(
        product,
        [
            "price",
            "sellingPrice",
            "salePrice",
        ],
        null
    );

}


function getOriginalPrice(
    product
) {

    return getFirstValue(
        product,
        [
            "oldPrice",
            "compareAtPrice",
            "originalPrice",
            "mrp",
        ],
        null
    );

}


function formatPrice(
    value
) {

    const amount =
        Number(value);

    if (
        !Number.isFinite(
            amount
        )
    ) {

        return "₹—";

    }

    return `₹${amount.toLocaleString(
        "en-IN"
    )}`;

}


function calculateDiscount(
    price,
    oldPrice
) {

    const current =
        Number(price);

    const original =
        Number(oldPrice);

    if (
        !Number.isFinite(
            current
        ) ||
        !Number.isFinite(
            original
        ) ||
        original <= current
    ) {

        return null;

    }

    return Math.round(
        (
            (original - current) /
            original
        ) * 100
    );

}


/* =========================================================
   INVENTORY
========================================================= */

function getStockQuantity(
    product
) {

    return getNumericValue(
        product,
        [
            "stockQuantity",
            "quantityInStock",
            "inventoryQuantity",
            "inventory",
            "stock",
        ]
    );

}


function isProductInStock(
    product
) {

    if (!product) {
        return false;
    }


    if (
        product?.inStock === false ||
        product?.in_stock === false
    ) {

        return false;

    }


    const stock =
        getStockQuantity(
            product
        );


    if (
        stock !== null &&
        stock <= 0
    ) {

        return false;

    }


    return true;

}


/* =========================================================
   WISHLIST
========================================================= */

function normalizeWishlist(
    value
) {

    if (
        !Array.isArray(
            value
        )
    ) {

        return [];

    }


    return [
        ...new Set(
            value
                .map(
                    (item) =>
                        getProductId(
                            item
                        )
                )
                .filter(Boolean)
        ),
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


        return normalizeWishlist(
            JSON.parse(
                saved
            )
        );

    } catch {

        return [];

    }

}


function saveWishlist(
    value
) {

    try {

        localStorage.setItem(
            WISHLIST_KEY,
            JSON.stringify(
                normalizeWishlist(
                    value
                )
            )
        );

    } catch {

        // Ignore localStorage errors.

    }

}


/* =========================================================
   REVIEWS
========================================================= */

function getReviewData(
    product
) {

    if (!product) {

        return {
            rating: null,
            reviewCount: 0,
            reviews: [],
            distribution: null,
        };

    }


    const reviews =
        Array.isArray(
            product?.reviews
        )
            ? product.reviews
            : [];


    const explicitRating =
        getNumericValue(
            product,
            [
                "rating",
                "averageRating",
                "avgRating",
                "reviewRating",
            ]
        );


    const calculatedRating =
        reviews.length > 0
            ? reviews.reduce(
                (
                    total,
                    review
                ) =>
                    total +
                    Number(
                        review?.rating ||
                        0
                    ),
                0
            ) / reviews.length
            : null;


    const rating =
        explicitRating !== null
            ? explicitRating
            : Number.isFinite(
                calculatedRating
            )
                ? calculatedRating
                : null;


    const explicitCount =
        getNumericValue(
            product,
            [
                "reviewCount",
                "reviewsCount",
                "totalReviews",
                "ratingCount",
                "ratingsCount",
            ]
        );


    const reviewCount =
        explicitCount !== null
            ? explicitCount
            : reviews.length;


    const distribution =
        product?.reviewDistribution ??
        product?.ratingDistribution ??
        null;


    return {
        rating,
        reviewCount,
        reviews,
        distribution,
    };

}


function getReviewDistribution(
    reviewData
) {

    if (
        reviewData?.distribution &&
        typeof reviewData.distribution ===
        "object" &&
        !Array.isArray(
            reviewData.distribution
        )
    ) {

        return reviewData.distribution;

    }


    if (
        !reviewData?.reviews?.length
    ) {

        return null;

    }


    const distribution = {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
    };


    reviewData.reviews.forEach(
        (review) => {

            const rating =
                Math.round(
                    Number(
                        review?.rating ||
                        0
                    )
                );


            if (
                rating >= 1 &&
                rating <= 5
            ) {

                distribution[
                    rating
                ] += 1;

            }

        }
    );


    return distribution;

}


function getStarCount(
    rating
) {

    if (
        rating === null ||
        rating === undefined
    ) {

        return 0;

    }


    const value =
        Number(rating);

    if (
        !Number.isFinite(
            value
        )
    ) {

        return 0;

    }


    return Math.max(
        0,
        Math.min(
            5,
            Math.round(
                value
            )
        )
    );

}


/* =========================================================
   SPECIFICATIONS
========================================================= */

function getSpecifications(
    product
) {

    if (!product) {
        return [];
    }


    const result = [];


    const sources = [
        product?.specifications,
        product?.specs,
        product?.attributes,
        product?.details,
        product?.productDetails,
    ];


    sources.forEach(
        (source) => {

            if (
                !source ||
                Array.isArray(
                    source
                ) ||
                typeof source !==
                "object"
            ) {

                return;

            }


            Object.entries(
                source
            ).forEach(
                (
                    [
                        key,
                        value,
                    ]
                ) => {

                    if (
                        value === null ||
                        value === undefined ||
                        value === ""
                    ) {

                        return;

                    }


                    const exists =
                        result.some(
                            (item) =>
                                item.key
                                    .toLowerCase() ===
                                String(
                                    key
                                ).toLowerCase()
                        );


                    if (
                        !exists
                    ) {

                        result.push({
                            key:
                                String(
                                    key
                                ),
                            value:
                                getDisplayValue(
                                    value
                                ),
                        });

                    }

                }
            );

        }
    );


    return result;

}


/* =========================================================
   ARRAY NORMALIZERS
========================================================= */

function normalizeBenefits(
    benefits
) {

    if (
        !Array.isArray(
            benefits
        )
    ) {

        return [];

    }


    return benefits
        .map(
            (
                benefit,
                index
            ) => {

                if (
                    typeof benefit ===
                    "string"
                ) {

                    return {
                        title:
                            benefit,
                        text:
                            "",
                        index,
                    };

                }


                return {
                    title:
                        getDisplayValue(
                            benefit?.title ??
                            benefit?.name ??
                            "",
                            `Benefit ${index + 1}`
                        ),
                    text:
                        getDisplayValue(
                            benefit?.text ??
                            benefit?.description ??
                            ""
                        ),
                    index,
                };

            }
        )
        .filter(
            (item) =>
                Boolean(
                    item.title
                )
        );

}


function normalizeFaq(
    faq
) {

    if (
        !Array.isArray(
            faq
        )
    ) {

        return [];

    }


    return faq
        .map(
            (
                item,
                index
            ) => {

                if (
                    typeof item ===
                    "string"
                ) {

                    return {
                        question:
                            item,
                        answer:
                            "",
                        index,
                    };

                }


                return {
                    question:
                        getDisplayValue(
                            item?.question ??
                            item?.title ??
                            ""
                        ),
                    answer:
                        getDisplayValue(
                            item?.answer ??
                            item?.text ??
                            item?.description ??
                            ""
                        ),
                    index,
                };

            }
        )
        .filter(
            (item) =>
                Boolean(
                    item.question
                )
        );

}


/* =========================================================
   ICONS
========================================================= */

function ArrowIcon() {

    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
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


function BackArrowIcon() {

    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
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
            fill="none"
            aria-hidden="true"
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


function StarIcon() {

    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
        >

            <path d="m12 2.8 2.77 5.61 6.19.9-4.48 4.36 1.06 6.16L12 16.92l-5.54 2.91 1.06-6.16-4.48-4.36 6.19-.9L12 2.8Z" />

        </svg>
    );

}


function TruckIcon() {

    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >

            <path
                d="M3 6.5h11v10H3z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
            />

            <path
                d="M14 10h3.4l3.1 3.1v3.4H14z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
            />

            <circle
                cx="7"
                cy="18"
                r="1.6"
                stroke="currentColor"
                strokeWidth="1.3"
            />

            <circle
                cx="18"
                cy="18"
                r="1.6"
                stroke="currentColor"
                strokeWidth="1.3"
            />

        </svg>
    );

}


function ShieldIcon() {

    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >

            <path
                d="M12 3.2 19 6v5.4c0 4.4-2.7 7.7-7 9.3-4.3-1.6-7-4.9-7-9.3V6l7-2.8Z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
            />

            <path
                d="m8.8 12 2.1 2.1 4.5-4.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

        </svg>
    );

}


function ReturnIcon() {

    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >

            <path
                d="M20 11a8 8 0 0 0-14.8-4L3 9"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            <path
                d="M3 4v5h5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            <path
                d="M4 13a8 8 0 0 0 14.8 4L21 15"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            <path
                d="M21 20v-5h-5"
                stroke="currentColor"
                strokeWidth="1.3"
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
            fill="none"
            aria-hidden="true"
        >

            <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
            />

        </svg>
    );

}


function MinusIcon() {

    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >

            <path
                d="M5 12h14"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
            />

        </svg>
    );

}


function ChevronIcon() {

    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >

            <path
                d="m7 9 5 5 5-5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

        </svg>
    );

}


/* =========================================================
   BENEFIT ROW
========================================================= */

function InfoRow({
    icon,
    title,
    text,
}) {

    return (
        <div className="product-info-row">

            <div className="product-info-icon">

                {icon}

            </div>


            <div>

                <strong>
                    {title}
                </strong>


                {text && (
                    <span>
                        {text}
                    </span>
                )}

            </div>

        </div>
    );

}


/* =========================================================
   COMPONENT
========================================================= */

export default function ProductDetails() {

    const {
        productId,
    } = useParams();


    const navigate =
        useNavigate();


    const {
        addItem,
    } = useCart();


    /* =====================================================
       STATE
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
        openSection,
        setOpenSection,
    ] = useState(
        "product"
    );


    const [
        pincode,
        setPincode,
    ] = useState("");


    const [
        deliveryMessage,
        setDeliveryMessage,
    ] = useState("");


    const [
        toast,
        setToast,
    ] = useState(null);


    const toastTimer =
        useRef(null);


    const relatedScrollerRef =
        useRef(null);


    /* =====================================================
       LOAD PRODUCTS
    ===================================================== */

    useEffect(() => {

        let active = true;


        async function loadProducts() {

            try {

                setLoading(
                    true
                );

                setError(
                    ""
                );


                const items =
                    await getProducts();


                if (!active) {
                    return;
                }


                setProducts(
                    Array.isArray(
                        items
                    )
                        ? items
                        : []
                );

            } catch (err) {

                if (!active) {
                    return;
                }


                console.error(
                    "GEEKA PRODUCT DETAILS ERROR:",
                    err
                );


                setError(
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


        loadProducts();


        return () => {

            active = false;

        };

    }, []);


    /* =====================================================
       CURRENT PRODUCT
    ===================================================== */

    const product =
        useMemo(() => {

            if (
                !products.length ||
                !productId
            ) {

                return null;

            }


            const target =
                decodeURIComponent(
                    String(
                        productId
                    )
                ).trim();


            return (
                products.find(
                    (item) =>
                        getComparableProductId(
                            item
                        ) === target
                ) ||
                null
            );

        }, [
            products,
            productId,
        ]);


    /* =====================================================
       PRODUCT IMAGES
    ===================================================== */

    const productImages =
        useMemo(
            () =>
                getProductImages(
                    product
                ),
            [
                product,
            ]
        );


    /* =====================================================
       PRODUCT DATA
    ===================================================== */

    const productIdValue =
        getProductId(
            product
        );


    const productName =
        getDisplayValue(
            product?.name,
            "Geeka Product"
        );


    const category =
        getDisplayValue(
            getFirstValue(
                product,
                [
                    "category",
                    "categoryName",
                    "subcategory",
                    "subcategoryName",
                    "collectionName",
                ],
                "Collection"
            )
        );


    const collection =
        getDisplayValue(
            getFirstValue(
                product,
                [
                    "collection",
                    "collectionName",
                    "parentCategory",
                    "parent_category",
                    "brand",
                ],
                "GEEKA"
            )
        );


    const currentPrice =
        getCurrentPrice(
            product
        );


    const originalPrice =
        getOriginalPrice(
            product
        );


    const discount =
        calculateDiscount(
            currentPrice,
            originalPrice
        );


    const description =
        getDisplayValue(
            getFirstValue(
                product,
                [
                    "description",
                    "longDescription",
                    "long_description",
                    "shortDescription",
                    "short_description",
                ],
                ""
            )
        );


    const material =
        getDisplayValue(
            getFirstValue(
                product,
                [
                    "material",
                    "fabric",
                    "materialType",
                    "material_type",
                ]
            )
        );


    const colour =
        getDisplayValue(
            getFirstValue(
                product,
                [
                    "color",
                    "colour",
                ]
            )
        );


    const occasion =
        getDisplayValue(
            getFirstValue(
                product,
                [
                    "occasion",
                    "suitableFor",
                    "suitable_for",
                ]
            )
        );


    const care =
        getDisplayValue(
            getFirstValue(
                product,
                [
                    "care",
                    "careInstructions",
                    "care_instructions",
                ]
            )
        );


    const countryOfOrigin =
        getDisplayValue(
            getFirstValue(
                product,
                [
                    "countryOfOrigin",
                    "country_of_origin",
                ]
            )
        );


    const productType =
        getDisplayValue(
            getFirstValue(
                product,
                [
                    "productType",
                    "product_type",
                    "type",
                ]
            )
        );


    const sku =
        getDisplayValue(
            getFirstValue(
                product,
                [
                    "sku",
                    "SKU",
                    "productCode",
                    "product_code",
                ],
                productIdValue
            ),
            productIdValue
        );


    const size =
        getDisplayValue(
            getFirstValue(
                product,
                [
                    "size",
                    "sizeInfo",
                    "size_info",
                    "fit",
                ]
            )
        );


    const story =
        getDisplayValue(
            getFirstValue(
                product,
                [
                    "story",
                    "productStory",
                    "product_story",
                    "brandStory",
                    "brand_story",
                ]
            )
        );


    const stylingNotes =
        getDisplayValue(
            getFirstValue(
                product,
                [
                    "stylingNotes",
                    "styling",
                    "stylingTips",
                    "styling_tips",
                ]
            )
        );


    const shippingText =
        getDisplayValue(
            getFirstValue(
                product,
                [
                    "shippingInfo",
                    "shipping",
                    "shippingDescription",
                    "shippingDescription",
                    "deliveryInfo",
                ]
            )
        );


    const deliveryEstimate =
        getDisplayValue(
            getFirstValue(
                product,
                [
                    "estimatedDelivery",
                    "deliveryEstimate",
                    "deliveryTime",
                    "shippingEstimate",
                ]
            )
        );


    const returnPolicy =
        getDisplayValue(
            getFirstValue(
                product,
                [
                    "returnPolicy",
                    "return_policy",
                    "returns",
                    "returnInfo",
                    "return_info",
                ]
            )
        );


    const warranty =
        getDisplayValue(
            getFirstValue(
                product,
                [
                    "warranty",
                    "warrantyInfo",
                    "warranty_info",
                ]
            )
        );


    const stockQuantity =
        getStockQuantity(
            product
        );


    const stockAvailable =
        isProductInStock(
            product
        );


    const benefits =
        useMemo(
            () =>
                normalizeBenefits(
                    product?.benefits
                ),
            [
                product,
            ]
        );


    const faq =
        useMemo(
            () =>
                normalizeFaq(
                    product?.faq ||
                    product?.faqs
                ),
            [
                product,
            ]
        );


    const reviewData =
        useMemo(
            () =>
                getReviewData(
                    product
                ),
            [
                product,
            ]
        );


    const reviewDistribution =
        useMemo(
            () =>
                getReviewDistribution(
                    reviewData
                ),
            [
                reviewData,
            ]
        );


    const specifications =
        useMemo(
            () =>
                getSpecifications(
                    product
                ),
            [
                product,
            ]
        );


    /* =====================================================
       HIGHLIGHTS
    ===================================================== */

    const highlights =
        useMemo(() => {

            const result = [];


            const definitions = [
                {
                    label:
                        "Material",
                    value:
                        material,
                },
                {
                    label:
                        "Category",
                    value:
                        category,
                },
                {
                    label:
                        "Colour",
                    value:
                        colour,
                },
                {
                    label:
                        "Occasion",
                    value:
                        occasion,
                },
                {
                    label:
                        "Care",
                    value:
                        care,
                },
                {
                    label:
                        "Country of Origin",
                    value:
                        countryOfOrigin,
                },
                {
                    label:
                        "Product Type",
                    value:
                        productType,
                },
                {
                    label:
                        "SKU",
                    value:
                        sku,
                },
            ];


            definitions.forEach(
                (item) => {

                    if (
                        item.value !==
                        undefined &&
                        item.value !==
                        null &&
                        item.value !==
                        ""
                    ) {

                        result.push(
                            item
                        );

                    }

                }
            );


            specifications.forEach(
                (item) => {

                    const exists =
                        result.some(
                            (existing) =>
                                existing.label
                                    .toLowerCase() ===
                                item.key
                                    .toLowerCase()
                        );


                    if (
                        !exists
                    ) {

                        result.push({
                            label:
                                item.key,
                            value:
                                item.value,
                        });

                    }

                }
            );


            return result;

        }, [
            material,
            category,
            colour,
            occasion,
            care,
            countryOfOrigin,
            productType,
            sku,
            specifications,
        ]);


    /* =====================================================
       RELATED PRODUCTS
    ===================================================== */

    const relatedProducts =
        useMemo(() => {

            if (!product) {
                return [];
            }


            const currentId =
                getComparableProductId(
                    product
                );


            const currentCategory =
                getDisplayValue(
                    product?.category
                );


            const currentCategoryName =
                getDisplayValue(
                    product?.categoryName
                );


            const currentCollection =
                getDisplayValue(
                    product?.collection
                );


            const currentCollectionId =
                String(
                    product?.collectionId ??
                    ""
                );


            return products
                .filter(
                    (item) => {

                        if (
                            getComparableProductId(
                                item
                            ) === currentId
                        ) {

                            return false;

                        }


                        const itemCategory =
                            getDisplayValue(
                                item?.category
                            );


                        const itemCategoryName =
                            getDisplayValue(
                                item?.categoryName
                            );


                        const itemCollection =
                            getDisplayValue(
                                item?.collection
                            );


                        const itemCollectionId =
                            String(
                                item?.collectionId ??
                                ""
                            );


                        return (
                            (
                                currentCategory &&
                                itemCategory &&
                                currentCategory ===
                                itemCategory
                            ) ||
                            (
                                currentCategoryName &&
                                itemCategoryName &&
                                currentCategoryName ===
                                itemCategoryName
                            ) ||
                            (
                                currentCollection &&
                                itemCollection &&
                                currentCollection ===
                                itemCollection
                            ) ||
                            (
                                currentCollectionId &&
                                itemCollectionId &&
                                currentCollectionId ===
                                itemCollectionId
                            )
                        );

                    }
                )
                .slice(
                    0,
                    8
                );

        }, [
            products,
            product,
        ]);


    /* =====================================================
       DERIVED UI
    ===================================================== */

    const isWishlisted =
        wishlist.includes(
            productIdValue
        );


    const currentMainImage =
        productImages[
        activeImage
        ] || "";


    const reviewStars =
        getStarCount(
            reviewData.rating
        );


    /* =====================================================
       RESET ON PRODUCT CHANGE
    ===================================================== */

    useEffect(() => {

        setActiveImage(
            0
        );

        setQuantity(
            1
        );

        setOpenSection(
            "product"
        );

        setPincode(
            ""
        );

        setDeliveryMessage(
            ""
        );

    }, [
        productId,
    ]);


    /* =====================================================
       SCROLL TOP
    ===================================================== */

    useEffect(() => {

        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "auto",
        });

    }, [
        productId,
    ]);


    /* =====================================================
       WISHLIST SYNC
    ===================================================== */

    useEffect(() => {

        function syncWishlist() {

            setWishlist(
                readWishlist()
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
       TOAST CLEANUP
    ===================================================== */

    useEffect(() => {

        return () => {

            if (
                toastTimer.current
            ) {

                clearTimeout(
                    toastTimer.current
                );

            }

        };

    }, []);


    /* =====================================================
       TOAST
    ===================================================== */

    function showToast(
        message,
        type = "bag"
    ) {

        if (
            toastTimer.current
        ) {

            clearTimeout(
                toastTimer.current
            );

        }


        setToast({
            message,
            type,
        });


        toastTimer.current =
            setTimeout(
                () => {

                    setToast(
                        null
                    );

                    toastTimer.current =
                        null;

                },
                3000
            );

    }


    /* =====================================================
       WISHLIST
    ===================================================== */

    function toggleWishlist() {

        if (!productIdValue) {
            return;
        }


        const current =
            readWishlist();


        const exists =
            current.includes(
                productIdValue
            );


        const next =
            exists
                ? current.filter(
                    (id) =>
                        id !==
                        productIdValue
                )
                : [
                    ...current,
                    productIdValue,
                ];


        saveWishlist(
            next
        );


        setWishlist(
            next
        );


        window.dispatchEvent(
            new Event(
                "geeka-wishlist-updated"
            )
        );


        showToast(
            exists
                ? "REMOVED FROM WISHLIST"
                : "ADDED TO WISHLIST",
            "wishlist"
        );

    }


    /* =====================================================
       QUANTITY
    ===================================================== */

    function increaseQuantity() {

        setQuantity(
            (current) => {

                if (
                    stockQuantity !==
                    null &&
                    stockQuantity > 0
                ) {

                    return Math.min(
                        current + 1,
                        stockQuantity
                    );

                }


                return current + 1;

            }
        );

    }


    function decreaseQuantity() {

        setQuantity(
            (current) =>
                Math.max(
                    1,
                    current - 1
                )
        );

    }


    /* =====================================================
       CART
    ===================================================== */

    function addProductToCart() {

        if (
            !product ||
            !stockAvailable
        ) {

            return false;

        }


        for (
            let index = 0;
            index < quantity;
            index += 1
        ) {

            addItem(
                product
            );

        }


        return true;

    }


    function handleAddToBag() {

        const added =
            addProductToCart();


        if (!added) {
            return;
        }


        showToast(
            quantity > 1
                ? `${quantity} ITEMS ADDED TO BAG`
                : "ADDED TO BAG",
            "bag"
        );

    }


    function handleBuyNow() {

        const added =
            addProductToCart();


        if (!added) {
            return;
        }


        navigate(
            "/cart"
        );

    }


    /* =====================================================
       DELIVERY
    ===================================================== */

    function checkDelivery() {

        const clean =
            pincode.trim();


        if (
            !/^\d{6}$/.test(
                clean
            )
        ) {

            setDeliveryMessage(
                "Enter a valid 6-digit pincode."
            );

            return;

        }


        if (
            deliveryEstimate
        ) {

            setDeliveryMessage(
                `${deliveryEstimate}`
            );

            return;

        }


        setDeliveryMessage(
            "Pincode format is valid. Exact delivery availability will be confirmed during checkout."
        );

    }


    /* =====================================================
       ACCORDION
    ===================================================== */

    function toggleSection(
        section
    ) {

        setOpenSection(
            (current) =>
                current === section
                    ? ""
                    : section
        );

    }


    /* =====================================================
       RELATED SCROLLER
    ===================================================== */

    function scrollRelated(
        direction
    ) {

        const container =
            relatedScrollerRef.current;


        if (!container) {
            return;
        }


        container.scrollBy({
            left:
                direction === "next"
                    ? 370
                    : -370,
            behavior:
                "smooth",
        });

    }


    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {

        return (
            <>
                <Header />

                <main className="product-details-page">

                    <div className="product-loading">

                        <div className="product-loading-gallery">

                            <div className="product-loading-main" />

                        </div>


                        <div className="product-loading-content">

                            <div />
                            <div />
                            <div />
                            <div />
                            <div />
                            <div />

                        </div>

                    </div>

                </main>
            </>
        );

    }


    /* =====================================================
       ERROR / NOT FOUND
    ===================================================== */

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
                            Product not found.
                        </h1>


                        <p>
                            {error ||
                                "The product you are looking for is unavailable or has been removed."}
                        </p>


                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/shop"
                                )
                            }
                        >

                            BACK TO SHOP

                            <ArrowIcon />

                        </button>

                    </div>

                </main>
            </>
        );

    }


    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <>
            <Header />

            <main className="product-details-page">

                {/* =================================================
                    AMBIENT BACKGROUND
                ================================================= */}

                <div
                    className="product-ambient ambient-one"
                    aria-hidden="true"
                />

                <div
                    className="product-ambient ambient-two"
                    aria-hidden="true"
                />

                <div
                    className="product-ambient ambient-three"
                    aria-hidden="true"
                />

                <div
                    className="product-ambient ambient-four"
                    aria-hidden="true"
                />

                {/* =================================================
                    MAIN PRODUCT
                ================================================= */}

                <section className="product-main">

                    {/* =================================================
                        GALLERY
                    ================================================= */}

                    <div className="product-gallery">

                        <div className="product-gallery-heading">

                            <span>
                                {collection.toUpperCase()}
                            </span>


                            <div>

                                {product?.isNew && (
                                    <span className="gallery-new-label">
                                        NEW
                                    </span>
                                )}


                                {stockAvailable && (
                                    <span className="gallery-stock-label">
                                        AVAILABLE
                                    </span>
                                )}

                            </div>

                        </div>


                        <div className="product-gallery-body">

                            {/* THUMBNAILS */}

                            {productImages.length > 1 && (

                                <div className="product-thumbnails">

                                    {productImages.map(
                                        (
                                            image,
                                            index
                                        ) => (

                                            <button
                                                key={`${image}-${index}`}
                                                type="button"
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
                                                aria-label={`View image ${index + 1}`}
                                            >

                                                <img
                                                    src={
                                                        image
                                                    }
                                                    alt={`${productName} thumbnail ${index + 1}`}
                                                />

                                                <span>
                                                    {String(
                                                        index + 1
                                                    ).padStart(
                                                        2,
                                                        "0"
                                                    )}
                                                </span>

                                            </button>

                                        )
                                    )}

                                </div>

                            )}


                            {/* MAIN IMAGE */}

                            <div className="product-main-image">

                                <div className="product-main-image-inner">

                                    {currentMainImage ? (

                                        <img
                                            src={
                                                currentMainImage
                                            }
                                            alt={
                                                productName
                                            }
                                            className="product-main-photo"
                                            onError={(
                                                event
                                            ) => {

                                                event.currentTarget.style.display =
                                                    "none";

                                            }}
                                        />

                                    ) : (

                                        <div className="product-image-placeholder">

                                            <span>
                                                GEEKA
                                            </span>

                                        </div>

                                    )}

                                </div>


                                <div className="product-image-shade" />


                                {product?.isNew && (

                                    <span className="product-main-badge">

                                        NEW ARRIVAL

                                    </span>

                                )}


                                {!stockAvailable && (

                                    <span className="product-main-sold">

                                        SOLD OUT

                                    </span>

                                )}


                                <div className="product-image-index">

                                    {productImages.length > 0
                                        ? `${String(
                                            activeImage + 1
                                        ).padStart(
                                            2,
                                            "0"
                                        )} / ${String(
                                            productImages.length
                                        ).padStart(
                                            2,
                                            "0"
                                        )}`
                                        : "01 / 01"}

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        PRODUCT PURCHASE PANEL
                    ================================================= */}

                    <div className="product-main-information">

                        <div className="product-status-row">

                            <span>
                                {category}
                            </span>


                            {stockAvailable ? (

                                <span className="in-stock">
                                    IN STOCK
                                </span>

                            ) : (

                                <span className="out-stock">
                                    SOLD OUT
                                </span>

                            )}

                        </div>


                        <div className="product-title-wrap">

                            <div>

                                <p className="product-eyebrow">
                                    {collection}
                                </p>


                                <h1>
                                    {productName}
                                </h1>

                            </div>


                            <button
                                type="button"
                                className={`product-main-wishlist ${isWishlisted
                                    ? "active"
                                    : ""
                                    }`}
                                onClick={
                                    toggleWishlist
                                }
                                aria-label={
                                    isWishlisted
                                        ? "Remove from wishlist"
                                        : "Add to wishlist"
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


                        {/* RATING */}

                        {reviewData.rating !== null && (

                            <div className="product-rating">

                                <div className="product-stars">

                                    {Array.from(
                                        {
                                            length: 5,
                                        },
                                        (
                                            _,
                                            index
                                        ) => (

                                            <span
                                                key={
                                                    index
                                                }
                                                className={
                                                    index <
                                                        reviewStars
                                                        ? "filled"
                                                        : ""
                                                }
                                            >

                                                <StarIcon />

                                            </span>

                                        )
                                    )}

                                </div>


                                <strong>

                                    {Number(
                                        reviewData.rating
                                    ).toFixed(
                                        1
                                    )}

                                </strong>


                                {reviewData.reviewCount > 0 && (

                                    <span>

                                        {reviewData.reviewCount}
                                        {" "}
                                        {reviewData.reviewCount ===
                                            1
                                            ? "review"
                                            : "reviews"}

                                    </span>

                                )}

                            </div>

                        )}


                        {/* PRICE */}

                        <div className="product-price-row">

                            <strong>
                                {formatPrice(
                                    currentPrice
                                )}
                            </strong>


                            {originalPrice !== null &&
                                Number(
                                    originalPrice
                                ) >
                                Number(
                                    currentPrice
                                ) && (

                                    <del>
                                        {formatPrice(
                                            originalPrice
                                        )}
                                    </del>

                                )}


                            {discount !== null && (

                                <span className="product-discount">

                                    {discount}% OFF

                                </span>

                            )}

                        </div>


                        {/* DESCRIPTION */}

                        {description && (

                            <div className="product-description-block">

                                <span>
                                    ABOUT
                                </span>


                                <p>
                                    {description}
                                </p>

                            </div>

                        )}


                        {/* QUANTITY */}

                        {stockAvailable && (

                            <div className="product-quantity-section">

                                <div>

                                    <span>
                                        Quantity
                                    </span>


                                    {stockQuantity !== null && (

                                        <small>
                                            {stockQuantity}
                                            {" "}
                                            available
                                        </small>

                                    )}

                                </div>


                                <div className="product-quantity">

                                    <button
                                        type="button"
                                        onClick={
                                            decreaseQuantity
                                        }
                                        aria-label="Decrease quantity"
                                    >

                                        <MinusIcon />

                                    </button>


                                    <strong>
                                        {quantity}
                                    </strong>


                                    <button
                                        type="button"
                                        onClick={
                                            increaseQuantity
                                        }
                                        aria-label="Increase quantity"
                                    >

                                        <PlusIcon />

                                    </button>

                                </div>

                            </div>

                        )}


                        {/* ACTIONS */}

                        <div className="product-purchase-actions">

                            <button
                                type="button"
                                className="product-add-button"
                                disabled={
                                    !stockAvailable
                                }
                                onClick={
                                    handleAddToBag
                                }
                            >

                                {
                                    stockAvailable
                                        ? "ADD TO BAG"
                                        : "SOLD OUT"
                                }


                                {stockAvailable && (
                                    <ArrowIcon />
                                )}

                            </button>


                            <button
                                type="button"
                                className="product-buy-button"
                                disabled={
                                    !stockAvailable
                                }
                                onClick={
                                    handleBuyNow
                                }
                            >

                                BUY NOW

                            </button>

                        </div>


                        {/* BENEFITS */}

                        {benefits.length > 0 && (

                            <div className="product-benefits">

                                {benefits
                                    .slice(
                                        0,
                                        6
                                    )
                                    .map(
                                        (
                                            benefit,
                                            index
                                        ) => {

                                            const icon =
                                                index ===
                                                    0
                                                    ? <TruckIcon />
                                                    : index ===
                                                        1
                                                        ? <ShieldIcon />
                                                        : <ReturnIcon />;


                                            return (
                                                <InfoRow
                                                    key={`${benefit.title}-${benefit.index}`}
                                                    icon={
                                                        icon
                                                    }
                                                    title={
                                                        benefit.title
                                                    }
                                                    text={
                                                        benefit.text
                                                    }
                                                />
                                            );

                                        }
                                    )}

                            </div>

                        )}


                        {/* POLICY */}

                        {(shippingText ||
                            deliveryEstimate ||
                            returnPolicy ||
                            warranty) && (

                                <div className="product-policy-strip">

                                    {shippingText && (

                                        <div>

                                            <TruckIcon />

                                            <span>
                                                {shippingText}
                                            </span>

                                        </div>

                                    )}


                                    {deliveryEstimate && (

                                        <div>

                                            <ShieldIcon />

                                            <span>
                                                {deliveryEstimate}
                                            </span>

                                        </div>

                                    )}


                                    {returnPolicy && (

                                        <div>

                                            <ReturnIcon />

                                            <span>
                                                {returnPolicy}
                                            </span>

                                        </div>

                                    )}


                                    {warranty && (

                                        <div>

                                            <ShieldIcon />

                                            <span>
                                                {warranty}
                                            </span>

                                        </div>

                                    )}

                                </div>

                            )}


                        {/* DELIVERY */}

                        <div className="product-delivery">

                            <div className="product-delivery-head">

                                <TruckIcon />

                                <div>

                                    <strong>
                                        Check delivery
                                    </strong>

                                    <span>
                                        Enter your pincode
                                    </span>

                                </div>

                            </div>


                            <div className="product-delivery-form">

                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={
                                        pincode
                                    }
                                    onChange={(
                                        event
                                    ) => {

                                        setPincode(
                                            event.target.value.replace(
                                                /\D/g,
                                                ""
                                            )
                                        );


                                        setDeliveryMessage(
                                            ""
                                        );

                                    }}
                                    placeholder="Enter pincode"
                                    aria-label="Enter pincode"
                                />


                                <button
                                    type="button"
                                    onClick={
                                        checkDelivery
                                    }
                                >

                                    CHECK

                                </button>

                            </div>


                            {deliveryMessage && (

                                <p
                                    className={
                                        deliveryMessage ===
                                            deliveryEstimate
                                            ? "success"
                                            : deliveryEstimate &&
                                                deliveryMessage.includes(
                                                    deliveryEstimate
                                                )
                                                ? "success"
                                                : deliveryMessage.startsWith(
                                                    "Enter"
                                                )
                                                    ? "error"
                                                    : "success"
                                    }
                                >

                                    {
                                        deliveryMessage
                                    }

                                </p>

                            )}

                        </div>

                    </div>

                </section>


                {/* =================================================
                    HIGHLIGHTS + STORY
                ================================================= */}

                <section className="product-information-layout">

                    {/* HIGHLIGHTS */}

                    <div className="product-highlights">

                        <div className="product-section-heading">

                            <span>
                                PRODUCT INFORMATION
                            </span>


                            <h2>
                                Product Highlights
                            </h2>

                        </div>


                        {highlights.length > 0 ? (

                            <div className="product-highlight-table">

                                {highlights.map(
                                    (
                                        item
                                    ) => (

                                        <div
                                            key={
                                                item.label
                                            }
                                        >

                                            <strong>
                                                {item.label}
                                            </strong>


                                            <span>
                                                {getDisplayValue(
                                                    item.value
                                                )}
                                            </span>

                                        </div>

                                    )
                                )}

                            </div>

                        ) : (

                            <div className="product-information-empty">

                                <strong>
                                    No additional specifications
                                </strong>


                                <span>
                                    Additional product information
                                    will appear when provided through
                                    the admin dashboard.
                                </span>

                            </div>

                        )}

                    </div>


                    {/* STORY */}

                    <div className="product-about">

                        <div className="product-section-heading">

                            <span>
                                PRODUCT STORY
                            </span>


                            <h2>
                                About This Product
                            </h2>

                        </div>


                        <div className="product-about-content">

                            {description && (

                                <div>

                                    <span className="about-label">
                                        DESCRIPTION
                                    </span>


                                    <p>
                                        {description}
                                    </p>

                                </div>

                            )}


                            {story && (

                                <div>

                                    <span className="about-label">
                                        THE STORY
                                    </span>


                                    <p>
                                        {story}
                                    </p>

                                </div>

                            )}


                            {stylingNotes && (

                                <div>

                                    <span className="about-label">
                                        STYLING
                                    </span>


                                    <p>
                                        {stylingNotes}
                                    </p>

                                </div>

                            )}


                            {!description &&
                                !story &&
                                !stylingNotes && (

                                    <div className="product-information-empty">

                                        <strong>
                                            No product story has been added
                                        </strong>


                                        <span>
                                            Description, story and styling
                                            content added from the admin
                                            dashboard will appear here.
                                        </span>

                                    </div>

                                )}

                        </div>

                    </div>

                </section>


                {/* =================================================
                    SPECIFICATIONS + REVIEWS
                ================================================= */}

                <section className="product-lower-information">

                    {/* =================================================
                        SPECIFICATIONS
                    ================================================= */}

                    <div className="product-specifications">

                        <div className="product-section-heading">

                            <span>
                                INFORMATION
                            </span>


                            <h2>
                                Specifications
                            </h2>

                        </div>


                        <div className="product-accordion">

                            {/* PRODUCT */}

                            <div
                                className={`product-accordion-item ${openSection ===
                                    "product"
                                    ? "open"
                                    : ""
                                    }`}
                            >

                                <button
                                    type="button"
                                    onClick={() =>
                                        toggleSection(
                                            "product"
                                        )
                                    }
                                >

                                    <span>
                                        Product Details
                                    </span>


                                    <ChevronIcon />

                                </button>


                                {openSection ===
                                    "product" && (

                                        <div className="product-accordion-content">

                                            <p>
                                                Product ID:
                                                {" "}
                                                {productIdValue}
                                            </p>


                                            <p>
                                                Category:
                                                {" "}
                                                {category}
                                            </p>


                                            <p>
                                                Collection:
                                                {" "}
                                                {collection}
                                            </p>


                                            {productType && (
                                                <p>
                                                    Product Type:
                                                    {" "}
                                                    {productType}
                                                </p>
                                            )}


                                            {sku && (
                                                <p>
                                                    SKU:
                                                    {" "}
                                                    {sku}
                                                </p>
                                            )}


                                            <p>
                                                Availability:
                                                {" "}
                                                {stockAvailable
                                                    ? "Currently available"
                                                    : "Currently sold out"}
                                            </p>

                                        </div>

                                    )}

                            </div>


                            {/* MATERIAL */}

                            <div
                                className={`product-accordion-item ${openSection ===
                                    "material"
                                    ? "open"
                                    : ""
                                    }`}
                            >

                                <button
                                    type="button"
                                    onClick={() =>
                                        toggleSection(
                                            "material"
                                        )
                                    }
                                >

                                    <span>
                                        Material & Care
                                    </span>


                                    <ChevronIcon />

                                </button>


                                {openSection ===
                                    "material" && (

                                        <div className="product-accordion-content">

                                            {material && (
                                                <p>
                                                    Material:
                                                    {" "}
                                                    {material}
                                                </p>
                                            )}


                                            {care && (
                                                <p>
                                                    Care:
                                                    {" "}
                                                    {care}
                                                </p>
                                            )}


                                            {!material &&
                                                !care && (

                                                    <p>
                                                        Material and care
                                                        information has not
                                                        been provided.
                                                    </p>

                                                )}

                                        </div>

                                    )}

                            </div>


                            {/* SIZE */}

                            <div
                                className={`product-accordion-item ${openSection ===
                                    "size"
                                    ? "open"
                                    : ""
                                    }`}
                            >

                                <button
                                    type="button"
                                    onClick={() =>
                                        toggleSection(
                                            "size"
                                        )
                                    }
                                >

                                    <span>
                                        Size & Fit
                                    </span>


                                    <ChevronIcon />

                                </button>


                                {openSection ===
                                    "size" && (

                                        <div className="product-accordion-content">

                                            <p>
                                                {size ||
                                                    "Size and fit information has not been provided."}
                                            </p>

                                        </div>

                                    )}

                            </div>


                            {/* SHIPPING */}

                            <div
                                className={`product-accordion-item ${openSection ===
                                    "shipping"
                                    ? "open"
                                    : ""
                                    }`}
                            >

                                <button
                                    type="button"
                                    onClick={() =>
                                        toggleSection(
                                            "shipping"
                                        )
                                    }
                                >

                                    <span>
                                        Shipping & Returns
                                    </span>


                                    <ChevronIcon />

                                </button>


                                {openSection ===
                                    "shipping" && (

                                        <div className="product-accordion-content">

                                            {shippingText && (
                                                <p>
                                                    Shipping:
                                                    {" "}
                                                    {shippingText}
                                                </p>
                                            )}


                                            {deliveryEstimate && (
                                                <p>
                                                    Delivery:
                                                    {" "}
                                                    {deliveryEstimate}
                                                </p>
                                            )}


                                            {returnPolicy && (
                                                <p>
                                                    Returns:
                                                    {" "}
                                                    {returnPolicy}
                                                </p>
                                            )}


                                            {!shippingText &&
                                                !deliveryEstimate &&
                                                !returnPolicy && (

                                                    <p>
                                                        Shipping and return
                                                        information has not
                                                        been provided.
                                                    </p>

                                                )}

                                        </div>

                                    )}

                            </div>


                            {/* WARRANTY */}

                            <div
                                className={`product-accordion-item ${openSection ===
                                    "warranty"
                                    ? "open"
                                    : ""
                                    }`}
                            >

                                <button
                                    type="button"
                                    onClick={() =>
                                        toggleSection(
                                            "warranty"
                                        )
                                    }
                                >

                                    <span>
                                        Warranty
                                    </span>


                                    <ChevronIcon />

                                </button>


                                {openSection ===
                                    "warranty" && (

                                        <div className="product-accordion-content">

                                            <p>
                                                {warranty ||
                                                    "No warranty information has been provided."}
                                            </p>

                                        </div>

                                    )}

                            </div>


                            {/* FAQ */}

                            <div
                                className={`product-accordion-item ${openSection ===
                                    "faq"
                                    ? "open"
                                    : ""
                                    }`}
                            >

                                <button
                                    type="button"
                                    onClick={() =>
                                        toggleSection(
                                            "faq"
                                        )
                                    }
                                >

                                    <span>
                                        FAQ
                                    </span>


                                    <ChevronIcon />

                                </button>


                                {openSection ===
                                    "faq" && (

                                        <div className="product-accordion-content">

                                            {faq.length > 0 ? (

                                                faq.map(
                                                    (
                                                        item
                                                    ) => (

                                                        <div
                                                            key={`${item.question}-${item.index}`}
                                                            className="product-faq-item"
                                                        >

                                                            <strong>
                                                                {
                                                                    item.question
                                                                }
                                                            </strong>


                                                            {item.answer && (
                                                                <p>
                                                                    {
                                                                        item.answer
                                                                    }
                                                                </p>
                                                            )}

                                                        </div>

                                                    )
                                                )

                                            ) : (

                                                <p>
                                                    No FAQ information
                                                    has been provided.
                                                </p>

                                            )}

                                        </div>

                                    )}

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        REVIEWS
                    ================================================= */}

                    <div className="product-reviews">

                        <div className="product-section-heading">

                            <span>
                                CUSTOMER FEEDBACK
                            </span>


                            <h2>
                                Customer Reviews
                            </h2>

                        </div>


                        {reviewData.rating !== null ? (

                            <>

                                <div className="product-review-summary">

                                    <div className="product-review-number">

                                        {Number(
                                            reviewData.rating
                                        ).toFixed(
                                            1
                                        )}

                                    </div>


                                    <div className="product-review-stars">

                                        <div>

                                            {Array.from(
                                                {
                                                    length: 5,
                                                },
                                                (
                                                    _,
                                                    index
                                                ) => (

                                                    <span
                                                        key={
                                                            index
                                                        }
                                                        className={
                                                            index <
                                                                reviewStars
                                                                ? "filled"
                                                                : ""
                                                        }
                                                    >

                                                        <StarIcon />

                                                    </span>

                                                )
                                            )}

                                        </div>


                                        <span>

                                            {reviewData.reviewCount > 0
                                                ? `Based on ${reviewData.reviewCount} ${reviewData.reviewCount ===
                                                    1
                                                    ? "review"
                                                    : "reviews"
                                                }`
                                                : "Product rating"}

                                        </span>

                                    </div>

                                </div>


                                {reviewDistribution && (

                                    <div className="product-review-bars">

                                        {[
                                            5,
                                            4,
                                            3,
                                            2,
                                            1,
                                        ].map(
                                            (
                                                star
                                            ) => {

                                                const count =
                                                    Number(
                                                        reviewDistribution?.[
                                                        star
                                                        ] ||
                                                        0
                                                    );


                                                const total =
                                                    Object.values(
                                                        reviewDistribution
                                                    ).reduce(
                                                        (
                                                            sum,
                                                            value
                                                        ) =>
                                                            sum +
                                                            Number(
                                                                value ||
                                                                0
                                                            ),
                                                        0
                                                    );


                                                const percentage =
                                                    total > 0
                                                        ? Math.round(
                                                            (
                                                                count /
                                                                total
                                                            ) *
                                                            100
                                                        )
                                                        : 0;


                                                return (
                                                    <div
                                                        key={
                                                            star
                                                        }
                                                    >

                                                        <span>
                                                            {star} ★
                                                        </span>


                                                        <div>

                                                            <span
                                                                style={{
                                                                    width:
                                                                        `${percentage}%`,
                                                                }}
                                                            />

                                                        </div>


                                                        <strong>
                                                            {percentage}%
                                                        </strong>

                                                    </div>
                                                );

                                            }
                                        )}

                                    </div>

                                )}


                                {reviewData.reviews.length > 0 ? (

                                    <div className="product-review-list">

                                        {reviewData.reviews
                                            .slice(
                                                0,
                                                5
                                            )
                                            .map(
                                                (
                                                    review,
                                                    index
                                                ) => {

                                                    const reviewName =
                                                        getDisplayValue(
                                                            review?.name ??
                                                            review?.user ??
                                                            review?.author,
                                                            "Customer"
                                                        );


                                                    const reviewText =
                                                        getDisplayValue(
                                                            review?.comment ??
                                                            review?.text ??
                                                            review?.review
                                                        );


                                                    const reviewRating =
                                                        Number(
                                                            review?.rating ||
                                                            0
                                                        );


                                                    return (
                                                        <article
                                                            key={`${reviewName}-${index}`}
                                                            className="product-review-card"
                                                        >

                                                            <div className="product-review-card-top">

                                                                <div>

                                                                    <strong>
                                                                        {
                                                                            reviewName
                                                                        }
                                                                    </strong>


                                                                    {review?.date && (
                                                                        <small>
                                                                            {
                                                                                review.date
                                                                            }
                                                                        </small>
                                                                    )}

                                                                </div>


                                                                {reviewRating > 0 && (

                                                                    <span>

                                                                        {reviewRating.toFixed(
                                                                            1
                                                                        )}
                                                                        {" "}
                                                                        ★

                                                                    </span>

                                                                )}

                                                            </div>


                                                            {reviewText && (

                                                                <p>
                                                                    {
                                                                        reviewText
                                                                    }
                                                                </p>

                                                            )}

                                                        </article>
                                                    );

                                                }
                                            )}

                                    </div>

                                ) : (

                                    <div className="product-information-empty">

                                        <strong>
                                            No written reviews yet
                                        </strong>


                                        <span>
                                            Customer reviews added
                                            through the admin and
                                            review system will appear here.
                                        </span>

                                    </div>

                                )}

                            </>

                        ) : (

                            <div className="product-empty-reviews">

                                <strong>
                                    No ratings yet
                                </strong>


                                <span>
                                    Ratings and customer reviews
                                    will appear here when they are
                                    available from the product data.
                                </span>

                            </div>

                        )}

                    </div>

                </section>


                {/* =================================================
                    RELATED PRODUCTS
                ================================================= */}

                {relatedProducts.length > 0 && (

                    <section className="product-related">

                        <div className="product-related-header">

                            <div className="product-section-heading">

                                <span>
                                    FROM THE COLLECTION
                                </span>


                                <h2>
                                    You May Also Like
                                </h2>

                            </div>


                            {relatedProducts.length > 3 && (

                                <div className="product-related-arrows">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            scrollRelated(
                                                "previous"
                                            )
                                        }
                                        aria-label="Previous related products"
                                    >

                                        <BackArrowIcon />

                                    </button>


                                    <button
                                        type="button"
                                        onClick={() =>
                                            scrollRelated(
                                                "next"
                                            )
                                        }
                                        aria-label="Next related products"
                                    >

                                        <ArrowIcon />

                                    </button>

                                </div>

                            )}

                        </div>


                        <div
                            className="product-related-grid"
                            ref={
                                relatedScrollerRef
                            }
                        >

                            {relatedProducts.map(
                                (
                                    item
                                ) => {

                                    const itemId =
                                        getProductId(
                                            item
                                        );


                                    const itemImages =
                                        getProductImages(
                                            item
                                        );


                                    const itemImage =
                                        itemImages[0] ||
                                        "";


                                    const itemCategory =
                                        getDisplayValue(
                                            item?.category ||
                                            item?.categoryName,
                                            "COLLECTION"
                                        );


                                    const itemPrice =
                                        getCurrentPrice(
                                            item
                                        );


                                    const itemOriginalPrice =
                                        getOriginalPrice(
                                            item
                                        );


                                    return (
                                        <article
                                            key={
                                                itemId
                                            }
                                            className="product-related-card"
                                        >

                                            <Link
                                                to={`/product/${encodeURIComponent(
                                                    itemId
                                                )}`}
                                                className="product-related-image"
                                            >

                                                {itemImage ? (

                                                    <img
                                                        src={
                                                            itemImage
                                                        }
                                                        alt={
                                                            getDisplayValue(
                                                                item?.name,
                                                                "Geeka product"
                                                            )
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


                                                {item?.isNew && (

                                                    <span className="product-related-badge">

                                                        NEW

                                                    </span>

                                                )}

                                            </Link>


                                            <div className="product-related-info">

                                                <span>
                                                    {
                                                        itemCategory
                                                    }
                                                </span>


                                                <Link
                                                    to={`/product/${encodeURIComponent(
                                                        itemId
                                                    )}`}
                                                >

                                                    {
                                                        getDisplayValue(
                                                            item?.name,
                                                            "Geeka Product"
                                                        )
                                                    }

                                                </Link>


                                                <div>

                                                    <strong>
                                                        {
                                                            formatPrice(
                                                                itemPrice
                                                            )
                                                        }
                                                    </strong>


                                                    {itemOriginalPrice !== null &&
                                                        Number(
                                                            itemOriginalPrice
                                                        ) >
                                                        Number(
                                                            itemPrice
                                                        ) && (

                                                            <del>
                                                                {
                                                                    formatPrice(
                                                                        itemOriginalPrice
                                                                    )
                                                                }
                                                            </del>

                                                        )}

                                                </div>

                                            </div>

                                        </article>
                                    );

                                }
                            )}

                        </div>

                    </section>

                )}

            </main>


            {/* =================================================
                TOAST
            ================================================= */}

            {toast && (

                <div
                    className={`product-detail-toast ${toast.type ===
                        "wishlist"
                        ? "wishlist"
                        : ""
                        }`}
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >

                    <div className="product-detail-toast-icon">

                        <HeartIcon
                            filled={
                                toast.type ===
                                "wishlist"
                            }
                        />

                    </div>


                    <div>

                        <strong>
                            {toast.message}
                        </strong>


                        <span>
                            {productName}
                        </span>

                    </div>


                    <button
                        type="button"
                        onClick={() =>
                            setToast(
                                null
                            )
                        }
                        aria-label="Close notification"
                    >

                        ×

                    </button>

                </div>

            )}

        </>
    );

}