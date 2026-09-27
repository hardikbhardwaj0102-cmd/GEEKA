/*
|--------------------------------------------------------------------------
| GEEKA CART HOOK
|--------------------------------------------------------------------------
| This file is the public hook used by:
|
| - Header.jsx
| - Shop.jsx
| - Cart.jsx
|
| The actual cart logic lives inside:
|
| src/services/cartStore.js
|
| Keeping this file separate makes it easier to replace the frontend
| cart implementation with a backend-connected system later.
|--------------------------------------------------------------------------
*/

export {
    useCart
} from "../services/cartStore";