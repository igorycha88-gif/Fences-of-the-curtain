# API Documentation

## Overview

API endpoints for the Fences and Canopies application. Base URL: `http://localhost:3000/api`

## Authentication

All admin endpoints require authentication. Include session cookie with requests.

## Public Endpoints

### Calculators

#### POST /api/calculator/fence

Calculate fence cost.

**Request:**
```json
{
  "fenceType": "PROFNASTIL|SHAKHETNIK|MESH|PANELS_3D",
  "length": 50,
  "height": 2.0,
  "postType": "string",
  "lagType": "string",
  "lagRows": "2|3",
  "hasGate": true,
  "gateType": "SWING|SLIDING",
  "gateWidth": 4.0,
  "hasWicket": true,
  "wicketWidth": 1.0,
  "coating": "GALVANIZED|POLYMER_SINGLE|POLYMER_DOUBLE",
  "color": "5005",
  "region": "string"
}
```

**Response (200):**
```json
{
  "materials": [
    {
      "name": "string",
      "quantity": 100,
      "unit": "м²",
      "pricePerUnit": 450,
      "total": 45000
    }
  ],
  "works": [
    {
      "name": "string",
      "quantity": 50,
      "unit": "м.п.",
      "pricePerUnit": 800,
      "total": 40000
    }
  ],
  "materialsTotal": 50000,
  "worksTotal": 45000,
  "grandTotal": 100000
}
```

#### POST /api/calculator/canopy

Calculate canopy cost.

**Request:**
```json
{
  "canopyType": "single-slope|double-slope|arch",
  "purpose": "car-1|car-2|car-3|gazebo|terrace|storage",
  "length": 6.0,
  "width": 4.0,
  "height": 2.5,
  "frameMaterial": "string",
  "roofMaterial": "string",
  "installationType": "ground|wall|base",
  "hasWaterSystem": true
}
```

**Response (200):**
```json
{
  "materials": [...],
  "works": [...],
  "materialsTotal": 25000,
  "worksTotal": 36000,
  "grandTotal": 61000
}
```

### Orders

#### POST /api/orders

Create new order.

**Request:**
```json
{
  "clientName": "Иван Иванов",
  "phone": "+79001234567",
  "email": "ivan@example.com",
  "serviceType": "fence|canopy",
  "parameters": {},
  "calculatedCost": 100000
}
```

**Response (201):**
```json
{
  "id": "order-id",
  "status": "NEW",
  "createdAt": "2026-03-02T10:00:00Z"
}
```

#### GET /api/orders

Get orders (admin only, auth required).

**Query Parameters:**
- `status`: Filter by order status (NEW, IN_PROGRESS, COMPLETED, CANCELLED)
- `serviceType`: Filter by service type (fence, canopy)

**Response (200):**
```json
{
  "orders": [...]
}
```

### Contact

#### POST /api/contact

Submit contact form.

**Request:**
```json
{
  "name": "Иван Иванов",
  "phone": "+79001234567",
  "email": "ivan@example.com",
  "message": "Текст сообщения"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Заявка отправлена"
}
```

### Materials

#### GET /api/materials

Get fence materials.

**Query Parameters:**
- `category`: Filter by category (PROFNASTIL, SHAKHETNIK, etc.)
- `active`: Filter by active status (true/false)

**Response (200):**
```json
{
  "materials": [
    {
      "id": "material-id",
      "name": "Профнастил С8",
      "category": "PROFNASTIL",
      "unit": "м²",
      "basePrice": 450,
      "description": "...",
      "image": "/images/material.jpg",
      "active": true,
      "sortOrder": 1
    }
  ]
}
```

### Authentication (NextAuth.js)

#### POST /api/auth/signin

Sign in to the system.

**Request (credentials provider):**
```json
{
  "email": "admin@fences.ru",
  "password": "admin123",
  "csrfToken": "..."
}
```

**Response (200):**
```json
{
  "url": "/admin/dashboard"
}
```

**Response (401):**
```json
{
  "error": "CredentialsSignin",
  "code": null,
  "status": 401
}
```

#### POST /api/auth/signout

Sign out from the system.

**Request:**
```json
{
  "csrfToken": "..."
}
```

**Response (200):**
```json
{
  "url": "/"
}
```

#### GET /api/auth/session

Get current session.

**Response (200) - authenticated:**
```json
{
  "user": {
    "id": "user-id",
    "email": "admin@fences.ru",
    "name": "Администратор"
  },
  "expires": "2026-03-04T10:00:00.000Z"
}
```

**Response (200) - not authenticated:**
```json
null
```

#### GET /api/auth/me

Get current user information.

**Response (200):**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "ADMIN"
  }
}
```

**Response (401):**
```json
{
  "error": "Unauthorized"
}
```

#### GET /api/auth/csrf

Get CSRF token for form submissions.

**Response (200):**
```json
{
  "csrfToken": "..."
}
```

#### GET /api/auth/providers

Get available authentication providers.

**Response (200):**
```json
{
  "credentials": {
    "id": "credentials",
    "name": "Credentials",
    "type": "credentials",
    "signinUrl": "http://localhost:3000/api/auth/signin/credentials",
    "callbackUrl": "http://localhost:3000/api/auth/callback/credentials"
  }
}
```

## Reference Guides Management (Admin Only)

### Fence Types

#### GET /api/admin/materials/fence-types

Get list of fence types.

**Query Parameters:**
- `active` (optional): Filter by active status (true/false)
- `search` (optional): Search by name or description
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)

**Response (200):**
```json
{
  "types": [
    {
      "id": "string",
      "name": "Профнастил",
      "description": "string",
      "image": "string",
      "difficultyCoef": 1.0,
      "postSpacing": 2.5,
      "defaultLagRows": 2,
      "active": true,
      "sortOrder": 1,
      "createdAt": "2026-03-01T10:00:00Z",
      "updatedAt": "2026-03-03T10:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "pageSize": 20,
  "totalPages": 1
}
```

#### POST /api/admin/materials/fence-types

Create new fence type (Admin only).

**Request:**
```json
{
  "name": "Новый тип забора",
  "description": "Описание",
  "image": "/images/new-type.jpg",
  "difficultyCoef": 1.2,
  "postSpacing": 2.5,
  "defaultLagRows": 2,
  "active": true,
  "sortOrder": 0
}
```

**Response (201):**
```json
{
  "id": "new-type-id"
}
```

#### GET /api/admin/materials/fence-types/[id]

Get fence type by ID.

#### PUT /api/admin/materials/fence-types/[id]

Update fence type (Admin, Manager).

#### DELETE /api/admin/materials/fence-types/[id]

Delete fence type (Admin only).

#### PATCH /api/admin/materials/fence-types/[id]

Toggle fence type active status (Admin, Manager).

### Fence Heights

#### GET /api/admin/fence-heights

Get list of materials with heights.

**Query Parameters:**
- `category` (optional): Filter by material category
- `active` (optional): Filter by active status
- `search` (optional): Search by name
- `page` (optional): Page number
- `pageSize` (optional): Items per page

**Response (200):**
```json
{
  "materials": [
    {
      "id": "material-id",
      "name": "Профнастил С8",
      "category": "PROFNASTIL",
      "basePrice": 450,
      "availableHeights": [
        { "height": 1.8, "priceCoef": 1.0, "isCustom": false, "comment": null },
        { "height": 2.0, "priceCoef": 1.1, "isCustom": false, "comment": null }
      ],
      "active": true
    }
  ],
  "total": 50,
  "page": 1,
  "pageSize": 20
}
```

#### POST /api/admin/fence-heights

Add height to material (Admin, Manager).

**Request:**
```json
{
  "materialId": "material-id",
  "height": 2.2,
  "priceCoef": 1.15,
  "isCustom": false,
  "comment": null
}
```

#### PUT /api/admin/fence-heights/[materialId]/[height]

Update height parameters (Admin, Manager).

#### DELETE /api/admin/fence-heights/[materialId]/[height]

Delete height (Admin only).

### Coating Types

#### GET /api/admin/coating-types

Get list of coating types.

**Response (200):**
```json
{
  "coatings": [
    {
      "id": "coating-id",
      "name": "Полимерное одностороннее",
      "description": "string",
      "baseCost": 50,
      "markupCoef": 1.15,
      "image": "string",
      "active": true,
      "sortOrder": 1
    }
  ],
  "total": 10,
  "page": 1,
  "pageSize": 20
}
```

#### POST /api/admin/coating-types

Create coating type (Admin only).

**Request:**
```json
{
  "name": "Новое покрытие",
  "description": "Описание",
  "baseCost": 60,
  "markupCoef": 1.2,
  "image": "/images/new-coating.jpg",
  "active": true,
  "sortOrder": 0
}
```

#### GET /api/admin/coating-types/[id]

Get coating type by ID.

#### PUT /api/admin/coating-types/[id]

Update coating type (Admin, Manager).

#### DELETE /api/admin/coating-types/[id]

Delete coating type (Admin only).

#### PATCH /api/admin/coating-types/[id]

Toggle coating type active status (Admin, Manager).

### Lag Types

#### GET /api/admin/lag-types

Get list of lag types.

**Query Parameters:**
- `active` (optional): Filter by active status
- `search` (optional): Search by name
- `minThickness` (optional): Minimum metal thickness
- `maxThickness` (optional): Maximum metal thickness
- `page` (optional): Page number
- `pageSize` (optional): Items per page

**Response (200):**
```json
{
  "lags": [
    {
      "id": "lag-id",
      "name": "Профиль 40x20x2.0",
      "description": "string",
      "width": 40,
      "height": 20,
      "metalThickness": 2.0,
      "basePricePerMeter": 150,
      "availableLengths": [
        { "length": 2.5, "priceCoef": 1.0 },
        { "length": 3.0, "priceCoef": 1.1 }
      ],
      "image": "string",
      "active": true,
      "sortOrder": 1
    }
  ],
  "total": 20,
  "page": 1,
  "pageSize": 20
}
```

#### POST /api/admin/lag-types

Create lag type (Admin only).

#### GET /api/admin/lag-types/[id]

Get lag type by ID.

#### PUT /api/admin/lag-types/[id]

Update lag type (Admin, Manager).

#### DELETE /api/admin/lag-types/[id]

Delete lag type (Admin only).

#### PATCH /api/admin/lag-types/[id]

Toggle lag type active status (Admin, Manager).

### Post Types

#### GET /api/admin/post-types

Get list of post types.

**Query Parameters:**
- `active` (optional): Filter by active status
- `search` (optional): Search by name
- `minThickness` (optional): Minimum wall thickness
- `maxThickness` (optional): Maximum wall thickness
- `page` (optional): Page number
- `pageSize` (optional): Items per page

**Response (200):**
```json
{
  "posts": [
    {
      "id": "post-id",
      "name": "Столб 60x60x2.5",
      "description": "string",
      "sectionWidth": 60,
      "sectionHeight": 60,
      "wallThickness": 2.5,
      "pricePerMeter": 350,
      "priceWithConcrete": 800,
      "availableLengths": [
        { "length": 2.5, "pricePerMeter": 350, "priceWithConcrete": 800 },
        { "length": 3.0, "pricePerMeter": 420, "priceWithConcrete": 950 }
      ],
      "image": "string",
      "active": true,
      "sortOrder": 1
    }
  ],
  "total": 30,
  "page": 1,
  "pageSize": 20
}
```

#### POST /api/admin/post-types

Create post type (Admin only).

#### GET /api/admin/post-types/[id]

Get post type by ID.

#### PUT /api/admin/post-types/[id]

Update post type (Admin, Manager).

#### DELETE /api/admin/post-types/[id]

Delete post type (Admin only).

  #### PATCH /api/admin/post-types/[id]

  Toggle post type active status (Admin, Manager).

  ### Profnastil Types

  #### GET /api/admin/profnastil-types

  Get list of profnastil types (Admin, Manager).

  **Query Parameters:**
  - `active` (optional): Filter by active status (true/false)
  - `search` (optional): Search by name, color, or coating
  - `coating` (optional): Filter by coating type
  - `page` (optional): Page number (default: 1)
  - `pageSize` (optional): Items per page (default: 20)
  - `validityFilter` (optional): Filter by validity ('all', 'active', 'expired', 'expiring_soon')
  - `sortBy` (optional): Sort field (default: 'priority')
  - `sortOrder` (optional): Sort order ('asc', 'desc')

  **Response (200):**
  ```json
  {
    "profnastil": [
      {
        "id": "string",
        "name": "Профнастил С8",
        "description": "string | null",
        "metalThickness": 0.5,
        "fullWidth": 1200,
        "usefulWidth": 1150,
        "length": 2000,
        "coating": "Полимерное (одностороннее)",
        "color": "RAL 8017 | null",
        "purchasePricePerLinearMeter": 350.00,
        "purchasePricePerUnit": 700.00,
        "retailPricePerUnit": 1200.00,
        "validFrom": "2026-03-01T10:00:00Z | null",
        "validUntil": "2026-12-31T23:59:59Z | null",
        "active": true,
        "image": "/images/profnastil.jpg",
        "priority": 1,
        "createdAt": "2026-03-01T10:00:00Z",
        "updatedAt": "2026-03-03T10:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
  ```

  **Note for MANAGER role:** purchasePricePerLinearMeter and purchasePricePerUnit fields are not included in response.

  #### POST /api/admin/profnastil-types

  Create new profnastil type (Admin only).

  **Request:**
  ```json
  {
    "name": "Профнастил С8",
    "description": "Описание",
    "metalThickness": 0.5,
    "fullWidth": 1200,
    "usefulWidth": 1150,
    "length": 2000,
    "coating": "Полимерное (одностороннее)",
    "color": "RAL 8017",
    "purchasePricePerLinearMeter": 350.00,
    "retailPricePerUnit": 1200.00,
    "validFrom": "2026-03-01T10:00:00Z",
    "validUntil": null,
    "active": true,
    "sortOrder": 0
  }
  ```

  **Automatic calculation:** purchasePricePerUnit = purchasePricePerLinearMeter × (length / 1000)
  - Example: 350 × (2000 / 1000) = 700.00

  **Response (201):**
  ```json
  {
    "id": "new-profnastil-id"
  }
  ```

  **Error Responses:**
  - 400: Validation error
  - 403: Forbidden (MANAGER cannot set purchase prices)
  - 409: Conflict (duplicate combination of name, metalThickness, coating, color)
  - 500: Internal server error

  #### GET /api/admin/profnastil-types/[id]

  Get profnastil type by ID (Admin, Manager).

  **Response (200) - ADMIN:**
  ```json
  {
    "id": "string",
    "name": "Профнастил С8",
    "purchasePricePerLinearMeter": 350.00,
    "purchasePricePerUnit": 700.00,
    "retailPricePerUnit": 1200.00,
    "length": 2000,
    "metalThickness": 0.5,
    "active": true
  }
  ```

  **Response (200) - MANAGER:**
  ```json
  {
    "id": "string",
    "name": "Профнастил С8",
    "retailPricePerUnit": 1200.00,
    "length": 2000,
    "metalThickness": 0.5,
    "active": true
  }
  ```

  **Note:** MANAGER role cannot see purchasePricePerLinearMeter and purchasePricePerUnit fields.

  #### PUT /api/admin/profnastil-types/[id]

  Update profnastil type (Admin, Manager).

  **Request:**
  ```json
  {
    "length": 2500,
    "purchasePricePerLinearMeter": 380.00,
    "active": true
  }
  ```

  **Automatic calculation:** If purchasePricePerLinearMeter or length changes, purchasePricePerUnit is recalculated.
  - Example: 380 × (2500 / 1000) = 950.00

  **Response (200) - ADMIN:**
  ```json
  {
    "id": "string",
    "name": "Профнастил С8",
    "purchasePricePerLinearMeter": 380.00,
    "purchasePricePerUnit": 950.00,
    "retailPricePerUnit": 1200.00,
    "length": 2500,
    "active": true
  }
  ```

  **Response (200) - MANAGER:**
  ```json
  {
    "id": "string",
    "name": "Профнастил С8",
    "retailPricePerUnit": 1200.00,
    "length": 2500,
    "active": true
  }
  ```

  **Note:**
  - MANAGER cannot modify purchasePricePerLinearMeter or purchasePricePerUnit
  - MANAGER response doesn't include purchase price fields

  **Error Responses:**
  - 400: Validation error
  - 403: Forbidden (MANAGER cannot modify purchase prices)
  - 404: Profnastil type not found
  - 409: Conflict (duplicate combination)
  - 500: Internal server error

  #### DELETE /api/admin/profnastil-types/[id]

  Delete profnastil type (Admin only).

  **Response (200):**
  ```json
  {
    "success": true
  }
  ```

  **Error Responses:**
  - 401: Unauthorized
  - 403: Forbidden (non-admin)
  - 404: Not found
  - 500: Internal server error

  #### PATCH /api/admin/profnastil-types/[id]

  Toggle profnastil type active status (Admin, Manager).

  **Response (200):**
  ```json
  {
    "id": "string",
    "name": "Профнастил С8",
    "active": false
  }
  ```

  #### PATCH /api/admin/profnastil-types/reorder

  Reorder profnastil types by changing priority (Admin, Manager).

  **Request:**
  ```json
  {
    "id": "string",
    "newPriority": 5
  }
  ```

  **Response (200):**
  ```json
  {
    "success": true
  }
  ```

  ## Admin Estimates

### GET /api/admin/estimates/[id]

Get estimate details with purchase prices and margin (for ADMIN only).

**Response (200) - ADMIN:**
```json
{
  "id": "estimate-id",
  "createdAt": "2026-03-16T10:00:00Z",
  "fenceType": { "id": "type-id", "name": "Профнастил" },
  "length": 50,
  "height": 2.0,
  "items": [
    {
      "category": "posts",
      "nomenclatureId": "post-id",
      "nomenclatureName": "Столб 60×60×2 мм",
      "quantity": 21,
      "unit": "шт",
      "pricePerUnit": 1428.57,
      "totalPrice": 30000.00,
      "purchasePricePerUnit": 950.00,
      "purchaseTotal": 19950.00,
      "marginRub": 10050.00,
      "marginPercent": 33.50
    }
  ],
  "summary": {
    "retailTotal": 140000.00,
    "purchaseTotal": 95000.00,
    "marginTotalRub": 45000.00,
    "marginTotalPercent": 32.14
  },
  "showPurchasePrices": true,
  "grandTotal": 140000.00
}
```

**Response (200) - MANAGER:**
```json
{
  "id": "estimate-id",
  "items": [...],
  "showPurchasePrices": false,
  "grandTotal": 140000.00
}
```

### GET /api/admin/estimates/[id]/export

Export estimate to Excel with purchase prices (for ADMIN only).

**Response (200):**
Binary XLSX file with columns:
- №, Категория, Наименование, Ед. изм., Кол-во
- Цена розн. за ед., Сумма розн. (for all users)
- Цена закуп. за ед., Сумма закуп., Маржа (₽), Маржа (%) (for ADMIN only)

## Rate Limiting

API endpoints have rate limiting (100 requests per minute per IP).

## CORS

CORS is configured to allow requests from frontend domain.
