import {
    useState,
} from "react";

import {
    NavLink,
    useNavigate,
} from "react-router-dom";

import {
    logoutAdmin,
} from "../services/adminAuthService";

import "../style/AdminLayout.css";


function Icon({ type }) {
    const paths = {
        grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
        products: <><path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5v-9Z" /><path d="M4 7.5 12 11l8-3.5M12 11v9" /></>,
        categories: <><path d="M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z" /></>,
        inventory: <><path d="M4 7h16v13H4z" /><path d="M8 7V5h8v2M8 11h8M8 15h5" /></>,
        orders: <><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
        customers: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20c.7-4 2.5-6 5.5-6s4.8 2 5.5 6" /><path d="M15 5.5a3 3 0 0 1 0 5.8M17 14.5c2.1.8 3.2 2.4 3.5 4.5" /></>,
        reviews: <><path d="M4 5h16v11H8l-4 4V5Z" /><path d="M8 9h8M8 12h5" /></>,
        messages: <><path d="M4 5h16v12H8l-4 3V5Z" /><path d="M8 9h8M8 12h6" /></>,
        settings: <><path d="M12 4v3M12 17v3M4 12h3M17 12h3" /><circle cx="12" cy="12" r="4" /><path d="m6.3 6.3 2.1 2.1M15.6 15.6l2.1 2.1M17.7 6.3l-2.1 2.1M8.4 15.6l-2.1 2.1" /></>,
        store: <><path d="M4 10h16v10H4z" /><path d="M3 10 5 4h14l2 6M8 10v3M16 10v3" /></>,
        logout: <><path d="M10 5H5v14h5" /><path d="M13 8l4 4-4 4M17 12H9" /></>,
    };

    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            {paths[type]}
        </svg>
    );
}


const nav = [
    {
        title: "Overview",
        items: [
            { to: "/admin", label: "Dashboard", icon: "grid", end: true },
        ],
    },
    {
        title: "Catalogue",
        items: [
            { to: "/admin/products", label: "Products", icon: "products" },
            { to: "/admin/categories", label: "Categories", icon: "categories" },
        ],
    },
    {
        title: "Operations",
        items: [
            { to: "/admin/inventory", label: "Inventory", icon: "inventory" },
            { to: "/admin/orders", label: "Orders", icon: "orders" },
            { to: "/admin/customers", label: "Customers", icon: "customers" },
            { to: "/admin/reviews", label: "Reviews", icon: "reviews" },
            { to: "/admin/messages", label: "Messages", icon: "messages" },
        ],
    },
    {
        title: "Configuration",
        items: [
            { to: "/admin/settings", label: "Settings", icon: "settings" },
        ],
    },
];


export default function AdminSidebar({ user, onClose }) {
    const navigate = useNavigate();
    const [logoutLoading, setLogoutLoading] = useState(false);

    async function handleLogout() {
        if (logoutLoading) {
            return;
        }

        setLogoutLoading(true);

        try {
            await logoutAdmin();

            const keys = [
                "geeka-auth",
                "geeka-user",
                "access_token",
                "refresh_token",
                "token",
            ];

            keys.forEach((key) => {
                try {
                    localStorage.removeItem(key);
                } catch {
                    // Ignore local storage errors.
                }
            });

            window.dispatchEvent(new Event("geeka-auth-updated"));

            navigate("/login", { replace: true });
        } catch (error) {
            console.error("GEEKA admin logout failed:", error);
        } finally {
            setLogoutLoading(false);
        }
    }

    const name = user?.full_name || user?.email || "Administrator";
    const initial = name.trim().charAt(0).toUpperCase() || "A";

    return (
        <aside className="admin-sidebar">
            <div className="admin-sidebar-brand">
                <div className="admin-brand-symbol">G</div>
                <div className="admin-brand-text">
                    <strong>GEEKA</strong>
                    <span>ADMIN</span>
                </div>
                <button
                    type="button"
                    className="admin-sidebar-close"
                    aria-label="Close navigation"
                    onClick={onClose}
                >
                    ×
                </button>
            </div>

            <div className="admin-sidebar-user">
                <div className="admin-user-avatar">{initial}</div>
                <div className="admin-user-details">
                    <strong>{name}</strong>
                    <span>Store administration</span>
                </div>
            </div>

            <nav className="admin-sidebar-navigation">
                {nav.map((section) => (
                    <div className="admin-nav-section" key={section.title}>
                        <p className="admin-nav-section-title">{section.title}</p>

                        {section.items.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    `admin-nav-item ${isActive ? "admin-nav-item-active" : ""
                                    }`
                                }
                            >
                                <span className="admin-nav-icon">
                                    <Icon type={item.icon} />
                                </span>
                                <span className="admin-nav-label">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="admin-sidebar-bottom">
                <button
                    type="button"
                    className="admin-sidebar-action"
                    onClick={() => navigate("/")}
                >
                    <span className="admin-nav-icon">
                        <Icon type="store" />
                    </span>
                    <span>View Store</span>
                </button>

                <button
                    type="button"
                    className="admin-sidebar-action admin-logout-action"
                    onClick={handleLogout}
                    disabled={logoutLoading}
                >
                    <span className="admin-nav-icon">
                        <Icon type="logout" />
                    </span>
                    <span>{logoutLoading ? "Signing out..." : "Logout"}</span>
                </button>
            </div>
        </aside>
    );
}
