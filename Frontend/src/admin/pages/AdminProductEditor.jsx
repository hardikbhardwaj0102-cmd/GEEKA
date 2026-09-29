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
    getAdminCategories,
    getAdminProduct,
    updateAdminProduct,
    updateAdminProductStatus,
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


/* =========================================================
   EMPTY PRODUCT
========================================================= */

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


/* =========================================================
   SLUGIFY
========================================================= */

function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}


/* =========================================================
   NORMALIZE PRODUCT
========================================================= */

function normalizeProduct(data) {
    const product =
        data?.product ||
        data ||
        {};

    let categoryId =
        product?.category_id ??
        product?.category?.id ??
        "";

    if (
        categoryId !== "" &&
        categoryId !== null &&
        categoryId !== undefined
    ) {
        const numericCategoryId =
            Number(categoryId);

        categoryId =
            Number.isInteger(numericCategoryId) &&
                numericCategoryId > 0
                ? numericCategoryId
                : "";
    } else {
        categoryId = "";
    }

    return {
        id:
            product?.id ||
            product?.uuid ||
            "",

        name:
            product?.name ??
            "",

        slug:
            product?.slug ??
            "",

        description:
            product?.description ??
            "",

        category_id:
            categoryId,

        status:
            product?.status ??
            "DRAFT",
    };
}


/* =========================================================
   NORMALIZE CATEGORIES
========================================================= */

function normalizeCategories(data) {
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


/* =========================================================
   NORMALIZE IMAGES
========================================================= */

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


/* =========================================================
   NORMALIZE VARIANTS
========================================================= */

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


/* =========================================================
   IMAGE VALIDATION
========================================================= */

function validateImageFile(file) {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
    ];

    if (
        !allowedTypes.includes(
            file.type
        )
    ) {
        return (
            "Use JPG, JPEG, PNG or WebP images."
        );
    }

    if (
        file.size >
        IMAGE_MAX_BYTES
    ) {
        return (
            "Image size must be 400 KB or less."
        );
    }

    return "";
}


/* =========================================================
   IMAGE DIMENSION CHECK
========================================================= */

function inspectImageDimensions(file) {
    return new Promise((resolve) => {
        const objectUrl =
            URL.createObjectURL(file);

        const image =
            new Image();

        image.onload = () => {
            const valid =
                image.width <=
                IMAGE_MAX_DIMENSION &&
                image.height <=
                IMAGE_MAX_DIMENSION;

            URL.revokeObjectURL(
                objectUrl
            );

            resolve({
                valid,
                width:
                    image.width,
                height:
                    image.height,
            });
        };

        image.onerror = () => {
            URL.revokeObjectURL(
                objectUrl
            );

            resolve({
                valid: false,
                width: 0,
                height: 0,
            });
        };

        image.src =
            objectUrl;
    });
}


/* =========================================================
   API ERROR MESSAGE
========================================================= */

function getApiErrorMessage(error) {
    if (!error) {
        return (
            "Something went wrong."
        );
    }

    if (
        error.status === 401
    ) {
        return (
            "Your Django session is no longer authenticated. Please log in again."
        );
    }

    if (
        error.status === 403
    ) {
        return (
            "Django denied this admin operation. The logged-in account must have staff/admin permission."
        );
    }

    if (
        Array.isArray(
            error.errors
        ) &&
        error.errors.length > 0
    ) {
        return error.errors.join(
            " "
        );
    }

    if (
        error.status === 404
    ) {
        return (
            error.message ||
            "The requested admin resource was not found."
        );
    }

    return (
        error.message ||
        "Something went wrong."
    );
}


/* =========================================================
   COMPONENT
========================================================= */

export default function AdminProductEditor() {
    const {
        productId,
    } = useParams();

    const navigate =
        useNavigate();

    const isEdit =
        Boolean(productId);

    const fileInputRef =
        useRef(null);


    /* =====================================================
       STATE
    ===================================================== */

    const [
        product,
        setProduct,
    ] = useState(
        createEmptyProduct()
    );

    const [
        categories,
        setCategories,
    ] = useState([]);

    const [
        initialStatus,
        setInitialStatus,
    ] = useState(
        "DRAFT"
    );

    const [
        images,
        setImages,
    ] = useState([]);

    const [
        variants,
        setVariants,
    ] = useState([]);

    const [
        selectedFiles,
        setSelectedFiles,
    ] = useState([]);

    const [
        loading,
        setLoading,
    ] = useState(isEdit);

    const [
        loadingCategories,
        setLoadingCategories,
    ] = useState(true);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        uploading,
        setUploading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        success,
        setSuccess,
    ] = useState("");

    const [
        categoryError,
        setCategoryError,
    ] = useState("");

    const [
        slugManuallyEdited,
        setSlugManuallyEdited,
    ] = useState(false);


    /* =====================================================
       LOAD CATEGORIES
    ===================================================== */

    useEffect(() => {
        let cancelled =
            false;

        async function loadCategories() {
            setLoadingCategories(
                true
            );

            setCategoryError(
                ""
            );

            try {
                const data =
                    await getAdminCategories();

                if (cancelled) {
                    return;
                }

                const normalizedCategories =
                    normalizeCategories(
                        data
                    );

                setCategories(
                    normalizedCategories
                );
            } catch (
            requestError
            ) {
                if (!cancelled) {
                    setCategories(
                        []
                    );

                    setCategoryError(
                        getApiErrorMessage(
                            requestError
                        )
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingCategories(
                        false
                    );
                }
            }
        }

        loadCategories();

        return () => {
            cancelled = true;
        };
    }, []);


    /* =====================================================
       LOAD PRODUCT WHEN EDITING
    ===================================================== */

    useEffect(() => {
        let cancelled =
            false;

        async function loadProduct() {
            if (!isEdit) {
                setLoading(
                    false
                );

                return;
            }

            setLoading(
                true
            );

            setError(
                ""
            );

            try {
                const data =
                    await getAdminProduct(
                        productId
                    );

                if (cancelled) {
                    return;
                }

                const normalizedProduct =
                    normalizeProduct(
                        data
                    );

                setProduct(
                    normalizedProduct
                );

                setInitialStatus(
                    normalizedProduct.status
                );

                setImages(
                    normalizeImages(
                        data
                    )
                );

                setVariants(
                    normalizeVariants(
                        data
                    )
                );
            } catch (
            requestError
            ) {
                if (!cancelled) {
                    setError(
                        getApiErrorMessage(
                            requestError
                        )
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(
                        false
                    );
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


    /* =====================================================
       GENERIC FIELD UPDATE
    ===================================================== */

    function updateField(
        field,
        value
    ) {
        setProduct(
            (current) => ({
                ...current,
                [field]:
                    value,
            })
        );

        setError(
            ""
        );

        setSuccess(
            ""
        );
    }


    /* =====================================================
       NAME CHANGE
    ===================================================== */

    function handleNameChange(
        event
    ) {
        const value =
            event.target.value;

        setProduct(
            (current) => ({
                ...current,

                name:
                    value,

                slug:
                    slugManuallyEdited
                        ? current.slug
                        : slugify(
                            value
                        ),
            })
        );

        setError(
            ""
        );

        setSuccess(
            ""
        );
    }


    /* =====================================================
       CATEGORY CHANGE

       HTML SELECT RETURNS STRING.
       CONVERT IT TO INTEGER HERE.
    ===================================================== */

    function handleCategoryChange(
        event
    ) {
        const rawValue =
            event.target.value;

        if (!rawValue) {
            updateField(
                "category_id",
                ""
            );

            return;
        }

        const categoryId =
            Number(
                rawValue
            );

        if (
            Number.isInteger(
                categoryId
            ) &&
            categoryId > 0
        ) {
            updateField(
                "category_id",
                categoryId
            );
        } else {
            updateField(
                "category_id",
                ""
            );
        }
    }


    /* =====================================================
       SAVE PRODUCT
    ===================================================== */

    async function handleSave(
        event
    ) {
        event.preventDefault();

        setError(
            ""
        );

        setSuccess(
            ""
        );


        /* -------------------------------------------------
           CATEGORY MUST BE INTEGER
        ------------------------------------------------- */

        const categoryId =
            Number(
                product.category_id
            );


        /* -------------------------------------------------
           PRODUCT PAYLOAD

           IMPORTANT:
           category_id is sent as INTEGER.
           status is NOT sent here.
        ------------------------------------------------- */

        const payload = {
            name:
                product.name.trim(),

            slug:
                product.slug.trim(),

            description:
                product.description.trim(),

            category_id:
                categoryId,
        };


        /* -------------------------------------------------
           BASIC VALIDATION
        ------------------------------------------------- */

        if (
            !payload.name
        ) {
            setError(
                "Product name is required."
            );

            return;
        }

        if (
            payload.name.length <
            2
        ) {
            setError(
                "Product name must contain at least 2 characters."
            );

            return;
        }

        if (
            !payload.slug
        ) {
            setError(
                "Slug is required."
            );

            return;
        }

        if (
            !Number.isInteger(
                categoryId
            ) ||
            categoryId <= 0
        ) {
            setError(
                "Please select a valid category."
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


        setSaving(
            true
        );


        try {
            /* -------------------------------------------------
               CREATE OR UPDATE PRODUCT
            ------------------------------------------------- */

            const response =
                isEdit
                    ? await updateAdminProduct(
                        productId,
                        payload
                    )
                    : await createAdminProduct(
                        payload
                    );


            /* -------------------------------------------------
               NORMALIZE RESPONSE
            ------------------------------------------------- */

            const savedProduct =
                response?.product ||
                response?.data ||
                response ||
                {};


            /* -------------------------------------------------
               GET PRODUCT UUID
            ------------------------------------------------- */

            const savedId =
                savedProduct?.id ||
                savedProduct?.uuid ||
                productId;


            if (!savedId) {
                throw new Error(
                    "The product was saved, but the backend response did not contain its UUID."
                );
            }


            /* -------------------------------------------------
               STATUS

               Product create/update does not change status.
               Status uses dedicated Django endpoint.
            ------------------------------------------------- */

            const requestedStatus =
                String(
                    product.status ||
                    "DRAFT"
                ).toUpperCase();


            const responseStatus =
                String(
                    savedProduct?.status ||
                    (
                        isEdit
                            ? initialStatus
                            : "DRAFT"
                    )
                ).toUpperCase();


            let finalStatus =
                responseStatus;


            if (
                requestedStatus !==
                responseStatus
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


            /* -------------------------------------------------
               NORMALIZE SAVED PRODUCT
            ------------------------------------------------- */

            const normalizedSavedProduct =
                normalizeProduct(
                    savedProduct
                );


            setProduct(
                (current) => ({
                    ...current,

                    ...normalizedSavedProduct,

                    id:
                        savedId,

                    category_id:
                        normalizedSavedProduct.category_id ||
                        categoryId,

                    status:
                        finalStatus,
                })
            );


            setInitialStatus(
                finalStatus
            );


            /* -------------------------------------------------
               SUCCESS
            ------------------------------------------------- */

            if (isEdit) {
                setSuccess(
                    "Product changes saved successfully."
                );
            } else {
                setSuccess(
                    "Product created successfully. You can now upload its images."
                );

                navigate(
                    `/admin/products/${savedId}`,
                    {
                        replace:
                            true,
                    }
                );
            }
        } catch (
        requestError
        ) {
            setError(
                getApiErrorMessage(
                    requestError
                )
            );
        } finally {
            setSaving(
                false
            );
        }
    }


    /* =====================================================
       IMAGE FILE SELECTION
    ===================================================== */

    async function handleImageSelection(
        event
    ) {
        const files =
            Array.from(
                event.target.files ||
                []
            );

        event.target.value =
            "";


        if (
            files.length === 0
        ) {
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


        setError(
            ""
        );

        setSuccess(
            ""
        );


        const prepared =
            [];


        try {
            for (
                const file of files
            ) {
                const validationError =
                    validateImageFile(
                        file
                    );


                if (
                    validationError
                ) {
                    throw new Error(
                        validationError
                    );
                }


                const dimensions =
                    await inspectImageDimensions(
                        file
                    );


                if (
                    !dimensions.valid
                ) {
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
        } catch (
        imageError
        ) {
            prepared.forEach(
                (item) => {
                    URL.revokeObjectURL(
                        item.previewUrl
                    );
                }
            );


            setError(
                imageError?.message ||
                "Unable to prepare the selected image."
            );
        }
    }


    /* =====================================================
       REMOVE PENDING IMAGE
    ===================================================== */

    function removePendingImage(
        index
    ) {
        setSelectedFiles(
            (current) => {
                const removed =
                    current[index];


                if (
                    removed?.previewUrl
                ) {
                    URL.revokeObjectURL(
                        removed.previewUrl
                    );
                }


                return current.filter(
                    (
                        _,
                        currentIndex
                    ) =>
                        currentIndex !==
                        index
                );
            }
        );
    }


    /* =====================================================
       UPLOAD IMAGES
    ===================================================== */

    async function handleUploadImages() {
        if (!productId) {
            setError(
                "Save the product first. Django needs the product UUID for image upload."
            );

            return;
        }


        if (
            selectedFiles.length ===
            0
        ) {
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


        setUploading(
            true
        );

        setError(
            ""
        );

        setSuccess(
            ""
        );


        try {
            let currentOrder =
                images.length;

            const uploaded =
                [];


            for (
                let index = 0;
                index <
                selectedFiles.length;
                index += 1
            ) {
                const item =
                    selectedFiles[
                    index
                    ];


                const result =
                    await uploadProductImage({
                        productId,

                        file:
                            item.file,

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


                currentOrder +=
                    1;
            }


            setImages(
                (current) => [
                    ...current,
                    ...uploaded,
                ]
            );


            selectedFiles.forEach(
                (item) => {
                    URL.revokeObjectURL(
                        item.previewUrl
                    );
                }
            );


            setSelectedFiles(
                []
            );


            setSuccess(
                `${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded successfully through Django.`
            );
        } catch (
        uploadError
        ) {
            setError(
                getApiErrorMessage(
                    uploadError
                )
            );
        } finally {
            setUploading(
                false
            );
        }
    }


    /* =====================================================
       LOADING
    ===================================================== */

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


    /* =====================================================
       PAGE
    ===================================================== */

    return (
        <div className="admin-page admin-product-editor">

            {/* =================================================
                TOOLBAR
            ================================================= */}

            <section className="admin-page-toolbar admin-product-toolbar">

                <div>
                    <div className="admin-eyebrow">
                        CATALOGUE /{" "}
                        {isEdit
                            ? "EDIT"
                            : "NEW"}
                    </div>

                    <h2>
                        {isEdit
                            ? "Edit product"
                            : "Add product"}
                    </h2>

                    <p>
                        Product data is saved through the Django catalogue API. Publication eligibility remains a backend decision.
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


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="admin-error-banner">
                    {error}
                </div>
            )}


            {/* =================================================
                SUCCESS
            ================================================= */}

            {success && (
                <div className="admin-success-banner">
                    {success}
                </div>
            )}


            {/* =================================================
                FORM
            ================================================= */}

            <form
                id="admin-product-form"
                className="admin-product-form-layout"
                onSubmit={handleSave}
            >

                {/* =============================================
                    MAIN COLUMN
                ============================================== */}

                <div className="admin-product-main-column">

                    {/* =========================================
                        PRODUCT INFORMATION
                    ========================================== */}

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

                            {/* =================================
                                PRODUCT NAME
                            ================================== */}

                            <label className="admin-field-span-2">

                                Product name

                                <input
                                    type="text"
                                    value={
                                        product.name
                                    }
                                    onChange={
                                        handleNameChange
                                    }
                                    placeholder="Enter the product name"
                                    required
                                />

                            </label>


                            {/* =================================
                                SLUG
                            ================================== */}

                            <label>

                                Slug

                                <input
                                    type="text"
                                    value={
                                        product.slug
                                    }
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


                            {/* =================================
                                CATEGORY
                            ================================== */}

                            <label>

                                Category

                                <select
                                    value={
                                        product.category_id ===
                                            ""
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
                                        loadingCategories
                                    }
                                >

                                    <option value="">
                                        {loadingCategories
                                            ? "Loading categories..."
                                            : categories.length ===
                                                0
                                                ? "No categories available"
                                                : "Select a category"}
                                    </option>


                                    {categories.map(
                                        (
                                            category
                                        ) => (
                                            <option
                                                key={
                                                    category.id
                                                }
                                                value={
                                                    String(
                                                        category.id
                                                    )
                                                }
                                            >
                                                {
                                                    category.name
                                                }

                                                {category.is_active ===
                                                    false
                                                    ? " (Inactive)"
                                                    : ""}
                                            </option>
                                        )
                                    )}

                                </select>


                                {categoryError ? (
                                    <span className="admin-field-help admin-field-warning">
                                        {categoryError}
                                    </span>
                                ) : (
                                    <span className="admin-field-help">
                                        Select a category by name. Django receives the category integer ID as <strong>category_id</strong>.
                                    </span>
                                )}

                            </label>


                            {/* =================================
                                STATUS
                            ================================== */}

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
                                    required
                                >

                                    {PRODUCT_STATUSES.map(
                                        (
                                            status
                                        ) => (
                                            <option
                                                key={
                                                    status
                                                }
                                                value={
                                                    status
                                                }
                                            >
                                                {
                                                    status
                                                }
                                            </option>
                                        )
                                    )}

                                </select>


                                <span className="admin-field-help">
                                    New products are created as DRAFT first. Status changes use Django's dedicated status endpoint.
                                </span>

                            </label>


                            {/* =================================
                                DESCRIPTION
                            ================================== */}

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


                    {/* =========================================
                        VARIANTS
                    ========================================== */}

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
                                    (
                                        variant,
                                        index
                                    ) => (

                                        <div
                                            className="admin-list-row"
                                            key={
                                                variant.id ||
                                                index
                                            }
                                        >

                                            <div>

                                                <strong>
                                                    {
                                                        variant.sku ||
                                                        `Variant ${index + 1}`
                                                    }
                                                </strong>

                                                <span>
                                                    {
                                                        variant.price ??
                                                        "—"
                                                    }{" "}
                                                    {
                                                        variant.currency ||
                                                        ""
                                                    }

                                                    {" · "}

                                                    Stock{" "}
                                                    {
                                                        variant.stock ??
                                                        "—"
                                                    }
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


                {/* =============================================
                    SIDE COLUMN
                ============================================== */}

                <aside className="admin-product-side-column">

                    {/* =========================================
                        IMAGE GALLERY
                    ========================================== */}

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

                                {images.length +
                                    selectedFiles.length}
                                /
                                {IMAGE_LIMIT}

                            </span>

                        </div>


                        <div className="admin-image-grid">

                            {/* =================================
                                SAVED IMAGES
                            ================================== */}

                            {images.map(
                                (
                                    image,
                                    index
                                ) => (

                                    <div
                                        className="admin-image-tile"
                                        key={
                                            image.id ||
                                            index
                                        }
                                    >

                                        {image.image_url ? (

                                            <img
                                                src={
                                                    image.image_url
                                                }
                                                alt={`Product ${index +
                                                    1
                                                    }`}
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


                            {/* =================================
                                PENDING IMAGES
                            ================================== */}

                            {selectedFiles.map(
                                (
                                    item,
                                    index
                                ) => (

                                    <div
                                        className="admin-image-tile"
                                        key={
                                            item.id
                                        }
                                    >

                                        <img
                                            src={
                                                item.previewUrl
                                            }
                                            alt={`Pending upload ${index +
                                                1
                                                }`}
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


                        {/* =====================================
                            FILE INPUT
                        ====================================== */}

                        <input
                            ref={
                                fileInputRef
                            }
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="admin-hidden-file-input"
                            onChange={
                                handleImageSelection
                            }
                        />


                        {/* =====================================
                            IMAGE BUTTONS
                        ====================================== */}

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


                    {/* =========================================
                        BACKEND SOURCE OF TRUTH
                    ========================================== */}

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