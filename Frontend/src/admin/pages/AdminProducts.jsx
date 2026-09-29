import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import {
    getAdminProducts,
    updateAdminProductStatus,
} from "../services/adminApi";

import "../style/AdminPages.css";


const PRODUCT_STATUSES = [
    "DRAFT",
    "PUBLISHED",
    "ARCHIVED",
];


function normalizeProducts(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.results)) {
        return data.results;
    }

    if (Array.isArray(data?.items)) {
        return data.items;
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    return [];
}


function getCategoryLabel(product) {
    if (typeof product?.category === "string") {
        return product.category;
    }

    if (product?.category?.name) {
        return product.category.name;
    }

    if (product?.category_name) {
        return product.category_name;
    }

    return "—";
}


function getProductId(product) {
    return product?.id || product?.uuid || null;
}


function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString();
}


function StatusBadge({ status }) {
    const normalized = String(
        status || "UNKNOWN"
    ).toUpperCase();

    return (
        <span
            className={`admin-status-badge status-${normalized.toLowerCase()}`}
        >
            {normalized}
        </span>
    );
}


export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");


    const loadProducts = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const data = await getAdminProducts();

            setProducts(
                normalizeProducts(data)
            );
        } catch (requestError) {
            setError(
                requestError?.message ||
                "Unable to load products."
            );
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        loadProducts();
    }, [loadProducts]);


    const filteredProducts = useMemo(() => {
        const search = query
            .trim()
            .toLowerCase();

        return products.filter((product) => {
            const productStatus = String(
                product?.status || ""
            ).toUpperCase();

            const matchesStatus =
                statusFilter === "ALL" ||
                productStatus === statusFilter;

            if (!matchesStatus) {
                return false;
            }

            if (!search) {
                return true;
            }

            const haystack = [
                product?.name,
                product?.slug,
                product?.id,
                getCategoryLabel(product),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return haystack.includes(search);
        });
    }, [
        products,
        query,
        statusFilter,
    ]);




    return (
        <div className="admin-page">
            <section className="admin-page-toolbar">
                <div>
                    <div className="admin-eyebrow">
                        CATALOGUE
                    </div>

                    <h2>
                        Products
                    </h2>

                    <p>
                        Products are loaded directly from the Django admin catalogue API.
                    </p>
                </div>

                <div className="admin-toolbar-actions">
                    <button
                        type="button"
                        className="admin-button admin-button-secondary"
                        onClick={loadProducts}
                        disabled={loading}
                    >
                        {loading
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>

                    <Link
                        to="/admin/products/new"
                        className="admin-button admin-button-primary"
                    >
                        Add product
                    </Link>
                </div>
            </section>

            {error && (
                <div className="admin-error-banner">
                    {error}
                </div>
            )}

            <section className="admin-panel-card">
                <div className="admin-filter-row">
                    <input
                        className="admin-search-input"
                        type="search"
                        placeholder="Search products..."
                        value={query}
                        onChange={(event) =>
                            setQuery(
                                event.target.value
                            )
                        }
                    />

                    <select
                        className="admin-select"
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(
                                event.target.value
                            )
                        }
                    >
                        <option value="ALL">
                            All statuses
                        </option>
                        {PRODUCT_STATUSES.map(
                            (status) => (
                                <option
                                    key={status}
                                    value={status}
                                >
                                    {status}
                                </option>
                            )
                        )}
                    </select>
                </div>

                {loading ? (
                    <div className="admin-empty-state">
                        <strong>
                            Loading products...
                        </strong>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="admin-empty-state">
                        <strong>
                            No products found
                        </strong>
                        <p>
                            The backend returned no products matching the current filters.
                        </p>
                    </div>
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>
                                        Product
                                    </th>
                                    <th>
                                        Category
                                    </th>
                                    <th>
                                        Status
                                    </th>
                                    <th>
                                        Updated
                                    </th>
                                    <th />
                                </tr>
                            </thead>

                            <tbody>
                                {filteredProducts.map(
                                    (product, index) => {
                                        const productId =
                                            getProductId(
                                                product
                                            );

                                        const currentStatus =
                                            String(
                                                product?.status ||
                                                "UNKNOWN"
                                            ).toUpperCase();

                                        return (
                                            <tr
                                                key={
                                                    productId ||
                                                    index
                                                }
                                            >
                                                <td>
                                                    <strong>
                                                        {product?.name ||
                                                            "Untitled product"}
                                                    </strong>

                                                    <span>
                                                        {product?.slug ||
                                                            productId ||
                                                            "—"}
                                                    </span>
                                                </td>

                                                <td>
                                                    {getCategoryLabel(
                                                        product
                                                    )}
                                                </td>

                                                <td>
                                                    <StatusBadge
                                                        status={
                                                            currentStatus
                                                        }
                                                    />
                                                </td>

                                                <td>
                                                    {formatDate(
                                                        product?.updated_at
                                                    )}
                                                </td>

                                                <td>
                                                    {productId ? (
                                                        <Link
                                                            to={`/admin/products/${productId}`}
                                                            className="admin-table-link"
                                                        >
                                                            Edit
                                                        </Link>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
