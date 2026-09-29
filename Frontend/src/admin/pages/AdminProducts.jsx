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
} from "../services/adminApi";

import "../style/AdminPages.css";


const PRODUCT_STATUSES = [
    "DRAFT",
    "PUBLISHED",
    "ARCHIVED",
];


function normalizeProducts(data) {

    if (
        Array.isArray(data)
    ) {
        return data;
    }


    if (
        Array.isArray(data?.results)
    ) {
        return data.results;
    }


    return [];
}


function getCategoryLabel(product) {

    if (
        product?.category?.name
    ) {
        return product.category.name;
    }


    if (
        typeof product?.category ===
        "string"
    ) {
        return product.category;
    }


    if (
        product?.category_id !==
        undefined &&
        product?.category_id !==
        null
    ) {
        return `Category #${product.category_id}`;
    }


    return "—";
}


function getProductId(product) {

    return (
        product?.id ||
        product?.uuid ||
        null
    );
}


function formatDate(value) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
    }


    return date.toLocaleDateString();
}


function StatusBadge({ status }) {

    const normalized =
        String(
            status ||
            "UNKNOWN"
        ).toUpperCase();


    return (
        <span
            className={`admin-status-badge status-${normalized.toLowerCase()}`}
        >
            {normalized}
        </span>
    );
}


function getApiErrorMessage(error) {

    if (!error) {
        return "Unable to load products.";
    }


    if (
        error.status ===
        401
    ) {
        return "Your Django session is no longer authenticated. Please log in again.";
    }


    if (
        error.status ===
        403
    ) {
        return "Django denied this request. The logged-in account must have staff/admin permission.";
    }


    if (
        error.status ===
        404
    ) {
        return (
            "The admin product endpoint returned 404. " +
            "Make sure the latest Django backend deployment is live."
        );
    }


    return (
        error.message ||
        "Unable to load products."
    );
}


export default function AdminProducts() {

    const [
        products,
        setProducts,
    ] = useState([]);


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        error,
        setError,
    ] = useState("");


    const [
        query,
        setQuery,
    ] = useState("");


    const [
        statusFilter,
        setStatusFilter,
    ] = useState("ALL");


    const [
        currentPage,
        setCurrentPage,
    ] = useState(1);


    const [
        pagination,
        setPagination,
    ] = useState({
        count: 0,
        next: null,
        previous: null,
    });


    const loadProducts =
        useCallback(
            async (
                page = currentPage
            ) => {

                setLoading(true);
                setError("");


                try {

                    const data =
                        await getAdminProducts({
                            status:
                                statusFilter ===
                                    "ALL"
                                    ? undefined
                                    : statusFilter,
                            page,
                        });


                    setProducts(
                        normalizeProducts(
                            data
                        )
                    );


                    setPagination({
                        count:
                            Number(
                                data?.count ||
                                0
                            ),
                        next:
                            data?.next ||
                            null,
                        previous:
                            data?.previous ||
                            null,
                    });

                } catch (
                requestError
                ) {

                    setProducts([]);

                    setPagination({
                        count: 0,
                        next: null,
                        previous: null,
                    });

                    setError(
                        getApiErrorMessage(
                            requestError
                        )
                    );

                } finally {

                    setLoading(
                        false
                    );
                }

            },
            [
                currentPage,
                statusFilter,
            ]
        );


    useEffect(() => {

        loadProducts(
            currentPage
        );

    }, [
        currentPage,
        loadProducts,
    ]);


    function handleStatusFilterChange(
        event
    ) {

        setStatusFilter(
            event.target.value
        );

        setCurrentPage(
            1
        );

        setQuery("");
    }


    function goToPreviousPage() {

        if (
            !pagination.previous ||
            currentPage <=
            1
        ) {
            return;
        }


        setCurrentPage(
            (page) =>
                Math.max(
                    1,
                    page - 1
                )
        );
    }


    function goToNextPage() {

        if (
            !pagination.next
        ) {
            return;
        }


        setCurrentPage(
            (page) =>
                page + 1
        );
    }


    const filteredProducts =
        useMemo(
            () => {

                const search =
                    query
                        .trim()
                        .toLowerCase();


                if (!search) {
                    return products;
                }


                return products.filter(
                    (
                        product
                    ) => {

                        const haystack = [
                            product?.name,
                            product?.slug,
                            product?.id,
                            getCategoryLabel(
                                product
                            ),
                        ]
                            .filter(
                                Boolean
                            )
                            .join(
                                " "
                            )
                            .toLowerCase();


                        return haystack.includes(
                            search
                        );
                    }
                );

            },
            [
                products,
                query,
            ]
        );


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
                        onClick={() =>
                            loadProducts(
                                currentPage
                            )
                        }
                        disabled={
                            loading
                        }
                    >
                        {
                            loading
                                ? "Refreshing..."
                                : "Refresh"
                        }
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
                        placeholder="Search products on this page..."
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
                        onChange={
                            handleStatusFilterChange
                        }
                    >

                        <option value="ALL">
                            All statuses
                        </option>


                        {PRODUCT_STATUSES.map(
                            (
                                status
                            ) => (
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
                                    (
                                        product,
                                        index
                                    ) => {

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
                                                        {
                                                            product?.name ||
                                                            "Untitled product"
                                                        }
                                                    </strong>


                                                    <span>
                                                        {
                                                            product?.slug ||
                                                            productId ||
                                                            "—"
                                                        }
                                                    </span>

                                                </td>


                                                <td>
                                                    {
                                                        getCategoryLabel(
                                                            product
                                                        )
                                                    }
                                                </td>


                                                <td>

                                                    <StatusBadge
                                                        status={
                                                            currentStatus
                                                        }
                                                    />

                                                </td>


                                                <td>
                                                    {
                                                        formatDate(
                                                            product?.updated_at
                                                        )
                                                    }
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


                <div
                    className="admin-toolbar-actions"
                    style={{
                        justifyContent:
                            "space-between",
                        alignItems:
                            "center",
                        marginTop:
                            "18px",
                    }}
                >

                    <span className="admin-field-help">

                        {
                            pagination.count
                                ? `${pagination.count} product${pagination.count === 1 ? "" : "s"} total · Page ${currentPage}`
                                : `Page ${currentPage}`
                        }

                    </span>


                    <div className="admin-toolbar-actions">

                        <button
                            type="button"
                            className="admin-button admin-button-secondary"
                            onClick={
                                goToPreviousPage
                            }
                            disabled={
                                loading ||
                                !pagination.previous
                            }
                        >
                            Previous
                        </button>


                        <button
                            type="button"
                            className="admin-button admin-button-secondary"
                            onClick={
                                goToNextPage
                            }
                            disabled={
                                loading ||
                                !pagination.next
                            }
                        >
                            Next
                        </button>

                    </div>

                </div>

            </section>

        </div>
    );
}
