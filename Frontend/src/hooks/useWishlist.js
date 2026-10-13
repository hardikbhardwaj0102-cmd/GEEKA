import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    getWishlist,
    addWishlistItem,
    removeWishlistItem,
    clearWishlist,
} from "../services/wishlistService";

const WISHLIST_EVENT = "geeka-wishlist-updated";

function getProductId(item) {
    const value =
        item?.product_id ??
        item?.productId ??
        item?.product?.id ??
        item?.product?.product_id ??
        item?.product?.productId ??
        item?.product_details?.id ??
        item?.product_details?.product_id ??
        item?.product_detail?.id ??
        null;

    return value == null ? null : String(value);
}

function getWishlistItemId(item) {
    return (
        item?.id ??
        item?.wishlist_item_id ??
        item?.wishlistItemId ??
        null
    );
}

function normalizeWishlist(items) {
    if (!Array.isArray(items)) {
        return [];
    }

    // Preserve array identity when its items are already valid.
    // This prevents consumer effects from looping on every render.
    const allValid = items.every(
        (item) =>
            item &&
            typeof item === "object" &&
            !Array.isArray(item)
    );

    return allValid
        ? items
        : items.filter(
            (item) =>
                item &&
                typeof item === "object" &&
                !Array.isArray(item)
        );
}

function notifyWishlistUpdated(items) {
    if (typeof window !== "undefined") {
        window.dispatchEvent(
            new CustomEvent(WISHLIST_EVENT, {
                detail: { items: Array.isArray(items) ? items : [] },
            })
        );
    }
}

export function useWishlist() {
    const [wishlist, setWishlist] = useState([]);
    const [loadingWishlist, setLoadingWishlist] = useState(true);
    const [pendingWishlistIds, setPendingWishlistIds] = useState([]);
    const [wishlistError, setWishlistError] = useState("");

    const pendingIdsRef = useRef(new Set());
    const requestVersionRef = useRef(0);
    const mountedRef = useRef(false);

    const refreshWishlist = useCallback(async () => {
        const requestVersion = ++requestVersionRef.current;

        try {
            setWishlistError("");

            const items = await getWishlist();
            const safeItems = normalizeWishlist(items);

            if (
                mountedRef.current &&
                requestVersion === requestVersionRef.current
            ) {
                setWishlist(safeItems);
            }

            return safeItems;
        } catch (error) {
            if (
                mountedRef.current &&
                requestVersion === requestVersionRef.current
            ) {
                setWishlistError(
                    error?.message || "Unable to load your wishlist."
                );
            }

            throw error;
        } finally {
            if (
                mountedRef.current &&
                requestVersion === requestVersionRef.current
            ) {
                setLoadingWishlist(false);
            }
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;

        async function loadWishlist() {
            try {
                await refreshWishlist();
            } catch {
                // refreshWishlist stores the readable error message.
            }
        }

        function handleWishlistUpdated(event) {
            const sharedItems = event?.detail?.items;

            // Keep all mounted consumers (including the header) in sync
            // immediately, without waiting for a second network request.
            if (Array.isArray(sharedItems)) {
                setWishlist(normalizeWishlist(sharedItems));
                setLoadingWishlist(false);
                return;
            }

            loadWishlist();
        }

        loadWishlist();
        window.addEventListener(WISHLIST_EVENT, handleWishlistUpdated);

        return () => {
            mountedRef.current = false;
            requestVersionRef.current += 1;
            window.removeEventListener(WISHLIST_EVENT, handleWishlistUpdated);
        };
    }, [refreshWishlist]);

    const safeWishlist = normalizeWishlist(wishlist);

    const wishlistProductIds = safeWishlist
        .map(getProductId)
        .filter(Boolean);

    const isWishlisted = useCallback(
        (productId) =>
            productId != null &&
            wishlistProductIds.includes(String(productId)),
        [wishlistProductIds]
    );

    const beginPendingAction = useCallback((productId) => {
        const id = String(productId);

        if (pendingIdsRef.current.has(id)) {
            return false;
        }

        pendingIdsRef.current.add(id);
        setPendingWishlistIds(Array.from(pendingIdsRef.current));
        return true;
    }, []);

    const endPendingAction = useCallback((productId) => {
        pendingIdsRef.current.delete(String(productId));
        setPendingWishlistIds(Array.from(pendingIdsRef.current));
    }, []);

    const toggleWishlist = useCallback(async (product) => {
        const productId =
            product && typeof product === "object"
                ? product.id ?? product.product_id
                : product;

        if (productId == null || productId === "") {
            throw new Error("A valid product is required.");
        }

        const normalizedId = String(productId);

        if (!beginPendingAction(normalizedId)) {
            return;
        }

        setWishlistError("");

        try {
            const existingItem = safeWishlist.find(
                (item) => getProductId(item) === normalizedId
            );

            if (existingItem) {
                const wishlistItemId = getWishlistItemId(existingItem);

                if (wishlistItemId == null || wishlistItemId === "") {
                    throw new Error(
                        "The wishlist item ID is missing. Refresh your wishlist and try again."
                    );
                }

                await removeWishlistItem(wishlistItemId);

                const updatedItems = safeWishlist.filter(
                    (item) => getProductId(item) !== normalizedId
                );
                setWishlist(updatedItems);
                notifyWishlistUpdated(updatedItems);
                return false;
            }

            const addResponse = await addWishlistItem(normalizedId);
            let updatedItems = await refreshWishlist();

            // Some backends return a newly-created item before the list endpoint
            // reflects it. Keep the UI responsive and preserve the returned item ID.
            if (!updatedItems.some((item) => getProductId(item) === normalizedId)) {
                const responseItem =
                    addResponse?.item ??
                    addResponse?.wishlist_item ??
                    addResponse?.data?.item ??
                    addResponse?.data ??
                    addResponse;
                const optimisticItem =
                    responseItem && typeof responseItem === "object"
                        ? { ...responseItem, product_id: responseItem.product_id ?? normalizedId }
                        : { product_id: normalizedId };
                updatedItems = [...updatedItems, optimisticItem];
                setWishlist(updatedItems);
            }

            notifyWishlistUpdated(updatedItems);
            return true;
        } catch (error) {
            setWishlistError(
                error?.message || "Unable to update your wishlist."
            );
            throw error;
        } finally {
            endPendingAction(normalizedId);
        }
    }, [safeWishlist, beginPendingAction, endPendingAction, refreshWishlist]);

    const removeFromWishlist = useCallback(async (productId) => {
        if (productId == null || productId === "") {
            throw new Error("A valid product ID is required.");
        }

        const normalizedId = String(productId);

        if (!beginPendingAction(normalizedId)) {
            return;
        }

        setWishlistError("");

        try {
            const existingItem = safeWishlist.find(
                (item) => getProductId(item) === normalizedId
            );

            if (!existingItem) {
                return;
            }

            const wishlistItemId = getWishlistItemId(existingItem);

            if (wishlistItemId == null || wishlistItemId === "") {
                throw new Error("The wishlist item ID is missing.");
            }

            await removeWishlistItem(wishlistItemId);

            const updatedItems = safeWishlist.filter(
                (item) => getProductId(item) !== normalizedId
            );
            setWishlist(updatedItems);
            notifyWishlistUpdated(updatedItems);
        } catch (error) {
            setWishlistError(
                error?.message || "Unable to remove this product."
            );
            throw error;
        } finally {
            endPendingAction(normalizedId);
        }
    }, [safeWishlist, beginPendingAction, endPendingAction]);

    const clearAllWishlist = useCallback(async () => {
        setWishlistError("");

        try {
            await clearWishlist();
            setWishlist([]);
            notifyWishlistUpdated([]);
        } catch (error) {
            setWishlistError(
                error?.message || "Unable to clear your wishlist."
            );
            throw error;
        }
    }, []);

    return {
        wishlist: safeWishlist,
        // Backwards-compatible names used by the profile page.
        wishlistItems: safeWishlist,
        loading: loadingWishlist,
        error: wishlistError,
        wishlistProductIds,
        loadingWishlist,
        pendingWishlistIds,
        wishlistError,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist: clearAllWishlist,
        refreshWishlist,
    };
}
