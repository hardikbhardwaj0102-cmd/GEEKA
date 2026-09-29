const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://geeka-backend.onrender.com";


export { API_URL };


export async function getCsrfToken() {
    const response = await fetch(
        `${API_URL}/api/v1/auth/csrf/`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                Accept: "application/json",
            },
        }
    );

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data?.error ||
            data?.message ||
            `Unable to obtain CSRF token. Status ${response.status}.`
        );
    }

    return data?.csrfToken || null;
}


export async function getCurrentUser() {
    const response = await fetch(
        `${API_URL}/api/v1/auth/me/`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                Accept: "application/json",
            },
        }
    );

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (
        response.status === 401 ||
        response.status === 403
    ) {
        return null;
    }

    if (!response.ok) {
        throw new Error(
            data?.error ||
            data?.message ||
            `Unable to load current user. Status ${response.status}.`
        );
    }

    return data?.user || null;
}


export async function loginAdmin({
    email,
    password,
}) {
    const csrfToken = await getCsrfToken();

    const response = await fetch(
        `${API_URL}/api/v1/auth/login/`,
        {
            method: "POST",
            credentials: "include",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                ...(csrfToken
                    ? { "X-CSRFToken": csrfToken }
                    : {}),
            },
            body: JSON.stringify({
                email,
                password,
            }),
        }
    );

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data?.error ||
            data?.message ||
            data?.detail ||
            data?.errors?.error?.[0] ||
            `Login failed with status ${response.status}.`
        );
    }

    return data;
}


export async function logoutAdmin() {
    const csrfToken = await getCsrfToken();

    const response = await fetch(
        `${API_URL}/api/v1/auth/logout/`,
        {
            method: "POST",
            credentials: "include",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                ...(csrfToken
                    ? { "X-CSRFToken": csrfToken }
                    : {}),
            },
        }
    );

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (
        !response.ok &&
        response.status !== 401
    ) {
        throw new Error(
            data?.error ||
            data?.message ||
            "Logout failed."
        );
    }

    return true;
}
