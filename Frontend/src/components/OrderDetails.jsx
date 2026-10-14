import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../style/OrderDetails.css";

const API_URL = import.meta.env.VITE_API_URL || "https://geeka-backend.onrender.com";

const ORDER_STAGES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

function money(value, currency = "INR") {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "—";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency || "INR",
        maximumFractionDigits: 2,
    }).format(amount);
}

function pretty(value) {
    return String(value || "Pending")
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateText(value) {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
}

function getAddress(order) {
    return order?.delivery_address || order?.shipping_address || order?.address_snapshot || {};
}

function getItems(order) {
    return Array.isArray(order?.items) ? order.items : Array.isArray(order?.order_items) ? order.order_items : [];
}

function getItemName(item) {
    return item?.product_name || item?.name || item?.product?.name || item?.title || "Geeka product";
}

function getItemImage(item) {
    return item?.image_url || item?.product_image || item?.image || item?.product?.image_url || item?.product?.image || "";
}

function getItemQty(item) {
    return Number(item?.quantity) || 1;
}

function getItemTotal(item) {
    return item?.line_total ?? item?.subtotal ?? item?.total ?? (Number(item?.unit_price ?? item?.price) * getItemQty(item));
}

export default function OrderDetails() {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadOrder() {
            setLoading(true);
            setError("");

            try {
                const response = await fetch(
                    `${API_URL}/api/v1/orders/${encodeURIComponent(orderId)}/`,
                    {
                        method: "GET",
                        credentials: "include",
                        headers: { Accept: "application/json" },
                    }
                );
                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        throw new Error("Please sign in to view this order.");
                    }
                    if (response.status === 404) {
                        throw new Error("We couldn't find this order.");
                    }
                    throw new Error(data?.error || data?.message || "Unable to load order details. Please try again.");
                }

                const result = data?.order || data?.data?.order || data?.data || data;
                if (!result || (!result.id && !result.order_number)) {
                    throw new Error("The server response did not contain order details.");
                }

                if (active) setOrder(result);
            } catch (loadError) {
                if (active) setError(loadError.message || "Unable to load order details.");
            } finally {
                if (active) setLoading(false);
            }
        }

        if (orderId) loadOrder();
        else {
            setError("An order reference is missing.");
            setLoading(false);
        }

        return () => { active = false; };
    }, [orderId]);

    const items = useMemo(() => getItems(order), [order]);
    const address = useMemo(() => getAddress(order), [order]);
    const status = String(order?.status || "PENDING").toUpperCase();
    const paymentStatus = String(order?.payment_status || "PENDING").toUpperCase();
    const currency = order?.currency || "INR";
    const currentStage = ORDER_STAGES.indexOf(status);
    const isCancelled = status === "CANCELLED";
    const subtotal = order?.subtotal ?? order?.items_subtotal;
    const shipping = order?.shipping_fee ?? order?.shipping_cost ?? 0;
    const discount = order?.discount_amount ?? order?.discount ?? 0;
    const total = order?.total ?? order?.grand_total;

    if (loading) {
        return <main className="geeka-order-page"><div className="geeka-order-state"><span className="geeka-order-spinner" /><p>Loading your order...</p></div></main>;
    }

    if (error || !order) {
        return (
            <main className="geeka-order-page">
                <div className="geeka-order-error">
                    <span className="geeka-order-eyebrow">GEEKA ORDERS</span>
                    <h1>Order details unavailable</h1>
                    <p>{error || "This order could not be loaded."}</p>
                    <div className="geeka-order-actions">
                        <Link className="geeka-order-button geeka-order-button-primary" to="/profile?section=orders">Go to My Orders</Link>
                        <Link className="geeka-order-button geeka-order-button-secondary" to="/shop">Continue shopping</Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="geeka-order-page">
            <div className="geeka-order-container">
                <div className="geeka-order-topbar">
                    <Link to="/profile?section=orders" className="geeka-order-back">← Back to My Orders</Link>
                    <span className="geeka-order-secure">Order information</span>
                </div>

                <section className="geeka-order-heading">
                    <div>
                        <span className="geeka-order-eyebrow">YOUR GEEKA ORDER</span>
                        <h1>Order details</h1>
                        <p>Thank you for choosing Geeka. Here's the latest information about your order.</p>
                    </div>
                    <span className={`geeka-order-status ${isCancelled ? "is-cancelled" : ""}`}>{pretty(status)}</span>
                </section>

                <section className="geeka-order-meta">
                    <div><span>Order number</span><strong>{order.order_number || order.id}</strong></div>
                    <div><span>Placed on</span><strong>{dateText(order.created_at || order.placed_at)}</strong></div>
                    <div><span>Payment status</span><strong className={`geeka-order-payment is-${paymentStatus.toLowerCase()}`}>{pretty(paymentStatus)}</strong></div>
                    <div><span>Order total</span><strong>{money(total, currency)}</strong></div>
                </section>

                <div className="geeka-order-grid">
                    <div className="geeka-order-main">
                        <section className="geeka-order-card">
                            <div className="geeka-order-card-heading">
                                <div><span className="geeka-order-eyebrow">PROGRESS</span><h2>Order tracking</h2></div>
                                {!isCancelled && <span className="geeka-order-small-status">{pretty(status)}</span>}
                            </div>
                            {isCancelled ? (
                                <div className="geeka-order-cancelled-note">This order has been cancelled. If you have questions, please contact Geeka support.</div>
                            ) : (
                                <div className="geeka-order-timeline">
                                    {ORDER_STAGES.map((stage, index) => {
                                        const completed = currentStage >= index && currentStage !== -1;
                                        const active = currentStage === index;
                                        return (
                                            <div className={`geeka-order-timeline-step ${completed ? "completed" : ""} ${active ? "active" : ""}`} key={stage}>
                                                <span className="geeka-order-timeline-dot">{completed ? "✓" : index + 1}</span>
                                                <div><strong>{pretty(stage)}</strong><span>{active ? "Current status" : completed ? "Completed" : "Awaiting update"}</span></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        <section className="geeka-order-card">
                            <div className="geeka-order-card-heading"><div><span className="geeka-order-eyebrow">IN YOUR ORDER</span><h2>Items ordered</h2></div><span className="geeka-order-small-status">{items.length} {items.length === 1 ? "item" : "items"}</span></div>
                            {items.length ? (
                                <div className="geeka-order-items">
                                    {items.map((item, index) => {
                                        const image = getItemImage(item);
                                        return (
                                            <article className="geeka-order-item" key={item.id || item.variant_id || `${getItemName(item)}-${index}`}>
                                                {image ? <img src={image} alt={getItemName(item)} /> : <div className="geeka-order-item-placeholder">G</div>}
                                                <div className="geeka-order-item-info">
                                                    <h3>{getItemName(item)}</h3>
                                                    {item?.sku && <p>SKU: {item.sku}</p>}
                                                    {item?.variant_name && <p>{item.variant_name}</p>}
                                                    <p>Quantity: {getItemQty(item)}</p>
                                                </div>
                                                <strong className="geeka-order-item-price">{money(getItemTotal(item), item?.currency || currency)}</strong>
                                            </article>
                                        );
                                    })}
                                </div>
                            ) : <p className="geeka-order-muted">Item details were not included in the server response.</p>}
                        </section>
                    </div>

                    <aside className="geeka-order-sidebar">
                        <section className="geeka-order-card">
                            <h2>Payment summary</h2>
                            <div className="geeka-order-totals">
                                <div><span>Subtotal</span><strong>{money(subtotal, currency)}</strong></div>
                                <div><span>Delivery</span><strong>{Number(shipping) === 0 ? "Free" : money(shipping, currency)}</strong></div>
                                {Number(discount) > 0 && <div><span>Discount</span><strong>−{money(discount, currency)}</strong></div>}
                                <div className="geeka-order-total"><span>Total</span><strong>{money(total, currency)}</strong></div>
                            </div>
                            <div className={`geeka-order-payment-note is-${paymentStatus.toLowerCase()}`}>
                                <strong>Payment: {pretty(paymentStatus)}</strong>
                                <p>{paymentStatus === "PAID" ? "Your payment has been confirmed." : paymentStatus === "FAILED" ? "Payment was not completed. Contact support for next steps." : paymentStatus === "REFUNDED" ? "A refund has been recorded for this order." : "Payment has not been confirmed. This order is not marked as paid."}</p>
                            </div>
                        </section>

                        <section className="geeka-order-card">
                            <h2>Delivery address</h2>
                            <div className="geeka-order-address">
                                <strong>{address.recipient_name || address.full_name || address.fullName || order.contact_name || "Recipient"}</strong>
                                {(address.delivery_phone || address.phone || order.contact_phone) && <p>{address.delivery_phone || address.phone || order.contact_phone}</p>}
                                {[address.address_line1 || address.line1, address.address_line2 || address.line2, [address.city, address.state, address.postal_code || address.postalCode].filter(Boolean).join(", ")].filter(Boolean).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}
                                {!Object.keys(address).length && <p className="geeka-order-muted">Delivery address is unavailable in the order response.</p>}
                            </div>
                        </section>

                        <div className="geeka-order-actions">
                            <Link className="geeka-order-button geeka-order-button-primary" to="/profile?section=orders">View all orders</Link>
                            <Link className="geeka-order-button geeka-order-button-secondary" to="/shop">Continue shopping</Link>
                        </div>
                        <p className="geeka-order-footnote">Order and payment statuses are provided by Geeka's server.</p>
                    </aside>
                </div>
            </div>
        </main>
    );
}
