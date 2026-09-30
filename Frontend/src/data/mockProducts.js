/*
|--------------------------------------------------------------------------
| GEEKA MOCK PRODUCTS
|--------------------------------------------------------------------------
|
| DEPRECATED
|
| Product data now comes directly from the Django backend through:
|
| src/services/productService.js
|
| Public catalog:
| GET /api/v1/catalog/products/
|
| Product details:
| GET /api/v1/catalog/products/{product_id}/
|
| This file is intentionally kept only so any old import does not break
| the application while the remaining frontend files are migrated.
|
| DO NOT ADD DEMO OR HARD-CODED PRODUCTS HERE.
|--------------------------------------------------------------------------
*/

export const PRODUCTS = [];

export const CATEGORIES = [];