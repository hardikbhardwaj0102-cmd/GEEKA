import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminCustomer, getAdminCustomers } from "../services/adminApi";
import "../style/AdminPages.css";
import "../style/AdminCustomers.css";

function asArray(value) {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.results)) return value.results;
    return [];
}

function money(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "—";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(amount);
}

function dateOnly(value) {
    if (!value) return "—";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

function dateTime(value) {
    if (!value) return "—";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
}

function getErrorMessage(error, fallback) {
    if (error?.status === 401) return "Your session has expired. Sign in again with your staff account.";
    if (error?.status === 403) return "Access denied. Customer records are available to authorized staff only.";
    if (error?.status === 404) return "The customer endpoint or selected customer was not found. Confirm that the latest backend deployment is live.";
    if (error?.status === 400) return error?.message || "The customer ID or request parameters were rejected.";
    return error?.message || fallback;
}

function StatusBadge({ active }) {
    return <span className={`admin-customer-status ${active ? "is-active" : "is-inactive"}`}>{active ? "Active" : "Inactive"}</span>;
}

function DetailItem({ label, value }) {
    return <div className="admin-customer-detail-item"><span>{label}</span><strong>{value === null || value === undefined || value === "" ? "—" : value}</strong></div>;
}

function CustomerDetails({ customer, loading, error, onClose }) {
    if (!customer && !loading && !error) return null;

    return (
        <div className="admin-customer-modal-backdrop" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
        }}>
            <section className="admin-customer-modal" role="dialog" aria-modal="true" aria-labelledby="admin-customer-modal-title">
                <header className="admin-customer-modal-header">
                    <div>
                        <p className="admin-eyebrow">Customer profile</p>
                        <h3 id="admin-customer-modal-title">{customer?.full_name || "Customer details"}</h3>
                        <p>Registered {dateOnly(customer?.date_joined)}</p>
                    </div>
                    <button className="admin-customer-close" type="button" onClick={onClose} aria-label="Close customer details">×</button>
                </header>

                {loading && <div className="admin-customer-modal-state">Loading customer details…</div>}
                {error && <div className="admin-error-banner admin-customer-alert" role="alert">{error}</div>}

                {customer && !loading && (
                    <>
                        <div className="admin-customer-detail-grid">
                            <DetailItem label="Full name" value={customer.full_name} />
                            <DetailItem label="Customer UUID" value={customer.id} />
                            <DetailItem label="Email address" value={customer.email} />
                            <DetailItem label="Phone number" value={customer.phone_number} />
                            <DetailItem label="Joined on" value={dateTime(customer.date_joined)} />
                            <DetailItem label="Account status" value={<StatusBadge active={Boolean(customer.is_active)} />} />
                            <DetailItem label="Email verified" value={customer.email_verified === true ? "Verified" : customer.email_verified === false ? "Not verified" : "Not provided"} />
                            <DetailItem label="Orders linked to account" value={Number(customer.order_count ?? 0).toLocaleString("en-IN")} />
                            <DetailItem label="Total linked order value" value={money(customer.total_order_value)} />
                        </div>
                        <p className="admin-customer-detail-note">Order count and total value include orders linked to this registered account. Guest orders may not be included, and the total is not limited to paid orders.</p>
                    </>
                )}

                <footer className="admin-customer-modal-footer">
                    <button className="admin-button admin-button-secondary" type="button" onClick={onClose}>Close</button>
                </footer>
            </section>
        </div>
    );
}

export default function AdminCustomers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");

    const loadCustomers = useCallback(async (pageNumber = page, activeSearch = search, size = pageSize) => {
        setLoading(true);
        setError("");
        try {
            const response = await getAdminCustomers({ page: pageNumber, page_size: size, search: activeSearch });
            const results = asArray(response);
            setCustomers(results);
            setPagination({
                count: Number(response?.count ?? response?.total ?? results.length),
                next: response?.next ?? null,
                previous: response?.previous ?? null,
            });
        } catch (requestError) {
            setCustomers([]);
            setPagination({ count: 0, next: null, previous: null });
            setError(getErrorMessage(requestError, "Unable to load customers."));
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search]);

    useEffect(() => {
        loadCustomers(page, search, pageSize);
    }, [loadCustomers, page, search, pageSize]);

    async function openCustomer(customer) {
        const customerId = customer?.id;
        if (!customerId) {
            setError("This customer record does not contain a customer UUID.");
            return;
        }
        setSelectedCustomer(null);
        setDetailError("");
        setDetailLoading(true);
        try {
            const response = await getAdminCustomer(customerId);
            setSelectedCustomer(response?.customer || response);
        } catch (requestError) {
            setDetailError(getErrorMessage(requestError, "Unable to load customer details."));
        } finally {
            setDetailLoading(false);
        }
    }

    function applySearch(event) {
        event.preventDefault();
        setSearch(searchInput.trim());
        setPage(1);
    }

    function clearSearch() {
        setSearchInput("");
        setSearch("");
        setPage(1);
    }

    const pageCount = useMemo(() => Math.max(1, Math.ceil(pagination.count / pageSize)), [pagination.count, pageSize]);
    const activeOnPage = useMemo(() => customers.filter((customer) => customer?.is_active).length, [customers]);

    return (
        <div className="admin-page admin-customers-page">
            <div className="admin-page-toolbar">
                <div>
                    <p className="admin-eyebrow">Store management</p>
                    <h2>Customers</h2>
                    <p>Review registered customer accounts, contact details, and linked order activity.</p>
                </div>
                <div className="admin-toolbar-actions">
                    <button className="admin-button admin-button-secondary" type="button" onClick={() => loadCustomers(page, search, pageSize)} disabled={loading}>
                        {loading ? "Refreshing…" : "Refresh customers"}
                    </button>
                </div>
            </div>

            {error && <div className="admin-error-banner admin-customer-alert" role="alert">{error}</div>}

            <section className="admin-panel-card admin-customers-summary">
                <div><span className="admin-customer-summary-label">Matching customers</span><strong>{pagination.count.toLocaleString("en-IN")}</strong></div>
                <div><span className="admin-customer-summary-label">Active on this page</span><strong>{activeOnPage.toLocaleString("en-IN")}</strong></div>
                <div><span className="admin-customer-summary-label">Current page</span><strong>{page} <small>/ {pageCount}</small></strong></div>
            </section>

            <section className="admin-panel-card admin-customers-card">
                <form className="admin-customers-filters" onSubmit={applySearch}>
                    <label className="admin-customers-search-field">
                        <span>Search customers</span>
                        <input className="admin-search-input" type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Name, email, phone or customer UUID" />
                    </label>
                    <div className="admin-customers-filter-actions">
                        <button className="admin-button admin-button-primary" type="submit" disabled={loading}>Search</button>
                        <button className="admin-button admin-button-secondary" type="button" onClick={clearSearch} disabled={loading && !searchInput && !search}>Clear</button>
                    </div>
                </form>

                <div className="admin-customers-table-wrap">
                    <table className="admin-table admin-customers-table">
                        <thead><tr><th>Customer</th><th>Contact</th><th>Joined</th><th>Orders</th><th>Total order value</th><th>Account</th><th>Action</th></tr></thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7"><div className="admin-empty-state compact"><p>Loading customers…</p></div></td></tr>
                            ) : customers.length === 0 ? (
                                <tr><td colSpan="7"><div className="admin-empty-state"><strong>{error ? "Customers could not be loaded" : "No customers found"}</strong><p>{error ? "Check the error above, your staff session, and whether the latest backend deployment includes the customer endpoints." : search ? "Try a different name, email, phone number, or UUID." : "Registered customers will appear here when the API returns records."}</p></div></td></tr>
                            ) : customers.map((customer, index) => (
                                <tr key={customer?.id || `customer-${index}`}>
                                    <td><div className="admin-customer-identity"><span className="admin-customer-avatar">{String(customer?.full_name || customer?.email || "C").trim().charAt(0).toUpperCase()}</span><div><strong>{customer?.full_name || "Unnamed customer"}</strong><span>{String(customer?.id || "UUID unavailable")}</span></div></div></td>
                                    <td><div className="admin-customer-contact"><span>{customer?.email || "Email unavailable"}</span><span>{customer?.phone_number || "Phone not provided"}</span></div></td>
                                    <td>{dateOnly(customer?.date_joined)}</td>
                                    <td><strong>{Number(customer?.order_count ?? 0).toLocaleString("en-IN")}</strong></td>
                                    <td><strong>{money(customer?.total_order_value)}</strong></td>
                                    <td><StatusBadge active={Boolean(customer?.is_active)} /></td>
                                    <td><button className="admin-table-link-button" type="button" onClick={() => openCustomer(customer)}>View details</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <footer className="admin-customers-pagination">
                    <span>Showing {customers.length ? ((page - 1) * pageSize) + 1 : 0}–{Math.min(page * pageSize, pagination.count)} of {pagination.count.toLocaleString("en-IN")}</span>
                    <div className="admin-customers-pagination-controls">
                        <label className="admin-customers-page-size">Rows <select className="admin-select" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label>
                        <button className="admin-button admin-button-secondary" type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={loading || page <= 1}>Previous</button>
                        <button className="admin-button admin-button-secondary" type="button" onClick={() => setPage((value) => value + 1)} disabled={loading || !pagination.next}>Next</button>
                    </div>
                </footer>
            </section>

            <CustomerDetails customer={selectedCustomer} loading={detailLoading} error={detailError} onClose={() => { setSelectedCustomer(null); setDetailError(""); }} />
        </div>
    );
}
