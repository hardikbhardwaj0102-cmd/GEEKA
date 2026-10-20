import { useCallback, useEffect, useMemo, useState } from "react";
import {
    cancelAdminOrder,
    getAdminOrder,
    getAdminOrders,
    updateAdminOrderStatus,
} from "../services/adminApi";
import "../style/AdminPages.css";
import "../style/AdminOrders.css";

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];
const NEXT_STATUS = {
    PENDING: "CONFIRMED",
    CONFIRMED: "PROCESSING",
    PROCESSING: "SHIPPED",
    SHIPPED: "DELIVERED",
};

function asArray(value) {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.results)) return value.results;
    return [];
}

function money(value, currency = "INR") {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return value ?? "—";
    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: currency || "INR",
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${currency || "INR"} ${amount.toFixed(2)}`;
    }
}

function dateTime(value) {
    if (!value) return "—";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString();
}

function dateOnly(value) {
    if (!value) return "—";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString();
}

function getOrderId(order) {
    return order?.id || order?.uuid || order?.order_uuid || "";
}

function getContact(order) {
    return order?.contact || order?.contact_snapshot || order?.customer || {};
}

function getOrderNumber(order) {
    return order?.order_number || order?.number || `Order ${String(getOrderId(order)).slice(0, 8)}`;
}

function getErrorMessage(error, fallback) {
    if (error?.status === 401) return "Your session has expired. Sign in again with your staff account.";
    if (error?.status === 403) return "Access denied. This page requires a Django account with staff permission.";
    if (error?.status === 404) return "The admin order endpoint was not found. Check that the latest backend deployment is live.";
    return error?.message || fallback;
}

function StatusBadge({ status }) {
    const normalized = String(status || "UNKNOWN").toUpperCase();
    return <span className={`admin-status-badge status-${normalized.toLowerCase()}`}>{normalized.replaceAll("_", " ")}</span>;
}

function DetailRow({ label, value }) {
    return <div className="admin-order-detail-row"><span>{label}</span><strong>{value || "—"}</strong></div>;
}

function OrderDetails({ order, onClose, onRefresh }) {
    const [busy, setBusy] = useState(false);
    const [actionError, setActionError] = useState("");
    const orderId = getOrderId(order);
    const status = String(order?.status || "").toUpperCase();
    const nextStatus = NEXT_STATUS[status];
    const paymentStatus = String(order?.payment_status || "").toUpperCase();
    const canCancel = status === "PENDING" && paymentStatus === "PENDING";
    const contact = getContact(order);
    const address = order?.delivery_address || order?.address || {};
    const items = asArray(order?.items || order?.order_items);
    const currency = order?.currency || "INR";

    const addressText = [
        address?.address_line_1 || address?.line1 || address?.address,
        address?.address_line_2 || address?.line2,
        address?.landmark,
        address?.city,
        address?.state,
        address?.postal_code || address?.pincode || address?.zip_code,
        address?.country,
    ].filter(Boolean).join(", ");

    async function runStatusUpdate() {
        if (!nextStatus) return;
        setBusy(true);
        setActionError("");
        try {
            await updateAdminOrderStatus(orderId, nextStatus);
            await onRefresh(orderId);
        } catch (error) {
            setActionError(getErrorMessage(error, "Could not update this order status."));
        } finally {
            setBusy(false);
        }
    }

    async function runCancel() {
        const confirmed = window.confirm(`Cancel ${getOrderNumber(order)}? This action cannot be undone.`);
        if (!confirmed) return;
        setBusy(true);
        setActionError("");
        try {
            await cancelAdminOrder(orderId);
            await onRefresh(orderId);
        } catch (error) {
            setActionError(getErrorMessage(error, "Could not cancel this order."));
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="admin-order-modal-backdrop" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) onClose();
        }}>
            <section className="admin-order-modal" role="dialog" aria-modal="true" aria-labelledby="admin-order-modal-title">
                <header className="admin-order-modal-header">
                    <div>
                        <p className="admin-eyebrow">Order details</p>
                        <h3 id="admin-order-modal-title">{getOrderNumber(order)}</h3>
                        <p className="admin-order-muted">Placed {dateTime(order?.created_at || order?.created)}</p>
                    </div>
                    <button className="admin-order-close" type="button" onClick={onClose} disabled={busy} aria-label="Close order details">×</button>
                </header>

                {actionError && <div className="admin-error-banner admin-order-alert">{actionError}</div>}

                <div className="admin-order-status-line">
                    <div><span className="admin-order-label">Order status</span><StatusBadge status={status} /></div>
                    <div><span className="admin-order-label">Payment</span><StatusBadge status={paymentStatus} /></div>
                </div>

                <div className="admin-order-detail-grid">
                    <section className="admin-order-detail-card">
                        <h4>Customer</h4>
                        <DetailRow label="Name" value={contact?.name || contact?.full_name} />
                        <DetailRow label="Email" value={contact?.email} />
                        <DetailRow label="Phone" value={contact?.phone || contact?.mobile} />
                        <DetailRow label="Customer ID" value={order?.customer_id} />
                    </section>
                    <section className="admin-order-detail-card">
                        <h4>Delivery address</h4>
                        <p className="admin-order-address">{addressText || "No saved delivery address was returned by the API."}</p>
                    </section>
                </div>

                <section className="admin-order-items-section">
                    <h4>Items ({items.length})</h4>
                    {items.length === 0 ? (
                        <div className="admin-empty-state compact"><p>No item details were returned for this order.</p></div>
                    ) : (
                        <div className="admin-table-wrap">
                            <table className="admin-table admin-order-items-table">
                                <thead><tr><th>Product</th><th>SKU / Variant</th><th>Qty</th><th>Unit price</th><th>Line total</th></tr></thead>
                                <tbody>{items.map((item, index) => (
                                    <tr key={item?.id || item?.sku || `${item?.product_name || item?.name || "item"}-${index}`}>
                                        <td><strong>{item?.product_name || item?.name || item?.product?.name || "Product"}</strong></td>
                                        <td>{item?.sku || item?.variant_name || item?.variant?.name || "—"}</td>
                                        <td>{item?.quantity ?? item?.qty ?? 1}</td>
                                        <td>{money(item?.unit_price ?? item?.price, item?.currency || currency)}</td>
                                        <td>{money(item?.line_total ?? item?.total ?? (Number(item?.unit_price ?? item?.price) * Number(item?.quantity ?? item?.qty ?? 1)), item?.currency || currency)}</td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="admin-order-total-card">
                    <DetailRow label="Subtotal" value={money(order?.subtotal, currency)} />
                    <DetailRow label="Shipping" value={money(order?.shipping_fee ?? order?.shipping, currency)} />
                    <DetailRow label="Discount" value={money(order?.discount_amount ?? order?.discount, currency)} />
                    <DetailRow label="Total" value={money(order?.total ?? order?.total_amount, currency)} />
                </section>

                <footer className="admin-order-modal-actions">
                    <button className="admin-button admin-button-secondary" type="button" onClick={onClose} disabled={busy}>Close</button>
                    {canCancel && <button className="admin-button admin-order-danger-button" type="button" onClick={runCancel} disabled={busy}>{busy ? "Please wait…" : "Cancel order"}</button>}
                    {nextStatus && <button className="admin-button admin-button-primary" type="button" onClick={runStatusUpdate} disabled={busy}>{busy ? "Updating…" : `Mark as ${nextStatus.toLowerCase()}`}</button>}
                </footer>
            </section>
        </div>
    );
}

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [filters, setFilters] = useState({ search: "", status: "", payment_status: "", date_from: "", date_to: "" });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const loadOrders = useCallback(async (pageNumber = page, activeFilters = filters, size = pageSize) => {
        setLoading(true);
        setError("");
        setNotice("");
        try {
            const response = await getAdminOrders({ ...activeFilters, page: pageNumber, page_size: size });
            setOrders(asArray(response));
            setPagination({
                count: Number(response?.count ?? response?.total ?? asArray(response).length),
                next: response?.next ?? null,
                previous: response?.previous ?? null,
            });
        } catch (requestError) {
            setOrders([]);
            setPagination({ count: 0, next: null, previous: null });
            setError(getErrorMessage(requestError, "Unable to load orders."));
        } finally {
            setLoading(false);
        }
    }, [filters, page, pageSize]);

    useEffect(() => { loadOrders(page, filters, pageSize); }, [loadOrders, page, filters, pageSize]);

    async function openOrder(order) {
        const id = getOrderId(order);
        if (!id) {
            setError("This order record does not contain an order UUID, so its details cannot be opened.");
            return;
        }
        setSelectedOrder(order);
        setDetailLoading(true);
        setError("");
        try {
            const response = await getAdminOrder(id);
            setSelectedOrder(response?.order || response);
        } catch (requestError) {
            setSelectedOrder(null);
            setError(getErrorMessage(requestError, "Unable to load order details."));
        } finally {
            setDetailLoading(false);
        }
    }

    async function refreshOrder(orderId) {
        const response = await getAdminOrder(orderId);
        const refreshed = response?.order || response;
        setSelectedOrder(refreshed);
        await loadOrders(page, filters, pageSize);
        setNotice("Order updated successfully.");
    }

    function applyFilters(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const nextFilters = {
            search: String(data.get("search") || "").trim(),
            status: String(data.get("status") || ""),
            payment_status: String(data.get("payment_status") || ""),
            date_from: String(data.get("date_from") || ""),
            date_to: String(data.get("date_to") || ""),
        };
        if (nextFilters.date_from && nextFilters.date_to && nextFilters.date_from > nextFilters.date_to) {
            setError("The start date must be on or before the end date.");
            return;
        }
        setFilters(nextFilters);
        setPage(1);
    }

    function clearFilters() {
        setSearchInput("");
        setFilters({ search: "", status: "", payment_status: "", date_from: "", date_to: "" });
        setPage(1);
    }

    const pageCount = useMemo(() => Math.max(1, Math.ceil(pagination.count / pageSize)), [pagination.count, pageSize]);

    return (
        <div className="admin-page admin-orders-page">
            <div className="admin-page-toolbar">
                <div>
                    <p className="admin-eyebrow">Store management</p>
                    <h2>Orders</h2>
                    <p>Review customer orders, inspect delivery details, and move orders through the supported fulfilment stages.</p>
                </div>
                <div className="admin-toolbar-actions">
                    <button className="admin-button admin-button-secondary" type="button" onClick={() => loadOrders(page, filters, pageSize)} disabled={loading}>{loading ? "Refreshing…" : "Refresh orders"}</button>
                </div>
            </div>

            {error && <div className="admin-error-banner admin-order-alert" role="alert">{error}</div>}
            {notice && <div className="admin-success-banner admin-order-alert" role="status">{notice}</div>}

            <section className="admin-panel-card admin-orders-summary">
                <div><span className="admin-order-summary-label">Matching orders</span><strong>{pagination.count.toLocaleString("en-IN")}</strong></div>
                <div><span className="admin-order-summary-label">Current page</span><strong>{page} <small>/ {pageCount}</small></strong></div>
                <div><span className="admin-order-summary-label">Rows per page</span><strong>{pageSize}</strong></div>
            </section>

            <section className="admin-panel-card admin-orders-card">
                <form key={JSON.stringify(filters)} className="admin-orders-filters" onSubmit={applyFilters}>
                    <label className="admin-orders-search-field"><span>Search orders</span><input className="admin-search-input" name="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Order number, name, email or UUID" /></label>
                    <label><span>Order status</span><select className="admin-select" name="status" defaultValue={filters.status}><option value="">All statuses</option>{ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
                    <label><span>Payment</span><select className="admin-select" name="payment_status" defaultValue={filters.payment_status}><option value="">All payments</option>{PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
                    <label><span>From date</span><input className="admin-search-input" type="date" name="date_from" defaultValue={filters.date_from} /></label>
                    <label><span>To date</span><input className="admin-search-input" type="date" name="date_to" defaultValue={filters.date_to} /></label>
                    <div className="admin-orders-filter-actions"><button className="admin-button admin-button-primary" type="submit">Apply filters</button><button className="admin-button admin-button-secondary" type="button" onClick={clearFilters}>Clear</button></div>
                </form>

                <div className="admin-table-wrap">
                    <table className="admin-table admin-orders-table">
                        <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Order status</th><th>Payment</th><th>Total</th><th>Action</th></tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan="7"><div className="admin-empty-state compact"><p>Loading orders…</p></div></td></tr> : orders.length === 0 ? <tr><td colSpan="7"><div className="admin-empty-state"><strong>No orders found</strong><p>Try changing the search or filters. If this is the first load, confirm the admin Orders endpoint is deployed.</p></div></td></tr> : orders.map((order, index) => {
                                const contact = getContact(order);
                                return <tr key={getOrderId(order) || `${getOrderNumber(order)}-${index}`}>
                                    <td><strong>{getOrderNumber(order)}</strong><span>{String(getOrderId(order)).slice(0, 18) || "UUID unavailable"}</span></td>
                                    <td><strong>{contact?.name || contact?.full_name || "Customer"}</strong><span>{contact?.email || "Email unavailable"}</span></td>
                                    <td>{dateOnly(order?.created_at || order?.created)}</td>
                                    <td><StatusBadge status={order?.status} /></td>
                                    <td><StatusBadge status={order?.payment_status} /></td>
                                    <td><strong>{money(order?.total ?? order?.total_amount, order?.currency || "INR")}</strong></td>
                                    <td><button className="admin-table-link-button" type="button" onClick={() => openOrder(order)}>View details</button></td>
                                </tr>;
                            })}
                        </tbody>
                    </table>
                </div>

                <footer className="admin-orders-pagination">
                    <span>Showing {orders.length ? ((page - 1) * pageSize) + 1 : 0}–{Math.min(page * pageSize, pagination.count)} of {pagination.count}</span>
                    <div>
                        <label className="admin-orders-page-size">Rows <select className="admin-select" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label>
                        <button className="admin-button admin-button-secondary" type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={loading || page <= 1}>Previous</button>
                        <button className="admin-button admin-button-secondary" type="button" onClick={() => setPage((value) => value + 1)} disabled={loading || !pagination.next}>{"Next"}</button>
                    </div>
                </footer>
            </section>

            {detailLoading && <div className="admin-order-loading-overlay"><div className="admin-panel-card">Loading order details…</div></div>}
            {selectedOrder && <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} onRefresh={refreshOrder} />}
        </div>
    );
}
