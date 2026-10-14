
import { useCallback, useEffect, useMemo, useState } from "react";

import {
    getAdminCollection,
    getAdminResource,
    isEndpointConfigured,
    deleteAdminResource,
} from "../services/adminApi";

import "../style/AdminPages.css";
import "../style/AdminMessages.css";

function listFromData(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.messages)) return data.messages;
    return null;
}

function normalizeMessage(message) {
    return {
        id: message?.id,
        name: message?.name || "",
        email: message?.email || "",
        subject: message?.subject || "Website enquiry",
        body: message?.message || "",
        createdAt: message?.created_at || null,
    };
}

function formatDate(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function formatDateTime(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function getErrorMessage(error) {
    if (error?.status === 401) {
        return "Your session has expired. Please sign in again.";
    }

    if (error?.status === 403) {
        return "Access denied. Only staff accounts can manage messages.";
    }

    return error?.message || "Unable to complete the request.";
}

export default function AdminMessages() {
    const [messages, setMessages] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");
    const [detailError, setDetailError] = useState("");
    const [success, setSuccess] = useState("");

    const loadMessages = useCallback(async () => {
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const data = await getAdminCollection("messages");
            const rows = listFromData(data);

            if (!rows) {
                throw new Error(
                    "The messages endpoint returned an unexpected response."
                );
            }

            const normalized = rows
                .map(normalizeMessage)
                .filter((message) => message.id != null);

            setMessages(normalized);

            setSelectedId((currentId) => {
                if (
                    currentId != null &&
                    normalized.some(
                        (message) =>
                            String(message.id) === String(currentId)
                    )
                ) {
                    return currentId;
                }

                return normalized[0]?.id ?? null;
            });
        } catch (requestError) {
            setError(getErrorMessage(requestError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    useEffect(() => {
        if (selectedId == null) {
            setDetailError("");
            setDetailLoading(false);
            return undefined;
        }

        let cancelled = false;

        async function loadDetails() {
            setDetailLoading(true);
            setDetailError("");

            try {
                const data = await getAdminResource(
                    "messages",
                    encodeURIComponent(selectedId)
                );

                if (!cancelled) {
                    const message = normalizeMessage(
                        data?.message || data
                    );

                    setMessages((current) =>
                        current.map((item) =>
                            String(item.id) === String(message.id)
                                ? { ...item, ...message }
                                : item
                        )
                    );
                }
            } catch (requestError) {
                if (!cancelled) {
                    setDetailError(getErrorMessage(requestError));
                }
            } finally {
                if (!cancelled) {
                    setDetailLoading(false);
                }
            }
        }

        loadDetails();

        return () => {
            cancelled = true;
        };
    }, [selectedId]);

    const filtered = useMemo(() => {
        const search = query.trim().toLowerCase();

        if (!search) return messages;

        return messages.filter((message) =>
            [
                message.name,
                message.email,
                message.subject,
                message.body,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(search)
        );
    }, [messages, query]);

    const selected = useMemo(
        () =>
            messages.find(
                (message) =>
                    String(message.id) === String(selectedId)
            ) || null,
        [messages, selectedId]
    );

    async function handleDelete() {
        if (!selected?.id || deleting) return;

        const confirmed = window.confirm(
            "Permanently delete this message? This cannot be undone."
        );

        if (!confirmed) return;

        const deletedId = selected.id;

        setDeleting(true);
        setError("");
        setDetailError("");
        setSuccess("");

        try {
            await deleteAdminResource("messages", deletedId);

            const remaining = messages.filter(
                (message) =>
                    String(message.id) !== String(deletedId)
            );

            setMessages(remaining);
            setSelectedId(remaining[0]?.id ?? null);
            setSuccess("Message deleted successfully.");
        } catch (requestError) {
            setDetailError(getErrorMessage(requestError));
        } finally {
            setDeleting(false);
        }
    }

    if (!isEndpointConfigured("messages")) {
        return (
            <div className="admin-page">
                <section className="admin-page-toolbar">
                    <div>
                        <div className="admin-eyebrow">
                            CUSTOMER COMMUNICATION
                        </div>
                        <h2>Messages</h2>
                    </div>
                </section>

                <div className="admin-integration-notice">
                    <strong>Messages endpoint is not configured.</strong>
                    <p>
                        Set the messages endpoint in adminApi.js before
                        loading the inbox.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <section className="admin-page-toolbar">
                <div>
                    <div className="admin-eyebrow">
                        CUSTOMER COMMUNICATION
                    </div>
                    <h2>Messages</h2>
                    <p>
                        Review and manage enquiries submitted through Geeka.
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

            {error && (
                <div className="admin-error-banner" role="alert">
                    {error}
                </div>
            )}

            {success && (
                <div className="admin-success-banner" role="status">
                    {success}
                </div>
            )}

            <div className="admin-message-layout">
                <section className="admin-panel-card admin-message-list-card">
                    <div className="admin-message-filter-bar">
                        <input
                            className="admin-search-input"
                            value={query}
                            onChange={(event) =>
                                setQuery(event.target.value)
                            }
                            placeholder="Search by name, email or subject..."
                            aria-label="Search customer messages"
                        />

                        <span className="admin-message-count">
                            {filtered.length} messages
                        </span>
                    </div>

                    <div className="admin-message-list">
                        {loading && messages.length === 0 ? (
                            <div className="admin-empty-state compact">
                                <strong>Loading messages...</strong>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="admin-empty-state compact">
                                <strong>No messages found</strong>
                                <p>
                                    {query.trim()
                                        ? "Try a different search."
                                        : "New customer enquiries will appear here."}
                                </p>
                            </div>
                        ) : (
                            filtered.map((message) => (
                                <button
                                    type="button"
                                    key={message.id}
                                    className={`admin-message-row ${String(message.id) ===
                                            String(selectedId)
                                            ? "admin-message-row-active"
                                            : ""
                                        }`}
                                    onClick={() => {
                                        setSelectedId(message.id);
                                        setDetailError("");
                                        setSuccess("");
                                    }}
                                >
                                    <div className="admin-message-row-main">
                                        <strong>
                                            {message.name ||
                                                message.email ||
                                                "Customer"}
                                        </strong>

                                        <span>{message.subject}</span>

                                        <small>
                                            {message.body.slice(0, 100)}
                                            {message.body.length > 100
                                                ? "..."
                                                : ""}
                                        </small>
                                    </div>

                                    <time>
                                        {formatDate(message.createdAt)}
                                    </time>
                                </button>
                            ))
                        )}
                    </div>
                </section>

                <section className="admin-panel-card admin-message-detail-card">
                    {!selected ? (
                        <div className="admin-empty-state">
                            <strong>
                                {loading
                                    ? "Loading inbox"
                                    : "Select a message"}
                            </strong>
                            <p>
                                {loading
                                    ? "Please wait while enquiries load."
                                    : "Choose an enquiry from the inbox to view its details."}
                            </p>
                        </div>
                    ) : detailLoading ? (
                        <div className="admin-empty-state">
                            <strong>Loading message details...</strong>
                        </div>
                    ) : (
                        <>
                            <div className="admin-message-detail-header">
                                <div>
                                    <div className="admin-eyebrow">
                                        MESSAGE DETAILS
                                    </div>
                                    <h3>{selected.subject}</h3>
                                </div>

                                <button
                                    type="button"
                                    className="admin-button admin-button-secondary"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? "Deleting..." : "Delete"}
                                </button>
                            </div>

                            {detailError && (
                                <div
                                    className="admin-error-banner"
                                    role="alert"
                                >
                                    {detailError}
                                </div>
                            )}

                            <div className="admin-message-sender">
                                <strong>
                                    {selected.name || "Customer"}
                                </strong>

                                {selected.email ? (
                                    <a href={`mailto:${selected.email}`}>
                                        {selected.email}
                                    </a>
                                ) : (
                                    <span>No email provided</span>
                                )}

                                <time>
                                    {formatDateTime(selected.createdAt)}
                                </time>
                            </div>

                            <div className="admin-message-body">
                                {selected.body ||
                                    "No message text was provided."}
                            </div>

                            <div className="admin-message-actions">
                                {selected.email && (
                                    <a
                                        className="admin-button admin-button-primary"
                                        href={`mailto:${selected.email}?subject=${encodeURIComponent(
                                            `Re: ${selected.subject}`
                                        )}`}
                                    >
                                        Reply by email
                                    </a>
                                )}
                            </div>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}
