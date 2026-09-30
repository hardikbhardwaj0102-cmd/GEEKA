const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://geeka-backend.onrender.com";

const detailCache = new Map();

function getCookie(name) {
    if (typeof document === "undefined") {
        return "";
    }

    const cookies = document.cookie
        .split(";")
        .map((item) => item.trim());

    const prefix = `${name}=`;
    const match = cookies.find((cookie) => cookie.startsWith(prefix));

    return match
        ? decodeURIComponent(match.slice(prefix.length))
        : "";
}

async function getCsrfToken() {
    const existingToken = getCookie("csrftoken");

    if (existingToken) {
        return existingToken;
    }

    const response = await fetch(`${API_URL}/api/v1/auth/csrf/`, {
        method: "GET",
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data?.detail ||
            data?.error ||
            "Unable to obtain the Django CSRF token."
        );
    }

    return (
        data?.csrf_token ||
        data?.csrfToken ||
        data?.token ||
        getCookie("csrftoken") ||
        ""
    );
}

async function request(pathOrUrl, options = {}) {
    const url = pathOrUrl.startsWith("http")
        ? pathOrUrl
        : `${API_URL}${pathOrUrl}`;

    const method = options.method || "GET";

    const headers = {
        Accept: "application/json",
        ...(options.headers || {}),
    };

    if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
        const csrfToken = await getCsrfToken();

        if (csrfToken) {
            headers["X-CSRFToken"] = csrfToken;
        }

        if (
            !headers["Content-Type"] &&
            !(options.body instanceof FormData)
        ) {
            headers["Content-Type"] = "application/json";
        }
    }

    const response = await fetch(url, {
        ...options,
        method,
        credentials: "include",
        headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const error = new Error(
            data?.detail ||
            data?.error ||
            data?.message ||
            `Django API request failed with status ${response.status}.`
        );

        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
}

function normalizeCategory(category) {
    if (!category) {
        return {
            id: "",
            name: "",
            slug: "",
        };
    }

    if (typeof category === "string") {
        return {
            id: "",
            name: category,
            slug: category
                .toLowerCase()
                .trim()
                .replace(/\s+/g, "-"),
        };
    }

    return {
        id: category?.id ?? "",
        name: category?.name ?? "",
        slug: category?.slug ?? "",
    };
}

function normalizeImage(image) {
    if (!image || typeof image !== "object") {
        return null;
    }

    return {
        id: image?.id ?? "",
        image_url: image?.image_url ?? "",
        display_order: Number(image?.display_order ?? 0),
        is_primary: image?.is_primary === true,
    };
}

function normalizeListProduct(product) {
    const category = normalizeCategory(product?.category);
    const primaryImage = normalizeImage(product?.primary_image);

    return {
        id: String(product?.id ?? "").trim(),
        name: product?.name ?? "",
        slug: product?.slug ?? "",

        category,

        categoryName: category.name,
        categorySlug: category.slug,

        primary_image: primaryImage,

        image: primaryImage?.image_url || "",
    };
}

function normalizeVariant(variant) {
    return {
        id: String(variant?.id ?? "").trim(),

        sku: variant?.sku ?? "",

        attributes: Array.isArray(variant?.attributes)
            ? variant.attributes.map((attribute) => ({
                attribute: attribute?.attribute ?? "",
                value: attribute?.value ?? "",
            }))
            : [],

        price: variant?.price ?? null,

        currency: variant?.currency || "INR",

        stock: Number(variant?.stock ?? 0),

        in_stock: variant?.in_stock === true,

        is_low_stock:
            variant?.is_low_stock === true,

        is_active:
            variant?.is_active !== false,
    };
}

function normalizeDetailProduct(data) {
    const product = data?.product || data || {};

    const category = normalizeCategory(product?.category);

    const images = Array.isArray(product?.images)
        ? product.images
            .map(normalizeImage)
            .filter(Boolean)
            .sort(
                (a, b) =>
                    Number(a.display_order) -
                    Number(b.display_order)
            )
        : [];

    const variants = Array.isArray(product?.variants)
        ? product.variants
            .map(normalizeVariant)
            .filter((variant) => variant.id)
        : [];

    return {
        id: String(product?.id ?? "").trim(),

        name: product?.name ?? "",

        slug: product?.slug ?? "",

        description: product?.description ?? "",

        category,

        categoryName: category.name,

        categorySlug: category.slug,

        images,

        variants,

        is_purchasable:
            product?.is_purchasable === true,
    };
}

function normalizeProductCollection(data) {
    if (Array.isArray(data)) {
        return data
            .map(normalizeListProduct)
            .filter((product) => product.id);
    }

    if (Array.isArray(data?.results)) {
        return data.results
            .map(normalizeListProduct)
            .filter((product) => product.id);
    }

    return [];
}

function buildListQuery({ category = "" } = {}) {
    const params = new URLSearchParams();

    if (category) {
        params.set("category", category);
    }

    const query = params.toString();

    return query ? `?${query}` : "";
}

export async function getProductsPage({
    category = "",
    url = "",
} = {}) {
    const path =
        url ||
        `/api/v1/catalog/products/${buildListQuery({
            category,
        })}`;

    const data = await request(path);

    return {
        count: Number(
            data?.count ??
            normalizeProductCollection(data).length
        ),

        next: data?.next ?? null,

        previous: data?.previous ?? null,

        results: normalizeProductCollection(data),
    };
}

export async function getProducts(options = {}) {
    const page = await getProductsPage(options);

    return page.results;
}

export async function getAllProducts({
    category = "",
} = {}) {
    const products = [];

    let nextUrl =
        `/api/v1/catalog/products/` +
        buildListQuery({ category });

    while (nextUrl) {
        const page = await getProductsPage({
            url: nextUrl,
        });

        products.push(...page.results);

        nextUrl = page.next;
    }

    return products;
}

export async function getProductById(productId) {
    const id = String(productId ?? "").trim();

    if (!id) {
        throw new Error("A product ID is required.");
    }

    if (detailCache.has(id)) {
        return detailCache.get(id);
    }

    const requestPromise = request(
        `/api/v1/catalog/products/${encodeURIComponent(id)}/`
    )
        .then(normalizeDetailProduct)
        .catch((error) => {
            detailCache.delete(id);
            throw error;
        });

    detailCache.set(id, requestPromise);

    return requestPromise;
}

export async function getProductCardData(product) {
    const detail = await getProductById(product.id);

    const activeVariants = detail.variants.filter(
        (variant) => variant.is_active
    );

    const prices = activeVariants
        .map((variant) => Number(variant.price))
        .filter((price) => Number.isFinite(price));

    const lowestPrice = prices.length
        ? Math.min(...prices)
        : null;

    return {
        ...product,

        detail,

        price: lowestPrice,

        currency:
            activeVariants[0]?.currency ||
            "INR",

        inStock:
            detail.is_purchasable,

        isPurchasable:
            detail.is_purchasable,

        hasVariants:
            activeVariants.length > 0,

        variantCount:
            activeVariants.length,

        displayImage:
            product?.primary_image?.image_url ||
            detail?.images?.find(
                (image) => image.is_primary
            )?.image_url ||
            detail?.images?.[0]?.image_url ||
            "",
    };
}

export async function getProductCards(
    products = []
) {
    return Promise.all(
        products.map(async (product) => {
            try {
                return await getProductCardData(product);
            } catch (error) {
                return {
                    ...product,

                    detail: null,

                    price: null,

                    currency: "INR",

                    inStock: false,

                    isPurchasable: false,

                    hasVariants: false,

                    variantCount: 0,

                    displayImage:
                        product?.primary_image
                            ?.image_url || "",

                    detailError: error,
                };
            }
        })
    );
}

export function getDefaultPurchasableVariant(
    product
) {
    const variants = Array.isArray(
        product?.variants
    )
        ? product.variants.filter(
            (variant) => variant.is_active
        )
        : [];

    return (
        variants.find(
            (variant) =>
                variant.in_stock &&
                variant.stock > 0
        ) ||
        variants[0] ||
        null
    );
}

export function clearProductDetailCache(
    productId = ""
) {
    if (productId) {
        detailCache.delete(
            String(productId)
        );

        return;
    }

    detailCache.clear();
}

export { API_URL };