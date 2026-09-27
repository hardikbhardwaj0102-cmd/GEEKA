import ethnicImage from "../assets/Ethical.png";
import jewelleryImage from "../assets/jwel.png";
import creativeImage from "../assets/Hand.png";

// Temporary frontend catalog.
// The object shape here is the contract the Shop UI expects from the backend later.
export const PRODUCTS = [
    {
        id: 1,
        name: "Floral Ethnic Set",
        category: "Ethnic Wear",
        price: 1499,
        oldPrice: 1799,
        image: ethnicImage,
        isNew: true,
        inStock: true,
        featured: true,
        description:
            "A graceful ethnic set with delicate floral detailing and an effortless silhouette.",
    },
    {
        id: 2,
        name: "Pearl Drop Earrings",
        category: "Jewellery",
        price: 799,
        oldPrice: 999,
        image: jewelleryImage,
        isNew: true,
        inStock: true,
        featured: true,
        description:
            "Elegant pearl-inspired drop earrings designed for everyday and festive styling.",
    },
    {
        id: 3,
        name: "Handwoven Crochet Blanket",
        category: "Creative",
        price: 799,
        oldPrice: 999,
        image: creativeImage,
        isNew: true,
        inStock: true,
        featured: true,
        description:
            "A handmade crochet creation with a soft texture and warm handcrafted character.",
    },
    {
        id: 4,
        name: "Classic Kurti Set",
        category: "Ethnic Wear",
        price: 1699,
        oldPrice: 1999,
        image: ethnicImage,
        isNew: false,
        inStock: true,
        featured: true,
        description:
            "A timeless kurti set balancing comfort, simplicity and traditional charm.",
    },
    {
        id: 5,
        name: "Silver Filigree Earrings",
        category: "Jewellery",
        price: 699,
        oldPrice: 899,
        image: jewelleryImage,
        isNew: true,
        inStock: true,
        featured: false,
        description:
            "Detailed earrings inspired by delicate traditional filigree craftsmanship.",
    },
    {
        id: 6,
        name: "Handmade Crochet Bag",
        category: "Creative",
        price: 1199,
        oldPrice: 1399,
        image: creativeImage,
        isNew: false,
        inStock: true,
        featured: true,
        description:
            "A handmade everyday bag crafted with a soft crochet texture and practical shape.",
    },
    {
        id: 7,
        name: "Printed Everyday Kurti",
        category: "Ethnic Wear",
        price: 1099,
        oldPrice: 1299,
        image: ethnicImage,
        isNew: false,
        inStock: true,
        featured: false,
        description:
            "An easy everyday kurti with relaxed styling and subtle traditional detailing.",
    },
    {
        id: 8,
        name: "Pearl Layer Necklace",
        category: "Jewellery",
        price: 1299,
        oldPrice: 1499,
        image: jewelleryImage,
        isNew: true,
        inStock: true,
        featured: true,
        description:
            "A layered pearl-inspired necklace made for elegant festive styling.",
    },
    {
        id: 9,
        name: "Crochet Mini Pouch",
        category: "Creative",
        price: 599,
        oldPrice: 699,
        image: creativeImage,
        isNew: true,
        inStock: true,
        featured: false,
        description:
            "A compact handmade pouch for your everyday essentials.",
    },
    {
        id: 10,
        name: "Embroidered Ethnic Set",
        category: "Ethnic Wear",
        price: 1899,
        oldPrice: 2199,
        image: ethnicImage,
        isNew: true,
        inStock: true,
        featured: true,
        description:
            "A refined ethnic ensemble featuring detailed embroidery and festive styling.",
    },
    {
        id: 11,
        name: "Delicate Pearl Bracelet",
        category: "Jewellery",
        price: 549,
        oldPrice: null,
        image: jewelleryImage,
        isNew: false,
        inStock: true,
        featured: false,
        description:
            "A subtle bracelet designed to complement both ethnic and contemporary looks.",
    },
    {
        id: 12,
        name: "Crochet Hair Accessory Set",
        category: "Creative",
        price: 449,
        oldPrice: 549,
        image: creativeImage,
        isNew: true,
        inStock: true,
        featured: false,
        description:
            "A playful handmade accessory set created with soft crochet detailing.",
    },
];

export const CATEGORIES = [
    "All",
    ...new Set(PRODUCTS.map((product) => product.category)),
];