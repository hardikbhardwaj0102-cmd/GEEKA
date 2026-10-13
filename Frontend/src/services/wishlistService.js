const API_BASE_URL = (
    import.meta.env.VITE_API_URL ||
    "https://geeka-backend.onrender.com"
).replace(/\/+$/, "");

const WISHLIST_URL = `${API_BASE_URL}/api/v1/cart/wishlist/`;
const WISHLIST_ITEMS_URL = `${API_BASE_URL}/api/v1/cart/wishlist/items/`;
const CSRF_URL = `${API_BASE_URL}/api/v1/auth/csrf/`;

function getCookie(name) {
    const cookies = document.cookie
        ? document.cookie.split(";")
        : [];

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

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data?.message ||
            data?.error ||
            data?.detail ||
            "Unable to obtain a CSRF token."
        );
    }

    const token =
        data?.csrfToken ||
        data?.csrf_token ||
        data?.csrf_token_value ||
        data?.token ||
        getCookie("csrftoken") ||
        getCookie("csrfToken") ||
        getCookie("csrf_token");

    return token || null;
}

async function requestJson(url, options = {}) {
    const response = await fetch(url, {
        credentials: "include",
        ...options,
        headers: {
            Accept: "application/json",
            ...(options.body
                ? { "Content-Type": "application/json" }
                : {}),
            ...options.headers,
        },
    });

    if (response.status === 204) {
        return null;
    }

    const responseData = await response
        .json()
        .catch(() => null);

    if (!response.ok) {
        const message =
            responseData?.message ||
            responseData?.error ||
            responseData?.detail ||
            `Request failed with status ${response.status}.`;

        throw new Error(message);
    }

    return responseData;
}

function extractWishlistItems(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.items)) {
        return data.items;
    }

    if (Array.isArray(data?.results)) {
        return data.results;
    }

    if (Array.isArray(data?.wishlist)) {
        return data.wishlist;
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    if (data == null) {
        return [];
    }

    console.warn(
        "Unexpected wishlist API response:",
        data
    );

    return [];
}

export async function getWishlist() {
    const data = await requestJson(WISHLIST_URL, {
        method: "GET",
    });

    return extractWishlistItems(data);
}

export async function addWishlistItem(productId) {
    if (!productId) {
        throw new Error(
            "A valid product ID is required to add an item to the wishlist."
        );
    }

    const csrfToken = await getCsrfToken();

    return requestJson(WISHLIST_ITEMS_URL, {
        method: "POST",
        headers: csrfToken
            ? { "X-CSRFToken": csrfToken }
            : {},
        body: JSON.stringify({
            product_id: String(productId),
        }),
    });
}

export async function removeWishlistItem(wishlistItemId) {
    if (!wishlistItemId) {
        throw new Error(
            "A valid wishlist item ID is required to remove an item."
        );
    }

    const csrfToken = await getCsrfToken();

    const url =
        `${WISHLIST_ITEMS_URL}${encodeURIComponent(
            String(wishlistItemId)
        )}/`;

    return requestJson(url, {
        method: "DELETE",
        headers: csrfToken
            ? { "X-CSRFToken": csrfToken }
            : {},
    });
}

export async function clearWishlist() {
    const csrfToken = await getCsrfToken();

    return requestJson(WISHLIST_URL, {
        method: "DELETE",
        headers: csrfToken
            ? { "X-CSRFToken": csrfToken }
            : {},
    });
}