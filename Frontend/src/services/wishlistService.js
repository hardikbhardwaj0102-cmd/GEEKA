const API_BASE_URL = (
    import.meta.env.VITE_API_URL || "https://geeka-backend.onrender.com"
).replace(/\/+$/, "");

const WISHLIST_URL = `${API_BASE_URL}/api/v1/cart/wishlist/`;
const WISHLIST_ITEMS_URL = `${API_BASE_URL}/api/v1/cart/wishlist/items/`;
const CSRF_URL = `${API_BASE_URL}/api/v1/auth/csrf/`;

function getCookie(name) {
    const cookies = document.cookie ? document.cookie.split(";") : [];

    for (const cookie of cookies) {
        const [key, ...value] = cookie.trim().split("=");

        if (key === name) {
            return decodeURIComponent(value.join("="));
        }
    }

    return null;
}

async function getCsrfToken() {
    const existingToken =
        getCookie("csrftoken") ||
        getCookie("csrfToken") ||
        getCookie("csrf_token");

    if (existingToken) {
        return existingToken;
    }

    const response = await fetch(CSRF_URL, {
        method: "GET",
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        throw new Error("Unable to obtain CSRF token. Please try again.");
    }

    const data = await response.json().catch(() => ({}));

    return (
        getCookie("csrftoken") ||
        getCookie("csrfToken") ||
        getCookie("csrf_token") ||
        data.csrfToken ||
        data.csrf_token ||
        data.csrf_token_value ||
        data.token ||
        null
    );
}

async function request(url, options = {}) {
    const method = (options.method || "GET").toUpperCase();

    const headers = {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
    };

    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
        const csrfToken = await getCsrfToken();

        if (csrfToken) {
            headers["X-CSRFToken"] = csrfToken;
        }
    }

    const response = await fetch(url, {
        ...options,
        method,
        headers,
        credentials: "include",
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message =
            responseData.message ||
            responseData.error ||
            responseData.detail ||
            (response.status === 401
                ? "Please log in to manage your wishlist."
                : `Wishlist request failed (${response.status}).`);

        throw new Error(message);
    }

    return responseData;
}

export async function getWishlist() {
    const data = await request(WISHLIST_URL);
    return Array.isArray(data) ? data : data.items || data.results || [];
}

export async function addWishlistItem(productId) {
    if (!productId) {
        throw new Error("A valid product ID is required.");
    }

    return request(WISHLIST_ITEMS_URL, {
        method: "POST",
        body: JSON.stringify({
            product_id: String(productId),
        }),
    });
}

export async function removeWishlistItem(wishlistItemId) {
    if (!wishlistItemId) {
        throw new Error("A valid wishlist item ID is required.");
    }

    return request(
        `${WISHLIST_ITEMS_URL}${encodeURIComponent(wishlistItemId)}/`,
        {
            method: "DELETE",
        }
    );
}

export async function clearWishlist() {
    return request(WISHLIST_URL, {
        method: "DELETE",
    });
}
