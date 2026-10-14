import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import { Link } from "react-router-dom";

import Header from "./Header";

import topBanner from "../assets/top-banner-3.jpg";

import "../style/Cart.css";

import { useCart } from "../hooks/useCart";

import {
    getProducts,
    getProductById,
    getProductCards,
    getDefaultPurchasableVariant,
} from "../services/productService";


/*
|--------------------------------------------------------------------------
| GEEKA CART
|--------------------------------------------------------------------------
| Cart data now comes from the Django backend.
|
| The cart store provides:
|
| - cartItems
| - cartCount
| - subtotal
| - shipping
| - total
| - addItem
| - updateQuantity
| - removeItem
| - clearCart
|
| Product catalog data is used only for additional display information
| such as product images/category because the documented cart response
| does not include those fields.
|--------------------------------------------------------------------------
*/


function Cart() {
    const {
        cartItems,
        updateQuantity,
        removeItem,
        subtotal,
        cartCount,
        shipping,
        total,
        addItem,
        loading,
        error: cartError,
        initialized,
    } = useCart();


    /*
    |--------------------------------------------------------------------------
    | PRODUCT DETAILS FOR CART DISPLAY
    |--------------------------------------------------------------------------
    | The backend cart gives us product_id but does not provide the product
    | image in the documented response.
    |
    | Therefore we fetch the corresponding public product details only
    | for display purposes.
    |--------------------------------------------------------------------------
    */

    const [cartProductDetails, setCartProductDetails] =
        useState({});


    /*
    |--------------------------------------------------------------------------
    | RECOMMENDATIONS
    |--------------------------------------------------------------------------
    */

    const [products, setProducts] =
        useState([]);

    const [
        recommendationProducts,
        setRecommendationProducts,
    ] = useState([]);

    const [recommendationsLoading, setRecommendationsLoading] =
        useState(false);

    const [quickAddingId, setQuickAddingId] =
        useState("");

    const [actionError, setActionError] =
        useState("");


    /*
    |--------------------------------------------------------------------------
    | LOAD PRODUCT DETAILS FOR CART ITEMS
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        let active = true;

        async function loadCartProductDetails() {
            if (!cartItems.length) {
                if (active) {
                    setCartProductDetails({});
                }

                return;
            }

            const uniqueProductIds = [
                ...new Set(
                    cartItems
                        .map((item) =>
                            String(
                                item?.product_id || ""
                            ).trim()
                        )
                        .filter(Boolean)
                ),
            ];

            if (!uniqueProductIds.length) {
                if (active) {
                    setCartProductDetails({});
                }

                return;
            }

            const entries = await Promise.all(
                uniqueProductIds.map(
                    async (productId) => {
                        try {
                            const product =
                                await getProductById(
                                    productId
                                );

                            return [
                                productId,
                                product,
                            ];
                        } catch {
                            return [
                                productId,
                                null,
                            ];
                        }
                    }
                )
            );

            if (active) {
                setCartProductDetails(
                    Object.fromEntries(
                        entries
                    )
                );
            }
        }

        loadCartProductDetails();

        return () => {
            active = false;
        };
    }, [cartItems]);


    /*
    |--------------------------------------------------------------------------
    | LOAD RECOMMENDATIONS
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        let active = true;

        async function loadRecommendations() {
            setRecommendationsLoading(true);

            try {
                const catalogProducts =
                    await getProducts();

                if (!active) {
                    return;
                }

                const items = Array.isArray(
                    catalogProducts
                )
                    ? catalogProducts
                    : [];

                setProducts(items);

                const cartProductIds =
                    new Set(
                        cartItems.map(
                            (item) =>
                                String(
                                    item?.product_id ||
                                    ""
                                )
                        )
                    );

                const candidates =
                    items
                        .filter(
                            (product) =>
                                product?.id &&
                                !cartProductIds.has(
                                    String(
                                        product.id
                                    )
                                )
                        )
                        .slice(0, 5);

                if (!candidates.length) {
                    if (active) {
                        setRecommendationProducts(
                            []
                        );
                    }

                    return;
                }

                const cards =
                    await getProductCards(
                        candidates
                    );

                if (active) {
                    setRecommendationProducts(
                        cards
                            .filter(
                                (product) =>
                                    product?.id &&
                                    product?.isPurchasable !== false
                            )
                            .slice(0, 5)
                    );
                }
            } catch {
                if (active) {
                    setProducts([]);

                    setRecommendationProducts(
                        []
                    );
                }
            } finally {
                if (active) {
                    setRecommendationsLoading(
                        false
                    );
                }
            }
        }

        if (initialized) {
            loadRecommendations();
        }

        return () => {
            active = false;
        };
    }, [cartItems, initialized]);


    /*
    |--------------------------------------------------------------------------
    | CART DISPLAY DATA
    |--------------------------------------------------------------------------
    */

    const displayCartItems = useMemo(() => {
        return cartItems.map((item) => {
            const product =
                cartProductDetails[
                String(
                    item?.product_id || ""
                )
                ] || null;

            const primaryImage =
                product?.images?.find(
                    (image) =>
                        image?.is_primary
                ) ||
                product?.images?.[0] ||
                null;

            const variant =
                product?.variants?.find(
                    (candidate) =>
                        String(
                            candidate?.id
                        ) ===
                        String(
                            item?.variant_id
                        )
                ) || null;

            return {
                ...item,

                displayName:
                    item?.product_name ||
                    product?.name ||
                    item?.name ||
                    "Product",

                displayCategory:
                    product?.category?.name ||
                    product?.categoryName ||
                    item?.category ||
                    "",

                displayImage:
                    primaryImage?.image_url ||
                    "",

                variant,

                variantAttributes:
                    Array.isArray(
                        variant?.attributes
                    )
                        ? variant.attributes
                        : [],
            };
        });
    }, [
        cartItems,
        cartProductDetails,
    ]);


    /*
    |--------------------------------------------------------------------------
    | VARIANT ATTRIBUTE HELPERS
    |--------------------------------------------------------------------------
    */

    function getVariantAttribute(
        attributes,
        name
    ) {
        const target =
            String(name)
                .trim()
                .toLowerCase();

        const match =
            attributes.find(
                (attribute) =>
                    String(
                        attribute?.attribute ||
                        ""
                    )
                        .trim()
                        .toLowerCase() ===
                    target
            );

        return match?.value || "";
    }


    /*
    |--------------------------------------------------------------------------
    | QUANTITY HANDLERS
    |--------------------------------------------------------------------------
    */

    async function handleQuantityChange(
        item,
        change
    ) {
        setActionError("");

        try {
            await updateQuantity(
                item.id,
                change
            );
        } catch (requestError) {
            setActionError(
                requestError?.message ||
                "Unable to update the cart quantity."
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | REMOVE HANDLER
    |--------------------------------------------------------------------------
    */

    async function handleRemove(
        itemId
    ) {
        setActionError("");

        try {
            await removeItem(
                itemId
            );
        } catch (requestError) {
            setActionError(
                requestError?.message ||
                "Unable to remove this item."
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | QUICK ADD RECOMMENDATION
    |--------------------------------------------------------------------------
    */

    async function handleQuickAdd(
        event,
        product
    ) {
        event.preventDefault();

        event.stopPropagation();

        setActionError("");

        if (!product?.id) {
            return;
        }

        const detail =
            product?.detail;

        const variant =
            getDefaultPurchasableVariant(
                detail
            );

        if (!variant?.id) {
            setActionError(
                "This product does not currently have an available variant."
            );

            return;
        }

        setQuickAddingId(
            String(product.id)
        );

        try {
            await addItem(
                product,
                variant,
                1
            );
        } catch (requestError) {
            setActionError(
                requestError?.message ||
                "Unable to add this product to your cart."
            );
        } finally {
            setQuickAddingId("");
        }
    }


    /*
    |--------------------------------------------------------------------------
    | FORMAT PRICE
    |--------------------------------------------------------------------------
    */

    function formatPrice(value) {
        const number =
            Number(value);

        if (!Number.isFinite(number)) {
            return "0";
        }

        return number.toLocaleString(
            "en-IN"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | LOADING STATE
    |--------------------------------------------------------------------------
    */

    if (
        !initialized &&
        loading
    ) {
        return (
            <div className="cart-page">
                <Header />

                <main className="cart-main">

                    <section className="empty-cart">

                        <span className="empty-eyebrow">
                            LOADING YOUR BAG
                        </span>

                        <h2>
                            Preparing your cart.
                        </h2>

                        <p>
                            Please wait while we load your
                            latest cart items.
                        </p>

                    </section>

                </main>
            </div>
        );
    }


    /*
    |--------------------------------------------------------------------------
    | MAIN UI
    |--------------------------------------------------------------------------
    */

    return (
        <div className="cart-page">

            {/* =====================================================
                HEADER
               ===================================================== */}

            <Header />


            {/* =====================================================
                CART HERO
               ===================================================== */}

            <section className="cart-hero">

                <img
                    src={topBanner}
                    alt="Geeka handmade collection"
                    className="cart-hero-image"
                />

                <div className="cart-hero-overlay"></div>

                <div className="cart-hero-content">

                    <span className="cart-eyebrow">
                        YOUR SHOPPING BAG
                    </span>

                    <h1>
                        Your Cart
                    </h1>

                    <p>
                        Good things take time — and so does
                        your perfect find.
                    </p>

                </div>

            </section>


            {/* =====================================================
                MAIN CART CONTENT
               ===================================================== */}

            <main className="cart-main">

                {(cartError ||
                    actionError) && (
                        <div
                            className="cart-error"
                            role="alert"
                        >
                            {actionError ||
                                cartError}
                        </div>
                    )}


                {cartItems.length > 0 ? (
                    <>

                        <div className="cart-layout">

                            {/* =================================================
                                CART PRODUCTS
                               ================================================= */}

                            <section className="cart-products-card">

                                <div className="cart-table-heading">

                                    <span>
                                        PRODUCT
                                    </span>

                                    <span>
                                        PRICE
                                    </span>

                                    <span>
                                        QUANTITY
                                    </span>

                                    <span>
                                        TOTAL
                                    </span>

                                </div>


                                <div className="cart-items">

                                    {displayCartItems.map(
                                        (item) => {

                                            const color =
                                                getVariantAttribute(
                                                    item.variantAttributes,
                                                    "color"
                                                );

                                            const size =
                                                getVariantAttribute(
                                                    item.variantAttributes,
                                                    "size"
                                                );

                                            const currentItemLoading =
                                                loading;


                                            return (
                                                <article
                                                    className="cart-item"
                                                    key={
                                                        item.id
                                                    }
                                                >

                                                    <div className="cart-product-info">

                                                        <div className="cart-product-image">

                                                            {item.displayImage ? (
                                                                <img
                                                                    src={
                                                                        item.displayImage
                                                                    }
                                                                    alt={
                                                                        item.displayName
                                                                    }
                                                                    loading="lazy"
                                                                />
                                                            ) : (
                                                                <div className="empty-image-placeholder">
                                                                    <span>
                                                                        IMAGE
                                                                    </span>
                                                                </div>
                                                            )}

                                                        </div>


                                                        <div className="cart-product-details">

                                                            <h2>
                                                                {
                                                                    item.displayName
                                                                }
                                                            </h2>

                                                            {item.displayCategory && (
                                                                <span className="cart-product-category">
                                                                    {
                                                                        item.displayCategory
                                                                    }
                                                                </span>
                                                            )}


                                                            {color && (
                                                                <span className="cart-product-color">
                                                                    Color:{" "}
                                                                    {color}
                                                                </span>
                                                            )}


                                                            {size && (
                                                                <span className="cart-product-color">
                                                                    Size:{" "}
                                                                    {size}
                                                                </span>
                                                            )}


                                                            {item.sku && (
                                                                <span className="cart-product-color">
                                                                    SKU:{" "}
                                                                    {item.sku}
                                                                </span>
                                                            )}


                                                            {!item.is_purchasable && (
                                                                <span
                                                                    className="cart-product-color"
                                                                    style={{
                                                                        color:
                                                                            "#a05f55",
                                                                    }}
                                                                >
                                                                    Currently unavailable
                                                                </span>
                                                            )}


                                                            {item.is_purchasable &&
                                                                item.stock >
                                                                0 &&
                                                                item.quantity >=
                                                                item.stock && (
                                                                    <span
                                                                        className="cart-product-color"
                                                                        style={{
                                                                            color:
                                                                                "#a05f55",
                                                                        }}
                                                                    >
                                                                        Maximum available quantity reached
                                                                    </span>
                                                                )}


                                                            <button
                                                                type="button"
                                                                className="remove-product"
                                                                onClick={() =>
                                                                    handleRemove(
                                                                        item.id
                                                                    )
                                                                }
                                                                disabled={
                                                                    currentItemLoading
                                                                }
                                                            >
                                                                Remove
                                                            </button>

                                                        </div>

                                                    </div>


                                                    <div className="cart-price">

                                                        ₹
                                                        {formatPrice(
                                                            item.price
                                                        )}

                                                    </div>


                                                    <div className="quantity-control">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleQuantityChange(
                                                                    item,
                                                                    -1
                                                                )
                                                            }
                                                            disabled={
                                                                currentItemLoading ||
                                                                item.quantity <=
                                                                1
                                                            }
                                                            aria-label="Decrease quantity"
                                                        >
                                                            −
                                                        </button>

                                                        <span>
                                                            {
                                                                item.quantity
                                                            }
                                                        </span>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleQuantityChange(
                                                                    item,
                                                                    1
                                                                )
                                                            }
                                                            disabled={
                                                                currentItemLoading ||
                                                                !item.is_purchasable ||
                                                                (
                                                                    item.stock >
                                                                    0 &&
                                                                    item.quantity >=
                                                                    item.stock
                                                                )
                                                            }
                                                            aria-label="Increase quantity"
                                                        >
                                                            +
                                                        </button>

                                                    </div>


                                                    <div className="cart-item-total">

                                                        ₹
                                                        {formatPrice(
                                                            item.price *
                                                            item.quantity
                                                        )}

                                                    </div>

                                                </article>
                                            );
                                        }
                                    )}

                                </div>


                                <div className="continue-shopping-wrapper">

                                    <Link
                                        to="/shop"
                                        className="continue-shopping"
                                    >
                                        <span>
                                            ←
                                        </span>

                                        Continue Shopping

                                    </Link>

                                </div>

                            </section>


                            {/* =================================================
                                ORDER SUMMARY
                               ================================================= */}

                            <aside className="order-summary">

                                <h2>
                                    Order Summary
                                </h2>


                                <div className="summary-row">

                                    <span>
                                        Subtotal (
                                        {
                                            cartCount
                                        }{" "}
                                        {cartCount === 1
                                            ? "item"
                                            : "items"}
                                        )
                                    </span>

                                    <strong>
                                        ₹
                                        {formatPrice(
                                            subtotal
                                        )}
                                    </strong>

                                </div>


                                <div className="summary-row">

                                    <span>
                                        Shipping
                                    </span>

                                    <strong>
                                        {shipping === 0
                                            ? "Free"
                                            : `₹${formatPrice(
                                                shipping
                                            )}`}
                                    </strong>

                                </div>


                                <div className="summary-divider"></div>


                                <div className="summary-total">

                                    <span>
                                        Total
                                    </span>

                                    <strong>
                                        ₹
                                        {formatPrice(
                                            total
                                        )}
                                    </strong>

                                </div>


                                <Link
                                    to="/checkout"
                                    className="checkout-button"
                                    aria-label="Proceed to checkout"
                                >
                                    Proceed to Checkout

                                    <span>
                                        →
                                    </span>

                                </Link>


                                <div className="secure-checkout">
                                    Secure and Encrypted Checkout
                                </div>


                                <div className="artisan-message">

                                    <div className="artisan-icon">
                                        <span>
                                            +
                                        </span>
                                    </div>

                                    <p>
                                        Every purchase supports{" "}
                                        <strong>
                                            handmade artisans
                                        </strong>{" "}
                                        and sustainable fashion.
                                    </p>

                                </div>

                            </aside>

                        </div>


                        {/* =================================================
                            RECOMMENDATIONS
                           ================================================= */}

                        <section className="recommendations">

                            <div className="recommendation-heading">

                                <div>

                                    <h2>
                                        You may also like
                                    </h2>

                                    <p>
                                        Complete your style with
                                        more handcrafted pieces.
                                    </p>

                                </div>


                                <Link to="/shop">

                                    View All

                                    <span>
                                        →
                                    </span>

                                </Link>

                            </div>


                            <div className="recommendation-grid">

                                {recommendationsLoading ? (
                                    <div className="recommendations-loading">
                                        Loading recommendations...
                                    </div>
                                ) : recommendationProducts.length > 0 ? (
                                    recommendationProducts.map(
                                        (product) => {

                                            const displayPrice =
                                                product?.price;

                                            return (
                                                <Link
                                                    to="/shop"
                                                    className="recommended-product"
                                                    key={
                                                        product.id
                                                    }
                                                >

                                                    <div className="recommended-image">

                                                        {product.displayImage ? (
                                                            <img
                                                                src={
                                                                    product.displayImage
                                                                }
                                                                alt={
                                                                    product.name
                                                                }
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <div className="empty-image-placeholder">
                                                                <span>
                                                                    IMAGE
                                                                </span>
                                                            </div>
                                                        )}


                                                        <button
                                                            type="button"
                                                            className="quick-add"
                                                            onClick={(
                                                                event
                                                            ) =>
                                                                handleQuickAdd(
                                                                    event,
                                                                    product
                                                                )
                                                            }
                                                            disabled={
                                                                quickAddingId ===
                                                                String(
                                                                    product.id
                                                                )
                                                            }
                                                            aria-label={`Add ${product.name} to cart`}
                                                        >
                                                            {quickAddingId ===
                                                                String(
                                                                    product.id
                                                                )
                                                                ? "..."
                                                                : "+"}
                                                        </button>

                                                    </div>


                                                    <div className="recommended-info">

                                                        <h3>
                                                            {
                                                                product.name
                                                            }
                                                        </h3>

                                                        <span>
                                                            {displayPrice !==
                                                                null &&
                                                                displayPrice !==
                                                                undefined
                                                                ? `₹${formatPrice(
                                                                    displayPrice
                                                                )}`
                                                                : "View product"}
                                                        </span>

                                                    </div>

                                                </Link>
                                            );
                                        }
                                    )
                                ) : (
                                    <div className="recommendations-loading">
                                        No recommendations available right now.
                                    </div>
                                )}

                            </div>

                        </section>

                    </>
                ) : (

                    /* =====================================================
                       EMPTY CART
                       ===================================================== */

                    <section className="empty-cart">

                        <div className="empty-cart-icon">
                            ♡
                        </div>

                        <span className="empty-eyebrow">
                            NOTHING HERE YET
                        </span>

                        <h2>
                            Your bag is waiting.
                        </h2>

                        <p>
                            Explore our ethnic wear, jewellery
                            and handmade collections and find
                            something uniquely yours.
                        </p>

                        <Link
                            to="/shop"
                            className="empty-cart-button"
                        >
                            EXPLORE COLLECTIONS

                            <span>
                                →
                            </span>
                        </Link>

                    </section>

                )}

            </main>

        </div>
    );
}

export default Cart;