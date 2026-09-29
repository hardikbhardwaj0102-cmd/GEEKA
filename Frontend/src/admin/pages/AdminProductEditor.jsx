import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Link,
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    createAdminProduct,
    getAdminProduct,
    updateAdminProduct,
    uploadProductImage,
} from "../services/adminApi";

import "../style/AdminPages.css";
import "../style/AdminProductEditor.css";


const PRODUCT_STATUSES = [
    "DRAFT",
    "PUBLISHED",
    "ARCHIVED",
];

const IMAGE_LIMIT = 5;
const IMAGE_MAX_BYTES = 400 * 1024;
const IMAGE_MAX_DIMENSION = 2000;


function createEmptyProduct() {
    return {
        name: "",
        slug: "",
        description: "",
        category: "",
        status: "DRAFT",
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
    const product =
        data?.product ||
        data ||
        {};

    let category =
        product?.category ??
        product?.category_id ??
        "";

    if (
        category &&
        typeof category === "object"
    ) {
        category =
            category.id ||
            category.slug ||
            category.name ||
            "";
    }

    return {
        name:
            product?.name ??
            "",
        slug:
            product?.slug ??
            "",
        description:
            product?.description ??
            "",
        category,
        status:
            product?.status ??
            "DRAFT",
    };
}


function normalizeImages(data) {
    const product =
        data?.product ||
        data ||
        {};

    if (
        Array.isArray(product?.images)
    ) {
        return product.images;
    }

    return [];
}


function normalizeVariants(data) {
    const product =
        data?.product ||
        data ||
        {};

    if (
        Array.isArray(product?.variants)
    ) {
        return product.variants;
    }

    return [];
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


function getApiErrorMessage(error) {
    if (!error) {
        return "Something went wrong.";
    }

    if (error.status === 401) {
        return "Your Django session is no longer authenticated. Please log in again.";
    }

    if (error.status === 403) {
        return "Django denied this admin operation. The logged-in account must have staff/admin permission.";
    }

    return error.message || "Something went wrong.";
}


export default function AdminProductEditor() {
    const { productId } = useParams();
    const navigate = useNavigate();

    const isEdit = Boolean(productId);

    const fileInputRef =
        useRef(null);

    const [product, setProduct] =
        useState(createEmptyProduct());

    const [images, setImages] =
        useState([]);

    const [variants, setVariants] =
        useState([]);

    const [selectedFiles, setSelectedFiles] =
        useState([]);

    const [loading, setLoading] =
        useState(isEdit);

    const [saving, setSaving] =
        useState(false);

    const [uploading, setUploading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [slugManuallyEdited, setSlugManuallyEdited] =
        useState(false);


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

                if (cancelled) {
                    return;
                }

                setProduct(
                    normalizeProduct(data)
                );

                setImages(
                    normalizeImages(data)
                );

                setVariants(
                    normalizeVariants(data)
                );
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
    }, [
        isEdit,
        productId,
    ]);


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
            slug:
                slugManuallyEdited
                    ? current.slug
                    : slugify(value),
        }));

        setError("");
        setSuccess("");
    }


    async function handleSave(event) {
        event.preventDefault();

        setError("");
        setSuccess("");

        const payload = {
            name: product.name.trim(),
            slug: product.slug.trim(),
            description:
                product.description.trim(),
            category:
                product.category.trim(),
            status: product.status,
        };

        if (!payload.name) {
            setError("Product name is required.");
            return;
        }

        if (!payload.slug) {
            setError("Slug is required.");
            return;
        }

        if (!payload.category) {
            setError("Category is required.");
            return;
        }

        if (!PRODUCT_STATUSES.includes(payload.status)) {
            setError("Select a valid product status.");
            return;
        }

        setSaving(true);

        try {
            const response =
                isEdit
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

            setProduct(
                normalizeProduct(
                    savedProduct
                )
            );

            if (isEdit) {
                setSuccess(
                    "Product changes saved successfully."
                );
            } else {
                if (!savedId) {
                    throw new Error(
                        "The product was created, but the backend response did not contain its UUID. Images cannot be uploaded until the product ID is returned."
                    );
                }

                setSuccess(
                    "Product created successfully. You can now upload its images."
                );

                navigate(
                    `/admin/products/${savedId}`,
                    {
                        replace: true,
                    }
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


    async function handleImageSelection(event) {
        const files = Array.from(
            event.target.files || []
        );

        event.target.value = "";

        if (files.length === 0) {
            return;
        }

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
                    validateImageFile(
                        file
                    );

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

            setSelectedFiles((current) => [
                ...current,
                ...prepared,
            ]);
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

        if (selectedFiles.length === 0) {
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
                index < selectedFiles.length;
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
                            images.length === 0 &&
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
                    <p>
                        Loading product...
                    </p>
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
                        Product data is saved through the finalized Django catalogue API. Publication eligibility remains a backend decision.
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
                        disabled={saving}
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
                                <h3>
                                    Basic information
                                </h3>
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
                                Category ID
                                <input
                                    type="text"
                                    value={product.category}
                                    onChange={(event) =>
                                        updateField(
                                            "category",
                                            event.target.value
                                        )
                                    }
                                    placeholder="Category UUID / value from Django"
                                    required
                                />
                                <span className="admin-field-help">
                                    Category CRUD is not finalized yet, so this field does not guess a category endpoint.
                                </span>
                            </label>

                            <label>
                                Status
                                <select
                                    value={product.status}
                                    onChange={(event) =>
                                        updateField(
                                            "status",
                                            event.target.value
                                        )
                                    }
                                    required
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
                                    Django validates whether a product is eligible for publication.
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
                                    02 / VARIANTS
                                </div>
                                <h3>
                                    Backend variant data
                                </h3>
                            </div>
                        </div>

                        {variants.length > 0 ? (
                            <div className="admin-list">
                                {variants.map(
                                    (variant, index) => (
                                        <div
                                            className="admin-list-row"
                                            key={
                                                variant.id ||
                                                index
                                            }
                                        >
                                            <div>
                                                <strong>
                                                    {variant.sku ||
                                                        `Variant ${index + 1}`}
                                                </strong>
                                                <span>
                                                    {variant.price ??
                                                        "—"} {variant.currency || ""}
                                                    {" · "}
                                                    Stock {variant.stock ?? "—"}
                                                </span>
                                            </div>

                                            <small>
                                                {variant.is_active ===
                                                    false
                                                    ? "INACTIVE"
                                                    : "ACTIVE"}
                                            </small>
                                        </div>
                                    )
                                )}
                            </div>
                        ) : (
                            <div className="admin-empty-state compact">
                                <strong>
                                    No variant data returned
                                </strong>
                                <p>
                                    Variant CRUD is waiting for the finalized Django variant request schemas.
                                </p>
                            </div>
                        )}
                    </section>
                </div>

                <aside className="admin-product-side-column">
                    <section className="admin-panel-card">
                        <div className="admin-panel-heading">
                            <div>
                                <div className="admin-eyebrow">
                                    03 / IMAGES
                                </div>
                                <h3>
                                    Product gallery
                                </h3>
                            </div>

                            <span className="admin-image-counter">
                                {images.length + selectedFiles.length}/
                                {IMAGE_LIMIT}
                            </span>
                        </div>

                        <div className="admin-image-grid">
                            {images.map(
                                (image, index) => (
                                    <div
                                        className="admin-image-tile"
                                        key={
                                            image.id ||
                                            index
                                        }
                                    >
                                        {image.image_url ? (
                                            <img
                                                src={image.image_url}
                                                alt={`Product ${index + 1}`}
                                            />
                                        ) : (
                                            <div className="admin-image-fallback">
                                                Image unavailable
                                            </div>
                                        )}

                                        {image.is_primary && (
                                            <span className="admin-image-tag">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                )
                            )}

                            {selectedFiles.map(
                                (item, index) => (
                                    <div
                                        className="admin-image-tile"
                                        key={item.id}
                                    >
                                        <img
                                            src={
                                                item.previewUrl
                                            }
                                            alt={`Pending upload ${index + 1}`}
                                        />

                                        <button
                                            type="button"
                                            className="admin-image-remove-button"
                                            onClick={() =>
                                                removePendingImage(
                                                    index
                                                )
                                            }
                                        >
                                            Remove pending
                                        </button>
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

                        <div className="admin-toolbar-actions">
                            <button
                                type="button"
                                className="admin-button admin-button-secondary"
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
                                Select images
                            </button>

                            <button
                                type="button"
                                className="admin-button admin-button-primary"
                                onClick={
                                    handleUploadImages
                                }
                                disabled={
                                    !productId ||
                                    uploading ||
                                    selectedFiles.length ===
                                    0
                                }
                            >
                                {uploading
                                    ? "Uploading..."
                                    : "Upload to Django"}
                            </button>
                        </div>

                        {!productId && (
                            <p className="admin-field-warning">
                                Create the product first. The image API requires the product UUID.
                            </p>
                        )}

                        <p className="admin-helper-text">
                            JPG, JPEG, PNG or WebP · maximum 400 KB · maximum 2000 × 2000 · maximum 5 images.
                        </p>
                    </section>

                    <section className="admin-panel-card">
                        <div className="admin-eyebrow">
                            SOURCE OF TRUTH
                        </div>

                        <h3>
                            Django controls publication
                        </h3>

                        <p className="admin-panel-description">
                            The frontend validates obvious form errors, but product publication, permissions and image storage remain controlled by the backend.
                        </p>
                    </section>
                </aside>
            </form>
        </div>
    );
}
