import { API_URL, getCsrfToken } from "./adminAuthService";


/* =========================================================
   GEEKA ADMIN API SERVICE

   Connected:
   - Products
   - Categories
   - Product image uploads
   - Product variants
   - Variant stock and low-stock threshold updates

   Other endpoints remain unconfigured until finalized.
========================================================= */


const ENDPOINTS = {
    products: "/api/v1/catalog/admin/products/",
    categories: "/api/v1/catalog/admin/categories/",

    inventory: "",
    orders: "/api/v1/orders/admin/",
    customers: "/api/v1/customers/admin/",
    reviews: "",

    messages: "/api/v1/contact/messages/admin/",
};


/* =========================================================
   URL HELPERS
========================================================= */

function resolveEndpoint(endpoint) {
    if (!endpoint) {
        return "";
    }

    if (
        endpoint.startsWith("http://") ||
        endpoint.startsWith("https://")
    ) {
        return endpoint;
    }

    return `${API_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
}


function getResourceEndpoint(key, resourceId = null) {
    const endpoint = getEndpoint(key);

    if (!endpoint) {
        return "";
    }

    const normalized = endpoint.replace(/\/$/, "");

    return resourceId
        ? `${normalized}/${resourceId}/`
        : `${normalized}/`;
}


/* =========================================================
   RESPONSE HANDLING
========================================================= */

async function parseResponse(response) {
    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        let validationMessage = null;

        if (Array.isArray(data?.errors)) {
            validationMessage = data.errors
                .filter(Boolean)
                .join(" ");
        } else if (
            data?.errors &&
            typeof data.errors === "object"
        ) {
            const messages = [];

            for (const value of Object.values(data.errors)) {
                if (Array.isArray(value)) {
                    messages.push(...value.filter(Boolean));
                } else if (value) {
                    messages.push(value);
                }
            }

            validationMessage = messages.length > 0
                ? messages.join(" ")
                : null;
        }

        const messageParts = [];

        if (data?.detail) {
            messageParts.push(data.detail);
        }

        if (Array.isArray(data?.errors)) {
            messageParts.push(...data.errors.filter(Boolean));
        }

        if (data?.error) {
            messageParts.push(data.error);
        }

        if (data?.message) {
            messageParts.push(data.message);
        }

        if (
            validationMessage &&
            !messageParts.includes(validationMessage)
        ) {
            messageParts.push(validationMessage);
        }

        const message = messageParts.length > 0
            ? messageParts.join(" ")
            : `Request failed with status ${response.status}.`;

        const error = new Error(String(message));

        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
}


/* =========================================================
   LOW-LEVEL ADMIN REQUEST
========================================================= */

export async function adminRequest({
    endpoint,
    method = "GET",
    body,
    headers = {},
    isFormData = false,
}) {
    const url = resolveEndpoint(endpoint);

    if (!url) {
        const error = new Error(
            "This admin API endpoint has not been configured yet."
        );

        error.code = "ENDPOINT_NOT_CONFIGURED";

        throw error;
    }

    const requestHeaders = {
        Accept: "application/json",
        ...headers,
    };

    let requestBody = body;

    /*
     * Do not manually set Content-Type for FormData.
     * The browser must generate the multipart boundary.
     */

    if (!isFormData) {
        requestHeaders["Content-Type"] = "application/json";
    }

    const stateChangingMethods = [
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
    ];

    /*
     * Django CSRF protection.
     */

    if (stateChangingMethods.includes(method.toUpperCase())) {
        const csrfToken = await getCsrfToken();

        if (csrfToken) {
            requestHeaders["X-CSRFToken"] = csrfToken;
        }
    }

    /*
     * JSON request body.
     */

    if (!isFormData && body !== undefined) {
        requestBody = JSON.stringify(body);
    }

    const response = await fetch(url, {
        method,
        credentials: "include",
        headers: requestHeaders,
        body: requestBody,
    });

    return parseResponse(response);
}


/* =========================================================
   ENDPOINT HELPERS
========================================================= */

export function isEndpointConfigured(key) {
    return Boolean(ENDPOINTS[key]);
}


export function getEndpoint(key) {
    return ENDPOINTS[key] || "";
}


/* =========================================================
   GENERIC COLLECTION GET
========================================================= */

export async function getAdminCollection(key, options = {}) {
    const endpoint = getEndpoint(key);

    if (!endpoint) {
        const error = new Error(
            `No API endpoint is configured for ${key}.`
        );

        error.code = "ENDPOINT_NOT_CONFIGURED";

        throw error;
    }

    return adminRequest({
        endpoint,
        method: "GET",
        ...options,
    });
}


/* =========================================================
   GENERIC RESOURCE GET
========================================================= */

export async function getAdminResource(key, resourceId) {
    if (!resourceId) {
        throw new Error("A resource ID is required.");
    }

    const endpoint = getResourceEndpoint(key, resourceId);

    if (!endpoint) {
        const error = new Error(
            `No API endpoint is configured for ${key}.`
        );

        error.code = "ENDPOINT_NOT_CONFIGURED";

        throw error;
    }

    return adminRequest({
        endpoint,
        method: "GET",
    });
}


/* =========================================================
   GENERIC CREATE
========================================================= */

export async function createAdminResource(key, payload) {
    const endpoint = getEndpoint(key);

    if (!endpoint) {
        const error = new Error(
            `No API endpoint is configured for ${key}.`
        );

        error.code = "ENDPOINT_NOT_CONFIGURED";

        throw error;
    }

    return adminRequest({
        endpoint,
        method: "POST",
        body: payload,
    });
}


/* =========================================================
   GENERIC UPDATE
========================================================= */

export async function updateAdminResource(
    key,
    resourceId,
    payload
) {
    if (!resourceId) {
        throw new Error("A resource ID is required.");
    }

    const endpoint = getResourceEndpoint(key, resourceId);

    if (!endpoint) {
        const error = new Error(
            `No API endpoint is configured for ${key}.`
        );

        error.code = "ENDPOINT_NOT_CONFIGURED";

        throw error;
    }

    return adminRequest({
        endpoint,
        method: "PATCH",
        body: payload,
    });
}


/* =========================================================
   GENERIC DELETE
========================================================= */

export async function deleteAdminResource(key, resourceId) {
    if (!resourceId) {
        throw new Error("A resource ID is required.");
    }

    const endpoint = getResourceEndpoint(key, resourceId);

    if (!endpoint) {
        const error = new Error(
            `No API endpoint is configured for ${key}.`
        );

        error.code = "ENDPOINT_NOT_CONFIGURED";

        throw error;
    }

    return adminRequest({
        endpoint,
        method: "DELETE",
    });
}


/* =========================================================
   PRODUCTS — EXPLICIT HELPERS
========================================================= */

export async function getAdminProducts(options = {}) {
    const {
        status,
        category,
        page,
    } = options;

    const params = new URLSearchParams();

    if (status) {
        params.set("status", status);
    }

    if (
        category !== undefined &&
        category !== null &&
        String(category).trim() !== ""
    ) {
        params.set("category", String(category));
    }

    if (
        page !== undefined &&
        page !== null &&
        String(page).trim() !== ""
    ) {
        params.set("page", String(page));
    }

    const endpoint = getEndpoint("products");

    return adminRequest({
        endpoint: params.toString()
            ? `${endpoint}?${params.toString()}`
            : endpoint,
        method: "GET",
    });
}


/* =========================================================
   GET SINGLE PRODUCT
========================================================= */

export async function getAdminProduct(productId) {
    return getAdminResource("products", productId);
}


/* =========================================================
   CREATE PRODUCT
========================================================= */

export async function createAdminProduct(payload) {
    return createAdminResource("products", payload);
}


/* =========================================================
   UPDATE PRODUCT
========================================================= */

export async function updateAdminProduct(productId, payload) {
    return updateAdminResource("products", productId, payload);
}


/* =========================================================
   CATEGORIES
========================================================= */

export async function getAdminCategories() {
    return getAdminCollection("categories");
}


export async function getAdminCategory(categoryId) {
    return getAdminResource("categories", categoryId);
}


export async function createAdminCategory(payload) {
    return createAdminResource("categories", payload);
}


export async function updateAdminCategory(categoryId, payload) {
    return updateAdminResource(
        "categories",
        categoryId,
        payload
    );
}


/* =========================================================
   PRODUCT STATUS

   PATCH /api/v1/catalog/admin/products/<id>/status/

   Body: { "status": "PUBLISHED" }
========================================================= */

export async function updateAdminProductStatus(
    productId,
    status
) {
    if (!productId) {
        throw new Error("A product ID is required.");
    }

    if (!status) {
        throw new Error("A product status is required.");
    }

    const base = getEndpoint("products").replace(/\/$/, "");

    return adminRequest({
        endpoint: `${base}/${productId}/status/`,
        method: "PATCH",
        body: { status },
    });
}


/* =========================================================
   PRODUCT VARIANTS — INVENTORY

   GET
   /api/v1/catalog/admin/products/<product_id>/variants/

   Returns variants belonging to a product.
========================================================= */

export async function getAdminProductVariants(productId) {
    if (!productId) {
        throw new Error("A product ID is required.");
    }

    return adminRequest({
        endpoint:
            `/api/v1/catalog/admin/products/${productId}/variants/`,
        method: "GET",
    });
}


/* =========================================================
   UPDATE VARIANT — INVENTORY

   PATCH
   /api/v1/catalog/admin/variants/<variant_id>/

   Example body:
   {
       "stock": 25,
       "low_stock_threshold": 5
   }
========================================================= */

export async function updateAdminVariant(
    variantId,
    payload
) {
    if (!variantId) {
        throw new Error("A variant ID is required.");
    }

    if (
        !payload ||
        typeof payload !== "object" ||
        Array.isArray(payload)
    ) {
        throw new Error("Variant update data is required.");
    }

    return adminRequest({
        endpoint:
            `/api/v1/catalog/admin/variants/${variantId}/`,
        method: "PATCH",
        body: payload,
    });
}


/* =========================================================
   PRODUCT IMAGES

   POST
   /api/v1/catalog/admin/products/<id>/images/

   multipart/form-data fields:
   - image_file
   - display_order
   - is_primary
========================================================= */

export async function uploadProductImage({
    productId,
    file,
    displayOrder = 0,
    isPrimary = false,
}) {
    if (!productId) {
        throw new Error("A product ID is required.");
    }

    if (
        typeof File === "undefined" ||
        !(file instanceof File)
    ) {
        throw new Error("Please select a valid image file.");
    }

    const formData = new FormData();

    formData.append("image_file", file);
    formData.append("display_order", String(displayOrder));
    formData.append("is_primary", String(Boolean(isPrimary)));

    return adminRequest({
        endpoint:
            `/api/v1/catalog/admin/products/${productId}/images/`,
        method: "POST",
        body: formData,
        isFormData: true,
    });
}



/* =========================================================
   CONTACT MESSAGES — READ / UNREAD STATUS

   PATCH /api/v1/contact/messages/admin/<id>/
   Body: { "is_read": true } or { "is_read": false }
========================================================= */

export async function updateAdminMessageReadStatus(messageId, isRead) {
    if (!messageId) {
        throw new Error("A message ID is required.");
    }

    if (typeof isRead !== "boolean") {
        throw new Error("Message read status must be true or false.");
    }

    return adminRequest({
        endpoint: getResourceEndpoint("messages", encodeURIComponent(messageId)),
        method: "PATCH",
        body: { is_read: isRead },
    });
}


/* =========================================================
   EXPORT ENDPOINTS
========================================================= */

export {
    ENDPOINTS,
};


/* =========================================================
   ADMIN ORDERS — documented in API_CONTRACT.md section 5.5
========================================================= */

export async function getAdminOrders(options = {}) {
    const {
        page = 1,
        page_size = 10,
        search,
        status,
        payment_status,
        date_from,
        date_to,
    } = options;

    const endpoint = getEndpoint("orders");
    if (!endpoint) {
        const error = new Error("No API endpoint is configured for orders.");
        error.code = "ENDPOINT_NOT_CONFIGURED";
        throw error;
    }

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(Math.min(50, Math.max(1, Number(page_size) || 10))));

    for (const [key, value] of Object.entries({ search, status, payment_status, date_from, date_to })) {
        if (value !== undefined && value !== null && String(value).trim() !== "") {
            params.set(key, String(value).trim());
        }
    }

    return adminRequest({ endpoint: `${endpoint}?${params.toString()}`, method: "GET" });
}

export async function getAdminOrder(orderUuid) {
    if (!orderUuid) throw new Error("An order UUID is required.");
    const base = getEndpoint("orders").replace(/\/$/, "");
    if (!base) {
        const error = new Error("No API endpoint is configured for orders.");
        error.code = "ENDPOINT_NOT_CONFIGURED";
        throw error;
    }
    return adminRequest({
        endpoint: `${base}/${encodeURIComponent(orderUuid)}/`,
        method: "GET",
    });
}

export async function updateAdminOrderStatus(orderUuid, status) {
    if (!orderUuid) throw new Error("An order UUID is required.");
    if (!status) throw new Error("A new order status is required.");
    const base = getEndpoint("orders").replace(/\/$/, "");
    if (!base) {
        const error = new Error("No API endpoint is configured for orders.");
        error.code = "ENDPOINT_NOT_CONFIGURED";
        throw error;
    }
    return adminRequest({
        endpoint: `${base}/${encodeURIComponent(orderUuid)}/status/`,
        method: "PATCH",
        body: { status },
    });
}

export async function cancelAdminOrder(orderUuid) {
    if (!orderUuid) throw new Error("An order UUID is required.");
    const base = getEndpoint("orders").replace(/\/$/, "");
    if (!base) {
        const error = new Error("No API endpoint is configured for orders.");
        error.code = "ENDPOINT_NOT_CONFIGURED";
        throw error;
    }
    return adminRequest({
        endpoint: `${base}/${encodeURIComponent(orderUuid)}/cancel/`,
        method: "POST",
    });
}

/*
 * ADMIN CUSTOMERS — documented in API_CONTRACT.md
 *
 * GET /api/v1/customers/admin/?page=1&page_size=10&search=...
 * GET /api/v1/customers/admin/<customer_uuid>/
 *
 * Read-only endpoints. Backend authorization remains authoritative.
 */
export async function getAdminCustomers(options = {}) {
    const endpoint = getEndpoint("customers");

    if (!endpoint) {
        const error = new Error("No API endpoint is configured for customers.");
        error.code = "ENDPOINT_NOT_CONFIGURED";
        throw error;
    }

    const {
        page = 1,
        page_size = 10,
        search,
    } = options;

    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safePageSize = Math.min(50, Math.max(1, Number.parseInt(page_size, 10) || 10));
    const params = new URLSearchParams({
        page: String(safePage),
        page_size: String(safePageSize),
    });

    if (search !== undefined && search !== null && String(search).trim()) {
        params.set("search", String(search).trim());
    }

    return adminRequest({
        endpoint: `${endpoint}?${params.toString()}`,
        method: "GET",
    });
}

export async function getAdminCustomer(customerId) {
    if (!customerId) {
        throw new Error("A customer UUID is required.");
    }

    const endpoint = getEndpoint("customers");
    if (!endpoint) {
        const error = new Error("No API endpoint is configured for customers.");
        error.code = "ENDPOINT_NOT_CONFIGURED";
        throw error;
    }

    const base = endpoint.replace(/\/$/, "");
    return adminRequest({
        endpoint: `${base}/${encodeURIComponent(customerId)}/`,
        method: "GET",
    });
}
