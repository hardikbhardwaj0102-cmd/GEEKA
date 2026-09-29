import {
    useEffect,
    useState,
} from "react";

import {
    Navigate,
    Outlet,
    useLocation,
    useNavigate,
} from "react-router-dom";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

import { getCurrentUser } from "../services/adminAuthService";

import "../style/AdminLayout.css";


/*
|--------------------------------------------------------------------------
| DEVELOPMENT ADMIN MODE
|--------------------------------------------------------------------------
|
| Because the backend admin/staff API is not ready yet, local development
| automatically uses a temporary admin user.
|
| To disable it manually:
|
| VITE_ADMIN_DEMO_MODE=false
|
|--------------------------------------------------------------------------
*/

const ADMIN_DEMO_MODE =
    import.meta.env.DEV &&
    import.meta.env.VITE_ADMIN_DEMO_MODE !== "false";


/* =========================================================
   COMPONENT
========================================================= */

export default function AdminLayout() {

    const navigate =
        useNavigate();

    const location =
        useLocation();


    /* =====================================================
       STATE
    ===================================================== */

    const [
        sidebarOpen,
        setSidebarOpen,
    ] = useState(false);


    const [
        authLoading,
        setAuthLoading,
    ] = useState(true);


    const [
        user,
        setUser,
    ] = useState(null);


    const [
        authError,
        setAuthError,
    ] = useState("");


    /* =====================================================
       SESSION CHECK
    ===================================================== */

    useEffect(() => {

        let cancelled = false;


        async function checkSession() {

            setAuthLoading(true);

            setAuthError("");


            /*
            |--------------------------------------------------------------------------
            | DEMO ADMIN
            |--------------------------------------------------------------------------
            */

            if (ADMIN_DEMO_MODE) {

                setUser({

                    id: "demo-admin",

                    full_name:
                        "Geeka Admin",

                    email:
                        "geekashop.official@gmail.com",

                    email_verified:
                        true,

                    is_staff:
                        true,

                    is_admin:
                        true,

                    is_superuser:
                        true,

                });

                setAuthLoading(false);

                return;
            }


            /*
            |--------------------------------------------------------------------------
            | REAL BACKEND SESSION
            |--------------------------------------------------------------------------
            */

            try {

                const currentUser =
                    await getCurrentUser();


                if (cancelled) {
                    return;
                }


                if (!currentUser) {

                    navigate(
                        "/login",
                        {
                            replace: true,

                            state: {
                                from:
                                    `${location.pathname}${location.search}`,
                            },
                        }
                    );

                    return;
                }


                setUser(
                    currentUser
                );

            } catch (error) {

                if (!cancelled) {

                    setAuthError(
                        error?.message ||
                        "Unable to verify the admin session."
                    );
                }

            } finally {

                if (!cancelled) {

                    setAuthLoading(
                        false
                    );
                }
            }
        }


        checkSession();


        return () => {

            cancelled = true;

        };

    }, [
        navigate,
        location.pathname,
        location.search,
    ]);


    /* =====================================================
       CLOSE MOBILE SIDEBAR ON ROUTE CHANGE
    ===================================================== */

    useEffect(() => {

        setSidebarOpen(false);

    }, [
        location.pathname,
    ]);


    /* =====================================================
       LOADING
    ===================================================== */

    if (authLoading) {

        return (

            <div className="admin-loading-screen">

                <div className="admin-loading-card">

                    <div className="admin-loading-mark">
                        G
                    </div>

                    <div className="admin-loading-spinner" />

                    <p>
                        Loading Geeka Admin...
                    </p>

                </div>

            </div>
        );
    }


    /* =====================================================
       AUTH ERROR
    ===================================================== */

    if (authError) {

        return (

            <div className="admin-error-screen">

                <div className="admin-error-card">

                    <div className="admin-error-mark">
                        !
                    </div>

                    <h1>
                        Unable to load admin panel
                    </h1>

                    <p>
                        {authError}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            window.location.reload()
                        }
                    >
                        Try Again
                    </button>

                </div>

            </div>
        );
    }


    /* =====================================================
       NO USER
    ===================================================== */

    if (!user) {

        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }


    /* =====================================================
       ADMIN LAYOUT
    ===================================================== */

    return (

        <div
            className={
                `admin-app ${sidebarOpen
                    ? "admin-sidebar-open"
                    : ""
                }`
            }
        >

            {/* =================================================
                SIDEBAR
            ================================================== */}

            <AdminSidebar
                user={user}
                onClose={() =>
                    setSidebarOpen(false)
                }
            />


            {/* =================================================
                MAIN
            ================================================== */}

            <div className="admin-main">


                {/* =================================================
                    HEADER
                ================================================== */}

                <AdminHeader
                    user={user}
                    onMenuClick={() =>
                        setSidebarOpen(true)
                    }
                />


                {/* =================================================
                    CONTENT
                ================================================== */}

                <main className="admin-content">

                    <Outlet
                        context={{
                            user,
                        }}
                    />

                </main>


            </div>


            {/* =================================================
                MOBILE OVERLAY
            ================================================== */}

            {sidebarOpen && (

                <button
                    type="button"
                    className="admin-sidebar-overlay"
                    aria-label="Close admin navigation"
                    onClick={() =>
                        setSidebarOpen(false)
                    }
                />

            )}

        </div>
    );
}