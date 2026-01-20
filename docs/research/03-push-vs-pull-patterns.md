# Push vs Pull Notification Architecture Patterns
## Deep Dive Analysis

### Executive Summary

For Ralph's Civic Notices admin panel with ~10-50 admins:
- **Primary**: Supabase Realtime (Push via WebSocket)
- **Fallback 1**: Server-Sent Events (Push via HTTP streaming)
- **Fallback 2**: HTTP Polling (Pull via REST)

This hybrid approach ensures notifications reach admins regardless of network conditions.

---

## 1. Push Architecture (Recommended Primary)

### Definition
Server sends data to client immediately when an event occurs. Client maintains a persistent connection (WebSocket) or long-lived stream (SSE).

### 1.1 WebSocket + Supabase Realtime

**Best for Ralph's Civic Notices** - Already using Supabase, no extra infrastructure needed.

#### How It Works
```
Client                                  Server
  │                                       │
  ├─ "Connect" ─────────────────────────>│
  │                                       │
  ├ "Authenticate" ──────────────────────>│
  │         <────────────────────────── "OK"
  │
  │ [WebSocket connection established]
  │
  ├─ Subscribe to notifications ────────>│
  │         <──────────────────────── "Subscribed"
  │
  │ (Waiting for events)
  │
  │         <────────────── New notification event
  │    (Receive & render immediately)
  │
  └─ Disconnect ──────────────────────>│
```

#### Pros
- **Real-time delivery**: ~100-200ms latency
- **Efficient**: No polling overhead
- **Scalable**: Can handle thousands of connections
- **Bidirectional**: Can send and receive
- **Built-in auth**: Supabase handles auth via JWT
- **RLS support**: Row-level security works with realtime
- **Native to Supabase**: Already have infrastructure

#### Cons
- **Connection management**: Need to handle disconnects/reconnects
- **Stateful**: Server maintains connections
- **Not all networks**: Some corporate proxies block WebSockets
- **Fallback needed**: Must have SSE/polling backup

#### Implementation Requirements
```
1. Create admin_notifications table
2. Enable Realtime publication
3. Set up RLS policies
4. Create Supabase client in React
5. Subscribe to 'postgres_changes' events
6. Handle INSERT/UPDATE events for notifications
```

#### Connection Lifecycle

```typescript
// Connect with automatic reconnection
const channel = supabase.channel('admin_notifications')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
    (payload) => { /* new notification */ }
  )
  .subscribe();

// Subscribe status events
.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    console.log('Connected - receiving real-time events');
  } else if (status === 'CLOSED') {
    console.log('Disconnected - fallback to polling');
    startPolling();
  }
});
```

#### Example Use Cases
- Admin approves organization → Real-time "New approval" badge appears
- Notice flagged → Real-time alert in dropdown
- New user invited → Immediate notification

---

### 1.2 Server-Sent Events (SSE)

**Excellent fallback** when WebSocket unavailable. Simpler than WebSocket, supports HTTP/1.1.

#### How It Works
```
Client                                  Server
  │                                       │
  ├─ GET /api/notifications/stream ────>│
  │         <──────────────────────── headers + 200 OK
  │              (Connection: keep-alive)
  │
  │ [HTTP stream established]
  │
  │ (Waiting for events)
  │         <────────── data: {"notification": "..."}
  │              (Event arrives)
  │         <────────── data: {"notification": "..."}
  │
  │         <────────── : heartbeat (keep-alive)
  │
  └─ Close connection
```

#### Pros
- **Simpler than WebSocket**: Standard HTTP, works with proxies
- **Built-in reconnection**: Browser handles auto-reconnect
- **Less overhead**: Server just writes to response stream
- **HTTP/1.1 compatible**: Works everywhere
- **Standards-based**: No special protocol

#### Cons
- **One-way only**: Server→Client (need separate API for commands)
- **Browser cleanup**: Need to manage EventSource lifecycle
- **Connection limits**: Browsers limit concurrent connections per domain

#### Implementation Example

```typescript
// Server (Express)
router.get('/notifications/stream', (req, res) => {
  const adminId = req.admin.id;

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial message
  res.write(':connected\n\n');

  // Heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // Store client for broadcasting
  sseClients.set(adminId, res);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(adminId);
  });
});

// Broadcast to admin when notification created
export function sendNotification(adminId: string, notification: any) {
  const client = sseClients.get(adminId);
  if (client) {
    client.write(`data: ${JSON.stringify(notification)}\n\n`);
  }
}
```

```typescript
// Client (React)
useEffect(() => {
  const eventSource = new EventSource('/api/notifications/stream');

  eventSource.onmessage = (event) => {
    const notification = JSON.parse(event.data);
    setNotifications(prev => [notification, ...prev]);
  };

  eventSource.onerror = () => {
    console.log('SSE failed, falling back to polling');
    eventSource.close();
    startPolling();
  };

  return () => eventSource.close();
}, []);
```

#### When to Use
- Corporate environments with WebSocket restrictions
- Legacy browser support needed
- Simpler server implementation preferred
- No bidirectional communication needed

---

### Comparison: WebSocket vs SSE

| Feature | WebSocket | SSE |
|---------|-----------|-----|
| **Direction** | Bidirectional | Unidirectional (server→client) |
| **Protocol** | ws:// / wss:// | HTTP/HTTPS |
| **Latency** | ~50-100ms | ~100-200ms |
| **Proxy Support** | Sometimes blocked | Works everywhere |
| **Complexity** | Medium | Simple |
| **Browser Support** | ~95% | ~85% |
| **Reconnection** | Manual | Automatic |
| **Scalability** | High | High |
| **Use in Ralph's** | Primary | Fallback 1 |

---

## 2. Pull Architecture (Fallback)

### Definition
Client requests notifications from server at regular intervals. No persistent connection maintained.

### 2.1 HTTP Polling

**Least preferred** but most resilient. Works everywhere, simple implementation.

#### How It Works
```
Client                                  Server
  │
  ├─ GET /api/notifications ──────────>│
  │         <───────────── [{...notifications...}]
  │    (Process notifications)
  │
  │ (Wait 30 seconds)
  │
  ├─ GET /api/notifications ──────────>│
  │         <───────────── [{...notifications...}]
  │    (Process notifications)
  │
  │ (Repeats forever)
```

#### Pros
- **Maximum compatibility**: Works everywhere (IE6+)
- **No infrastructure needed**: Just HTTP endpoints
- **Stateless**: Server doesn't maintain connections
- **Simple to implement**: Standard REST API
- **Survives network changes**: Reconnect on next interval

#### Cons
- **High latency**: 5-60 seconds between checks
- **Network overhead**: Repeated requests even when no notifications
- **Server load**: Scales poorly with many clients
- **Battery drain**: Mobile devices consume more power
- **Not real-time**: User won't see urgent alerts immediately

#### Implementation Example

```typescript
// Client (React)
const POLL_INTERVAL = 30000; // 30 seconds

useEffect(() => {
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const notifications = await response.json();
      setNotifications(notifications);
    } catch (err) {
      console.error('Poll failed:', err);
    }
  };

  // Fetch immediately
  fetchNotifications();

  // Then poll every 30 seconds
  const interval = setInterval(fetchNotifications, POLL_INTERVAL);

  return () => clearInterval(interval);
}, []);
```

#### Optimization Strategies

**1. Exponential Backoff**
```
Attempt 1: 5 seconds
Attempt 2: 10 seconds
Attempt 3: 20 seconds
Attempt 4: 60 seconds
(Reset on success)
```

**2. Conditional Polling**
```typescript
// Only poll when tab is visible
useEffect(() => {
  const handleVisibility = () => {
    if (document.hidden) {
      clearInterval(pollInterval);
    } else {
      startPolling();
    }
  };

  document.addEventListener('visibilitychange', handleVisibility);
  return () => document.removeEventListener('visibilitychange', handleVisibility);
}, []);
```

**3. Range Queries**
```typescript
// Only fetch notifications since last check
const lastCheck = new Date(Date.now() - 30000);
const response = await fetch(
  `/api/notifications?since=${lastCheck.toISOString()}`
);
```

#### When to Use
- Fallback when WebSocket/SSE unavailable
- Very low-frequency notifications (<1/hour)
- Network unstable (mobile networks)
- Budget/infrastructure constraints

---

## 3. Hybrid Fallback Chain (Recommended for Ralph's)

### Strategy: Try Multiple Transports

```
┌─ User opens admin panel
│
├─→ Try WebSocket (Supabase Realtime)
│   │
│   ├─ Success? → Use for real-time updates (100ms)
│   │
│   └─ Fail? → Try next option
│
├─→ Try SSE (/api/notifications/stream)
│   │
│   ├─ Success? → Use for near-real-time (500ms)
│   │
│   └─ Fail? → Try next option
│
└─→ Use Polling (/api/notifications every 30s)
    │
    ├─ Success? → Use as last resort (~30s)
    │
    └─ Fail? → Show error, retry
```

### Implementation

```typescript
// hooks/useNotifications.ts
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [transport, setTransport] = useState<'websocket' | 'sse' | 'polling' | null>(null);

  useEffect(() => {
    // 1. Try WebSocket
    const tryWebSocket = () => {
      const channel = supabase
        .channel('admin_notifications')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'admin_notifications' },
          (payload) => {
            setNotifications(prev => [...prev, payload.new]);
            setTransport('websocket');
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Notifications] Connected via WebSocket');
            setTransport('websocket');
          } else if (status === 'CLOSED') {
            console.log('[Notifications] WebSocket failed, trying SSE');
            trySSE();
          }
        });

      return channel;
    };

    // 2. Try SSE
    const trySSE = () => {
      try {
        const eventSource = new EventSource('/api/notifications/stream');

        eventSource.onmessage = (event) => {
          const notification = JSON.parse(event.data);
          setNotifications(prev => [...prev, notification]);
          setTransport('sse');
        };

        eventSource.onerror = () => {
          console.log('[Notifications] SSE failed, using polling');
          eventSource.close();
          tryPolling();
        };

        console.log('[Notifications] Connected via SSE');
        return eventSource;
      } catch (err) {
        console.log('[Notifications] SSE not available, using polling');
        tryPolling();
      }
    };

    // 3. Fall back to polling
    const tryPolling = () => {
      const fetchNotifications = async () => {
        try {
          const response = await fetch('/api/notifications');
          const data = await response.json();
          setNotifications(data);
          setTransport('polling');
        } catch (err) {
          console.error('[Notifications] Polling failed:', err);
        }
      };

      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);

      console.log('[Notifications] Using polling (30s interval)');
      return interval;
    };

    // Start the chain
    tryWebSocket();
  }, []);

  return {
    notifications,
    unreadCount,
    transport, // Can show in UI: "Real-time" vs "Polling"
    markAsRead,
    dismissNotification,
  };
}
```

### Status Indicator for Users (Optional)

```typescript
// Show connection status in header
const getStatusIcon = (transport: string) => {
  switch (transport) {
    case 'websocket': return '🟢 Real-time';
    case 'sse': return '🟡 Streaming';
    case 'polling': return '🔵 Polling';
    default: return '⚪ Disconnected';
  }
};
```

---

## 4. Architecture Decision Tree

```
╔════════════════════════════════════════════════════════════════╗
║ Choosing the Right Transport Layer for Your Use Case           ║
╚════════════════════════════════════════════════════════════════╝

1. Do you need real-time (<1 second) delivery?
   ├─ YES: Use WebSocket or SSE
   │  │
   │  └─ Do you already use Supabase?
   │     ├─ YES: Use Supabase Realtime (WebSocket)
   │     └─ NO: Set up custom WebSocket server or use SSE
   │
   └─ NO: Check frequency
      │
      └─ Less than 1/hour?
         ├─ YES: Use polling (simpler)
         └─ NO: Use SSE or WebSocket

2. How many concurrent connections?
   ├─ <100: Any option works
   ├─ 100-1000: WebSocket or SSE preferred
   └─ >1000: WebSocket required (less server resource/connection)

3. Network reliability?
   ├─ High (office): WebSocket first choice
   ├─ Medium (mobile): SSE with fallback
   └─ Low: Polling with exponential backoff

4. Complexity tolerance?
   ├─ Low: Use polling
   ├─ Medium: Use SSE
   └─ High: Use WebSocket

FINAL RECOMMENDATION FOR RALPH'S CIVIC NOTICES:
┌──────────────────────────────────────────────────┐
│ Primary: Supabase Realtime (WebSocket)          │
│ Fallback: SSE (30-second heartbeat)             │
│ Last Resort: HTTP Polling (30-second interval)  │
│                                                   │
│ Rationale:                                       │
│ - Already using Supabase                        │
│ - Admin panel (not mobile)                      │
│ - Corporate networks (need fallbacks)           │
│ - <50 admins (low scale complexity)             │
└──────────────────────────────────────────────────┘
```

---

## 5. Performance Comparison at Scale

### For 10 Active Admins

| Metric | WebSocket | SSE | Polling (30s) |
|--------|-----------|-----|---------------|
| **Server Connections** | 10 | 10 | 0 (stateless) |
| **Server Memory** | 50KB | 50KB | ~1KB |
| **Network Traffic** | 1KB/min | 1KB/min | 5KB/min |
| **Latency** | 100ms | 200ms | 30s |
| **CPU Usage** | Low | Low | Low |

### For 100 Active Admins

| Metric | WebSocket | SSE | Polling (30s) |
|--------|-----------|-----|---------------|
| **Server Connections** | 100 | 100 | 0 |
| **Server Memory** | 500KB | 500KB | ~10KB |
| **Network Traffic** | 10KB/min | 10KB/min | 50KB/min |
| **Latency** | 100ms | 200ms | 30s |
| **CPU Usage** | Low | Low | Medium |

### For 1000 Active Admins

| Metric | WebSocket | SSE | Polling (30s) |
|--------|-----------|-----|---------------|
| **Server Connections** | 1000 | 1000 | 0 |
| **Server Memory** | 5MB | 5MB | ~100KB |
| **Network Traffic** | 100KB/min | 100KB/min | 500KB/min |
| **Latency** | 100ms | 200ms | 30s |
| **CPU Usage** | Medium | Medium | High |
| **Recommendation** | Use WSS + CDN | Consider SSE | Not suitable |

---

## 6. Migration Path (Incremental Adoption)

### Phase 1: Foundation (Weeks 1-2)
```
Implement: HTTP Polling
├─ Simple to build
├─ Works everywhere
├─ Good baseline for testing
└─ Easy to migrate from later
```

### Phase 2: Real-Time Ready (Weeks 3-4)
```
Add: SSE Fallback
├─ Better latency (200ms vs 30s)
├─ Still simple
├─ Transparent to UI layer
└─ Tests framework for push
```

### Phase 3: Full Real-Time (Weeks 5-6)
```
Add: Supabase Realtime (WebSocket)
├─ Production-grade
├─ Built-in auth & security
├─ Fully tested fallback chain
└─ Ready for scale
```

### Benefits of Incremental Approach
1. **Risk reduction**: Start simple, add complexity gradually
2. **Testing**: Each layer tested independently
3. **Learning**: Team understands each layer
4. **Rollback**: Can disable WebSocket, fall back to SSE/polling
5. **Cost**: Don't over-engineer initially

---

## References

- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Server-Sent Events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [WebSocket API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [HTTP Long Polling](https://tools.ietf.org/html/draft-loreto-http-subscribe-04)

