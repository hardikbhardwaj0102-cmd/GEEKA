import { API_URL, getCsrfToken } from "./adminAuthService";


/* =========================================================
   GEEKA ADMIN API SERVICE

   Product CRUD + product image upload are connected because
   those endpoints are finalized in the backend contract.

   The remaining admin resources are intentionally left
   unconfigured until their backend endpoints/schemas are
   finalized.
========================================================= */


const ENDPOINTS = {
    products:
        "/api/v1/catalog/admin/products/",

    // These remain empty until your friend finalizes them.
    categories: "",
    inventory: "",
    orders: "",
    customers: "",
    reviews: "",
    messages: "",
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

    return `${API_URL}${endpoint.startsWith("/")
            ? ""
            : "/"
        }${endpoint}`;
}


function getResourceEndpoint(
    key,
    resourceId = null
) {

    const endpoint =
        getEndpoint(key);

    if (!endpoint) {
        return "";
    }

    const normalized =
        endpoint.replace(
            /\/$/,
            ""
        );

    return resourceId
        ? `${normalized}/${resourceId}/`
        : `${normalized}/`;
}


/* =========================================================
   RESPONSE HANDLING
========================================================= */

async function parseResponse(
    response
) {

    let data = {};

    try {

        data =
            await response.json();

    } catch {

        data = {};

    }


    if (!response.ok) {

        let validationMessage =
            null;


        if (
            data?.errors &&
            typeof data.errors ===
            "object"
        ) {

            for (
                const value of
                Object.values(
                    data.errors
                )
            ) {

                if (
                    Array.isArray(
                        value
                    )
                ) {

                    validationMessage =
                        value.find(
                            Boolean
                        );

                } else if (
                    value
                ) {

                    validationMessage =
                        value;
                }


                if (
                    validationMessage
                ) {
                    break;
                }
            }
        }


        const message =
            data?.detail ||
            data?.error ||
            data?.message ||
            validationMessage ||
            `Request failed with status ${response.status}.`;


        const error =
            new Error(
                String(message)
            );


        error.status =
            response.status;

        error.data =
            data;


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

    const url =
        resolveEndpoint(
            endpoint
        );


    if (!url) {

        const error =
            new Error(
                "This admin API endpoint has not been configured yet."
            );


        error.code =
            "ENDPOINT_NOT_CONFIGURED";


        throw error;
    }


    const requestHeaders = {
        Accept:
            "application/json",

        ...headers,
    };


    let requestBody =
        body;


    /*
     * Do NOT set Content-Type for FormData.
     * The browser must add the multipart boundary itself.
     */

    if (!isFormData) {

        requestHeaders[
            "Content-Type"
        ] =
            "application/json";
    }


    const stateChangingMethods = [
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
    ];


    if (
        stateChangingMethods.includes(
            method.toUpperCase()
        )
    ) {

        const csrfToken =
            await getCsrfToken();


        if (csrfToken) {

            requestHeaders[
                "X-CSRFToken"
            ] =
                csrfToken;
        }
    }


    if (
        !isFormData &&
        body !== undefined
    ) {

        requestBody =
            JSON.stringify(
                body
            );
    }


    const response =
        await fetch(
            url,
            {
                method,

                credentials:
                    "include",

                headers:
                    requestHeaders,

                body:
                    requestBody,
            }
        );


    return parseResponse(
        response
    );
}


/* =========================================================
   ENDPOINT HELPERS
========================================================= */

export function isEndpointConfigured(
    key
) {

    return Boolean(
        ENDPOINTS[key]
    );
}


export function getEndpoint(
    key
) {

    return (
        ENDPOINTS[key] ||
        ""
    );
}


/* =========================================================
   GENERIC COLLECTION GET
========================================================= */

export async function getAdminCollection(
    key,
    options = {}
) {

    const endpoint =
        getEndpoint(key);


    if (!endpoint) {

        const error =
            new Error(
                `No API endpoint is configured for ${key}.`
            );


        error.code =
            "ENDPOINT_NOT_CONFIGURED";


        throw error;
    }


    return adminRequest({

        endpoint,

        method:
            "GET",

        ...options,
    });
}


/* =========================================================
   GENERIC RESOURCE GET
========================================================= */

export async function getAdminResource(
    key,
    resourceId
) {

    if (!resourceId) {

        throw new Error(
            "A resource ID is required."
        );
    }


    const endpoint =
        getResourceEndpoint(
            key,
            resourceId
        );


    if (!endpoint) {

        const error =
            new Error(
                `No API endpoint is configured for ${key}.`
            );


        error.code =
            "ENDPOINT_NOT_CONFIGURED";


        throw error;
    }


    return adminRequest({

        endpoint,

        method:
            "GET",
    });
}


/* =========================================================
   GENERIC CREATE
========================================================= */

export async function createAdminResource(
    key,
    payload
) {

    const endpoint =
        getEndpoint(key);


    if (!endpoint) {

        const error =
            new Error(
                `No API endpoint is configured for ${key}.`
            );


        error.code =
            "ENDPOINT_NOT_CONFIGURED";


        throw error;
    }


    return adminRequest({

        endpoint,

        method:
            "POST",

        body:
            payload,
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

        throw new Error(
            "A resource ID is required."
        );
    }


    const endpoint =
        getResourceEndpoint(
            key,
            resourceId
        );


    if (!endpoint) {

        const error =
            new Error(
                `No API endpoint is configured for ${key}.`
            );


        error.code =
            "ENDPOINT_NOT_CONFIGURED";


        throw error;
    }


    return adminRequest({

        endpoint,

        method:
            "PATCH",

        body:
            payload,
    });
}


/* =========================================================
   GENERIC DELETE
========================================================= */

export async function deleteAdminResource(
    key,
    resourceId
) {

    if (!resourceId) {

        throw new Error(
            "A resource ID is required."
        );
    }


    const endpoint =
        getResourceEndpoint(
            key,
            resourceId
        );


    if (!endpoint) {

        const error =
            new Error(
                `No API endpoint is configured for ${key}.`
            );


        error.code =
            "ENDPOINT_NOT_CONFIGURED";


        throw error;
    }


    return adminRequest({

        endpoint,

        method:
            "DELETE",
    });
}


/* =========================================================
   PRODUCTS — EXPLICIT HELPERS

   Finalized endpoints:

   GET   /api/v1/catalog/admin/products/
   GET   /api/v1/catalog/admin/products/<id>/
   POST  /api/v1/catalog/admin/products/
   PATCH /api/v1/catalog/admin/products/<id>/
========================================================= */

export async function getAdminProducts() {

    return getAdminCollection(
        "products"
    );
}


export async function getAdminProduct(
    productId
) {

    return getAdminResource(
        "products",
        productId
    );
}


export async function createAdminProduct(
    payload
) {

    return createAdminResource(
        "products",
        payload
    );
}


export async function updateAdminProduct(
    productId,
    payload
) {

    return updateAdminResource(
        "products",
        productId,
        payload
    );
}


/* =========================================================
   PRODUCT STATUS

   PATCH
   /api/v1/catalog/admin/products/<id>/status/
========================================================= */

export async function updateAdminProductStatus(
    productId,
    status
) {

    if (!productId) {

        throw new Error(
            "A product ID is required."
        );
    }


    if (!status) {

        throw new Error(
            "A product status is required."
        );
    }


    const base =
        getEndpoint(
            "products"
        ).replace(
            /\/$/,
            ""
        );


    return adminRequest({

        endpoint:
            `${base}/${productId}/status/`,

        method:
            "PATCH",

        body: {
            status,
        },
    });
}


/* =========================================================
   PRODUCT IMAGES — FINALIZED

   POST
   /api/v1/catalog/admin/products/<id>/images/
========================================================= */

export async function uploadProductImage({
    productId,
    file,
    displayOrder = 0,
    isPrimary = false,
}) {

    if (!productId) {

        throw new Error(
            "A product ID is required."
        );
    }


    if (
        !(file instanceof File)
    ) {

        throw new Error(
            "Please select a valid image file."
        );
    }


    const formData =
        new FormData();


    formData.append(
        "image_file",
        file
    );


    formData.append(
        "display_order",
        String(
            displayOrder
        )
    );


    formData.append(
        "is_primary",
        String(
            Boolean(
                isPrimary
            )
        )
    );


    return adminRequest({

        endpoint:
            `/api/v1/catalog/admin/products/${productId}/images/`,

        method:
            "POST",

        body:
            formData,

        isFormData:
            true,
    });
}


/* =========================================================
   EXPORT ENDPOINTS
========================================================= */

export {
    ENDPOINTS,
};