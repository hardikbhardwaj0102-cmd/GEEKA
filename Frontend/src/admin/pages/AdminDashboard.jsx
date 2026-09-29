import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";

import {
    getAdminCollection,
    isEndpointConfigured,
} from "../services/adminApi";

import "../style/AdminPages.css";


function MetricCard({ label, value, note, tone = "neutral" }) {
    return (
        <article className={`admin-metric-card admin-tone-${tone}`}>
            <div className="admin-metric-label">{label}</div>
            <div className="admin-metric-value">{value}</div>
            <div className="admin-metric-note">{note}</div>
        </article>
    );
}


function extractList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    return [];
}


function countValue(data) {
    if (typeof data === "number") return data;
    if (typeof data?.count === "number") return data.count;
    if (typeof data?.total === "number") return data.total;
    if (typeof data?.count === "string") return data.count;
    if (Array.isArray(data)) return data.length;
    if (Array.isArray(data?.results)) return data.results.length;
    if (Array.isArray(data?.items)) return data.items.length;
    return "—";
}


export default function AdminDashboard() {
    const { user } = useOutletContext();

    const [data, setData] = useState({
        products: null,
        inventory: null,
        orders: null,
        customers: null,
        reviews: null,
        messages: null,
        categories: null,
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const loadDashboard = useCallback(async () => {
        const keys = [
            "products",
            "categories",
            "inventory",
            "orders",
            "customers",
            "reviews",
            "messages",
        ];

        const configured = keys.filter(isEndpointConfigured);

        if (!configured.length) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setErrors({});

        const responses = await Promise.allSettled(
            configured.map(async (key) => [key, await getAdminCollection(key)])
        );

        const nextData = {};
        const nextErrors = {};

        responses.forEach((result, index) => {
            const key = configured[index];

            if (result.status === "fulfilled") {
                nextData[result.value[0]] = result.value[1];
            } else {
                nextData[key] = null;
                nextErrors[key] = result.reason?.message || "Unable to load data.";
            }
        });

        setData((current) => ({ ...current, ...nextData }));
        setErrors(nextErrors);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const firstName = useMemo(
        () => (user?.full_name || user?.email || "Administrator").split(" ")[0],
        [user]
    );

    const recentMessages = extractList(data.messages).slice(0, 5);
    const recentOrders = extractList(data.orders).slice(0, 5);

    return (
        <div className="admin-page">
            <section className="admin-hero-card">
                <div>
                    <div className="admin-eyebrow">STORE CONTROL CENTER</div>
                    <h2>Good to see you, {firstName}.</h2>
                    <p>
                        Manage the catalogue, fulfilment, customers and customer
                        communication from one place.
                    </p>
                </div>

                <div className="admin-hero-actions">
                    <Link className="admin-button admin-button-primary" to="/admin/products/new">
                        Add product
                    </Link>
                    <Link className="admin-button admin-button-secondary" to="/admin/messages">
                        Open inbox
                    </Link>
                </div>
            </section>

            <section className="admin-section-block">
                <div className="admin-section-title-row">
                    <div>
                        <div className="admin-eyebrow">LIVE OVERVIEW</div>
                        <h3>Store health</h3>
                    </div>
                    <button
                        type="button"
                        className="admin-text-button"
                        onClick={loadDashboard}
                        disabled={loading}
                    >
                        {loading ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                <div className="admin-metric-grid">
                    <MetricCard
                        label="Products"
                        value={countValue(data.products)}
                        note={errors.products || "From admin catalogue API"}
                    />
                    <MetricCard
                        label="Categories"
                        value={countValue(data.categories)}
                        note={errors.categories || "From catalogue API"}
                    />
                    <MetricCard
                        label="Orders"
                        value={countValue(data.orders)}
                        note={errors.orders || "From order API"}
                    />
                    <MetricCard
                        label="Customers"
                        value={countValue(data.customers)}
                        note={errors.customers || "From customer API"}
                    />
                    <MetricCard
                        label="Inventory"
                        value={countValue(data.inventory)}
                        note={errors.inventory || "Stock source of truth is Django"}
                    />
                    <MetricCard
                        label="Reviews"
                        value={countValue(data.reviews)}
                        note={errors.reviews || "From moderation API"}
                        tone="soft"
                    />
                    <MetricCard
                        label="Messages"
                        value={countValue(data.messages)}
                        note={errors.messages || "Website enquiries and suggestions"}
                        tone="soft"
                    />
                </div>
            </section>

            <section className="admin-dashboard-two-column">
                <div className="admin-panel-card">
                    <div className="admin-panel-heading">
                        <div>
                            <div className="admin-eyebrow">CUSTOMER COMMUNICATION</div>
                            <h3>Recent messages</h3>
                        </div>
                        <Link to="/admin/messages" className="admin-link">View inbox</Link>
                    </div>

                    {!isEndpointConfigured("messages") ? (
                        <EmptyState
                            title="Messages API not connected"
                            text="Add the finalized contact-message endpoint when your Django API contract is ready."
                        />
                    ) : recentMessages.length === 0 ? (
                        <EmptyState
                            title="No messages yet"
                            text="Customer questions and suggestions will appear here."
                        />
                    ) : (
                        <div className="admin-list">
                            {recentMessages.map((item, index) => (
                                <div className="admin-list-row" key={item.id || index}>
                                    <div>
                                        <strong>{item.name || item.email || "Customer"}</strong>
                                        <span>{item.subject || item.title || "Website enquiry"}</span>
                                    </div>
                                    <small>{item.status || "NEW"}</small>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="admin-panel-card">
                    <div className="admin-panel-heading">
                        <div>
                            <div className="admin-eyebrow">FULFILMENT</div>
                            <h3>Recent orders</h3>
                        </div>
                        <Link to="/admin/orders" className="admin-link">View orders</Link>
                    </div>

                    {!isEndpointConfigured("orders") ? (
                        <EmptyState
                            title="Orders API not connected"
                            text="Connect the finalized Django order endpoint to populate this panel."
                        />
                    ) : recentOrders.length === 0 ? (
                        <EmptyState
                            title="No orders yet"
                            text="New orders will appear here when the backend order API is connected."
                        />
                    ) : (
                        <div className="admin-list">
                            {recentOrders.map((item, index) => (
                                <div className="admin-list-row" key={item.id || index}>
                                    <div>
                                        <strong>{item.order_number || item.id || "Order"}</strong>
                                        <span>{item.customer_name || item.email || "Customer"}</span>
                                    </div>
                                    <small>{item.status || "—"}</small>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section className="admin-panel-card admin-quick-actions-panel">
                <div className="admin-panel-heading">
                    <div>
                        <div className="admin-eyebrow">QUICK ACTIONS</div>
                        <h3>Get things done</h3>
                    </div>
                </div>

                <div className="admin-action-grid">
                    <Link to="/admin/products/new" className="admin-action-card">
                        <span>Add product</span>
                        <strong>Create catalogue item</strong>
                        <small>Product details, variants and images.</small>
                    </Link>
                    <Link to="/admin/inventory" className="admin-action-card">
                        <span>Inventory</span>
                        <strong>Check stock</strong>
                        <small>Review low-stock and unavailable variants.</small>
                    </Link>
                    <Link to="/admin/messages" className="admin-action-card">
                        <span>Messages</span>
                        <strong>Respond to customers</strong>
                        <small>Handle questions, suggestions and enquiries.</small>
                    </Link>
                    <Link to="/admin/reviews" className="admin-action-card">
                        <span>Reviews</span>
                        <strong>Moderate reviews</strong>
                        <small>Approve or reject pending submissions.</small>
                    </Link>
                </div>
            </section>
        </div>
    );
}


function EmptyState({ title, text }) {
    return (
        <div className="admin-empty-state">
            <strong>{title}</strong>
            <p>{text}</p>
        </div>
    );
}
