import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
    createAdminProduct,
    getAdminCategories,
    getAdminProduct,
    updateAdminProduct,
    updateAdminProductStatus,
    uploadProductImage,
} from "../services/adminApi";

import "../style/AdminPages.css";
import "../style/AdminProductEditor.css";

const PRODUCT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"];

const IMAGE_LIMIT = 5;
const IMAGE_MAX_BYTES = 400 * 1024;
const IMAGE_MAX_DIMENSION = 2000;

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://geeka-backend.onrender.com";

function createEmptyProduct() {
    return {
        id: "",
        name: "",
        slug: "",
        description: "",
        category_id: "",
        status: "DRAFT",
    };
}

function createEmptyVariant() {
    return {
        id: "",
        sku: "",
        price: "",
        stock: "0",
        low_stock_threshold: "0",
        attribute_value_ids: [],
        is_active: true,
        currency: "INR",
    };
}

function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function normalizeProduct(data) {
    const product = data?.product || data || {};
    const rawCategoryId =
        product?.category_id ??
        product?.category?.id ??
        "";

    const categoryId = Number(rawCategoryId);

    return {
        id: product?.id || product?.uuid || "",
        name: product?.name ?? "",
        slug: product?.slug ?? "",
        description: product?.description ?? "",
        category_id:
            Number.isInteger(categoryId) && categoryId > 0
                ? categoryId
                : "",
        status: product?.status ?? "DRAFT",
    };
}

function normalizeImages(data) {
    const product = data?.product || data || {};
    return Array.isArray(product?.images)
        ? product.images
        : [];
}

function normalizeCategories(data) {
    const results = Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data)
            ? data
            : [];

    return results
        .map((category) => {
            const id = Number(category?.id);

            if (!Number.isInteger(id) || id <= 0) {
                return null;
            }

            return {
                id,
                name: category?.name || `Category ${id}`,
                slug: category?.slug || "",
                description: category?.description || "",
                is_active: category?.is_active !== false,
            };
        })
        .filter(Boolean);
}

function normalizeCollection(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.attributes)) return data.attributes;
    if (Array.isArray(data?.values)) return data.values;
    if (Array.isArray(data?.variants)) return data.variants;
    return [];
}

function normalizeAttribute(attribute) {
    return {
        id: Number(attribute?.id),
        name: attribute?.name || "",
        slug: attribute?.slug || "",
        is_active: attribute?.is_active !== false,
    };
}

function normalizeAttributeValue(value) {
    return {
        id: Number(value?.id),
        value:
            value?.value ??
            value?.name ??
            "",
        attribute_id: Number(
            value?.attribute_id ??
            value?.attribute?.id
        ),
        is_active: value?.is_active !== false,
    };
}

function normalizeVariant(variant) {
    const attributeValueIds = Array.isArray(
        variant?.attribute_value_ids
    )
        ? variant.attribute_value_ids
        : Array.isArray(variant?.attributes)
            ? variant.attributes
                .map((item) => item?.value?.id ?? item?.value_id)
                .filter(Boolean)
                .map(Number)
            : [];

    return {
        ...variant,
        id: variant?.id || "",
        sku: variant?.sku || "",
        price: variant?.price ?? "",
        stock: Number(variant?.stock ?? 0),
        low_stock_threshold: Number(
            variant?.low_stock_threshold ?? 0
        ),
        currency: variant?.currency || "INR",
        attribute_value_ids: attributeValueIds,
        is_active: variant?.is_active !== false,
    };
}

function validateImageFile(file) {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
        return "Use JPG, JPEG, PNG or WebP images.";
    }

    if (file.size > IMAGE_MAX_BYTES) {
        return "Image size must be 400 KB or less.";
    }

    return "";
}

function inspectImageDimensions(file) {
    return new Promise((resolve) => {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            const valid =
                image.width <= IMAGE_MAX_DIMENSION &&
                image.height <= IMAGE_MAX_DIMENSION;

            URL.revokeObjectURL(objectUrl);

            resolve({
                valid,
                width: image.width,
                height: image.height,
            });
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve({
                valid: false,
                width: 0,
                height: 0,
            });
        };

        image.src = objectUrl;
    });
}

function getCookie(name) {
    const cookies = document.cookie
        .split(";")
        .map((item) => item.trim());

    const prefix = `${name}=`;

    const match = cookies.find((cookie) =>
        cookie.startsWith(prefix)
    );

    return match
        ? decodeURIComponent(
            match.slice(prefix.length)
        )
        : "";
}

async function getCsrfToken() {
    const existingToken = getCookie("csrftoken");

    if (existingToken) {
        return existingToken;
    }

    const response = await fetch(
        `${API_URL}/api/v1/auth/csrf/`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                Accept: "application/json",
            },
        }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data?.detail ||
            data?.error ||
            "Unable to obtain the Django CSRF token."
        );
    }

    return (
        data?.csrf_token ||
        data?.csrfToken ||
        data?.token ||
        getCookie("csrftoken") ||
        ""
    );
}

async function catalogAdminRequest(
    path,
    options = {}
) {
    const method =
        options.method || "GET";

    const headers = {
        Accept: "application/json",
        ...(options.headers || {}),
    };

    if (
        !["GET", "HEAD", "OPTIONS"].includes(
            method.toUpperCase()
        )
    ) {
        const csrfToken = await getCsrfToken();

        if (csrfToken) {
            headers["X-CSRFToken"] =
                csrfToken;
        }

        headers["Content-Type"] =
            "application/json";
    }

    const response = await fetch(
        `${API_URL}${path}`,
        {
            ...options,
            method,
            credentials: "include",
            headers,
        }
    );

    const data = await response
        .json()
        .catch(() => ({}));

    if (!response.ok) {
        const error = new Error(
            data?.detail ||
            data?.error ||
            data?.message ||
            "The Django API request failed."
        );

        error.status = response.status;
        error.errors =
            data?.errors ||
            data?.non_field_errors ||
            [];

        throw error;
    }

    return data;
}

async function getAdminAttributes() {
    return catalogAdminRequest(
        "/api/v1/catalog/admin/attributes/"
    );
}

async function createAdminAttribute(payload) {
    return catalogAdminRequest(
        "/api/v1/catalog/admin/attributes/",
        {
            method: "POST",
            body: JSON.stringify(payload),
        }
    );
}

async function getAdminAttributeValues(
    attributeId
) {
    return catalogAdminRequest(
        `/api/v1/catalog/admin/attributes/${attributeId}/values/`
    );
}

async function createAdminAttributeValue(
    attributeId,
    payload
) {
    return catalogAdminRequest(
        `/api/v1/catalog/admin/attributes/${attributeId}/values/`,
        {
            method: "POST",
            body: JSON.stringify(payload),
        }
    );
}

async function getAdminProductVariants(
    productId
) {
    return catalogAdminRequest(
        `/api/v1/catalog/admin/products/${productId}/variants/`
    );
}

async function createAdminProductVariant(
    productId,
    payload
) {
    return catalogAdminRequest(
        `/api/v1/catalog/admin/products/${productId}/variants/`,
        {
            method: "POST",
            body: JSON.stringify(payload),
        }
    );
}

async function updateAdminProductVariant(
    productId,
    variantId,
    payload
) {
    return catalogAdminRequest(
        `/api/v1/catalog/admin/products/${productId}/variants/${variantId}/`,
        {
            method: "PATCH",
            body: JSON.stringify(payload),
        }
    );
}

async function deactivateAdminProductVariant(
    productId,
    variantId
) {
    return catalogAdminRequest(
        `/api/v1/catalog/admin/products/${productId}/variants/${variantId}/deactivate/`,
        {
            method: "POST",
            body: JSON.stringify({}),
        }
    );
}

function getApiErrorMessage(error) {
    if (!error) {
        return "Something went wrong.";
    }

    if (error.status === 401) {
        return "Your Django session is no longer authenticated. Please log in again.";
    }

    if (error.status === 403) {
        return "Django denied this admin operation. The logged-in account must have staff/admin permission or the CSRF session is invalid.";
    }

    if (Array.isArray(error.errors)) {
        const messages = error.errors
            .flatMap((item) =>
                typeof item === "string"
                    ? [item]
                    : Object.values(item || {})
                        .flat()
                        .filter(Boolean)
            );

        if (messages.length) {
            return messages.join(" ");
        }
    }

    if (
        error.errors &&
        typeof error.errors === "object"
    ) {
        const messages = Object.values(
            error.errors
        )
            .flat()
            .filter(Boolean);

        if (messages.length) {
            return messages.join(" ");
        }
    }

    return (
        error.message ||
        "Something went wrong."
    );
}

function attributeDisplayName(variant) {
    if (!Array.isArray(variant?.attributes)) {
        return "No attribute values";
    }

    const parts = variant.attributes
        .map((item) => {
            const attribute =
                item?.attribute?.name ||
                item?.attribute ||
                "";

            const value =
                item?.value?.value ||
                item?.value ||
                "";

            if (!attribute && !value) {
                return "";
            }

            return `${attribute}: ${value}`;
        })
        .filter(Boolean);

    return parts.length
        ? parts.join(" · ")
        : "No attribute values";
}

export default function AdminProductEditor() {
    const { productId } = useParams();
    const navigate = useNavigate();

    const isEdit = Boolean(productId);

    const fileInputRef = useRef(null);

    const [product, setProduct] = useState(
        createEmptyProduct()
    );

    const [initialStatus, setInitialStatus] =
        useState("DRAFT");

    const [categories, setCategories] =
        useState([]);

    const [categoriesLoading, setCategoriesLoading] =
        useState(true);

    const [images, setImages] =
        useState([]);

    const [selectedFiles, setSelectedFiles] =
        useState([]);

    const [attributes, setAttributes] =
        useState([]);

    const [attributeValues, setAttributeValues] =
        useState({});

    const [attributesLoading, setAttributesLoading] =
        useState(false);

    const [attributeForm, setAttributeForm] =
        useState({
            name: "",
        });

    const [valueForms, setValueForms] =
        useState({});

    const [variant, setVariant] =
        useState(createEmptyVariant());

    const [variants, setVariants] =
        useState([]);

    const [variantsLoading, setVariantsLoading] =
        useState(false);

    const [expandedVariantId, setExpandedVariantId] =
        useState("");

    const [savingVariant, setSavingVariant] =
        useState(false);

    const [loading, setLoading] =
        useState(isEdit);

    const [saving, setSaving] =
        useState(false);

    const [uploading, setUploading] =
        useState(false);

    const [creatingAttribute, setCreatingAttribute] =
        useState(false);

    const [creatingValueAttributeId, setCreatingValueAttributeId] =
        useState("");

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [slugManuallyEdited, setSlugManuallyEdited] =
        useState(false);

    const activeAttributes = useMemo(
        () =>
            attributes.filter(
                (item) => item.is_active !== false
            ),
        [attributes]
    );

    const currentCategory = categories.find(
        (category) =>
            category.id ===
            Number(product.category_id)
    );

    useEffect(() => {
        let cancelled = false;

        async function loadCategories() {
            setCategoriesLoading(true);

            try {
                const data =
                    await getAdminCategories();

                if (!cancelled) {
                    setCategories(
                        normalizeCategories(data)
                    );
                }
            } catch (requestError) {
                if (!cancelled) {
                    setCategories([]);
                    setError(
                        getApiErrorMessage(
                            requestError
                        )
                    );
                }
            } finally {
                if (!cancelled) {
                    setCategoriesLoading(false);
                }
            }
        }

        loadCategories();

        return () => {
            cancelled = true;
        };
    }, []);

    async function loadAttributesAndValues() {
        setAttributesLoading(true);

        try {
            const data =
                await getAdminAttributes();

            const normalized =
                normalizeCollection(data)
                    .map(normalizeAttribute)
                    .filter(
                        (item) =>
                            Number.isInteger(item.id) &&
                            item.id > 0 &&
                            item.name
                    );

            setAttributes(normalized);

            const valuesMap = {};

            await Promise.all(
                normalized.map(
                    async (attribute) => {
                        try {
                            const values =
                                await getAdminAttributeValues(
                                    attribute.id
                                );

                            valuesMap[
                                attribute.id
                            ] =
                                normalizeCollection(
                                    values
                                )
                                    .map(
                                        normalizeAttributeValue
                                    )
                                    .filter(
                                        (item) =>
                                            Number.isInteger(
                                                item.id
                                            ) &&
                                            item.id > 0 &&
                                            item.value &&
                                            item.is_active !== false
                                    );
                        } catch {
                            valuesMap[
                                attribute.id
                            ] = [];
                        }
                    }
                )
            );

            setAttributeValues(valuesMap);
        } catch (requestError) {
            setAttributes([]);
            setAttributeValues({});
            setError(
                getApiErrorMessage(
                    requestError
                )
            );
        } finally {
            setAttributesLoading(false);
        }
    }

    async function loadVariants(id) {
        if (!id) {
            setVariants([]);
            return;
        }

        setVariantsLoading(true);

        try {
            const data =
                await getAdminProductVariants(id);

            setVariants(
                normalizeCollection(data)
                    .map(normalizeVariant)
            );
        } catch (requestError) {
            setVariants([]);
            setError(
                getApiErrorMessage(
                    requestError
                )
            );
        } finally {
            setVariantsLoading(false);
        }
    }

    useEffect(() => {
        loadAttributesAndValues();
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadProduct() {
            if (!isEdit) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");

            try {
                const data =
                    await getAdminProduct(
                        productId
                    );

                if (cancelled) return;

                const normalized =
                    normalizeProduct(data);

                setProduct(normalized);
                setInitialStatus(
                    normalized.status
                );
                setImages(
                    normalizeImages(data)
                );

                const returnedVariants =
                    normalizeCollection(
                        data?.product?.variants ??
                        data?.variants
                    );

                if (returnedVariants.length) {
                    setVariants(
                        returnedVariants.map(
                            normalizeVariant
                        )
                    );
                } else {
                    await loadVariants(
                        normalized.id ||
                        productId
                    );
                }
            } catch (requestError) {
                if (!cancelled) {
                    setError(
                        getApiErrorMessage(
                            requestError
                        )
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadProduct();

        return () => {
            cancelled = true;
        };
    }, [isEdit, productId]);

    function updateField(field, value) {
        setProduct((current) => ({
            ...current,
            [field]: value,
        }));

        setError("");
        setSuccess("");
    }

    function handleNameChange(event) {
        const value =
            event.target.value;

        setProduct((current) => ({
            ...current,
            name: value,
            slug: slugManuallyEdited
                ? current.slug
                : slugify(value),
        }));

        setError("");
        setSuccess("");
    }

    function handleCategoryChange(event) {
        const value =
            event.target.value;

        updateField(
            "category_id",
            value
                ? Number(value)
                : ""
        );
    }

    async function handleSave(event) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (categoriesLoading) {
            setError(
                "Categories are still loading. Please wait a moment and try again."
            );
            return;
        }

        const categoryId =
            Number(product.category_id);

        const payload = {
            name: product.name.trim(),
            slug: product.slug.trim(),
            description:
                product.description.trim(),
            category_id: categoryId,
        };

        if (!payload.name) {
            setError(
                "Product name is required."
            );
            return;
        }

        if (payload.name.length < 2) {
            setError(
                "Product name must contain at least 2 characters."
            );
            return;
        }

        if (!payload.slug) {
            setError("Slug is required.");
            return;
        }

        if (
            !Number.isInteger(categoryId) ||
            categoryId <= 0
        ) {
            setError(
                "Please select a valid category."
            );
            return;
        }

        const selectedCategory =
            categories.find(
                (category) =>
                    category.id ===
                    categoryId
            );

        if (!selectedCategory) {
            setError(
                "Selected category does not exist in the Django category list."
            );
            return;
        }

        if (!selectedCategory.is_active) {
            setError(
                "The selected category is inactive. Please choose an active category."
            );
            return;
        }

        if (
            !PRODUCT_STATUSES.includes(
                product.status
            )
        ) {
            setError(
                "Select a valid product status."
            );
            return;
        }

        setSaving(true);

        try {
            const response = isEdit
                ? await updateAdminProduct(
                    productId,
                    payload
                )
                : await createAdminProduct(
                    payload
                );

            const savedProduct =
                response?.product ||
                response?.data ||
                response ||
                {};

            const savedId =
                savedProduct?.id ||
                savedProduct?.uuid ||
                productId;

            if (!savedId) {
                throw new Error(
                    "The product was saved, but the backend response did not contain its UUID."
                );
            }

            const requestedStatus =
                String(
                    product.status || "DRAFT"
                ).toUpperCase();

            const backendStatus =
                String(
                    savedProduct?.status ||
                    (
                        isEdit
                            ? initialStatus
                            : "DRAFT"
                    )
                ).toUpperCase();

            let finalStatus =
                backendStatus;

            if (
                requestedStatus !==
                backendStatus
            ) {
                const statusResponse =
                    await updateAdminProductStatus(
                        savedId,
                        requestedStatus
                    );

                const statusProduct =
                    statusResponse?.product ||
                    statusResponse?.data ||
                    statusResponse ||
                    {};

                finalStatus =
                    String(
                        statusProduct?.status ||
                        requestedStatus
                    ).toUpperCase();
            }

            const normalized =
                normalizeProduct(
                    savedProduct
                );

            setProduct((current) => ({
                ...current,
                ...normalized,
                id: savedId,
                category_id:
                    normalized.category_id ||
                    categoryId,
                status: finalStatus,
            }));

            setInitialStatus(finalStatus);

            if (!isEdit) {
                setSuccess(
                    "Product created successfully. You can now configure its attributes, variants and images."
                );

                navigate(
                    `/admin/products/${savedId}`,
                    { replace: true }
                );
            } else {
                setSuccess(
                    "Product changes saved successfully."
                );
            }
        } catch (requestError) {
            setError(
                getApiErrorMessage(
                    requestError
                )
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleCreateAttribute(
        event
    ) {
        event.preventDefault();

        const name =
            attributeForm.name.trim();

        if (!name) {
            setError(
                "Enter an attribute name."
            );
            return;
        }

        setCreatingAttribute(true);
        setError("");
        setSuccess("");

        try {
            await createAdminAttribute({
                name,
            });

            setAttributeForm({
                name: "",
            });

            await loadAttributesAndValues();

            setSuccess(
                `Attribute "${name}" created successfully.`
            );
        } catch (requestError) {
            setError(
                getApiErrorMessage(
                    requestError
                )
            );
        } finally {
            setCreatingAttribute(false);
        }
    }

    function updateValueForm(
        attributeId,
        value
    ) {
        setValueForms((current) => ({
            ...current,
            [attributeId]: value,
        }));
    }

    async function handleCreateValue(
        event,
        attribute
    ) {
        event.preventDefault();

        const value =
            String(
                valueForms[attribute.id] || ""
            ).trim();

        if (!value) {
            setError(
                `Enter a value for ${attribute.name}.`
            );
            return;
        }

        setCreatingValueAttributeId(
            String(attribute.id)
        );

        setError("");
        setSuccess("");

        try {
            await createAdminAttributeValue(
                attribute.id,
                { value }
            );

            updateValueForm(
                attribute.id,
                ""
            );

            await loadAttributesAndValues();

            setSuccess(
                `"${value}" was added to ${attribute.name}.`
            );
        } catch (requestError) {
            setError(
                getApiErrorMessage(
                    requestError
                )
            );
        } finally {
            setCreatingValueAttributeId("");
        }
    }

    function toggleVariantValue(
        valueId
    ) {
        const numericId =
            Number(valueId);

        setVariant((current) => {
            const exists =
                current.attribute_value_ids.includes(
                    numericId
                );

            return {
                ...current,
                attribute_value_ids:
                    exists
                        ? current.attribute_value_ids.filter(
                            (id) =>
                                id !== numericId
                        )
                        : [
                            ...current.attribute_value_ids,
                            numericId,
                        ],
            };
        });
    }

    function clearVariantEditor() {
        setVariant(
            createEmptyVariant()
        );
        setExpandedVariantId("");
    }

    function editVariant(item) {
        const normalized =
            normalizeVariant(item);

        setVariant({
            ...normalized,
            price:
                normalized.price === null ||
                    normalized.price === undefined
                    ? ""
                    : String(
                        normalized.price
                    ),
            stock: String(
                normalized.stock
            ),
            low_stock_threshold:
                String(
                    normalized.low_stock_threshold
                ),
        });

        setExpandedVariantId(
            normalized.id
        );

        document
            .getElementById(
                "admin-variant-editor"
            )
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
    }

    async function handleSaveVariant(
        event
    ) {
        event.preventDefault();

        if (!productId) {
            setError(
                "Save the product before creating variants."
            );
            return;
        }

        const sku =
            variant.sku.trim();

        const price =
            Number(variant.price);

        const stock =
            Number(variant.stock);

        const lowStock =
            Number(
                variant.low_stock_threshold
            );

        if (!sku) {
            setError(
                "Variant SKU is required."
            );
            return;
        }

        if (
            !Number.isFinite(price) ||
            price <= 0
        ) {
            setError(
                "Variant price must be greater than 0."
            );
            return;
        }

        if (
            !Number.isInteger(stock) ||
            stock < 0
        ) {
            setError(
                "Stock must be a whole number greater than or equal to 0."
            );
            return;
        }

        if (
            !Number.isInteger(lowStock) ||
            lowStock < 0
        ) {
            setError(
                "Low-stock threshold must be a whole number greater than or equal to 0."
            );
            return;
        }

        const duplicateAttributeIds =
            new Set(
                variant.attribute_value_ids
            );

        if (
            duplicateAttributeIds.size !==
            variant.attribute_value_ids.length
        ) {
            setError(
                "A variant cannot contain the same attribute value more than once."
            );
            return;
        }

        const payload = {
            sku,
            price: price.toFixed(2),
            attribute_value_ids:
                variant.attribute_value_ids.map(
                    Number
                ),
            stock,
            low_stock_threshold:
                lowStock,
        };

        setSavingVariant(true);
        setError("");
        setSuccess("");

        try {
            if (variant.id) {
                const response =
                    await updateAdminProductVariant(
                        productId,
                        variant.id,
                        payload
                    );

                const updated =
                    normalizeVariant(
                        response?.variant ||
                        response?.data ||
                        response
                    );

                setVariants((current) =>
                    current.map((item) =>
                        item.id ===
                            variant.id
                            ? {
                                ...item,
                                ...updated,
                            }
                            : item
                    )
                );

                setSuccess(
                    `Variant ${sku} updated successfully.`
                );
            } else {
                const response =
                    await createAdminProductVariant(
                        productId,
                        payload
                    );

                const created =
                    normalizeVariant(
                        response?.variant ||
                        response?.data ||
                        response
                    );

                setVariants((current) => [
                    ...current,
                    created,
                ]);

                setSuccess(
                    `Variant ${sku} created successfully.`
                );
            }

            clearVariantEditor();
        } catch (requestError) {
            setError(
                getApiErrorMessage(
                    requestError
                )
            );
        } finally {
            setSavingVariant(false);
        }
    }

    async function handleDeactivateVariant(
        item
    ) {
        if (!item?.id || !productId) {
            return;
        }

        const confirmed =
            window.confirm(
                `Deactivate variant "${item.sku || item.id}"? It will no longer be active for purchase.`
            );

        if (!confirmed) {
            return;
        }

        setError("");
        setSuccess("");

        try {
            const response =
                await deactivateAdminProductVariant(
                    productId,
                    item.id
                );

            const updated =
                normalizeVariant(
                    response?.variant ||
                    response?.data ||
                    response
                );

            setVariants((current) =>
                current.map((currentItem) =>
                    currentItem.id ===
                        item.id
                        ? {
                            ...currentItem,
                            ...updated,
                            is_active: false,
                        }
                        : currentItem
                )
            );

            if (
                variant.id === item.id
            ) {
                clearVariantEditor();
            }

            setSuccess(
                `Variant ${item.sku || item.id} was deactivated.`
            );
        } catch (requestError) {
            setError(
                getApiErrorMessage(
                    requestError
                )
            );
        }
    }

    function selectedValueCountForAttribute(
        attributeId
    ) {
        const valueIds =
            variant.attribute_value_ids;

        const ids =
            attributeValues[
            attributeId
            ] || [];

        return ids.filter(
            (item) =>
                valueIds.includes(
                    Number(item.id)
                )
        ).length;
    }

    async function handleImageSelection(
        event
    ) {
        const files = Array.from(
            event.target.files || []
        );

        event.target.value = "";

        if (!files.length) return;

        if (
            images.length +
            selectedFiles.length +
            files.length >
            IMAGE_LIMIT
        ) {
            setError(
                `A product can have a maximum of ${IMAGE_LIMIT} images.`
            );
            return;
        }

        setError("");
        setSuccess("");

        const prepared = [];

        try {
            for (const file of files) {
                const validationError =
                    validateImageFile(file);

                if (validationError) {
                    throw new Error(
                        validationError
                    );
                }

                const dimensions =
                    await inspectImageDimensions(
                        file
                    );

                if (!dimensions.valid) {
                    throw new Error(
                        "Image dimensions must be 2000 × 2000 pixels or smaller, and the file must be a valid image."
                    );
                }

                prepared.push({
                    id:
                        `${Date.now()}-${Math.random()}`,
                    file,
                    previewUrl:
                        URL.createObjectURL(
                            file
                        ),
                });
            }

            setSelectedFiles(
                (current) => [
                    ...current,
                    ...prepared,
                ]
            );
        } catch (imageError) {
            prepared.forEach((item) => {
                URL.revokeObjectURL(
                    item.previewUrl
                );
            });

            setError(
                imageError?.message ||
                "Unable to prepare the selected image."
            );
        }
    }

    function removePendingImage(index) {
        setSelectedFiles((current) => {
            const removed =
                current[index];

            if (removed?.previewUrl) {
                URL.revokeObjectURL(
                    removed.previewUrl
                );
            }

            return current.filter(
                (_, currentIndex) =>
                    currentIndex !== index
            );
        });
    }

    async function handleUploadImages() {
        if (!productId) {
            setError(
                "Save the product first. Django needs the product UUID for image upload."
            );
            return;
        }

        if (!selectedFiles.length) {
            setError(
                "Select at least one new image first."
            );
            return;
        }

        if (
            images.length +
            selectedFiles.length >
            IMAGE_LIMIT
        ) {
            setError(
                `A product can have a maximum of ${IMAGE_LIMIT} images.`
            );
            return;
        }

        setUploading(true);
        setError("");
        setSuccess("");

        try {
            let currentOrder =
                images.length;

            const uploaded = [];

            for (
                let index = 0;
                index <
                selectedFiles.length;
                index += 1
            ) {
                const item =
                    selectedFiles[index];

                const result =
                    await uploadProductImage({
                        productId,
                        file: item.file,
                        displayOrder:
                            currentOrder,
                        isPrimary:
                            images.length ===
                            0 &&
                            index === 0,
                    });

                uploaded.push(
                    result?.image ||
                    result
                );

                currentOrder += 1;
            }

            setImages((current) => [
                ...current,
                ...uploaded,
            ]);

            selectedFiles.forEach((item) => {
                URL.revokeObjectURL(
                    item.previewUrl
                );
            });

            setSelectedFiles([]);

            setSuccess(
                `${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded successfully through Django.`
            );
        } catch (uploadError) {
            setError(
                getApiErrorMessage(
                    uploadError
                )
            );
        } finally {
            setUploading(false);
        }
    }

    if (loading) {
        return (
            <div className="admin-page">
                <section className="admin-panel-card admin-product-loading">
                    <div className="admin-loading-spinner" />
                    <p>Loading product...</p>
                </section>
            </div>
        );
    }

    return (
        <div className="admin-page admin-product-editor">
            <section className="admin-page-toolbar admin-product-toolbar">
                <div>
                    <div className="admin-eyebrow">
                        CATALOGUE / {isEdit ? "EDIT" : "NEW"}
                    </div>

                    <h2>
                        {isEdit
                            ? "Edit product"
                            : "Add product"}
                    </h2>

                    <p>
                        Manage product data, backend attributes,
                        attribute values, variants, stock and
                        product images from one place.
                    </p>
                </div>

                <div className="admin-toolbar-actions">
                    <Link
                        to="/admin/products"
                        className="admin-button admin-button-secondary"
                    >
                        Back to products
                    </Link>

                    <button
                        type="submit"
                        form="admin-product-form"
                        className="admin-button admin-button-primary"
                        disabled={
                            saving ||
                            categoriesLoading
                        }
                    >
                        {saving
                            ? "Saving..."
                            : isEdit
                                ? "Save changes"
                                : "Create product"}
                    </button>
                </div>
            </section>

            {error && (
                <div className="admin-error-banner">
                    {error}
                </div>
            )}

            {success && (
                <div className="admin-success-banner">
                    {success}
                </div>
            )}

            <form
                id="admin-product-form"
                className="admin-product-form-layout"
                onSubmit={handleSave}
            >
                <div className="admin-product-main-column">
                    <section className="admin-panel-card admin-editor-card">
                        <div className="admin-panel-heading">
                            <div>
                                <div className="admin-eyebrow">
                                    01 / PRODUCT
                                </div>
                                <h3>Basic information</h3>
                            </div>
                        </div>

                        <div className="admin-form admin-product-form">
                            <label className="admin-field-span-2">
                                Product name
                                <input
                                    type="text"
                                    value={product.name}
                                    onChange={
                                        handleNameChange
                                    }
                                    placeholder="Enter the product name"
                                    required
                                />
                            </label>

                            <label>
                                Slug
                                <input
                                    type="text"
                                    value={product.slug}
                                    onChange={(event) => {
                                        setSlugManuallyEdited(
                                            true
                                        );

                                        updateField(
                                            "slug",
                                            event.target.value
                                        );
                                    }}
                                    placeholder="product-slug"
                                    required
                                />
                            </label>

                            <label>
                                Category
                                <select
                                    value={
                                        product.category_id === ""
                                            ? ""
                                            : String(
                                                product.category_id
                                            )
                                    }
                                    onChange={
                                        handleCategoryChange
                                    }
                                    required
                                    disabled={
                                        categoriesLoading ||
                                        categories.length === 0
                                    }
                                >
                                    <option value="">
                                        {categoriesLoading
                                            ? "Loading categories..."
                                            : categories.length === 0
                                                ? "No categories available"
                                                : "Select a category"}
                                    </option>

                                    {categories
                                        .filter(
                                            (category) =>
                                                category.is_active ||
                                                (
                                                    isEdit &&
                                                    category.id ===
                                                    Number(
                                                        product.category_id
                                                    )
                                                )
                                        )
                                        .map((category) => (
                                            <option
                                                key={category.id}
                                                value={String(
                                                    category.id
                                                )}
                                            >
                                                {category.name}
                                                {!category.is_active &&
                                                    " (Inactive)"}
                                            </option>
                                        ))}
                                </select>

                                <span className="admin-field-help">
                                    {currentCategory &&
                                        !currentCategory.is_active
                                        ? "This product currently uses an inactive category. Select an active category before saving."
                                        : "Categories are loaded directly from Django."}
                                </span>
                            </label>

                            <label>
                                Status
                                <select
                                    value={
                                        product.status
                                    }
                                    onChange={(event) =>
                                        updateField(
                                            "status",
                                            event.target.value
                                        )
                                    }
                                >
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

                                <span className="admin-field-help">
                                    New products are created as
                                    DRAFT. Publication uses the
                                    dedicated Django status endpoint.
                                </span>
                            </label>

                            <label className="admin-field-span-2">
                                Description
                                <textarea
                                    rows="9"
                                    value={
                                        product.description
                                    }
                                    onChange={(event) =>
                                        updateField(
                                            "description",
                                            event.target.value
                                        )
                                    }
                                    placeholder="Customer-facing product description"
                                />
                            </label>
                        </div>
                    </section>

                    <section className="admin-panel-card admin-editor-card">
                        <div className="admin-panel-heading">
                            <div>
                                <div className="admin-eyebrow">
                                    02 / ATTRIBUTES
                                </div>
                                <h3>
                                    Attribute definitions
                                </h3>
                                <p className="admin-panel-description">
                                    Create reusable attributes such
                                    as Color, Size or Material, then
                                    add their allowed values.
                                </p>
                            </div>
                        </div>

                        <div className="admin-attribute-create">
                            <div className="admin-inline-form">
                                <label>
                                    New attribute
                                    <input
                                        type="text"
                                        value={
                                            attributeForm.name
                                        }
                                        onChange={(event) =>
                                            setAttributeForm({
                                                name:
                                                    event.target
                                                        .value,
                                            })
                                        }
                                        placeholder="Color, Size, Material..."
                                    />
                                </label>

                                <button
                                    type="button"
                                    onClick={handleCreateAttribute}
                                    className="admin-button admin-button-primary admin-small-button"
                                    disabled={
                                        creatingAttribute
                                    }
                                >
                                    {creatingAttribute
                                        ? "Creating..."
                                        : "Create attribute"}
                                </button>
                            </div>
                        </div>

                        {attributesLoading ? (
                            <div className="admin-attribute-loading">
                                Loading attributes...
                            </div>
                        ) : activeAttributes.length === 0 ? (
                            <div className="admin-empty-state compact">
                                <strong>
                                    No active attributes
                                </strong>
                                <p>
                                    Create your first attribute
                                    above.
                                </p>
                            </div>
                        ) : (
                            <div className="admin-attribute-manager">
                                {activeAttributes.map(
                                    (attribute) => {
                                        const values =
                                            attributeValues[
                                            attribute.id
                                            ] || [];

                                        const creating =
                                            creatingValueAttributeId ===
                                            String(
                                                attribute.id
                                            );

                                        return (
                                            <div
                                                className="admin-attribute-manager-row"
                                                key={
                                                    attribute.id
                                                }
                                            >
                                                <div className="admin-attribute-manager-heading">
                                                    <div>
                                                        <strong>
                                                            {
                                                                attribute.name
                                                            }
                                                        </strong>
                                                        <span>
                                                            {values.length} active value
                                                            {values.length === 1
                                                                ? ""
                                                                : "s"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="admin-attribute-value-chips">
                                                    {values.length ? (
                                                        values.map(
                                                            (
                                                                value
                                                            ) => (
                                                                <span
                                                                    key={
                                                                        value.id
                                                                    }
                                                                    className="admin-attribute-chip"
                                                                >
                                                                    {
                                                                        value.value
                                                                    }
                                                                </span>
                                                            )
                                                        )
                                                    ) : (
                                                        <span className="admin-attribute-no-values">
                                                            No values yet
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="admin-inline-form admin-value-form">
                                                    <label>
                                                        Add value
                                                        <input
                                                            type="text"
                                                            value={
                                                                valueForms[
                                                                attribute.id
                                                                ] ||
                                                                ""
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateValueForm(
                                                                    attribute.id,
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder={`New ${attribute.name.toLowerCase()} value`}
                                                        />
                                                    </label>

                                                    <button
                                                        type="button"
                                                        onClick={(event) =>
                                                            handleCreateValue(
                                                                event,
                                                                attribute
                                                            )
                                                        }
                                                        className="admin-button admin-button-secondary admin-small-button"
                                                        disabled={
                                                            creating
                                                        }
                                                    >
                                                        {creating
                                                            ? "Adding..."
                                                            : "Add value"}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        )}
                    </section>

                    <section
                        id="admin-variant-editor"
                        className="admin-panel-card admin-editor-card"
                    >
                        <div className="admin-panel-heading">
                            <div>
                                <div className="admin-eyebrow">
                                    03 / VARIANTS
                                </div>
                                <h3>
                                    Variant builder
                                </h3>
                                <p className="admin-panel-description">
                                    Every variant is stored by Django.
                                    Select attribute values, then set
                                    its SKU, INR price, stock and
                                    low-stock threshold.
                                </p>
                            </div>

                            {variant.id && (
                                <button
                                    type="button"
                                    className="admin-button admin-button-secondary admin-small-button"
                                    onClick={
                                        clearVariantEditor
                                    }
                                >
                                    New variant
                                </button>
                            )}
                        </div>

                        {!productId ? (
                            <div className="admin-variant-notice">
                                Save the product first. Variants
                                require the product UUID.
                            </div>
                        ) : (
                            <div className="admin-variant-builder">
                                <div className="admin-variant-editor-top">
                                    <div>
                                        <strong>
                                            {variant.id
                                                ? "Edit existing variant"
                                                : "Create variant"}
                                        </strong>
                                        <span>
                                            Currency is controlled
                                            by Django and currently
                                            uses INR.
                                        </span>
                                    </div>
                                </div>

                                <div className="admin-variant-field-grid">
                                    <label>
                                        SKU
                                        <input
                                            type="text"
                                            value={
                                                variant.sku
                                            }
                                            onChange={(event) =>
                                                setVariant(
                                                    (current) => ({
                                                        ...current,
                                                        sku:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                            placeholder="GEEKA-COLOR-M-001"
                                        />
                                    </label>

                                    <label>
                                        Price (INR)
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={
                                                variant.price
                                            }
                                            onChange={(event) =>
                                                setVariant(
                                                    (current) => ({
                                                        ...current,
                                                        price:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                            placeholder="899.00"
                                        />
                                    </label>

                                    <label>
                                        Stock
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={
                                                variant.stock
                                            }
                                            onChange={(event) =>
                                                setVariant(
                                                    (current) => ({
                                                        ...current,
                                                        stock:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        Low-stock threshold
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={
                                                variant.low_stock_threshold
                                            }
                                            onChange={(event) =>
                                                setVariant(
                                                    (current) => ({
                                                        ...current,
                                                        low_stock_threshold:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                        />
                                    </label>
                                </div>

                                <div className="admin-variant-selection">
                                    <div className="admin-subsection-heading">
                                        <div>
                                            <strong>
                                                Attribute values
                                            </strong>
                                            <span>
                                                Select the values
                                                that uniquely define
                                                this variant.
                                            </span>
                                        </div>

                                        <span className="admin-selection-count">
                                            {
                                                variant
                                                    .attribute_value_ids
                                                    .length
                                            } selected
                                        </span>
                                    </div>

                                    {attributesLoading ? (
                                        <div className="admin-attribute-loading">
                                            Loading attributes...
                                        </div>
                                    ) : activeAttributes.length === 0 ? (
                                        <div className="admin-empty-state compact">
                                            <strong>
                                                Create an attribute first
                                            </strong>
                                            <p>
                                                The variant builder
                                                will show attribute
                                                values here after you
                                                create them.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="admin-variant-attribute-groups">
                                            {activeAttributes.map(
                                                (
                                                    attribute
                                                ) => {
                                                    const values =
                                                        attributeValues[
                                                        attribute.id
                                                        ] || [];

                                                    return (
                                                        <div
                                                            className="admin-variant-attribute-group"
                                                            key={
                                                                attribute.id
                                                            }
                                                        >
                                                            <div className="admin-variant-attribute-group-heading">
                                                                <strong>
                                                                    {
                                                                        attribute.name
                                                                    }
                                                                </strong>
                                                                <span>
                                                                    {
                                                                        selectedValueCountForAttribute(
                                                                            attribute.id
                                                                        )
                                                                    } selected
                                                                </span>
                                                            </div>

                                                            {values.length ? (
                                                                <div className="admin-value-selector">
                                                                    {values.map(
                                                                        (
                                                                            value
                                                                        ) => {
                                                                            const selected =
                                                                                variant.attribute_value_ids.includes(
                                                                                    Number(
                                                                                        value.id
                                                                                    )
                                                                                );

                                                                            return (
                                                                                <button
                                                                                    type="button"
                                                                                    key={
                                                                                        value.id
                                                                                    }
                                                                                    className={
                                                                                        selected
                                                                                            ? "admin-value-option is-selected"
                                                                                            : "admin-value-option"
                                                                                    }
                                                                                    onClick={() =>
                                                                                        toggleVariantValue(
                                                                                            value.id
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        value.value
                                                                                    }
                                                                                </button>
                                                                            );
                                                                        }
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="admin-attribute-no-values">
                                                                    Add values to
                                                                    this attribute
                                                                    first.
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="admin-variant-footer">
                                    <span>
                                        The frontend does not send
                                        currency. Django assigns INR
                                        and validates SKU, price,
                                        stock and attribute values.
                                    </span>

                                    <div className="admin-toolbar-actions">
                                        {variant.id && (
                                            <button
                                                type="button"
                                                className="admin-button admin-button-secondary admin-small-button"
                                                onClick={
                                                    clearVariantEditor
                                                }
                                                disabled={
                                                    savingVariant
                                                }
                                            >
                                                Cancel
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={handleSaveVariant}
                                            className="admin-button admin-button-primary admin-small-button"
                                            disabled={
                                                savingVariant
                                            }
                                        >
                                            {savingVariant
                                                ? "Saving..."
                                                : variant.id
                                                    ? "Update variant"
                                                    : "Create variant"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="admin-panel-card admin-editor-card">
                        <div className="admin-panel-heading">
                            <div>
                                <div className="admin-eyebrow">
                                    04 / INVENTORY
                                </div>
                                <h3>
                                    Product variants
                                </h3>
                                <p className="admin-panel-description">
                                    Edit existing variants or deactivate
                                    variants directly through the Django
                                    API.
                                </p>
                            </div>

                            <span className="admin-image-counter">
                                {variants.length}
                            </span>
                        </div>

                        {variantsLoading ? (
                            <div className="admin-attribute-loading">
                                Loading variants...
                            </div>
                        ) : variants.length === 0 ? (
                            <div className="admin-empty-state compact">
                                <strong>
                                    No variants yet
                                </strong>
                                <p>
                                    Create the first variant above.
                                </p>
                            </div>
                        ) : (
                            <div className="admin-variant-list">
                                {variants.map(
                                    (item, index) => {
                                        const isExpanded =
                                            expandedVariantId ===
                                            item.id;

                                        return (
                                            <div
                                                className={
                                                    item.is_active === false
                                                        ? "admin-variant-item is-inactive"
                                                        : "admin-variant-item"
                                                }
                                                key={
                                                    item.id ||
                                                    index
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    className="admin-variant-summary"
                                                    onClick={() =>
                                                        setExpandedVariantId(
                                                            isExpanded
                                                                ? ""
                                                                : item.id
                                                        )
                                                    }
                                                >
                                                    <span className="admin-variant-number">
                                                        {String(
                                                            index + 1
                                                        ).padStart(
                                                            2,
                                                            "0"
                                                        )}
                                                    </span>

                                                    <span className="admin-variant-summary-copy">
                                                        <strong>
                                                            {
                                                                item.sku
                                                            }
                                                        </strong>
                                                        <span>
                                                            {attributeDisplayName(
                                                                item
                                                            )}
                                                        </span>
                                                    </span>

                                                    <span className="admin-variant-summary-meta">
                                                        ₹
                                                        {Number(
                                                            item.price || 0
                                                        ).toFixed(
                                                            2
                                                        )}{" "}
                                                        · Stock{" "}
                                                        {
                                                            item.stock
                                                        }
                                                    </span>

                                                    <span className="admin-variant-chevron">
                                                        {isExpanded
                                                            ? "−"
                                                            : "+"}
                                                    </span>
                                                </button>

                                                {isExpanded && (
                                                    <div className="admin-variant-body">
                                                        <div className="admin-variant-detail-grid">
                                                            <div>
                                                                <span>
                                                                    Price
                                                                </span>
                                                                <strong>
                                                                    ₹
                                                                    {Number(
                                                                        item.price ||
                                                                        0
                                                                    ).toFixed(
                                                                        2
                                                                    )}
                                                                </strong>
                                                            </div>

                                                            <div>
                                                                <span>
                                                                    Stock
                                                                </span>
                                                                <strong>
                                                                    {
                                                                        item.stock
                                                                    }
                                                                </strong>
                                                            </div>

                                                            <div>
                                                                <span>
                                                                    Low stock
                                                                </span>
                                                                <strong>
                                                                    {
                                                                        item.low_stock_threshold
                                                                    }
                                                                </strong>
                                                            </div>

                                                            <div>
                                                                <span>
                                                                    Status
                                                                </span>
                                                                <strong>
                                                                    {item.is_active ===
                                                                        false
                                                                        ? "INACTIVE"
                                                                        : "ACTIVE"}
                                                                </strong>
                                                            </div>
                                                        </div>

                                                        <div className="admin-variant-attribute-preview">
                                                            <span>
                                                                Attributes
                                                            </span>
                                                            <strong>
                                                                {attributeDisplayName(
                                                                    item
                                                                )}
                                                            </strong>
                                                        </div>

                                                        <div className="admin-variant-footer">
                                                            <span>
                                                                SKU:
                                                                {" "}
                                                                {item.sku}
                                                            </span>

                                                            <div className="admin-toolbar-actions">
                                                                {item.is_active !==
                                                                    false && (
                                                                        <button
                                                                            type="button"
                                                                            className="admin-button admin-button-secondary admin-small-button"
                                                                            onClick={() =>
                                                                                editVariant(
                                                                                    item
                                                                                )
                                                                            }
                                                                        >
                                                                            Edit variant
                                                                        </button>
                                                                    )}

                                                                {item.is_active !==
                                                                    false && (
                                                                        <button
                                                                            type="button"
                                                                            className="admin-button admin-button-danger admin-small-button"
                                                                            onClick={() =>
                                                                                handleDeactivateVariant(
                                                                                    item
                                                                                )
                                                                            }
                                                                        >
                                                                            Deactivate
                                                                        </button>
                                                                    )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        )}
                    </section>
                </div>

                <aside className="admin-product-side-column">
                    <section className="admin-panel-card">
                        <div className="admin-panel-heading">
                            <div>
                                <div className="admin-eyebrow">
                                    05 / IMAGES
                                </div>
                                <h3>
                                    Product gallery
                                </h3>
                            </div>

                            <span className="admin-image-counter">
                                {images.length +
                                    selectedFiles.length}
                                /{IMAGE_LIMIT}
                            </span>
                        </div>

                        <div className="admin-product-gallery">
                            {images.map(
                                (image, index) => (
                                    <div
                                        className={
                                            image.is_primary
                                                ? "admin-gallery-item is-primary"
                                                : "admin-gallery-item"
                                        }
                                        key={
                                            image.id ||
                                            index
                                        }
                                    >
                                        <div className="admin-gallery-image-wrap">
                                            {image.image_url ? (
                                                <img
                                                    src={
                                                        image.image_url
                                                    }
                                                    alt={`Product ${index + 1}`}
                                                />
                                            ) : (
                                                <div className="admin-gallery-fallback">
                                                    Image unavailable
                                                </div>
                                            )}

                                            <span className="admin-gallery-number">
                                                {index + 1}
                                            </span>
                                        </div>

                                        <div className="admin-gallery-meta">
                                            {image.is_primary ? (
                                                <span className="admin-gallery-primary-label">
                                                    PRIMARY
                                                </span>
                                            ) : (
                                                <span>
                                                    Image
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            )}

                            {selectedFiles.map(
                                (
                                    item,
                                    index
                                ) => (
                                    <div
                                        className="admin-gallery-item"
                                        key={
                                            item.id
                                        }
                                    >
                                        <div className="admin-gallery-image-wrap">
                                            <img
                                                src={
                                                    item.previewUrl
                                                }
                                                alt={`Pending upload ${index + 1}`}
                                            />
                                        </div>

                                        <div className="admin-gallery-meta">
                                            <button
                                                type="button"
                                                className="admin-danger-text-button"
                                                onClick={() =>
                                                    removePendingImage(
                                                        index
                                                    )
                                                }
                                            >
                                                Remove pending
                                            </button>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="admin-hidden-file-input"
                            onChange={
                                handleImageSelection
                            }
                        />

                        <div className="admin-image-upload-zone">
                            <button
                                type="button"
                                className="admin-image-upload-button"
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                                disabled={
                                    !productId ||
                                    uploading ||
                                    images.length +
                                    selectedFiles.length >=
                                    IMAGE_LIMIT
                                }
                            >
                                <span className="admin-upload-icon">
                                    +
                                </span>
                                <strong>
                                    Select product images
                                </strong>
                                <span>
                                    Add up to 5 validated
                                    product images.
                                </span>
                            </button>
                        </div>

                        <div className="admin-toolbar-actions">
                            <button
                                type="button"
                                className="admin-button admin-button-primary"
                                onClick={
                                    handleUploadImages
                                }
                                disabled={
                                    !productId ||
                                    uploading ||
                                    !selectedFiles.length
                                }
                            >
                                {uploading
                                    ? "Uploading..."
                                    : "Upload to Django"}
                            </button>
                        </div>

                        {!productId && (
                            <p className="admin-field-warning">
                                Create the product first.
                                Image upload requires its
                                UUID.
                            </p>
                        )}

                        <p className="admin-helper-text">
                            JPG, JPEG, PNG or WebP · maximum
                            400 KB · maximum 2000 × 2000 ·
                            maximum 5 images.
                        </p>
                    </section>

                    <section className="admin-panel-card admin-product-readiness-card">
                        <div className="admin-eyebrow">
                            CATALOGUE FLOW
                        </div>

                        <h3>
                            Backend-first product setup
                        </h3>

                        <div className="admin-readiness-list">
                            <div
                                className={
                                    product.name.trim()
                                        ? "is-complete"
                                        : ""
                                }
                            >
                                <span />
                                Product information
                            </div>

                            <div
                                className={
                                    product.category_id
                                        ? "is-complete"
                                        : ""
                                }
                            >
                                <span />
                                Category selected
                            </div>

                            <div
                                className={
                                    activeAttributes.length
                                        ? "is-complete"
                                        : ""
                                }
                            >
                                <span />
                                Attributes available
                            </div>

                            <div
                                className={
                                    variants.length
                                        ? "is-complete"
                                        : ""
                                }
                            >
                                <span />
                                Variants configured
                            </div>

                            <div
                                className={
                                    images.length
                                        ? "is-complete"
                                        : ""
                                }
                            >
                                <span />
                                Product images uploaded
                            </div>
                        </div>

                        <p className="admin-readiness-note">
                            Publishing remains controlled by
                            Django. The frontend does not invent
                            stock, prices, currency or product
                            visibility.
                        </p>
                    </section>
                </aside>
            </form>
        </div>
    );
}
