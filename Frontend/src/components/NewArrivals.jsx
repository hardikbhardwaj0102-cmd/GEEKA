import "../style/NewArrivals.css";

import ethnicImage from "../assets/Ethical.png";
import jewelleryImage from "../assets/jwel.png";
import creativeImage from "../assets/hand.png";

const products = [
    {
        id: 1,
        name: "Pearl Drop Earrings",
        category: "Jewellery",
        price: "₹799",
        image: jewelleryImage,
        isNew: true,
    },
    {
        id: 2,
        name: "Floral Ethnic Set",
        category: "Ethnic Wear",
        price: "₹1,499",
        image: ethnicImage,
        isNew: true,
    },
    {
        id: 3,
        name: "Handmade Crochet Bag",
        category: "Creative",
        price: "₹1,199",
        image: creativeImage,
        isNew: true,
    },
    {
        id: 4,
        name: "Classic Kurti Set",
        category: "Ethnic Wear",
        price: "₹1,699",
        image: ethnicImage,
        isNew: false,
    },
];

export default function NewArrivals() {
    return (
        <section className="new-arrivals-section" id="new-arrivals">

            <div className="new-arrivals-top">

                <div className="new-arrivals-title">

                    <span>JUST IN</span>

                    <h2>
                        New Arrivals
                    </h2>

                    <p>
                        The latest pieces added to the GEEKA collection.
                    </p>

                </div>

                <button
                    type="button"
                    className="new-arrivals-view-all"
                >
                    VIEW ALL
                    <span>→</span>
                </button>

            </div>


            <div className="products-wrapper">

                <div className="products-track">

                    {products.map((product) => (
                        <article
                            className="new-product-card"
                            key={product.id}
                        >

                            <div className="new-product-image">

                                <img
                                    src={product.image}
                                    alt={product.name}
                                />

                                {product.isNew && (
                                    <span className="new-product-badge">
                                        NEW
                                    </span>
                                )}

                                <button
                                    type="button"
                                    className="new-product-heart"
                                    aria-label={`Add ${product.name} to wishlist`}
                                >
                                    ♡
                                </button>

                                <div className="new-product-quick-view">
                                    QUICK VIEW
                                </div>

                            </div>


                            <div className="new-product-details">

                                <span className="new-product-category">
                                    {product.category}
                                </span>

                                <h3>
                                    {product.name}
                                </h3>

                                <div className="new-product-bottom">

                                    <span className="new-product-price">
                                        {product.price}
                                    </span>

                                    <button
                                        type="button"
                                        className="new-product-shop"
                                    >
                                        SHOP
                                        <span>→</span>
                                    </button>

                                </div>

                            </div>

                        </article>
                    ))}

                </div>

            </div>


            <div className="new-arrivals-navigation">

                <button
                    type="button"
                    aria-label="Previous products"
                >
                    ←
                </button>

                <div className="new-arrivals-progress">
                    <span className="active" />
                    <span />
                    <span />
                </div>

                <button
                    type="button"
                    aria-label="Next products"
                >
                    →
                </button>

            </div>

        </section>
    );
}