import {
    API_URL,
    getCsrfToken,
} from "./adminAuthService";


const CONTACT_SUBMIT_ENDPOINT =
    import.meta.env.VITE_CONTACT_SUBMIT_ENDPOINT ||
    "";


export async function submitContactMessage(payload) {
    if (!CONTACT_SUBMIT_ENDPOINT) {
        const error = new Error(
            "The public Contact form submission endpoint has not been configured yet."
        );
        error.code = "CONTACT_ENDPOINT_NOT_CONFIGURED";
        throw error;
    }

    const csrfToken = await getCsrfToken();

    const endpoint = CONTACT_SUBMIT_ENDPOINT.startsWith("http")
        ? CONTACT_SUBMIT_ENDPOINT
        : `${API_URL}${CONTACT_SUBMIT_ENDPOINT.startsWith("/") ? "" : "/"}${CONTACT_SUBMIT_ENDPOINT}`;

    const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(csrfToken
                ? { "X-CSRFToken": csrfToken }
                : {}),
        },
        body: JSON.stringify(payload),
    });

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data?.detail ||
            data?.error ||
            data?.message ||
            data?.errors?.error?.[0] ||
            `Contact request failed with status ${response.status}.`
        );
    }

    return data;
}


export { CONTACT_SUBMIT_ENDPOINT };
