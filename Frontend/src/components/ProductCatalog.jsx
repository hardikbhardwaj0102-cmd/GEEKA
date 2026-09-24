import { useMemo, useState } from "react";
import "../style/ProductCatalog.css";

import ethnicImage from "../assets/Ethical.png";
import jewelleryImage from "../assets/jwel.png";
import creativeImage from "../assets/Ethical.png";


/* =========================================================
   TEMPORARY PREVIEW DATA
   ---------------------------------------------------------
   Used only while the backend is not connected.
   Real `products` automatically replace this data.
========================================================= */

const demoProducts = [
    {
        id: "demo-1",
        name: "Meera Embroidered Kurta Set",
        category: "ETHNIC WEAR",
        price: 1899,
        image: ethnicImage,
        badge: "NEW",
    },
    {
        id: "demo-2",
        name: "Lotus Pearl Drop Earrings",
        category: "JEWELLERY",
        price: 799,
        image: jewelleryImage,
        badge: "NEW",
    },
    {
        id: "demo-3",
        name: "Handwoven Crochet Tote",
        category: "CREATIVE",
        price: 1299,
        image: creativeImage,
    },
    {
        id: "demo-4",
        name: "Riya Printed Anarkali",
        category: "ETHNIC WEAR",
        price: 2199,
        image: ethnicImage,
    },
    {
        id: "demo-5",
        name: "Aarohi Layered Necklace",
        category: "JEWELLERY",
        price: 999,
        image: jewelleryImage,
        badge: "LIMITED",
    },
    {
        id: "demo-6",
        name: "Petal Crochet Mini Bag",
        category: "CREATIVE",
        price: 1099,
        image: creativeImage,
    },
    {
        id: "demo-7",
        name: "Anaya Co-ord Set",
        category: "ETHNIC WEAR",
        price: 2399,
        image: ethnicImage,
    },
    {
        id: "demo-8",
        name: "Maya Floral Earrings",
        category: "JEWELLERY",
        price: 649,
        image: jewelleryImage,
    },
];


export default function ProductCatalog({
    products = [],
}) {
    const [activeCategory, setActiveCategory] = useState("ALL");

    /* =====================================================
       USE REAL PRODUCTS WHEN AVAILABLE
    ===================================================== */

    const displayProducts =
        Array.isArray(products) && products.length > 0
            ? products
            : demoProducts;


    /* =====================================================
       BUILD CATEGORY FILTER
    ===================================================== */

    const categories = useMemo(() => {
        const uniqueCategories = new Set();

        displayProducts.forEach((product) => {
            if (product?.category) {
                uniqueCategories.add(
                    String(product.category).toUpperCase()
                );
            }
        });

        return [
            "ALL",
            ...Array.from(uniqueCategories),
        ];
    }, [displayProducts]);


    /* =====================================================
       FILTER PRODUCTS
    ===================================================== */

    const filteredProducts = useMemo(() => {
        if (activeCategory === "ALL") {
            return displayProducts;
        }

        return displayProducts.filter(
            (product) =>
                String(product?.category || "")
                    .toUpperCase() === activeCategory
        );
    }, [
        displayProducts,
        activeCategory,
    ]);


    /* =====================================================
       PRICE FORMAT
    ===================================================== */

    const formatPrice = (price) => {
        if (
            price === null ||
            price === undefined ||
            price === ""
        ) {
            return "";
        }

        if (
            typeof price === "number" ||
            !Number.isNaN(Number(price))
        ) {
            return `₹${Number(price).toLocaleString("en-IN")}`;
        }

        return String(price);
    };


    /* =====================================================
       IMAGE HANDLER
    ===================================================== */

    const getProductImage = (product) => {
        return (
            product?.image ||
            product?.image_url ||
            product?.thumbnail ||
            ""
        );
    };


    return (
        <section
            className="catalog-section"
            id="products"
        >

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="catalog-header">

                <div className="catalog-heading">

                    <span>
                        GEEKA COLLECTION
                    </span>

                    <h2>
                        Our Products
                    </h2>

                    <p>
                        Thoughtfully selected pieces for
                        everyday expression.
                    </p>

                </div>


                <button
                    type="button"
                    className="catalog-view-all-top"
                >
                    VIEW ALL
                    <span>
                        →
                    </span>
                </button>

            </div>


            {/* =================================================
                CATEGORY NAVIGATION
            ================================================= */}

            <div className="catalog-category-bar">

                <div className="catalog-category-list">

                    {categories.map((category) => (
                        <button
                            key={category}
                            type="button"
                            className={
                                activeCategory === category
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveCategory(category)
                            }
                        >
                            {category}
                        </button>
                    ))}

                </div>

            </div>


            {/* =================================================
                PRODUCTS
            ================================================= */}

            {filteredProducts.length > 0 ? (
                <div className="catalog-grid">

                    {filteredProducts.map((product) => {

                        const image =
                            getProductImage(product);

                        return (
                            <article
                                className="catalog-card"
                                key={product.id}
                            >

                                {/* =================================
                                    IMAGE
                                ================================= */}

                                <div className="catalog-card-image">

                                    {image ? (
                                        <img
                                            src={image}
                                            alt={
                                                product.name ||
                                                "Product"
                                            }
                                        />
                                    ) : (
                                        <div className="catalog-no-image" />
                                    )}


                                    {product.badge && (
                                        <span className="catalog-badge">
                                            {product.badge}
                                        </span>
                                    )}


                                    <button
                                        type="button"
                                        className="catalog-heart"
                                        aria-label="Add to wishlist"
                                    >
                                        ♡
                                    </button>


                                    <div className="catalog-card-overlay">

                                        <button
                                            type="button"
                                        >
                                            VIEW PRODUCT
                                            <span>
                                                →
                                            </span>
                                        </button>

                                    </div>

                                </div>


                                {/* =================================
                                    PRODUCT INFO
                                ================================= */}

                                <div className="catalog-card-info">

                                    <div className="catalog-card-category">
                                        {product.category || ""}
                                    </div>


                                    <h3>
                                        {product.name || ""}
                                    </h3>


                                    <div className="catalog-card-bottom">

                                        <span>
                                            {formatPrice(
                                                product.price
                                            )}
                                        </span>


                                        <button
                                            type="button"
                                            className="catalog-add-button"
                                        >
                                            ADD TO BAG
                                        </button>

                                    </div>

                                </div>

                            </article>
                        );
                    })}

                </div>
            ) : (
                <div className="catalog-empty">

                    <h3>
                        No products available
                    </h3>

                    <p>
                        Products will appear here when they
                        become available.
                    </p>

                </div>
            )}


            {/* =================================================
                FOOTER
            ================================================= */}

            {filteredProducts.length > 0 && (
                <div className="catalog-footer">

                    <span>
                        {filteredProducts.length}{" "}
                        {filteredProducts.length === 1
                            ? "PRODUCT"
                            : "PRODUCTS"}
                    </span>


                    <button
                        type="button"
                        className="catalog-footer-button"
                    >
                        EXPLORE COLLECTION
                        <span>
                            →
                        </span>
                    </button>

                </div>
            )}

        </section>
    );
}