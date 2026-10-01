import { Link } from "react-router-dom";
import "../style/CollectionSection.css";

import creativeImage from "../assets/Ethical.png";
import jwelImage from "../assets/jwel.png";
import handImage from "../assets/Hand.png";


const collections = [
    {
        id: "ethnic",
        number: "01",
        title: "Ethnic Wear",
        subtitle: "Tradition, Reimagined.",
        description:
            "Discover thoughtfully curated ethnic pieces that blend timeless Indian aesthetics with contemporary style.",
        image: creativeImage,
        categories: [
            "Kurti & Kurta Sets",
            "Sarees",
            "Anarkali",
            "Co-ord Sets",
            "More",
        ],
    },
    {
        id: "jewellery",
        number: "02",
        title: "Jewellery",
        subtitle: "Little Details, Big Impact.",
        description:
            "Add the perfect finishing touch to your look with jewellery designed for every mood and occasion.",
        image: jwelImage,
        categories: [
            "Earrings",
            "Necklaces",
            "Rings",
            "Bracelets",
            "More",
        ],
    },
    {
        id: "creative",
        number: "03",
        title: "Creative",
        subtitle: "Made by Hand, Made with Heart.",
        description:
            "Explore charming handcrafted creations that bring creativity and individuality to everyday life.",
        image: handImage,
        categories: [
            "Crochet Bags",
            "Keychains",
            "Hair Accessories",
            "Home Décor",
            "More",
        ],
    },
];


function CollectionIcon({ collectionId }) {
    if (collectionId === "ethnic") {
        return (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 20c0-5.8 3.3-10.5 8-13.2" />
                <path d="M12 20C12 13.8 8.8 8.9 4 6.8" />
                <path d="M12 15.2c-1.9-1.4-3.1-3.5-3.1-5.8" />
                <path d="M12 13.4c2.1-1 3.6-2.7 4.2-4.8" />
                <path d="M5.2 7.2C6.1 4.7 8.3 3.2 10.3 3" />
                <path d="M18.6 6.8C17.8 4.4 15.9 3 13.9 2.7" />
            </svg>
        );
    }

    if (collectionId === "jewellery") {
        return (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m12 3 7 5-7 13L5 8l7-5Z" />
                <path d="m5 8 7 3 7-3" />
                <path d="M12 3v8" />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="7.5" />
            <path d="M12 5.5c2.5 2.2 2.5 4.1 0 6.1-2.5 2-2.5 3.9 0 6.9" />
            <path d="M5.7 10.4c2.3-.7 4.2.2 5.7 2.6" />
        </svg>
    );
}


function CollectionCard({ collection }) {
    return (
        <article
            className={`collection-card collection-${collection.id}`}
        >
            <div className="collection-card-image">
                <img
                    src={collection.image}
                    alt={collection.title}
                    loading="lazy"
                />

                <span className="collection-card-number">
                    {collection.number}
                </span>

                <div className="collection-card-image-shade" />
            </div>


            <div className="collection-card-info">
                <div className="collection-card-icon">
                    <CollectionIcon collectionId={collection.id} />
                </div>

                <span className="collection-card-kicker">
                    GEEKA COLLECTION
                </span>

                <h3>
                    {collection.title}
                </h3>

                <div className="collection-card-subtitle">
                    {collection.subtitle}
                </div>

                <p>
                    {collection.description}
                </p>

                <Link
                    to={`/shop?collection=${encodeURIComponent(
                        collection.id
                    )}`}
                    className="collection-card-link"
                    aria-label={`Shop ${collection.title}`}
                >
                    <span>Shop Collection</span>

                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path d="M5 12h13" />
                        <path d="m13 6 6 6-6 6" />
                    </svg>
                </Link>
            </div>


            <div className="collection-card-categories">
                {collection.categories.map(
                    (category, index) => (
                        <span key={category}>
                            {category}

                            {index !==
                                collection.categories.length - 1 && (
                                    <b aria-hidden="true">·</b>
                                )}
                        </span>
                    )
                )}
            </div>
        </article>
    );
}


export default function CollectionSection() {
    return (
        <section
            className="collection-section"
            id="collections"
        >
            <div className="collection-heading">
                <div className="collection-heading-rule" />

                <div className="collection-heading-copy">
                    <span>CURATED FOR EVERY DAY</span>

                    <h2>Our Collection</h2>

                    <p>Curated with love, crafted for you</p>
                </div>

                <div className="collection-heading-rule" />
            </div>


            <div className="collection-grid">
                {collections.map(
                    (collection) => (
                        <CollectionCard
                            key={collection.id}
                            collection={collection}
                        />
                    )
                )}
            </div>
        </section>
    );
}
