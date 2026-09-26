import { Link } from "react-router-dom";
import "../style/Cart.css";

function BagIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 8h14l-1 13H6L5 8Z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
    );
}

export default function Cart() {
    return (
        <main className="cart-page">

            {/* ================================
                HEADER
            ================================= */}

            <section className="cart-header">

                <span className="cart-eyebrow">
                    YOUR SHOPPING BAG
                </span>

                <h1>
                    Your Cart
                </h1>

                <p>
                    Your thoughtfully chosen pieces will appear here.
                </p>

            </section>


            {/* ================================
                EMPTY CART
            ================================= */}

            <section className="cart-empty">

                <div className="cart-empty-icon">
                    <BagIcon />
                </div>

                <span className="cart-empty-small">
                    NOTHING HERE YET
                </span>

                <h2>
                    Your bag is waiting.
                </h2>

                <p>
                    Explore our ethnic wear, jewellery and handmade
                    collections and find something uniquely yours.
                </p>

                <Link
                    to="/shop"
                    className="cart-shop-button"
                >
                    <span>EXPLORE COLLECTIONS</span>
                    <strong>→</strong>
                </Link>

            </section>

        </main>
    );
}