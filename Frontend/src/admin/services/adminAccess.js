/* =========================================================
   GEEKA ADMIN ACCESS
========================================================= */


/* =========================================================
   OFFICIAL ADMIN EMAIL
========================================================= */

const OFFICIAL_ADMIN_EMAIL =
    import.meta.env.VITE_ADMIN_EMAIL ||
    "geekashop.official@gmail.com";


/* =========================================================
   NORMALIZE EMAIL
========================================================= */

function normalizeEmail(email) {

    return String(
        email || ""
    )
        .trim()
        .toLowerCase();

}


/* =========================================================
   CHECK OFFICIAL ADMIN EMAIL
========================================================= */

function isOfficialAdminEmail(user) {

    const userEmail =
        normalizeEmail(
            user?.email
        );

    const adminEmail =
        normalizeEmail(
            OFFICIAL_ADMIN_EMAIL
        );

    return (
        Boolean(userEmail) &&
        Boolean(adminEmail) &&
        userEmail === adminEmail
    );

}


/* =========================================================
   CHECK BACKEND ADMIN / STAFF PERMISSION
=========================================================

   The backend should eventually provide a clearly
   documented admin/staff permission field.

   This function supports several common response
   structures so the frontend can work with the current
   backend while keeping backend permission information
   as the preferred source.
========================================================= */

function hasBackendAdminPermission(user) {

    if (!user) {
        return false;
    }


    /* -----------------------------------------------------
       EXPLICIT BOOLEAN FIELDS
    ----------------------------------------------------- */

    if (
        user.is_staff === true ||
        user.is_admin === true ||
        user.is_superuser === true
    ) {
        return true;
    }


    /* -----------------------------------------------------
       ROLE FIELDS
    ----------------------------------------------------- */

    const roles = [
        user.role,
        user.user_role,
        user.account_role,
        user.permission,
        user.access_level,
    ];


    const normalizedRoles =
        roles
            .filter(Boolean)
            .map(
                (value) =>
                    String(value)
                        .trim()
                        .toLowerCase()
            );


    if (
        normalizedRoles.includes(
            "admin"
        ) ||
        normalizedRoles.includes(
            "administrator"
        ) ||
        normalizedRoles.includes(
            "staff"
        ) ||
        normalizedRoles.includes(
            "superadmin"
        ) ||
        normalizedRoles.includes(
            "super_admin"
        )
    ) {
        return true;
    }


    /* -----------------------------------------------------
       PERMISSIONS ARRAY
    ----------------------------------------------------- */

    const permissions =
        Array.isArray(
            user.permissions
        )
            ? user.permissions
            : [];


    const normalizedPermissions =
        permissions
            .map(
                (permission) => {

                    if (
                        typeof permission ===
                        "string"
                    ) {

                        return permission
                            .trim()
                            .toLowerCase();

                    }


                    if (
                        permission &&
                        typeof permission ===
                        "object"
                    ) {

                        return String(
                            permission.name ||
                            permission.codename ||
                            permission.permission ||
                            ""
                        )
                            .trim()
                            .toLowerCase();

                    }


                    return "";

                }
            )
            .filter(Boolean);


    if (
        normalizedPermissions.includes(
            "admin"
        ) ||
        normalizedPermissions.includes(
            "administrator"
        ) ||
        normalizedPermissions.includes(
            "staff"
        ) ||
        normalizedPermissions.includes(
            "manage_store"
        ) ||
        normalizedPermissions.includes(
            "manage_storefront"
        )
    ) {
        return true;
    }


    return false;

}


/* =========================================================
   MAIN ADMIN ACCESS CHECK
========================================================= */

export function canAccessAdmin(user) {

    if (!user) {
        return false;
    }


    /*
     * Prefer explicit backend permission.
     */

    if (
        hasBackendAdminPermission(
            user
        )
    ) {
        return true;
    }


    /*
     * Temporary fallback for the current
     * API contract.
     *
     * Your current /auth/me/ response does not yet
     * document an admin/staff field.
     */

    return isOfficialAdminEmail(
        user
    );

}


/* =========================================================
   HEADER COMPATIBILITY EXPORT
=========================================================

   Your Header.jsx currently imports `isAdminUser`.
   Keep this alias so Header.jsx works without changing
   its import name.
========================================================= */

export function isAdminUser(user) {

    return canAccessAdmin(
        user
    );

}


/* =========================================================
   CHECK OFFICIAL ADMIN
========================================================= */

export function isOfficialAdmin(user) {

    return isOfficialAdminEmail(
        user
    );

}


/* =========================================================
   GET ADMIN EMAIL
========================================================= */

export function getAdminEmail() {

    return OFFICIAL_ADMIN_EMAIL;

}


/* =========================================================
   GET ACCESS SOURCE
========================================================= */

export function getAdminAccessSource(user) {

    if (!user) {
        return "none";
    }


    if (
        hasBackendAdminPermission(
            user
        )
    ) {
        return "backend";
    }


    if (
        isOfficialAdminEmail(
            user
        )
    ) {
        return "official-email-fallback";
    }


    return "none";

}


/* =========================================================
   EXPORT DEFAULT
========================================================= */

export default {
    canAccessAdmin,
    isAdminUser,
    isOfficialAdmin,
    getAdminEmail,
    getAdminAccessSource,
};