import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";

import {
    getAdminCollection,
    getAdminProducts,
    getAdminProductVariants,
    isEndpointConfigured,
} from "../services/adminApi";

import "../style/AdminPages.css";
import "../style/AdminDashboard.css";


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
    if (Array.isArray(data?.variants)) return data.variants;
    if (Array.isArray(data?.products)) return data.products;
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


function getStockValue(variant) {
    const value = variant?.stock ?? variant?.stock_quantity ?? variant?.quantity ?? variant?.inventory_quantity;
    const number = Number(value);
    return Number.isFinite(number) && value !== null && value !== "" ? Math.max(0, number) : null;
}


function getThreshold(variant) {
    const value = variant?.low_stock_threshold ?? variant?.low_stock_alert ?? variant?.low_stock_limit ?? 5;
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, number) : 5;
}


function getProductName(product) {
    return product?.name || product?.title || product?.product_name || "Unnamed product";
}


function getVariantLabel(variant) {
    return (
        variant?.name ||
        variant?.variant_name ||
        variant?.sku ||
        variant?.label ||
        "Product variant"
    );
}


function getVariantId(variant, index) {
    return variant?.id ?? variant?.uuid ?? variant?.sku ?? `${getVariantLabel(variant)}-${index}`;
}


function InventorySummary({ inventory, loading, error }) {
    const metrics = inventory || {
        variants: null,
        units: null,
        lowStock: null,
        outOfStock: null,
        rows: [],
    };

    return (
        <section className="admin-inventory-overview">
            <div className="admin-inventory-overview-heading">
                <div>
                    <div className="admin-eyebrow">STOCK CONTROL</div>
                    <h3>Inventory overview</h3>
                    <p>Keep track of available stock and variants that need attention.</p>
                </div>
                <Link to="/admin/inventory" className="admin-inventory-view-link">
                    Manage inventory <span aria-hidden="true">→</span>
                </Link>
            </div>

            {error && (
                <div className="admin-inventory-inline-notice" role="status">
                    {error}
                </div>
            )}

            <div className="admin-inventory-metric-grid">
                <article className="admin-inventory-metric">
                    <span className="admin-inventory-metric-label">Variants tracked</span>
                    <strong>{loading ? "…" : metrics.variants ?? "—"}</strong>
                    <small>Product options in the catalogue</small>
                </article>
                <article className="admin-inventory-metric">
                    <span className="admin-inventory-metric-label">Units in stock</span>
                    <strong>{loading ? "…" : metrics.units ?? "—"}</strong>
                    <small>Total available quantity</small>
                </article>
                <article className="admin-inventory-metric admin-inventory-metric-warning">
                    <span className="admin-inventory-metric-label">Low stock</span>
                    <strong>{loading ? "…" : metrics.lowStock ?? "—"}</strong>
                    <small>At or below the alert threshold</small>
                </article>
                <article className="admin-inventory-metric admin-inventory-metric-danger">
                    <span className="admin-inventory-metric-label">Out of stock</span>
                    <strong>{loading ? "…" : metrics.outOfStock ?? "—"}</strong>
                    <small>Variants with no available units</small>
                </article>
            </div>

            <div className="admin-inventory-recent">
                <div className="admin-inventory-recent-heading">
                    <div>
                        <h4>Stock needing attention</h4>
                        <p>Low-stock and unavailable variants from your catalogue.</p>
                    </div>
                    <span className="admin-inventory-recent-count">
                        {loading ? "Loading" : `${metrics.rows.length} shown`}
                    </span>
                </div>

                {loading ? (
                    <div className="admin-inventory-empty">Loading inventory data…</div>
                ) : metrics.rows.length === 0 ? (
                    <div className="admin-inventory-empty">
                        {error
                            ? "Inventory data could not be loaded. Use Manage inventory to check stock directly."
                            : "Everything looks good. No low-stock or out-of-stock variants were found."}
                    </div>
                ) : (
                    <div className="admin-inventory-attention-list">
                        {metrics.rows.slice(0, 5).map((row) => (
                            <div className="admin-inventory-attention-row" key={row.key}>
                                <div className="admin-inventory-attention-product">
                                    <strong>{row.productName}</strong>
                                    <span>{row.variantLabel}</span>
                                </div>
                                <span
                                    className={`admin-inventory-status ${row.stock === 0 ? "is-out" : "is-low"}`}
                                >
                                    {row.stock === 0 ? "Out of stock" : "Low stock"}
                                </span>
                                <strong className="admin-inventory-attention-quantity">
                                    {row.stock} left
                                </strong>
                            </div>
                        ))}
                    </div>
                )}

                <div className="admin-inventory-recent-footer">
                    <Link to="/admin/inventory">Open full inventory <span aria-hidden="true">→</span></Link>
                </div>
            </div>
        </section>
    );
}


export default function AdminDashboard() {
    const outletContext = useOutletContext() || {};
    const user = outletContext.user;

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
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [inventoryError, setInventoryError] = useState("");

    const loadInventory = useCallback(async () => {
        if (!isEndpointConfigured("products")) {
            setInventoryError("Product API is not configured, so inventory totals are unavailable.");
            setData((current) => ({ ...current, inventory: null }));
            return;
        }

        setInventoryLoading(true);
        setInventoryError("");

        try {
            const productsResponse = await getAdminProducts();
            const products = extractList(productsResponse);

            const variantResponses = await Promise.allSettled(
                products.map(async (product) => {
                    const productId = product?.id ?? product?.uuid;
                    if (!productId) return { product, variants: [] };
                    const response = await getAdminProductVariants(productId);
                    return { product, variants: extractList(response) };
                })
            );

            const allVariants = [];
            let failedProducts = 0;

            variantResponses.forEach((result) => {
                if (result.status !== "fulfilled") {
                    failedProducts += 1;
                    return;
                }

                const { product, variants } = result.value;
                variants.forEach((variant, index) => {
                    const stock = getStockValue(variant);
                    const threshold = getThreshold(variant);
                    allVariants.push({
                        key: `${product?.id ?? product?.uuid ?? getProductName(product)}-${getVariantId(variant, index)}`,
                        productName: getProductName(product),
                        variantLabel: getVariantLabel(variant),
                        stock,
                        threshold,
                    });
                });
            });

            const knownStockVariants = allVariants.filter((variant) => variant.stock !== null);
            const lowStockRows = knownStockVariants
                .filter((variant) => variant.stock > 0 && variant.stock <= variant.threshold)
                .sort((a, b) => a.stock - b.stock);
            const outOfStockRows = knownStockVariants
                .filter((variant) => variant.stock === 0);

            const inventory = {
                variants: allVariants.length,
                units: knownStockVariants.reduce((total, variant) => total + variant.stock, 0),
                lowStock: lowStockRows.length,
                outOfStock: outOfStockRows.length,
                rows: [...outOfStockRows, ...lowStockRows],
            };

            setData((current) => ({ ...current, inventory }));
            if (failedProducts > 0) {
                setInventoryError(
                    `Some product variants could not be loaded (${failedProducts} product${failedProducts === 1 ? "" : "s"}). Counts may be incomplete.`
                );
            } else if (allVariants.length > 0 && knownStockVariants.length === 0) {
                setInventoryError("Variants loaded, but no recognized stock quantity field was returned by the API.");
            }
        } catch (error) {
            setData((current) => ({ ...current, inventory: null }));
            setInventoryError(error?.message || "Unable to load inventory data.");
        } finally {
            setInventoryLoading(false);
        }
    }, []);

    const loadDashboard = useCallback(async () => {
        const keys = ["products", "categories", "orders", "customers", "reviews", "messages"];
        const configured = keys.filter(isEndpointConfigured);

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
        await loadInventory();
    }, [loadInventory]);

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
        <div className="admin-page admin-dashboard-page">
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
                        disabled={loading || inventoryLoading}
                    >
                        {loading || inventoryLoading ? "Refreshing..." : "Refresh"}
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
                        note={errors.orders || (isEndpointConfigured("orders") ? "From order API" : "Orders API not configured")}
                    />
                    <MetricCard
                        label="Customers"
                        value={countValue(data.customers)}
                        note={errors.customers || (isEndpointConfigured("customers") ? "From customer API" : "Customers API not configured")}
                    />
                    <MetricCard
                        label="Inventory variants"
                        value={data.inventory?.variants ?? "—"}
                        note={inventoryError || "Live product-variant stock data"}
                        tone={inventoryError ? "soft" : "neutral"}
                    />
                    <MetricCard
                        label="Reviews"
                        value={countValue(data.reviews)}
                        note={errors.reviews || (isEndpointConfigured("reviews") ? "From moderation API" : "Reviews API not configured")}
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

            <InventorySummary
                inventory={data.inventory}
                loading={inventoryLoading}
                error={inventoryError}
            />

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
                            text="Configure the contact-message endpoint to show customer enquiries here."
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
                                    <small>{item.is_read ? "READ" : "UNREAD"}</small>
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
                            text="Connect the order endpoint to populate this panel."
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
