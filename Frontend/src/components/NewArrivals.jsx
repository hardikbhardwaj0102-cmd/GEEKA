import { useEffect, useRef, useState } from "react";

import { Link, useNavigate } from "react-router-dom";



import "../style/NewArrivals.css";



import {

    getDefaultPurchasableVariant,

    getProductCards,

    getProductsPage,

} from "../services/productService";



import { useCart } from "../hooks/useCart";

import { useWishlist } from "../hooks/useWishlist";



const PRODUCTS_PER_PAGE = 4;



/* =========================================================

   WISHLIST

========================================================= */









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



function productId(product) {

    return String(product?.id ?? "").trim();

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



function PlusIcon() {

    return (

        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">

            <path

                d="M12 5v14M5 12h14"

                stroke="currentColor"

                strokeWidth="1.35"

                strokeLinecap="round"

            />

        </svg>

    );

}



/* =========================================================

   PRODUCT GALLERY HOVER SLIDESHOW

========================================================= */



const GALLERY_SLIDE_INTERVAL = 2200;

const GALLERY_TRANSITION_DURATION = 520;



function getProductGalleryImages(product) {

    const detailImages = Array.isArray(product?.detail?.images)

        ? [...product.detail.images]

            .filter((image) => image && image.is_active !== false)

            .sort(

                (a, b) =>

                    Number(a?.display_order ?? 0) -

                    Number(b?.display_order ?? 0)

            )

        : [];



    const imageSources = [

        product?.displayImage,

        ...detailImages,

        ...(Array.isArray(product?.images) ? product.images : []),

        ...(Array.isArray(product?.gallery) ? product.gallery : []),

    ]

        .map((image) => {

            if (typeof image === "string") {

                return image.trim();

            }



            return String(

                image?.image_url ??

                image?.url ??

                image?.imageUrl ??

                image?.src ??

                ""

            ).trim();

        })

        .filter(Boolean);



    // Keep the primary image first and avoid duplicate images.

    return [...new Set(imageSources)];

}



function NewArrivalProductImage({

    product,

    id,

    wishlisted,

    onToggleWishlist,

}) {

    const galleryImages = getProductGalleryImages(product);

    const productName = product?.name || "Geeka product";



    const [activeIndex, setActiveIndex] = useState(0);

    const [transitionEnabled, setTransitionEnabled] = useState(true);



    const intervalRef = useRef(null);

    const resetTimeoutRef = useRef(null);



    const clearSlideshowTimers = () => {

        if (intervalRef.current !== null) {

            window.clearInterval(intervalRef.current);

            intervalRef.current = null;

        }



        if (resetTimeoutRef.current !== null) {

            window.clearTimeout(resetTimeoutRef.current);

            resetTimeoutRef.current = null;

        }

    };



    useEffect(() => {

        return () => {

            if (intervalRef.current !== null) {

                window.clearInterval(intervalRef.current);

            }



            if (resetTimeoutRef.current !== null) {

                window.clearTimeout(resetTimeoutRef.current);

            }

        };

    }, []);



    /*

       When the slideshow reaches the duplicated first image,

       jump back to the beginning without a visible reverse slide.

    */



    useEffect(() => {

        if (

            galleryImages.length < 2 ||

            activeIndex !== galleryImages.length

        ) {

            return undefined;

        }



        resetTimeoutRef.current = window.setTimeout(() => {

            setTransitionEnabled(false);

            setActiveIndex(0);



            window.requestAnimationFrame(() => {

                window.requestAnimationFrame(() => {

                    setTransitionEnabled(true);

                });

            });

        }, GALLERY_TRANSITION_DURATION + 30);



        return () => {

            if (resetTimeoutRef.current !== null) {

                window.clearTimeout(resetTimeoutRef.current);

                resetTimeoutRef.current = null;

            }

        };

    }, [activeIndex, galleryImages.length]);



    const handleMouseEnter = () => {

        if (

            galleryImages.length < 2 ||

            intervalRef.current !== null

        ) {

            return;

        }



        // Preload gallery images to make the transition smoother.

        galleryImages.slice(1).forEach((src) => {

            const preloadImage = new window.Image();

            preloadImage.src = src;

        });



        intervalRef.current = window.setInterval(() => {

            setActiveIndex((current) =>

                current >= galleryImages.length - 1

                    ? galleryImages.length

                    : current + 1

            );

        }, GALLERY_SLIDE_INTERVAL);

    };



    const handleMouseLeave = () => {

        clearSlideshowTimers();



        setTransitionEnabled(true);

        setActiveIndex(0);

    };



    /*

       Duplicate the first image to create a continuous loop.

    */



    const slides =

        galleryImages.length > 1

            ? [...galleryImages, galleryImages[0]]

            : galleryImages;



    return (

        <div

            className="new-arrival-image"

            onMouseEnter={handleMouseEnter}

            onMouseLeave={handleMouseLeave}

            style={{ overflow: "hidden" }}

        >

            <Link

                className="new-arrival-gallery-link"

                to={`/product/${encodeURIComponent(id)}`}

                aria-label={`View ${productName}`}

                style={{

                    display: "block",

                    width: "100%",

                    height: "100%",

                    overflow: "hidden",

                }}

            >

                {slides.length > 0 ? (

                    <div

                        className="new-arrival-gallery-track"

                        style={{

                            display: "flex",

                            width: "100%",

                            height: "100%",

                            transform: `translateX(-${activeIndex * 100}%)`,

                            transition: transitionEnabled

                                ? `transform ${GALLERY_TRANSITION_DURATION}ms cubic-bezier(0.22, 0.61, 0.36, 1)`

                                : "none",

                            willChange:

                                galleryImages.length > 1

                                    ? "transform"

                                    : "auto",

                        }}

                    >

                        {slides.map((src, index) => (

                            <img

                                className="new-arrival-gallery-image"

                                key={`${src}-${index}`}

                                src={src}

                                alt={productName}

                                loading={index === 0 ? "eager" : "lazy"}

                                draggable={false}

                                style={{

                                    display: "block",

                                    width: "100%",

                                    height: "100%",

                                    flex: "0 0 100%",

                                    minWidth: 0,

                                    objectFit: "cover",

                                }}

                            />

                        ))}

                    </div>

                ) : (

                    <div className="new-arrival-image-placeholder">

                        GEEKA

                    </div>

                )}

            </Link>



            {/* IMAGE LABEL AND WISHLIST */}



            <div className="new-arrival-image-top">

                <span className="new-arrival-label">NEW</span>



                <button

                    type="button"

                    className="new-arrival-heart"

                    onClick={(event) => {

                        event.preventDefault();

                        event.stopPropagation();

                        onToggleWishlist();

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

            </div>

        </div>

    );

}



/* =========================================================

   NEW ARRIVALS

========================================================= */



export default function NewArrivals() {

    const navigate = useNavigate();

    const { addItem } = useCart();



    const toastTimerRef = useRef(null);



    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [toast, setToast] = useState("");

    const { wishlist, toggleWishlist: updateWishlist } = useWishlist();



    /* =====================================================

       LOAD PRODUCTS

    ===================================================== */



    const loadPage = async () => {

        setLoading(true);

        setError("");



        try {

            const response = await getProductsPage();



            const results = Array.isArray(response?.results)

                ? response.results

                : [];



            const firstProducts = results.slice(

                0,

                PRODUCTS_PER_PAGE

            );



            const cards = await getProductCards(firstProducts);



            setProducts(Array.isArray(cards) ? cards : []);

        } catch (requestError) {

            setError(

                requestError?.message ||

                "Unable to load the latest products from Geeka."

            );



            setProducts([]);

        } finally {

            setLoading(false);

        }

    };



    /* =====================================================

       INITIAL LOAD

    ===================================================== */



    useEffect(() => {

        loadPage();



        return () => {

            if (toastTimerRef.current) {

                clearTimeout(toastTimerRef.current);

            }

        };

    }, []);



    /* =====================================================

       WISHLIST

    ===================================================== */



    const toggleWishlist = async (id) => {
        if (!id) return;

        const wasWishlisted = wishlist.includes(String(id));

        try {
            await updateWishlist(id);
            showToast(wasWishlisted ? "REMOVED FROM WISHLIST" : "ADDED TO WISHLIST");
        } catch (requestError) {
            showToast(
                requestError?.message ||
                "Unable to update your wishlist. Please try again."
            );
        }
    };



    /* =====================================================

       TOAST

    ===================================================== */



    const showToast = (message) => {

        setToast(message);



        if (toastTimerRef.current) {

            clearTimeout(toastTimerRef.current);

        }



        toastTimerRef.current = setTimeout(

            () => setToast(""),

            2600

        );

    };



    /* =====================================================

       ADD TO CART

    ===================================================== */



    const addToCart = async (product) => {

        const variant = getDefaultPurchasableVariant(

            product?.detail

        );



        if (

            !variant?.id ||

            variant?.is_active !== true ||

            variant?.in_stock !== true ||

            Number(variant?.stock) < 1

        ) {

            navigate(

                `/product/${encodeURIComponent(productId(product))}`

            );



            return;

        }



        try {

            await addItem(product, variant, 1);

            showToast("ITEM ADDED TO BAG");

        } catch (requestError) {

            showToast(

                requestError?.message ||

                "Unable to add this item to bag."

            );

        }

    };



    /* =====================================================

       ERROR STATE

    ===================================================== */



    if (error) {

        return (

            <section className="new-arrivals-section">

                <div className="new-arrivals-header">

                    <div className="new-arrivals-heading">

                        <span className="new-arrivals-eyebrow">

                            LATEST EDIT

                        </span>



                        <h2>New Arrivals</h2>

                        <p>{error}</p>

                    </div>

                </div>



                <div className="new-arrivals-empty">

                    <p>

                        We could not load the latest products right now.

                    </p>



                    <button

                        type="button"

                        onClick={loadPage}

                    >

                        TRY AGAIN <ArrowIcon />

                    </button>

                </div>

            </section>

        );

    }



    /* =====================================================

       MAIN UI

    ===================================================== */



    return (

        <section className="new-arrivals-section">

            <div className="new-arrivals-header">

                <div className="new-arrivals-heading">

                    <span className="new-arrivals-eyebrow">

                        LATEST EDIT

                    </span>



                    <h2>New Arrivals</h2>



                    <p>

                        Freshly published pieces from the Geeka catalogue,

                        displayed in the order supplied by the store backend.

                    </p>

                </div>

            </div>



            {/* LOADING */}



            {loading ? (

                <div className="new-arrivals-loading-grid">

                    {Array.from({

                        length: PRODUCTS_PER_PAGE,

                    }).map((_, index) => (

                        <div

                            className="new-arrivals-loading"

                            key={index}

                        >

                            <div className="new-arrivals-loading-line" />

                        </div>

                    ))}

                </div>

            ) : products.length === 0 ? (

                /* EMPTY */



                <div className="new-arrivals-empty">

                    <p>

                        No published products are available yet.

                    </p>



                    <Link

                        className="new-arrivals-empty-link"

                        to="/shop"

                    >

                        OPEN SHOP <ArrowIcon />

                    </Link>

                </div>

            ) : (

                <>

                    {/* PRODUCT GRID */}



                    <div className="new-arrivals-grid">

                        {products.map((product) => {

                            const id = productId(product);



                            const category =

                                product?.categoryName ||

                                product?.category?.name ||

                                "COLLECTION";



                            const wishlisted = wishlist.includes(id);

                            const price = product?.price;

                            const currency = product?.currency || "INR";

                            const detail = product?.detail;



                            const purchasable =

                                detail?.is_purchasable === true;



                            const hasStock =

                                Array.isArray(detail?.variants) &&

                                detail.variants.some(

                                    (variant) =>

                                        variant?.is_active === true &&

                                        variant?.in_stock === true &&

                                        Number(variant?.stock) > 0

                                );



                            return (

                                <article

                                    className="new-arrival-card"

                                    key={id}

                                >

                                    {/* PRODUCT IMAGE WITH HOVER SLIDESHOW */}



                                    <NewArrivalProductImage

                                        product={product}

                                        id={id}

                                        wishlisted={wishlisted}

                                        onToggleWishlist={() =>

                                            toggleWishlist(id)

                                        }

                                    />



                                    {/* PRODUCT DETAILS */}



                                    <div className="new-arrival-details">

                                        <div className="new-arrival-meta">

                                            <span>{category}</span>



                                            {(!purchasable || !hasStock) && (

                                                <span className="new-arrival-sold">

                                                    SOLD OUT

                                                </span>

                                            )}

                                        </div>



                                        <h3>

                                            <Link

                                                to={`/product/${encodeURIComponent(id)}`}

                                            >

                                                {product.name}

                                            </Link>

                                        </h3>



                                        <div className="new-arrival-bottom">

                                            <div className="new-arrival-price">

                                                <strong>

                                                    {price === null ||

                                                        price === undefined

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

                                                disabled={!detail}

                                                onClick={() =>

                                                    addToCart(product)

                                                }

                                            >

                                                {purchasable && hasStock

                                                    ? "ADD TO BAG"

                                                    : "VIEW PRODUCT"}



                                                {purchasable && hasStock && (

                                                    <PlusIcon />

                                                )}

                                            </button>

                                        </div>

                                    </div>

                                </article>

                            );

                        })}

                    </div>



                    {/* VIEW ALL */}



                    <div className="new-arrivals-footer">

                        <Link

                            className="new-arrivals-footer-button"

                            to="/shop"

                        >

                            VIEW ALL NEW ARRIVALS <ArrowIcon />

                        </Link>

                    </div>



                    {/* CART NOTIFICATION */}



                    {toast && (

                        <div

                            className="new-arrival-toast"

                            role="status"

                        >

                            {toast}

                        </div>

                    )}

                </>

            )}

        </section>

    );

}