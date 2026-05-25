# Budget Requests API (tafeito-api)

Base path: **`/budget-requests`**

## Endpoints

### 1) Create budget request
- **POST** `/budget-requests`
- Method: `BudgetRequestController.create`
- Service: `BudgetRequestService.create`

**Auth:** uses `@CurrentUser()` to get `userId` (send Authorization header if your app requires it).

**Body (CreateBudgetRequestDto):**
```json
{
  "serviceId": "<SERVICE_UUID>",
  "title": "Pedido de orçamento",
  "description": "Detalhes do pedido",
  "category": "categoria",
  "location": "bairro/cidade",
  "requestDate": "2026-01-01T00:00:00.000Z",
  "photos": ["https://example.com/photo1.jpg"]
}
```

**Response:** `BudgetRequestDto`.

---

### 2) List all budget requests
- **GET** `/budget-requests`
- Method: `BudgetRequestController.findAll`
- Service: `BudgetRequestService.findAll`

**Response:** `BudgetRequestDto[]`.

---

### 3) Get budget request by id
- **GET** `/budget-requests/:id`
- Method: `BudgetRequestController.findById`
- Service: `BudgetRequestService.findById`

**Response:** `BudgetRequestDto | null`.

---

### 4) List budget requests by user
- **GET** `/budget-requests/user/:userId`
- Method: `BudgetRequestController.findByUserId`
- Service: `BudgetRequestService.findByUserId`

**Response:** `BudgetRequestDto[]`.

---

### 5) List available budget requests for a provider (prestador)
- **GET** `/budget-requests/available?serviceId=:serviceId`
- Method: `BudgetRequestController.findAvailable`
- Service: `BudgetRequestService.findAvailableByServiceId`
- Repository: `DrizzleBudgetRequestRepository.findAvailableByServiceId`

**Regra de negócio (filtro):**
- `status` **exatamente** `'pending'`
- `serviceId` **igual** ao query param

**Query:**
- `serviceId` (obrigatório)

**Example (Postman):**
- **GET** `http://localhost:3000/budget-requests/available?serviceId=<SERVICE_UUID>`

**Response:** `BudgetRequestDto[]`.

**Validation example (serviceId vazio):**
- **GET** `http://localhost:3000/budget-requests/available?serviceId=`
- **Response:** `400 BadRequest` with message `serviceId é obrigatório`.

---

### 6) Cancel a budget request
- **PATCH** `/budget-requests/:id/cancel`
- Method: `BudgetRequestController.cancel`
- Service: `BudgetRequestService.cancel`

**Body (CancelBudgetRequestDto):**
```json
{
  "reason": "Motivo do cancelamento"
}
```

**Regra de negócio:** só permite cancelar quando `status === 'pending'`.

**Response:** `void` (no content).

---

### 7) Delete a budget request
- **DELETE** `/budget-requests/:id`
- Method: `BudgetRequestController.remove`
- Service: `BudgetRequestService.delete`

**Response:** `void` (no content).

---

## JSON de exemplo de resposta (BudgetRequestDto)

> Observação: campos `requestDate/createdAt/updatedAt` vêm como timestamps ISO.

```json
{
  "id": "<BUDGET_REQUEST_UUID>",
  "userId": "<USER_UUID>",
  "serviceId": "<SERVICE_UUID>",
  "title": "Pedido de orçamento",
  "description": "Detalhes do pedido",
  "category": "categoria",
  "location": "bairro/cidade",
  "requestDate": "2026-01-01T00:00:00.000Z",
  "status": "pending",
  "photos": ["https://example.com/photo1.jpg"],
  "cancellationReason": null,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

