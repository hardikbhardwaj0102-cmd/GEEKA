import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    getAdminProducts,
    getAdminProductVariants,
    updateAdminVariant,
} from "../services/adminApi";

import "../style/AdminPages.css";
import "../style/AdminInventory.css";


const LOW_STOCK_DEFAULT = 5;
const MAX_CONCURRENT_REQUESTS = 5;


/* =========================================================
   DATA HELPERS
========================================================= */

function normalizeList(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.results)) {
        return data.results;
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    return [];
}


function getProductId(product) {
    return (
        product?.id ??
        product?.product_id ??
        product?.pk ??
        null
    );
}


function getVariantId(variant) {
    return (
        variant?.id ??
        variant?.variant_id ??
        variant?.pk ??
        null
    );
}


function getCategoryName(product) {
    const category = product?.category;

    if (typeof category === "string") {
        return category;
    }

    if (typeof category === "number") {
        return String(category);
    }

    return (
        category?.name ??
        product?.category_name ??
        "Uncategorized"
    );
}


function getVariantLabel(variant) {
    const attributes = variant?.attributes;

    if (Array.isArray(attributes)) {
        const values = attributes
            .map((item) => {
                if (typeof item === "string") {
                    return item;
                }

                return (
                    item?.value?.value ??
                    item?.value?.name ??
                    item?.value ??
                    item?.attribute_value ??
                    item?.name ??
                    ""
                );
            })
            .filter(Boolean);

        if (values.length > 0) {
            return values.join(" / ");
        }
    }

    if (
        attributes &&
        typeof attributes === "object"
    ) {
        const values = Object.values(attributes)
            .map((value) => {
                if (
                    value &&
                    typeof value === "object"
                ) {
                    return (
                        value.value ??
                        value.name ??
                        ""
                    );
                }

                return value;
            })
            .filter(Boolean);

        if (values.length > 0) {
            return values.join(" / ");
        }
    }

    return (
        variant?.name ??
        variant?.title ??
        variant?.sku ??
        `Variant ${getVariantId(variant) ?? ""}`
    );
}


function getStockValue(variant) {
    const value =
        variant?.stock ??
        variant?.stock_quantity ??
        variant?.quantity ??
        0;

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}


function getThresholdValue(variant) {
    const value =
        variant?.low_stock_threshold ??
        variant?.low_stock_limit ??
        LOW_STOCK_DEFAULT;

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : LOW_STOCK_DEFAULT;
}


function getStockStatus(stock, threshold) {
    if (stock <= 0) {
        return "OUT";
    }

    if (stock <= threshold) {
        return "LOW";
    }

    return "IN";
}


function formatCurrency(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "—";
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(number);
}


function getErrorMessage(error) {
    if (error?.code === "ENDPOINT_NOT_CONFIGURED") {
        return "This API endpoint has not been configured in the admin service.";
    }

    if (error?.status === 401) {
        return "Your session has expired. Please sign in again.";
    }

    if (error?.status === 403) {
        return "You do not have permission to access this inventory.";
    }

    if (error?.status === 404) {
        return "The inventory API endpoint was not found on the backend.";
    }

    return (
        error?.message ||
        "Something went wrong while loading inventory."
    );
}


/* =========================================================
   API HELPERS
========================================================= */

async function fetchAllProducts() {
    const allProducts = [];
    const seenPages = new Set();

    let page = 1;

    while (page <= 1000) {
        if (seenPages.has(page)) {
            break;
        }

        seenPages.add(page);

        const response = await getAdminProducts({ page });
        const products = normalizeList(response);

        allProducts.push(...products);

        if (
            Array.isArray(response) ||
            !response?.next ||
            products.length === 0
        ) {
            break;
        }

        page += 1;
    }

    return allProducts;
}


async function fetchProductVariants(productId) {
    const response = await getAdminProductVariants(productId);

    return normalizeList(response);
}


async function updateVariantStock(
    variantId,
    stock,
    lowStockThreshold
) {
    return updateAdminVariant(variantId, {
        stock,
        low_stock_threshold: lowStockThreshold,
    });
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
            const index = nextIndex;
            nextIndex += 1;

            if (index >= items.length) {
                return;
            }

            try {
                results[index] = {
                    success: true,
                    value: await callback(items[index]),
                };
            } catch (error) {
                results[index] = {
                    success: false,
                    error,
                };
            }
        }
    }

    const workerCount = Math.min(
        concurrency,
        items.length
    );

    await Promise.all(
        Array.from(
            { length: workerCount },
            () => worker()
        )
    );

    return results;
}


/* =========================================================
   INVENTORY PAGE
========================================================= */

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


    /* =====================================================
       LOAD INVENTORY
    ===================================================== */

    const loadInventory = useCallback(async () => {
        setLoading(true);
        setError("");
        setWarning("");
        setNotice("");
        setRowError("");

        try {
            const products = await fetchAllProducts();

            const validProducts = products.filter(
                (product) => getProductId(product) != null
            );

            const results = await mapWithConcurrency(
                validProducts,
                MAX_CONCURRENT_REQUESTS,
                async (product) => {
                    const productId = getProductId(product);

                    const variants =
                        await fetchProductVariants(productId);

                    return {
                        product,
                        variants,
                    };
                }
            );

            const rows = [];
            let failedProducts = 0;

            results.forEach((result) => {
                if (!result?.success) {
                    failedProducts += 1;
                    return;
                }

                const { product, variants } = result.value;

                variants.forEach((variant) => {
                    const variantId = getVariantId(variant);

                    if (variantId == null) {
                        return;
                    }

                    const stock = getStockValue(variant);
                    const threshold = getThresholdValue(variant);

                    rows.push({
                        id: String(variantId),
                        variantId,
                        productId: getProductId(product),

                        productName:
                            product?.name ??
                            product?.title ??
                            "Unnamed product",

                        productSlug: product?.slug ?? "",
                        category: getCategoryName(product),
                        sku: variant?.sku ?? "",
                        variantLabel: getVariantLabel(variant),

                        stock,
                        lowStockThreshold: threshold,

                        price:
                            variant?.price ??
                            product?.price ??
                            null,

                        status: getStockStatus(
                            stock,
                            threshold
                        ),
                    });
                });
            });

            setInventory(rows);

            if (failedProducts > 0) {
                setWarning(
                    `Inventory loaded partially. Could not load variants for ${failedProducts} product(s). Verify that the backend variant endpoint is available.`
                );
            }
        } catch (loadError) {
            setError(getErrorMessage(loadError));
            setInventory([]);
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        loadInventory();
    }, [loadInventory]);


    /* =====================================================
       SUMMARY
    ===================================================== */

    const summary = useMemo(() => {
        const totalStock = inventory.reduce(
            (total, item) => total + item.stock,
            0
        );

        const lowStock = inventory.filter(
            (item) => item.status === "LOW"
        ).length;

        const outOfStock = inventory.filter(
            (item) => item.status === "OUT"
        ).length;

        return {
            totalVariants: inventory.length,
            totalStock,
            lowStock,
            outOfStock,
        };
    }, [inventory]);


    /* =====================================================
       FILTERING
    ===================================================== */

    const filteredInventory = useMemo(() => {
        const normalizedQuery = query
            .trim()
            .toLowerCase();

        return inventory.filter((item) => {
            const matchesQuery =
                !normalizedQuery ||
                [
                    item.productName,
                    item.productSlug,
                    item.category,
                    item.sku,
                    item.variantLabel,
                    String(item.productId),
                    String(item.variantId),
                ].some((value) =>
                    String(value ?? "")
                        .toLowerCase()
                        .includes(normalizedQuery)
                );

            const matchesStatus =
                statusFilter === "ALL" ||
                item.status === statusFilter;

            return matchesQuery && matchesStatus;
        });
    }, [inventory, query, statusFilter]);


    /* =====================================================
       EDITING
    ===================================================== */

    function startEditing(item) {
        setEditingId(item.id);
        setDraftStock(String(item.stock));

        setDraftThreshold(
            String(item.lowStockThreshold)
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


    async function saveStock(item) {
        const stock = Number(draftStock);
        const threshold = Number(draftThreshold);

        if (
            draftStock.trim() === "" ||
            !Number.isInteger(stock) ||
            stock < 0
        ) {
            setRowError(
                "Stock must be a non-negative whole number."
            );
            return;
        }

        if (
            draftThreshold.trim() === "" ||
            !Number.isInteger(threshold) ||
            threshold < 0
        ) {
            setRowError(
                "The low-stock threshold must be a non-negative whole number."
            );
            return;
        }

        setSavingId(item.id);
        setRowError("");
        setNotice("");

        try {
            await updateVariantStock(
                item.variantId,
                stock,
                threshold
            );

            setInventory((current) =>
                current.map((row) => {
                    if (row.id !== item.id) {
                        return row;
                    }

                    return {
                        ...row,
                        stock,
                        lowStockThreshold: threshold,

                        status: getStockStatus(
                            stock,
                            threshold
                        ),
                    };
                })
            );

            setEditingId(null);
            setDraftStock("");
            setDraftThreshold("");

            setNotice(
                `Stock updated for ${item.productName}.`
            );
        } catch (saveError) {
            setRowError(getErrorMessage(saveError));
        } finally {
            setSavingId(null);
        }
    }


    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <main className="admin-inventory-page">
            <header className="admin-inventory-header">
                <div>
                    <p className="admin-inventory-eyebrow">
                        CATALOG MANAGEMENT
                    </p>

                    <h1>Inventory</h1>

                    <p className="admin-inventory-description">
                        Monitor stock levels and manage product variants.
                    </p>
                </div>

                <button
                    type="button"
                    className="inventory-refresh-button"
                    onClick={loadInventory}
                    disabled={loading || savingId !== null}
                >
                    {loading ? "Loading..." : "Refresh inventory"}
                </button>
            </header>


            {error && (
                <div
                    className="inventory-message inventory-message-error"
                    role="alert"
                >
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={loadInventory}
                        disabled={loading}
                    >
                        Retry
                    </button>
                </div>
            )}


            {warning && !error && (
                <div
                    className="inventory-message inventory-message-warning"
                    role="status"
                >
                    {warning}
                </div>
            )}


            {notice && (
                <div
                    className="inventory-message inventory-message-success"
                    role="status"
                >
                    {notice}
                </div>
            )}


            <section
                className="inventory-summary-grid"
                aria-label="Inventory summary"
            >
                <article className="inventory-summary-card">
                    <span>Variants tracked</span>

                    <strong>
                        {summary.totalVariants}
                    </strong>
                </article>

                <article className="inventory-summary-card">
                    <span>Total units in stock</span>

                    <strong>
                        {summary.totalStock}
                    </strong>
                </article>

                <article className="inventory-summary-card">
                    <span>Low stock</span>

                    <strong className="inventory-summary-low">
                        {summary.lowStock}
                    </strong>
                </article>

                <article className="inventory-summary-card">
                    <span>Out of stock</span>

                    <strong className="inventory-summary-out">
                        {summary.outOfStock}
                    </strong>
                </article>
            </section>


            <section className="inventory-panel">
                <div className="inventory-panel-header">
                    <div>
                        <h2>Stock overview</h2>

                        <p>
                            Search products, check availability, and edit stock levels.
                        </p>
                    </div>

                    <span className="inventory-result-count">
                        {filteredInventory.length} variants
                    </span>
                </div>


                <div className="inventory-toolbar">
                    <input
                        type="search"
                        className="inventory-search"
                        placeholder="Search product, SKU, category..."
                        value={query}
                        onChange={(event) =>
                            setQuery(event.target.value)
                        }
                        aria-label="Search inventory"
                    />

                    <select
                        className="inventory-status-filter"
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value)
                        }
                        aria-label="Filter inventory by stock status"
                    >
                        <option value="ALL">
                            All stock statuses
                        </option>

                        <option value="IN">
                            In stock
                        </option>

                        <option value="LOW">
                            Low stock
                        </option>

                        <option value="OUT">
                            Out of stock
                        </option>
                    </select>
                </div>


                {rowError && (
                    <div
                        className="inventory-message inventory-message-error"
                        role="alert"
                    >
                        {rowError}
                    </div>
                )}


                <div className="inventory-table-wrapper">
                    <table className="inventory-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Variant / SKU</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Low-stock alert</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="inventory-empty-state"
                                    >
                                        Loading inventory...
                                    </td>
                                </tr>
                            )}


                            {!loading &&
                                !error &&
                                filteredInventory.map((item) => {
                                    const isEditing =
                                        editingId === item.id;

                                    const isSaving =
                                        savingId === item.id;

                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <div className="inventory-product-cell">
                                                    <strong>
                                                        {item.productName}
                                                    </strong>

                                                    <span>
                                                        {item.category}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="inventory-variant-cell">
                                                    <span>
                                                        {item.variantLabel}
                                                    </span>

                                                    <small>
                                                        {item.sku || "No SKU"}
                                                    </small>
                                                </div>
                                            </td>

                                            <td>
                                                {formatCurrency(item.price)}
                                            </td>

                                            <td>
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        className="inventory-number-input"
                                                        value={draftStock}
                                                        onChange={(event) =>
                                                            setDraftStock(
                                                                event.target.value
                                                            )
                                                        }
                                                        aria-label={`Stock for ${item.productName}`}
                                                    />
                                                ) : (
                                                    <strong className="inventory-stock-number">
                                                        {item.stock}
                                                    </strong>
                                                )}
                                            </td>

                                            <td>
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        className="inventory-number-input"
                                                        value={draftThreshold}
                                                        onChange={(event) =>
                                                            setDraftThreshold(
                                                                event.target.value
                                                            )
                                                        }
                                                        aria-label={`Low-stock threshold for ${item.productName}`}
                                                    />
                                                ) : (
                                                    item.lowStockThreshold
                                                )}
                                            </td>

                                            <td>
                                                <span
                                                    className={`inventory-stock-badge inventory-stock-${item.status.toLowerCase()}`}
                                                >
                                                    {item.status === "IN"
                                                        ? "In stock"
                                                        : item.status === "LOW"
                                                            ? "Low stock"
                                                            : "Out of stock"}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="inventory-actions">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="inventory-save-button"
                                                                onClick={() =>
                                                                    saveStock(item)
                                                                }
                                                                disabled={isSaving}
                                                            >
                                                                {isSaving
                                                                    ? "Saving..."
                                                                    : "Save"}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="inventory-cancel-button"
                                                                onClick={cancelEditing}
                                                                disabled={isSaving}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="inventory-edit-button"
                                                            onClick={() =>
                                                                startEditing(item)
                                                            }
                                                            disabled={
                                                                savingId !== null
                                                            }
                                                        >
                                                            Edit stock
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}


                            {!loading &&
                                !error &&
                                filteredInventory.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="inventory-empty-state"
                                        >
                                            {inventory.length === 0
                                                ? "No inventory variants found."
                                                : "No variants match your search or filter."}
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}
