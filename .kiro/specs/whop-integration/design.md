# Design Document: Whop Integration

## Overview

This feature integrates Whop payment verification into CopyBot, allowing hosts to sell signal subscriptions through Whop and subscribers to activate their accounts using Whop license keys.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Whop      │────▶│  CopyBot    │────▶│  Database   │
│   Store     │     │  Backend    │     │  (Neon)     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   ▲
       │                   │
       ▼                   │
┌─────────────┐     ┌─────────────┐
│  Customer   │────▶│  Activate   │
│  (Browser)  │     │  Page       │
└─────────────┘     └─────────────┘
```

### Flow

1. **Host Setup**: Host enters Whop API key and product ID in Settings
2. **Customer Purchase**: Customer buys on Whop, receives license key
3. **Activation**: Customer visits `/activate/:hostSlug`, enters license key
4. **Verification**: Backend calls Whop API to verify license
5. **Account Creation**: System creates subscriber, returns CopyBot API key

## Components and Interfaces

### Backend Routes

#### `POST /host/whop-settings`
Save Whop integration settings for a host.

```typescript
Request: {
  whop_api_key: string;
  whop_product_id: string;
}
Response: { ok: true }
```

#### `POST /activate/:hostSlug`
Activate a subscriber account using a Whop license key.

```typescript
Request: {
  license_key: string;
  name: string;
  email?: string;
}
Response: {
  success: true;
  subscriber: {
    name: string;
    apiKey: string;
    hostName: string;
  };
  instructions: { ... };
}
```

#### `POST /whop/webhook`
Handle Whop webhooks for subscription changes.

```typescript
Request: Whop webhook payload
Response: { received: true }
```

### Whop API Integration

Using Whop's API v2:
- `GET /api/v2/memberships/{license_key}` - Verify license key
- Webhook events: `membership.went_invalid`, `membership.cancelled`

## Data Models

### hosts table additions
```sql
ALTER TABLE hosts ADD COLUMN whop_api_key TEXT;
ALTER TABLE hosts ADD COLUMN whop_product_id TEXT;
ALTER TABLE hosts ADD COLUMN slug TEXT UNIQUE;
```

### subscribers table additions
```sql
ALTER TABLE subscribers ADD COLUMN whop_license_key TEXT UNIQUE;
ALTER TABLE subscribers ADD COLUMN whop_membership_id TEXT;
ALTER TABLE subscribers ADD COLUMN activated_via TEXT DEFAULT 'manual';
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid credentials are stored
*For any* valid Whop API key and product ID, saving them should result in the host record being updated with those values.
**Validates: Requirements 1.1, 1.2**

### Property 2: License key verification creates subscriber
*For any* valid and active Whop license key, activation should create a subscriber with a unique API key.
**Validates: Requirements 2.1, 2.2**

### Property 3: Duplicate license keys are rejected
*For any* license key that has already been used, attempting to activate again should fail with an error.
**Validates: Requirements 2.4**

### Property 4: Whop-activated subscribers are marked
*For any* subscriber created via Whop activation, the `activated_via` field should be 'whop' and `whop_license_key` should be set.
**Validates: Requirements 3.1**

### Property 5: Webhook cancellation deactivates subscriber
*For any* valid Whop cancellation webhook, the corresponding subscriber should be marked as inactive.
**Validates: Requirements 3.2**

## Error Handling

| Error | Response |
|-------|----------|
| Invalid Whop API key | 400: "Invalid Whop API credentials" |
| Invalid license key | 400: "License key not found or invalid" |
| Expired license | 400: "License has expired" |
| Already used key | 409: "License key already activated" |
| Host not found | 404: "Host not found" |
| Whop API error | 503: "Unable to verify license, try again" |

## Testing Strategy

### Unit Tests
- Test Whop API response parsing
- Test license key validation logic
- Test webhook signature verification

### Property-Based Tests
- Use fast-check library for JavaScript
- Test that valid inputs produce valid outputs
- Test that duplicate keys are always rejected
- Minimum 100 iterations per property test

### Integration Tests
- Mock Whop API responses
- Test full activation flow
- Test webhook handling
