import { useLocation } from "react-router-dom";

import "../style/AdminLayout.css";


const pageMap = [
    ["/admin", "Dashboard", "Store overview and activity."],
    ["/admin/products/new", "Add Product", "Create a new catalogue product."],
    ["/admin/products", "Products", "Manage products, variants and images."],
    ["/admin/categories", "Categories", "Organize your product catalogue."],
    ["/admin/inventory", "Inventory", "Monitor stock and low-stock items."],
    ["/admin/orders", "Orders", "Track customer orders and fulfilment."],
    ["/admin/customers", "Customers", "Review customer accounts and activity."],
    ["/admin/reviews", "Reviews", "Moderate product reviews."],
    ["/admin/messages", "Messages", "Manage website enquiries and suggestions."],
    ["/admin/settings", "Settings", "Manage admin and store configuration."],
];


function getPage(pathname) {
    const exact = pageMap.find(([path]) => pathname === path);

    if (exact) {
        return { title: exact[1], description: exact[2] };
    }

    if (pathname.startsWith("/admin/products/")) {
        return {
            title: "Edit Product",
            description: "Update catalogue information, variants and images.",
        };
    }

    return {
        title: "Admin",
        description: "Geeka store administration.",
    };
}


export default function AdminHeader({ user, onMenuClick }) {
    const location = useLocation();
    const page = getPage(location.pathname);

    const name = user?.full_name || user?.email || "Administrator";
    const initials = name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("") || "A";

    return (
        <header className="admin-header">
            <div className="admin-header-left">
                <button
                    type="button"
                    className="admin-menu-button"
                    aria-label="Open admin navigation"
                    onClick={onMenuClick}
                >
                    <span />
                    <span />
                    <span />
                </button>

                <div className="admin-page-heading">
                    <h1>{page.title}</h1>
                    <p>{page.description}</p>
                </div>
            </div>

            <div className="admin-header-right">
                <div className="admin-header-account">
                    <div className="admin-header-avatar">{initials}</div>
                    <div className="admin-header-user">
                        <strong>{name}</strong>
                        <span>Administrator</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
