import { useCallback, useEffect, useState } from "react";

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
        item?.product?.id ??
        item?.product?.product_id ??
        null;

    return value == null ? null : String(value);
}

function getWishlistItemId(item) {
    return item?.id ?? item?.wishlist_item_id ?? null;
}

function notifyWishlistUpdated() {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(WISHLIST_EVENT));
    }
}

export default function useWishlist() {
    const [wishlist, setWishlist] = useState([]);
    const [loadingWishlist, setLoadingWishlist] = useState(true);
    const [pendingWishlistIds, setPendingWishlistIds] = useState([]);
    const [wishlistError, setWishlistError] = useState("");

    const refreshWishlist = useCallback(async () => {
        try {
            setWishlistError("");

            const items = await getWishlist();

            setWishlist(Array.isArray(items) ? items : []);

            return items;
        } catch (error) {
            setWishlistError(error.message || "Unable to load your wishlist.");
            throw error;
        } finally {
            setLoadingWishlist(false);
        }
    }, []);

    useEffect(() => {
        let active = true;

        async function loadWishlist() {
            try {
                const items = await getWishlist();

                if (active) {
                    setWishlist(Array.isArray(items) ? items : []);
                    setWishlistError("");
                }
            } catch (error) {
                if (active) {
                    setWishlistError(
                        error.message || "Unable to load your wishlist."
                    );
                }
            } finally {
                if (active) {
                    setLoadingWishlist(false);
                }
            }
        }

        function handleWishlistUpdated() {
            loadWishlist();
        }

        loadWishlist();

        window.addEventListener(WISHLIST_EVENT, handleWishlistUpdated);

        return () => {
            active = false;
            window.removeEventListener(WISHLIST_EVENT, handleWishlistUpdated);
        };
    }, []);

    const wishlistProductIds = wishlist
        .map(getProductId)
        .filter(Boolean);

    const isWishlisted = useCallback(
        (productId) =>
            wishlistProductIds.includes(String(productId)),
        [wishlistProductIds]
    );

    const toggleWishlist = useCallback(
        async (product) => {
            const productId =
                typeof product === "object"
                    ? product?.id ?? product?.product_id
                    : product;

            if (!productId) {
                throw new Error("A valid product is required.");
            }

            const normalizedId = String(productId);

            if (pendingWishlistIds.includes(normalizedId)) {
                return;
            }

            setPendingWishlistIds((current) => [...current, normalizedId]);
            setWishlistError("");

            try {
                const existingItem = wishlist.find(
                    (item) => getProductId(item) === normalizedId
                );

                if (existingItem) {
                    const wishlistItemId = getWishlistItemId(existingItem);

                    if (!wishlistItemId) {
                        throw new Error(
                            "The wishlist item ID is missing. Refresh your wishlist and try again."
                        );
                    }

                    await removeWishlistItem(wishlistItemId);

                    setWishlist((current) =>
                        current.filter(
                            (item) => getProductId(item) !== normalizedId
                        )
                    );
                } else {
                    await addWishlistItem(normalizedId);
                    await refreshWishlist();
                }

                notifyWishlistUpdated();

                return !existingItem;
            } catch (error) {
                setWishlistError(
                    error.message || "Unable to update your wishlist."
                );

                throw error;
            } finally {
                setPendingWishlistIds((current) =>
                    current.filter((id) => id !== normalizedId)
                );
            }
        },
        [wishlist, pendingWishlistIds, refreshWishlist]
    );

    const removeFromWishlist = useCallback(
        async (productId) => {
            const normalizedId = String(productId);

            const existingItem = wishlist.find(
                (item) => getProductId(item) === normalizedId
            );

            if (!existingItem) {
                return;
            }

            const wishlistItemId = getWishlistItemId(existingItem);

            if (!wishlistItemId) {
                throw new Error("The wishlist item ID is missing.");
            }

            setPendingWishlistIds((current) => [...current, normalizedId]);

            try {
                await removeWishlistItem(wishlistItemId);

                setWishlist((current) =>
                    current.filter(
                        (item) => getProductId(item) !== normalizedId
                    )
                );

                notifyWishlistUpdated();
            } catch (error) {
                setWishlistError(
                    error.message || "Unable to remove this product."
                );
                throw error;
            } finally {
                setPendingWishlistIds((current) =>
                    current.filter((id) => id !== normalizedId)
                );
            }
        },
        [wishlist]
    );

    const clearAllWishlist = useCallback(async () => {
        try {
            await clearWishlist();
            setWishlist([]);
            notifyWishlistUpdated();
        } catch (error) {
            setWishlistError(
                error.message || "Unable to clear your wishlist."
            );
            throw error;
        }
    }, []);

    return {
        wishlist,
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
