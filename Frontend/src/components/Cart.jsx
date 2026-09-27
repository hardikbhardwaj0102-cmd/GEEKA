import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import topBanner from "../assets/top-banner-3.jpg";
import "../style/Cart.css";
import { useCart } from "../hooks/useCart";
import { getProducts } from "../services/productService";

function Cart() {
    const {
        cartItems,
        updateQuantity,
        removeItem,
        subtotal,
        totalItems,
        shipping,
        total,
        addItem,
    } = useCart();

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

    const recommendedProducts = useMemo(() => {
        const cartIds = new Set(
            cartItems.map((item) => String(item.id))
        );

        return products
            .filter((product) =>
                !cartIds.has(String(product.id)) &&
                product.inStock !== false
            )
            .sort(
                (a, b) => Number(b.featured) - Number(a.featured)
            )
            .slice(0, 5);
    }, [products, cartItems]);

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
                        Good things take time — and so does your perfect find.
                    </p>

                </div>

            </section>


            {/* =====================================================
                MAIN CART CONTENT
               ===================================================== */}

            <main className="cart-main">

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

                                    {cartItems.map((item) => (

                                        <article
                                            className="cart-item"
                                            key={item.id}
                                        >

                                            <div className="cart-product-info">

                                                <div className="cart-product-image">

                                                    <div className="empty-image-placeholder">

                                                        <span>
                                                            IMAGE
                                                        </span>

                                                    </div>

                                                </div>


                                                <div className="cart-product-details">

                                                    <h2>
                                                        {item.name}
                                                    </h2>

                                                    <span className="cart-product-category">
                                                        {item.category}
                                                    </span>

                                                    {item.color && (
                                                        <span className="cart-product-color">
                                                            {item.color}
                                                        </span>
                                                    )}

                                                    <button
                                                        type="button"
                                                        className="remove-product"
                                                        onClick={() =>
                                                            removeItem(item.id)
                                                        }
                                                    >

                                                        <span className="remove-icon">
                                                            ♧
                                                        </span>

                                                        Remove

                                                    </button>

                                                </div>

                                            </div>


                                            <div className="cart-price">

                                                ₹
                                                {item.price.toLocaleString(
                                                    "en-IN"
                                                )}

                                            </div>


                                            <div className="quantity-control">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.id,
                                                            -1
                                                        )
                                                    }
                                                    aria-label="Decrease quantity"
                                                >
                                                    −
                                                </button>

                                                <span>
                                                    {item.quantity}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.id,
                                                            1
                                                        )
                                                    }
                                                    aria-label="Increase quantity"
                                                >
                                                    +
                                                </button>

                                            </div>


                                            <div className="cart-item-total">

                                                ₹
                                                {(
                                                    item.price *
                                                    item.quantity
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}

                                            </div>

                                        </article>

                                    ))}

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
                                        Subtotal ({totalItems}{" "}
                                        {totalItems === 1
                                            ? "item"
                                            : "items"})
                                    </span>

                                    <strong>
                                        ₹
                                        {subtotal.toLocaleString(
                                            "en-IN"
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
                                            : `₹${shipping}`}
                                    </strong>

                                </div>


                                <div className="summary-divider"></div>


                                <div className="summary-total">

                                    <span>
                                        Total
                                    </span>

                                    <strong>
                                        ₹
                                        {total.toLocaleString(
                                            "en-IN"
                                        )}
                                    </strong>

                                </div>


                                <button
                                    type="button"
                                    className="checkout-button"
                                >

                                    Proceed to Checkout

                                    <span>
                                        →
                                    </span>

                                </button>


                                <div className="secure-checkout">

                                    <span className="lock-icon">
                                        ♢
                                    </span>

                                    Secure and Encrypted Checkout

                                </div>


                                <div className="artisan-message">

                                    <div className="artisan-icon">

                                        <span>
                                            ❧
                                        </span>

                                    </div>

                                    <p>

                                        Every purchase supports

                                        <strong>
                                            handmade artisans
                                        </strong>

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
                                        Complete your style with more handcrafted pieces.
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

                                {recommendedProducts.map((product) => (

                                    <Link
                                        to="/shop"
                                        className="recommended-product"
                                        key={product.id}
                                    >

                                        <div className="recommended-image">

                                            <div className="empty-image-placeholder">

                                                <span>
                                                    IMAGE
                                                </span>

                                            </div>


                                            <button
                                                type="button"
                                                className="quick-add"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    addItem(product);
                                                }}
                                                aria-label={`Add ${product.name} to cart`}
                                            >
                                                +
                                            </button>

                                        </div>


                                        <div className="recommended-info">

                                            <h3>
                                                {product.name}
                                            </h3>

                                            <span>
                                                ₹
                                                {Number(product.price).toLocaleString(
                                                    "en-IN"
                                                )}
                                            </span>

                                        </div>

                                    </Link>

                                ))}

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
