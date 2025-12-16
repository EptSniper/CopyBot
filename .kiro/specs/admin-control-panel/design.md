# Design Document: Admin Control Panel

## Overview

The Admin Control Panel provides platform administrators with comprehensive visibility and control over the CopyBot system. It includes real-time monitoring of system health, security metrics, signal delivery statistics, and operational controls. The design follows a modular approach with dedicated pages for each major category and a unified dashboard for at-a-glance monitoring.

## Architecture

```mermaid
graph TB
    subgraph Frontend
        AD[Admin Dashboard]
        AH[System Health Page]
        AS[Security Page]
        ADL[Delivery Stats Page]
        AL[Logs Page]
        ADB[Database Stats Page]
    end
    
    subgraph Backend API
        AE[/admin/* endpoints]
        HE[/admin/health]
        SE[/admin/security]
        DE[/admin/delivery-stats]
        LE[/admin/logs]
        DBE[/admin/db-stats]
        ACT[/admin/actions/*]
    end
    
    subgraph Data Sources
        DB[(PostgreSQL)]
        MEM[In-Memory Stats]
        WS[WebSocket Server]
    end
    
    AD --> AE
    AH --> HE
    AS --> SE
    ADL --> DE
    AL --> LE
    ADB --> DBE
    
    HE --> DB
    HE --> MEM
    HE --> WS
    SE --> MEM
    DE --> DB
    LE --> DB
    DBE --> DB
```

## Components and Interfaces

### Backend API Endpoints

#### GET /admin/health
Returns system health metrics including API status, database health, and WebSocket connections.

```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'critical';
  api: {
    status: 'online' | 'offline';
    uptime: number; // seconds
    version: string;
  };
  database: {
    status: 'connected' | 'disconnected';
    latency: number; // ms
    poolSize: number;
    activeConnections: number;
  };
  websocket: {
    status: 'running' | 'stopped';
    connections: number;
  };
  memory: {
    used: number; // bytes
    total: number;
    percentage: number;
  };
  timestamp: string;
}
```

#### GET /admin/security
Returns security metrics and rate limiting statistics.

```typescript
interface SecurityResponse {
  rateLimits: {
    auth: { current: number; limit: number; blocked: number };
    api: { current: number; limit: number; blocked: number };
    signals: { current: number; limit: number; blocked: number };
  };
  blocked24h: number;
  failedAuth24h: number;
  topIPs: Array<{ ip: string; requests: number; blocked: boolean }>;
  suspiciousActivity: boolean;
  timestamp: string;
}
```

#### GET /admin/delivery-stats
Returns signal delivery statistics.

```typescript
interface DeliveryStatsResponse {
  period: string;
  signals: {
    total: number;
    delivered: number;
    pending: number;
    failed: number;
  };
  successRate: number; // percentage
  errorBreakdown: Array<{ error: string; count: number }>;
  webhooks: {
    total: number;
    success: number;
    failed: number;
    retries: number;
  };
  avgLatency: number; // ms
  timestamp: string;
}
```

#### GET /admin/db-stats
Returns database statistics.

```typescript
interface DbStatsResponse {
  tables: Array<{ name: string; rows: number; size: string }>;
  totalSize: string;
  connections: {
    active: number;
    idle: number;
    max: number;
  };
  queryStats: {
    avgTime: number;
    slowQueries: number;
  };
  timestamp: string;
}
```

#### POST /admin/actions/clear-rate-limits
Clears rate limit counters.

#### POST /admin/actions/broadcast
Sends a system-wide notification.

#### POST /admin/actions/maintenance
Toggles maintenance mode.

### Frontend Components

#### AdminSystemHealth.jsx
Displays system health metrics with status indicators and gauges.

#### AdminSecurity.jsx
Displays security metrics with rate limit visualizations and IP tables.

#### AdminDeliveryStats.jsx
Displays delivery statistics with charts and error breakdowns.

#### AdminLogs.jsx
Displays filterable, searchable system logs with pagination.

#### AdminDbStats.jsx
Displays database statistics with table sizes and connection info.

## Data Models

### System Metrics (In-Memory)
```javascript
{
  startTime: Date,
  requestCount: number,
  rateLimitStore: Map<string, { count, windowStart }>,
  blockedRequests: number,
  failedAuthAttempts: number
}
```

### Logs Table (Existing)
```sql
CREATE TABLE logs (
  id SERIAL PRIMARY KEY,
  level VARCHAR(10),
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Health endpoint returns valid structure
*For any* request to the health endpoint, the response SHALL contain status, api, database, websocket, and memory fields with valid values.
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Security endpoint returns rate limit stats
*For any* request to the security endpoint, the response SHALL contain rateLimits object with auth, api, and signals categories, each having current, limit, and blocked counts.
**Validates: Requirements 2.1, 2.2**

### Property 3: Security endpoint returns IP statistics
*For any* request to the security endpoint, the response SHALL contain topIPs array with ip and requests fields for each entry.
**Validates: Requirements 2.3, 2.4**

### Property 4: Delivery stats endpoint accepts time period
*For any* valid time period parameter (1, 7, 30 days), the delivery stats endpoint SHALL return statistics for that period.
**Validates: Requirements 3.1**

### Property 5: Delivery stats includes success rate
*For any* request to delivery stats, the response SHALL contain a successRate field calculated as (delivered / total) * 100.
**Validates: Requirements 3.2, 3.3, 3.4, 3.5**

### Property 6: Logs endpoint supports filtering
*For any* log level filter (error, warn, info), the logs endpoint SHALL return only logs matching that level.
**Validates: Requirements 4.1, 4.2**

### Property 7: Logs endpoint supports pagination
*For any* limit and offset parameters, the logs endpoint SHALL return at most limit entries starting from offset.
**Validates: Requirements 4.5**

### Property 8: Clear rate limits action resets counters
*For any* call to clear rate limits, the rate limit counters SHALL be reset to zero.
**Validates: Requirements 5.1**

### Property 9: Database stats returns table counts
*For any* request to db-stats, the response SHALL contain tables array with name and rows for each major table.
**Validates: Requirements 6.1, 6.2**

### Property 10: Dashboard includes all summary sections
*For any* request to the enhanced dashboard, the response SHALL contain health, security, and delivery summary objects.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

## Error Handling

- All admin endpoints require valid admin token authentication
- Invalid requests return 400 with descriptive error message
- Server errors return 500 with generic message (details logged server-side)
- Rate limit exceeded returns 429 with retry-after header
- Unauthorized access returns 401

## Testing Strategy

### Unit Testing
- Test each admin endpoint returns correct response structure
- Test filtering and pagination logic
- Test action endpoints modify state correctly

### Property-Based Testing
- Use fast-check library for JavaScript property-based testing
- Test response structures conform to interfaces
- Test filtering returns correct subsets
- Test pagination boundaries

### Integration Testing
- Test full request/response cycle through API
- Test authentication requirements
- Test error handling scenarios
