
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    getAdminProducts,
    adminRequest,
} from "../../services/adminApi";

import "../style/AdminPages.css";
import "../style/AdminInventory.css";


const LOW_STOCK_FALLBACK = 5;


function normalizeList(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.results)) {
        return data.results;
    }

    return [];
}


function getProductId(product) {
    return product?.id || product?.uuid || null;
}


function getVariantId(variant) {
    return variant?.id || variant?.uuid || null;
}


function getCategoryName(product) {
    if (typeof product?.category === "string") {
        return product.category;
    }

    return product?.category?.name || "Uncategorised";
}


function getVariantLabel(variant) {
    if (!Array.isArray(variant?.attributes)) {
        return "Default variant";
    }

    const labels = variant.attributes
        .map((item) => {
            const attribute = item?.attribute?.name || "";
            const value = item?.value?.value || "";

            if (attribute && value) {
                return `${attribute}: ${value}`;
            }

            return value || attribute;
        })
        .filter(Boolean);

    return labels.length
        ? labels.join(" · ")
        : "Default variant";
}


function getStockStatus(variant) {
    const stock = Number(variant?.stock ?? 0);

    const threshold = Number(
        variant?.low_stock_threshold ??
        LOW_STOCK_FALLBACK
    );

    if (stock <= 0) {
        return "OUT";
    }

    if (threshold > 0 && stock <= threshold) {
        return "LOW";
    }

    return "IN";
}


function getStockLabel(status) {
    if (status === "OUT") return "Out of stock";
    if (status === "LOW") return "Low stock";

    return "In stock";
}


function formatCurrency(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "—";
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(amount);
}


function getErrorMessage(error) {
    if (error?.status === 401) {
        return "Your session has expired. Please sign in again.";
    }

    if (error?.status === 403) {
        return "You do not have permission to access inventory.";
    }

    if (error?.status === 404) {
        return "An inventory endpoint returned 404. Check your backend deployment.";
    }

    return error?.message || "Unable to load inventory.";
}


async function fetchProductVariants(productId) {
    return adminRequest({
        endpoint:
            `/api/v1/catalog/admin/products/${productId}/variants/`,
        method: "GET",
    });
}


async function updateVariantStock(
    variantId,
    stock,
    lowStockThreshold
) {
    return adminRequest({
        endpoint:
            `/api/v1/catalog/admin/variants/${variantId}/`,
        method: "PATCH",
        body: {
            stock,
            low_stock_threshold: lowStockThreshold,
        },
    });
}


async function fetchAllProducts() {
    const allProducts = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
        const data = await getAdminProducts({ page });

        allProducts.push(...normalizeList(data));

        hasNextPage = Boolean(data?.next);

        if (Array.isArray(data)) {
            hasNextPage = false;
        }

        page += 1;

        if (page > 1000) {
            throw new Error(
                "Too many product pages were returned."
            );
        }
    }

    return allProducts;
}


async function mapWithConcurrency(
    items,
    concurrency,
    callback
) {
    const results = new Array(items.length);
    let nextIndex = 0;

    async function worker() {
        while (true) {
            const index = nextIndex++;

            if (index >= items.length) {
                return;
            }

            results[index] = await callback(
                items[index],
                index
            );
        }
    }

    await Promise.all(
        Array.from(
            {
                length: Math.min(
                    concurrency,
                    items.length
                ),
            },
            () => worker()
        )
    );

    return results;
}


export default function AdminInventory() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [warning, setWarning] = useState("");
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [editingId, setEditingId] = useState(null);
    const [draftStock, setDraftStock] = useState("");
    const [draftThreshold, setDraftThreshold] = useState("");
    const [savingId, setSavingId] = useState(null);
    const [rowError, setRowError] = useState("");
    const [notice, setNotice] = useState("");

    const loadInventory = useCallback(async () => {
        setLoading(true);
        setError("");
        setWarning("");
        setNotice("");
        setRowError("");

        try {
            const products = await fetchAllProducts();

            const validProducts = products.filter(
                (product) => getProductId(product)
            );

            const results = await mapWithConcurrency(
                validProducts,
                5,
                async (product) => {
                    try {
                        const response =
                            await fetchProductVariants(
                                getProductId(product)
                            );

                        return {
                            product,
                            variants: normalizeList(response),
                            failed: false,
                        };
                    } catch (variantError) {
                        return {
                            product,
                            variants: [],
                            failed: true,
                            error: variantError,
                        };
                    }
                }
            );

            const rows = [];
            let failedProducts = 0;

            results.forEach((result) => {
                if (result.failed) {
                    failedProducts += 1;
                    return;
                }

                result.variants.forEach((variant) => {
                    const variantId = getVariantId(variant);

                    if (!variantId) {
                        return;
                    }

                    rows.push({
                        id: String(variantId),
                        variant,
                        product: result.product,
                    });
                });
            });

            setInventory(rows);

            if (failedProducts > 0) {
                setWarning(
                    `Could not load variants for ${failedProducts} product(s). ` +
                    "Some inventory may be missing. Try refreshing."
                );
            }
        } catch (requestError) {
            setInventory([]);
            setError(getErrorMessage(requestError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInventory();
    }, [loadInventory]);

    const summary = useMemo(() => {
        return inventory.reduce(
            (totals, row) => {
                const stock = Math.max(
                    0,
                    Number(row.variant?.stock ?? 0)
                );

                const status = getStockStatus(row.variant);

                totals.totalVariants += 1;
                totals.totalStock += stock;

                if (status === "LOW") {
                    totals.lowStock += 1;
                }

                if (status === "OUT") {
                    totals.outOfStock += 1;
                }

                return totals;
            },
            {
                totalVariants: 0,
                totalStock: 0,
                lowStock: 0,
                outOfStock: 0,
            }
        );
    }, [inventory]);

    const filteredInventory = useMemo(() => {
        const search = query.trim().toLowerCase();

        return inventory.filter(({ product, variant }) => {
            const status = getStockStatus(variant);

            if (
                statusFilter !== "ALL" &&
                status !== statusFilter
            ) {
                return false;
            }

            if (!search) {
                return true;
            }

            const searchableText = [
                product?.name,
                product?.slug,
                getProductId(product),
                getCategoryName(product),
                variant?.sku,
                getVariantLabel(variant),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(search);
        });
    }, [inventory, query, statusFilter]);

    function startEditing(row) {
        setEditingId(row.id);
        setDraftStock(String(row.variant?.stock ?? 0));
        setDraftThreshold(
            String(row.variant?.low_stock_threshold ?? 0)
        );
        setRowError("");
        setNotice("");
    }

    function cancelEditing() {
        setEditingId(null);
        setDraftStock("");
        setDraftThreshold("");
        setRowError("");
    }

    async function saveStock(row) {
        if (
            draftStock.trim() === "" ||
            draftThreshold.trim() === ""
        ) {
            setRowError(
                "Enter both the stock quantity and low-stock threshold."
            );
            return;
        }

        const stock = Number(draftStock);
        const threshold = Number(draftThreshold);

        if (
            !Number.isSafeInteger(stock) ||
            stock < 0
        ) {
            setRowError(
                "Stock must be a whole number of zero or more."
            );
            return;
        }

        if (
            !Number.isSafeInteger(threshold) ||
            threshold < 0
        ) {
            setRowError(
                "The low-stock threshold must be a whole number of zero or more."
            );
            return;
        }

        setSavingId(row.id);
        setRowError("");
        setNotice("");

        try {
            const updated = await updateVariantStock(
                row.id,
                stock,
                threshold
            );

            setInventory((current) =>
                current.map((item) => {
                    if (item.id !== row.id) {
                        return item;
                    }

                    return {
                        ...item,
                        variant: {
                            ...item.variant,
                            ...updated,
                            stock: Number(
                                updated?.stock ?? stock
                            ),
                            low_stock_threshold: Number(
                                updated?.low_stock_threshold ??
                                threshold
                            ),
                        },
                    };
                })
            );

            setEditingId(null);
            setDraftStock("");
            setDraftThreshold("");

            setNotice(
                `Stock updated for ${row.product?.name || "this product"}.`
            );
        } catch (saveError) {
            setRowError(getErrorMessage(saveError));
        } finally {
            setSavingId(null);
        }
    }

    return (
        <div className="admin-page admin-inventory-page">
            <section className="admin-page-toolbar">
                <div>
                    <div className="admin-eyebrow">
                        CATALOGUE
                    </div>

                    <h2>Inventory</h2>

                    <p>
                        Monitor stock levels and update product variants.
                    </p>
                </div>

                <div className="admin-toolbar-actions">
                    <button
                        type="button"
                        className="admin-button admin-button-secondary"
                        onClick={loadInventory}
                        disabled={loading || Boolean(savingId)}
                    >
                        {loading ? "Refreshing..." : "Refresh inventory"}
                    </button>
                </div>
            </section>

            {error && (
                <div className="admin-error-banner">
                    {error}
                </div>
            )}

            {warning && (
                <div className="inventory-warning-banner">
                    {warning}
                </div>
            )}

            {notice && (
                <div className="inventory-success-banner">
                    {notice}
                </div>
            )}

            <section className="inventory-summary-grid">
                <article className="inventory-summary-card">
                    <span className="inventory-summary-label">
                        Variants tracked
                    </span>

                    <strong>
                        {summary.totalVariants.toLocaleString("en-IN")}
                    </strong>

                    <span className="inventory-summary-footnote">
                        Across loaded products
                    </span>
                </article>

                <article className="inventory-summary-card">
                    <span className="inventory-summary-label">
                        Units in stock
                    </span>

                    <strong>
                        {summary.totalStock.toLocaleString("en-IN")}
                    </strong>

                    <span className="inventory-summary-footnote">
                        Total available quantity
                    </span>
                </article>

                <article className="inventory-summary-card inventory-summary-low">
                    <span className="inventory-summary-label">
                        Low stock
                    </span>

                    <strong>
                        {summary.lowStock.toLocaleString("en-IN")}
                    </strong>

                    <span className="inventory-summary-footnote">
                        At or below threshold
                    </span>
                </article>

                <article className="inventory-summary-card inventory-summary-out">
                    <span className="inventory-summary-label">
                        Out of stock
                    </span>

                    <strong>
                        {summary.outOfStock.toLocaleString("en-IN")}
                    </strong>

                    <span className="inventory-summary-footnote">
                        Variants with zero units
                    </span>
                </article>
            </section>

            <section className="admin-panel-card inventory-panel">
                <div className="inventory-panel-heading">
                    <div>
                        <h3>Stock overview</h3>

                        <p>
                            Stock is managed separately for each product variant.
                        </p>
                    </div>

                    <span className="inventory-result-count">
                        {filteredInventory.length}{" "}
                        {filteredInventory.length === 1
                            ? "variant"
                            : "variants"}
                    </span>
                </div>

                <div className="admin-filter-row inventory-filter-row">
                    <input
                        className="admin-search-input"
                        type="search"
                        placeholder="Search product, SKU or variant..."
                        value={query}
                        onChange={(event) =>
                            setQuery(event.target.value)
                        }
                    />

                    <select
                        className="admin-select"
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value)
                        }
                    >
                        <option value="ALL">All stock statuses</option>
                        <option value="IN">In stock</option>
                        <option value="LOW">Low stock</option>
                        <option value="OUT">Out of stock</option>
                    </select>
                </div>

                {loading ? (
                    <div className="admin-empty-state">
                        <strong>Loading inventory...</strong>

                        <p>
                            Retrieving products and variants from Django.
                        </p>
                    </div>
                ) : error ? (
                    <div className="admin-empty-state">
                        <strong>Inventory could not be loaded</strong>

                        <p>
                            Check the backend response and try again.
                        </p>

                        <button
                            type="button"
                            className="admin-button admin-button-secondary"
                            onClick={loadInventory}
                        >
                            Try again
                        </button>
                    </div>
                ) : filteredInventory.length === 0 ? (
                    <div className="admin-empty-state">
                        <strong>No inventory found</strong>

                        <p>
                            Try another search or stock-status filter.
                        </p>
                    </div>
                ) : (
                    <div className="admin-table-wrap inventory-table-wrap">
                        <table className="admin-table inventory-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>SKU / Variant</th>
                                    <th>Price</th>
                                    <th>Available stock</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredInventory.map((row) => {
                                    const { product, variant } = row;
                                    const status = getStockStatus(variant);
                                    const isEditing = editingId === row.id;
                                    const isSaving = savingId === row.id;

                                    return (
                                        <tr key={row.id}>
                                            <td>
                                                <div className="inventory-product-cell">
                                                    <strong>
                                                        {product?.name || "Untitled product"}
                                                    </strong>

                                                    <span>
                                                        {getCategoryName(product)}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="inventory-variant-cell">
                                                    <strong>
                                                        {variant?.sku || "No SKU"}
                                                    </strong>

                                                    <span>
                                                        {getVariantLabel(variant)}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="inventory-price">
                                                {formatCurrency(variant?.price)}
                                            </td>

                                            <td>
                                                {isEditing ? (
                                                    <div className="inventory-edit-fields">
                                                        <label>
                                                            <span>Quantity</span>

                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="1"
                                                                value={draftStock}
                                                                onChange={(event) =>
                                                                    setDraftStock(
                                                                        event.target.value
                                                                    )
                                                                }
                                                                disabled={isSaving}
                                                            />
                                                        </label>

                                                        <label>
                                                            <span>Low-stock alert</span>

                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="1"
                                                                value={draftThreshold}
                                                                onChange={(event) =>
                                                                    setDraftThreshold(
                                                                        event.target.value
                                                                    )
                                                                }
                                                                disabled={isSaving}
                                                            />
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <div className="inventory-stock-value">
                                                        <strong>
                                                            {Number(
                                                                variant?.stock ?? 0
                                                            ).toLocaleString("en-IN")}
                                                        </strong>

                                                        <span>units</span>
                                                    </div>
                                                )}
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        `inventory-stock-badge inventory-stock-${status.toLowerCase()}`
                                                    }
                                                >
                                                    {getStockLabel(status)}
                                                </span>
                                            </td>

                                            <td>
                                                {isEditing ? (
                                                    <div className="inventory-row-actions">
                                                        <button
                                                            type="button"
                                                            className="inventory-save-button"
                                                            onClick={() =>
                                                                saveStock(row)
                                                            }
                                                            disabled={isSaving}
                                                        >
                                                            {isSaving ? "Saving..." : "Save"}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="inventory-cancel-button"
                                                            onClick={cancelEditing}
                                                            disabled={isSaving}
                                                        >
                                                            Cancel
                                                        </button>

                                                        {rowError && (
                                                            <span className="inventory-row-error">
                                                                {rowError}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="admin-table-link inventory-edit-button"
                                                        onClick={() =>
                                                            startEditing(row)
                                                        }
                                                        disabled={Boolean(savingId)}
                                                    >
                                                        Edit stock
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="inventory-table-footer">
                    <span>
                        Showing {filteredInventory.length} of{" "}
                        {inventory.length} loaded variants
                    </span>

                    <span>
                        Changes are saved directly to the backend.
                    </span>
                </div>
            </section>
        </div>
    );
}
