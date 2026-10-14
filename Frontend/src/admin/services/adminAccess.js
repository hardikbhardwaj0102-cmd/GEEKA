/* =========================================================
   GEEKA ADMIN ACCESS
========================================================= */

/*
 * The API contract currently documents `is_staff` as the
 * backend's Django staff permission, but the current `/auth/me/`
 * response does not yet include it. Access is denied unless the
 * backend explicitly returns `is_staff: true`.
 *
 * This is a frontend visibility/route guard only. Every admin API
 * must independently enforce authenticated staff permissions.
 */

export function canAccessAdmin(user) {
    return Boolean(user && user.is_staff === true);
}

// Keep the existing Header.jsx import compatible.
export function isAdminUser(user) {
    return canAccessAdmin(user);
}

// Retained for compatibility with any other imports; email is NOT authorization.
export function isOfficialAdmin() {
    return false;
}

export function getAdminEmail() {
    return import.meta.env.VITE_ADMIN_EMAIL || "geekashop.official@gmail.com";
}

export function getAdminAccessSource(user) {
    return canAccessAdmin(user) ? "backend-is_staff" : "none";
}

export default {
    canAccessAdmin,
    isAdminUser,
    isOfficialAdmin,
    getAdminEmail,
    getAdminAccessSource,
};
