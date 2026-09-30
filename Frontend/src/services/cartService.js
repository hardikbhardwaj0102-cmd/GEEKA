/*
|--------------------------------------------------------------------------
| GEEKA CART SERVICE
|--------------------------------------------------------------------------
| Backend-connected cart service.
|
| Backend source of truth:
|
| GET    /api/v1/cart/
| POST   /api/v1/cart/items/
| PATCH  /api/v1/cart/items/{id}/
| DELETE /api/v1/cart/items/{id}/
| DELETE /api/v1/cart/
|
| The Django backend manages:
| - Cart ownership
| - Guest cart cookie
| - Product variant
| - Price
| - Stock
| - Purchasability
| - Quantity validation
|
| The frontend must never submit or trust its own price/stock values.
|--------------------------------------------------------------------------
*/

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://geeka-backend.onrender.com";


/*
|--------------------------------------------------------------------------
| COOKIE HELPERS
|--------------------------------------------------------------------------
*/

function getCookie(name) {
    if (typeof document === "undefined") {
        return "";
    }

    const cookies = document.cookie
        .split(";")
        .map((cookie) => cookie.trim());

    const prefix = `${name}=`;

    const match = cookies.find((cookie) =>
        cookie.startsWith(prefix)
    );

    return match
        ? decodeURIComponent(match.slice(prefix.length))
        : "";
}


/*
|--------------------------------------------------------------------------
| CSRF
|--------------------------------------------------------------------------
| Django exposes:
|
| GET /api/v1/auth/csrf/
|
| State-changing session requests use X-CSRFToken.
|--------------------------------------------------------------------------
*/

let csrfRequestPromise = null;

async function getCsrfToken() {
    const existingToken = getCookie("csrftoken");

    if (existingToken) {
        return existingToken;
    }

    if (csrfRequestPromise) {
        return csrfRequestPromise;
    }

    csrfRequestPromise = fetch(
        `${API_URL}/api/v1/auth/csrf/`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                Accept: "application/json",
            },
        }
    )
        .then(async (response) => {
            const data =
                await response.json().catch(() => ({}));

            if (!response.ok) {
                throw createApiError(
                    response,
                    data
                );
            }

            return (
                data?.csrfToken ||
                data?.csrf_token ||
                getCookie("csrftoken") ||
                ""
            );
        })
        .finally(() => {
            csrfRequestPromise = null;
        });

    return csrfRequestPromise;
}


/*
|--------------------------------------------------------------------------
| ERROR HELPER
|--------------------------------------------------------------------------
*/

function createApiError(response, data = {}) {
    const message =
        data?.detail ||
        data?.error ||
        data?.message ||
        data?.errors?.detail ||
        data?.errors?.non_field_errors?.[0] ||
        `Cart API request failed with status ${response.status}.`;

    const error = new Error(message);

    error.status = response.status;
    error.data = data;

    return error;
}


/*
|--------------------------------------------------------------------------
| REQUEST HELPER
|--------------------------------------------------------------------------
*/

async function cartRequest(
    path,
    {
        method = "GET",
        body = undefined,
    } = {}
) {
    const headers = {
        Accept: "application/json",
    };

    const upperMethod = method.toUpperCase();

    if (
        !["GET", "HEAD", "OPTIONS"].includes(
            upperMethod
        )
    ) {
        const csrfToken =
            await getCsrfToken();

        if (csrfToken) {
            headers["X-CSRFToken"] =
                csrfToken;
        }

        headers["Content-Type"] =
            "application/json";
    }

    const response = await fetch(
        `${API_URL}${path}`,
        {
            method,
            credentials: "include",
            headers,
            body:
                body === undefined
                    ? undefined
                    : JSON.stringify(body),
        }
    );

    /*
    |--------------------------------------------------------------------------
    | 204 NO CONTENT
    |--------------------------------------------------------------------------
    */

    if (response.status === 204) {
        return null;
    }

    const data =
        await response
            .json()
            .catch(() => ({}));

    if (!response.ok) {
        throw createApiError(
            response,
            data
        );
    }

    return data;
}


/*
|--------------------------------------------------------------------------
| NORMALIZE CART ITEM
|--------------------------------------------------------------------------
*/

function normalizeCartItem(item) {
    if (!item) {
        return null;
    }

    const price = Number(item.price);

    const quantity = Math.max(
        1,
        Math.floor(
            Number(item.quantity) || 1
        )
    );

    const stock = Math.max(
        0,
        Math.floor(
            Number(item.stock) || 0
        )
    );

    const subtotal =
        item.subtotal !== undefined &&
            item.subtotal !== null
            ? Number(item.subtotal)
            : Number.isFinite(price)
                ? price * quantity
                : 0;

    return {
        id: String(item.id ?? "").trim(),

        product_id:
            String(
                item.product_id ?? ""
            ).trim(),

        variant_id:
            String(
                item.variant_id ?? ""
            ).trim(),

        product_name:
            item.product_name ||
            item.name ||
            "Product",

        name:
            item.product_name ||
            item.name ||
            "Product",

        sku:
            item.sku || "",

        price:
            Number.isFinite(price)
                ? price
                : 0,

        quantity,

        subtotal:
            Number.isFinite(subtotal)
                ? subtotal
                : 0,

        stock,

        in_stock:
            item.in_stock === true,

        is_purchasable:
            item.is_purchasable === true,

        /*
        |--------------------------------------------------------------------------
        | Optional frontend display fields
        |--------------------------------------------------------------------------
        | These are not assumed to come from the cart API.
        | Product image/category can be added later by Cart.jsx using
        | the catalog product detail API.
        */

        image:
            item.image || "",

        category:
            item.category || "",

        color:
            item.color || "",

        currency:
            item.currency || "INR",
    };
}


/*
|--------------------------------------------------------------------------
| NORMALIZE CART
|--------------------------------------------------------------------------
*/

function normalizeCart(data) {
    const sourceItems =
        Array.isArray(data)
            ? data
            : Array.isArray(data?.items)
                ? data.items
                : Array.isArray(data?.results)
                    ? data.results
                    : [];

    return sourceItems
        .map(normalizeCartItem)
        .filter(
            (item) =>
                item &&
                item.id &&
                item.variant_id
        );
}


/*
|--------------------------------------------------------------------------
| GET CURRENT CART
|--------------------------------------------------------------------------
*/

export async function getCart() {
    const data =
        await cartRequest(
            "/api/v1/cart/",
            {
                method: "GET",
            }
        );

    return {
        ...data,

        id:
            data?.id ??
            null,

        items:
            normalizeCart(data),

        created_at:
            data?.created_at ??
            null,

        updated_at:
            data?.updated_at ??
            null,
    };
}


/*
|--------------------------------------------------------------------------
| ADD CART ITEM
|--------------------------------------------------------------------------
| Backend expects:
|
| {
|     variant_id: "...",
|     quantity: 1
| }
|--------------------------------------------------------------------------
*/

export async function addCartItem(
    variantId,
    quantity = 1
) {
    const safeVariantId =
        String(
            variantId ?? ""
        ).trim();

    const safeQuantity = Math.max(
        1,
        Math.floor(
            Number(quantity) || 1
        )
    );

    if (!safeVariantId) {
        throw new Error(
            "A product variant is required."
        );
    }

    const data =
        await cartRequest(
            "/api/v1/cart/items/",
            {
                method: "POST",

                body: {
                    variant_id:
                        safeVariantId,

                    quantity:
                        safeQuantity,
                },
            }
        );

    return normalizeCartItem(data);
}


/*
|--------------------------------------------------------------------------
| UPDATE CART ITEM QUANTITY
|--------------------------------------------------------------------------
*/

export async function updateCartItem(
    itemId,
    quantity
) {
    const safeItemId =
        String(
            itemId ?? ""
        ).trim();

    const safeQuantity = Math.max(
        1,
        Math.floor(
            Number(quantity) || 1
        )
    );

    if (!safeItemId) {
        throw new Error(
            "A cart item ID is required."
        );
    }

    const data =
        await cartRequest(
            `/api/v1/cart/items/${encodeURIComponent(
                safeItemId
            )}/`,
            {
                method: "PATCH",

                body: {
                    quantity:
                        safeQuantity,
                },
            }
        );

    return normalizeCartItem(data);
}


/*
|--------------------------------------------------------------------------
| REMOVE CART ITEM
|--------------------------------------------------------------------------
*/

export async function removeCartItem(
    itemId
) {
    const safeItemId =
        String(
            itemId ?? ""
        ).trim();

    if (!safeItemId) {
        throw new Error(
            "A cart item ID is required."
        );
    }

    await cartRequest(
        `/api/v1/cart/items/${encodeURIComponent(
            safeItemId
        )}/`,
        {
            method: "DELETE",
        }
    );

    return true;
}


/*
|--------------------------------------------------------------------------
| CLEAR CART
|--------------------------------------------------------------------------
*/

export async function clearCart() {
    await cartRequest(
        "/api/v1/cart/",
        {
            method: "DELETE",
        }
    );

    return true;
}


/*
|--------------------------------------------------------------------------
| ERROR MESSAGE HELPER
|--------------------------------------------------------------------------
*/

export function getCartErrorMessage(
    error
) {
    if (!error) {
        return "Something went wrong with the cart.";
    }

    if (
        error?.data?.detail
    ) {
        return String(
            error.data.detail
        );
    }

    if (
        error?.data?.error
    ) {
        return String(
            error.data.error
        );
    }

    if (error?.message) {
        return error.message;
    }

    return "Something went wrong with the cart.";
}


/*
|--------------------------------------------------------------------------
| API URL
|--------------------------------------------------------------------------
*/

export { API_URL }; 