import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
    getAdminCollection,
    isEndpointConfigured,
} from "../services/adminApi";

import "../style/AdminPages.css";


const CONFIG = {
    categories: {
        eyebrow: "CATALOGUE",
        title: "Categories",
        description: "Organize products into the categories used by the storefront.",
        endpointKey: "categories",
        columns: ["Name", "Slug", "Status"],
    },
    inventory: {
        eyebrow: "OPERATIONS",
        title: "Inventory",
        description: "Monitor stock at the product-variant level.",
        endpointKey: "inventory",
        columns: ["Product", "SKU", "Stock", "Status"],
    },
    orders: {
        eyebrow: "OPERATIONS",
        title: "Orders",
        description: "Track customer orders and fulfilment status.",
        endpointKey: "orders",
        columns: ["Order", "Customer", "Total", "Status"],
    },
    customers: {
        eyebrow: "OPERATIONS",
        title: "Customers",
        description: "Review customer accounts and order activity.",
        endpointKey: "customers",
        columns: ["Customer", "Email", "Orders", "Joined"],
    },
    reviews: {
        eyebrow: "CUSTOMER VOICE",
        title: "Reviews",
        description: "Moderate product reviews. Official rating metrics remain backend-owned.",
        endpointKey: "reviews",
        columns: ["Customer", "Product", "Rating", "Status"],
    },
    messages: {
        eyebrow: "CUSTOMER COMMUNICATION",
        title: "Messages",
        description: "Customer questions, suggestions and enquiries from the website contact form.",
        endpointKey: "messages",
        columns: ["Sender", "Subject", "Status", "Received"],
    },
};


function listFromData(data) {
    if (Array.isArray(data)) return data;
    return data?.results || data?.items || data?.data || [];
}


function valueFor(item, key) {
    if (key === "Name") return item.name || item.title || "—";
    if (key === "Slug") return item.slug || "—";
    if (key === "Status") return item.status || "—";
    if (key === "Product") return item.product_name || item.product?.name || "—";
    if (key === "SKU") return item.sku || item.variant_sku || "—";
    if (key === "Stock") return item.stock ?? item.quantity ?? "—";
    if (key === "Order") return item.order_number || item.id || "—";
    if (key === "Customer") return item.customer_name || item.name || item.customer?.name || "—";
    if (key === "Email") return item.email || item.customer?.email || "—";
    if (key === "Total") return item.total ?? item.total_amount ?? "—";
    if (key === "Orders") return item.order_count ?? item.orders_count ?? "—";
    if (key === "Joined") return formatDate(item.created_at);
    if (key === "Rating") return item.rating ?? "—";
    if (key === "Sender") return item.name || item.email || "—";
    if (key === "Subject") return item.subject || "Website enquiry";
    if (key === "Received") return formatDate(item.created_at);
    return "—";
}


export default function AdminSectionPage({ section }) {
    const config = CONFIG[section];
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");

    const load = useCallback(async () => {
        if (!isEndpointConfigured(config.endpointKey)) {
            setItems([]);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const data = await getAdminCollection(config.endpointKey);
            setItems(listFromData(data));
        } catch (requestError) {
            setError(requestError?.message || "Unable to load data.");
        } finally {
            setLoading(false);
        }
    }, [config.endpointKey]);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = useMemo(() => {
        const search = query.trim().toLowerCase();
        if (!search) return items;

        return items.filter((item) =>
            JSON.stringify(item).toLowerCase().includes(search)
        );
    }, [items, query]);

    return (
        <div className="admin-page">
            <section className="admin-page-toolbar">
                <div>
                    <div className="admin-eyebrow">{config.eyebrow}</div>
                    <h2>{config.title}</h2>
                    <p>{config.description}</p>
                </div>

                <div className="admin-toolbar-actions">
                    <button
                        type="button"
                        className="admin-button admin-button-secondary"
                        onClick={load}
                        disabled={loading}
                    >
                        {loading ? "Refreshing..." : "Refresh"}
                    </button>

                    {section === "messages" && (
                        <Link to="/contact" className="admin-button admin-button-secondary">
                            View contact page
                        </Link>
                    )}
                </div>
            </section>

            {!isEndpointConfigured(config.endpointKey) ? (
                <div className="admin-integration-notice">
                    <div className="admin-integration-dot" />
                    <div>
                        <strong>{config.title} API is not connected yet</strong>
                        <p>
                            The frontend is ready for this section, but the current
                            API contract has not finalized its endpoint. No fake data
                            is being displayed.
                        </p>
                    </div>
                </div>
            ) : (
                <section className="admin-panel-card">
                    {error && <div className="admin-error-banner">{error}</div>}

                    <div className="admin-filter-row">
                        <input
                            className="admin-search-input"
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={`Search ${config.title.toLowerCase()}...`}
                        />
                    </div>

                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    {config.columns.map((column) => (
                                        <th key={column}>{column}</th>
                                    ))}
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={config.columns.length + 1}>
                                            <div className="admin-empty-state compact">
                                                <strong>No records found</strong>
                                                <p>
                                                    There are no records matching your current filter.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filtered.map((item, index) => (
                                    <tr key={item.id || index}>
                                        {config.columns.map((column) => (
                                            <td key={column}>
                                                {valueFor(item, column)}
                                            </td>
                                        ))}
                                        <td>
                                            <button
                                                type="button"
                                                className="admin-table-link-button"
                                                onClick={() => {
                                                    console.info("Admin record:", item);
                                                }}
                                            >
                                                Open
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}


function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString();
}
