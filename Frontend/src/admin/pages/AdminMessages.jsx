import { useCallback, useEffect, useMemo, useState } from "react";

import {
    getAdminCollection,
    isEndpointConfigured,
    updateAdminResource,
} from "../services/adminApi";

import "../style/AdminPages.css";
import "../style/AdminMessages.css";


function listFromData(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    return [];
}


function normalizeMessage(message) {
    return {
        id: message?.id,
        name: message?.name || message?.full_name || message?.sender_name || "",
        email: message?.email || message?.sender_email || "",
        subject: message?.subject || message?.title || "Website enquiry",
        body: message?.message || message?.body || message?.content || "",
        status: String(message?.status || "NEW").toUpperCase(),
        createdAt: message?.created_at || message?.createdAt || message?.received_at || null,
        raw: message,
    };
}


export default function AdminMessages() {
    const [messages, setMessages] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadMessages = useCallback(async () => {
        if (!isEndpointConfigured("messages")) {
            setMessages([]);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const data = await getAdminCollection("messages");
            const normalized = listFromData(data).map(normalizeMessage);
            setMessages(normalized);

            if (!selectedId && normalized[0]?.id) {
                setSelectedId(normalized[0].id);
            }
        } catch (requestError) {
            setError(requestError?.message || "Unable to load messages.");
        } finally {
            setLoading(false);
        }
    }, [selectedId]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    const filtered = useMemo(() => {
        const search = query.trim().toLowerCase();

        return messages.filter((message) => {
            const matchesStatus =
                statusFilter === "ALL" ||
                message.status === statusFilter;

            if (!matchesStatus) return false;
            if (!search) return true;

            return [
                message.name,
                message.email,
                message.subject,
                message.body,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(search);
        });
    }, [messages, query, statusFilter]);

    const selected = useMemo(
        () => messages.find((message) => String(message.id) === String(selectedId)) || null,
        [messages, selectedId]
    );

    async function updateStatus(nextStatus) {
        if (!selected?.id || !isEndpointConfigured("messages")) {
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            await updateAdminResource(
                "messages",
                selected.id,
                { status: nextStatus }
            );

            setMessages((current) =>
                current.map((message) =>
                    String(message.id) === String(selected.id)
                        ? { ...message, status: nextStatus }
                        : message
                )
            );

            setSuccess(`Message marked as ${nextStatus}.`);
        } catch (requestError) {
            setError(requestError?.message || "Unable to update message.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="admin-page">
            <section className="admin-page-toolbar">
                <div>
                    <div className="admin-eyebrow">CUSTOMER COMMUNICATION</div>
                    <h2>Messages</h2>
                    <p>
                        Every enquiry submitted through the Geeka Contact page can
                        become an actionable conversation here.
                    </p>
                </div>

                <button
                    type="button"
                    className="admin-button admin-button-secondary"
                    onClick={loadMessages}
                    disabled={loading}
                >
                    {loading ? "Refreshing..." : "Refresh inbox"}
                </button>
            </section>

            {!isEndpointConfigured("messages") ? (
                <div className="admin-integration-notice">
                    <div className="admin-integration-dot" />
                    <div>
                        <strong>Contact-message API is the remaining connection.</strong>
                        <p>
                            The inbox UI is ready. Add the finalized Django admin
                            message endpoint to <code>VITE_ADMIN_MESSAGES_ENDPOINT</code>
                            and wire the public Contact form to the corresponding
                            submission endpoint.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {error && <div className="admin-error-banner">{error}</div>}
                    {success && <div className="admin-success-banner">{success}</div>}

                    <div className="admin-message-layout">
                        <section className="admin-panel-card admin-message-list-card">
                            <div className="admin-message-filter-bar">
                                <input
                                    className="admin-search-input"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Search messages..."
                                />
                                <select
                                    className="admin-select"
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value)}
                                >
                                    <option value="ALL">All</option>
                                    <option value="NEW">New</option>
                                    <option value="READ">Read</option>
                                    <option value="REPLIED">Replied</option>
                                    <option value="ARCHIVED">Archived</option>
                                </select>
                            </div>

                            <div className="admin-message-list">
                                {filtered.length === 0 ? (
                                    <div className="admin-empty-state compact">
                                        <strong>No messages found</strong>
                                        <p>New website enquiries will appear here.</p>
                                    </div>
                                ) : filtered.map((message) => (
                                    <button
                                        type="button"
                                        key={message.id}
                                        className={`admin-message-row ${
                                            String(message.id) === String(selectedId)
                                                ? "admin-message-row-active"
                                                : ""
                                        }`}
                                        onClick={() => setSelectedId(message.id)}
                                    >
                                        <div>
                                            <strong>{message.name || message.email || "Customer"}</strong>
                                            <span>{message.subject}</span>
                                        </div>
                                        <div className="admin-message-row-meta">
                                            <small>{message.status}</small>
                                            <time>{formatDate(message.createdAt)}</time>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="admin-panel-card admin-message-detail-card">
                            {!selected ? (
                                <div className="admin-empty-state">
                                    <strong>Select a message</strong>
                                    <p>Choose an enquiry from the inbox to inspect it.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="admin-message-detail-header">
                                        <div>
                                            <div className="admin-eyebrow">MESSAGE</div>
                                            <h3>{selected.subject}</h3>
                                        </div>
                                        <span className={`admin-status-badge status-${selected.status.toLowerCase()}`}>
                                            {selected.status}
                                        </span>
                                    </div>

                                    <div className="admin-message-sender">
                                        <strong>{selected.name || "Customer"}</strong>
                                        <a href={`mailto:${selected.email}`}>{selected.email || "No email provided"}</a>
                                        <span>{formatDateTime(selected.createdAt)}</span>
                                    </div>

                                    <div className="admin-message-body">
                                        {selected.body || "No message text was provided."}
                                    </div>

                                    <div className="admin-message-actions">
                                        {selected.email && (
                                            <a
                                                className="admin-button admin-button-primary"
                                                href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                                            >
                                                Reply by email
                                            </a>
                                        )}

                                        <button
                                            type="button"
                                            className="admin-button admin-button-secondary"
                                            onClick={() => updateStatus("READ")}
                                            disabled={saving || selected.status === "READ"}
                                        >
                                            Mark read
                                        </button>

                                        <button
                                            type="button"
                                            className="admin-button admin-button-secondary"
                                            onClick={() => updateStatus("REPLIED")}
                                            disabled={saving || selected.status === "REPLIED"}
                                        >
                                            Mark replied
                                        </button>

                                        <button
                                            type="button"
                                            className="admin-button admin-button-secondary"
                                            onClick={() => updateStatus("ARCHIVED")}
                                            disabled={saving || selected.status === "ARCHIVED"}
                                        >
                                            Archive
                                        </button>
                                    </div>
                                </>
                            )}
                        </section>
                    </div>
                </>
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

function formatDateTime(value) {
    if (!value) return "Date not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
}
