import "../style/CollectionSection.css";

import creativeImage from "../assets/Ethical.png";
import jwelImage from "../assets/jwel.png";
import handImage from "../assets/hand.png";
const collections = [
    {
        id: "ethnic",
        number: "01",
        title: "Ethnic Wear",
        subtitle: "Tradition, Reimagined.",
        description:
            "Discover thoughtfully curated ethnic pieces that blend timeless Indian aesthetics with contemporary style.",
        image:
            creativeImage,
        icon: "✿",
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
        image:
            jwelImage,
        icon: "♢",
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
        image:
            handImage,
        icon: "◌",
        categories: [
            "Crochet Bags",
            "Keychains",
            "Hair Accessories",
            "Home Décor",
            "More",
        ],
    },
];

function CollectionCard({ collection }) {
    return (
        <article className={`collection-card collection-${collection.id}`}>
            <div className="collection-card-image">
                <img
                    src={collection.image}
                    alt={collection.title}
                />
            </div>

            <div className="collection-card-info">
                <div className="collection-card-icon">
                    {collection.icon}
                </div>

                <h3>{collection.title}</h3>

                <div className="collection-card-subtitle">
                    {collection.subtitle}
                </div>

                <p>{collection.description}</p>

                <a href="#new-arrivals" className="collection-card-link">
                    <span>Shop Now</span>
                    <strong>→</strong>
                </a>
            </div>

            <div className="collection-card-categories">
                {collection.categories.map((category, index) => (
                    <span key={category}>
                        {category}
                        {index !== collection.categories.length - 1 && (
                            <b>|</b>
                        )}
                    </span>
                ))}
            </div>
        </article>
    );
}

export default function CollectionSection() {
    return (
        <section className="collection-section" id="collections">
            <div className="collection-heading">
                <div className="collection-heading-line" />

                <div>
                    <h2>OUR COLLECTION</h2>
                    <p>Curated with love, crafted for you</p>
                </div>

                <div className="collection-heading-line" />
            </div>

            <div className="collection-grid">
                {collections.map((collection) => (
                    <CollectionCard
                        key={collection.id}
                        collection={collection}
                    />
                ))}
            </div>
        </section>
    );
}