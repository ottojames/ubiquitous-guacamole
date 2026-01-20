# Error Handling & Recovery Patterns for Admin Operations

## Research Summary

This document provides comprehensive patterns for error handling and recovery in React + TypeScript admin applications, focusing on five critical areas:

1. Optimistic Updates with Rollback
2. Retry Logic for Failed Operations
3. Partial Failure Handling in Bulk Operations
4. Network Error Recovery
5. Conflict Resolution for Concurrent Edits

### Codebase Context

**Current Implementation Status:**
- Frontend: React 19.x with TypeScript + Vite
- Backend: Express.js (Node.js) with PostgreSQL via Supabase
- Auth: Unified authentication context with session management
- Error Handling: Sentry integration for error tracking
- State Management: React Context + custom hooks (no TanStack Query)

---

## 1. Optimistic Updates with Rollback Pattern

### Problem
User actions should feel instant, but network failures can result in stale UI state. Optimistic updates improve perceived performance but need safe rollback mechanisms.

### Current Implementation Example
**File:** `src/hooks/useAutoSave.ts`

The codebase already demonstrates version-based conflict detection:
```typescript
// Auto-save hook with version tracking
const versionRef = useRef<number>(1);

// Version conflict detection
if (response.status === 409) {
  const errorData = await response.json();
  throw new Error(`Version conflict: draft was modified elsewhere`);
}

// Update version after successful save
versionRef.current = savedDraft.version;
```

### Recommended Pattern: Optimistic Update Hook

```typescript
// src/hooks/useOptimisticUpdate.ts

interface OptimisticState<T> {
  data: T;
  isPending: boolean;
  error: Error | null;
}

interface UseOptimisticUpdateOptions<T> {
  initialData: T;
  updateFn: (data: T) => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error, rollbackData: T) => void;
  onSettled?: () => void;
}

export function useOptimisticUpdate<T>({
  initialData,
  updateFn,
  onSuccess,
  onError,
  onSettled,
}: UseOptimisticUpdateOptions<T>) {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isPending: false,
    error: null,
  });

  const prevDataRef = useRef<T>(initialData);
  const abortControllerRef = useRef<AbortController | null>(null);

  const update = useCallback(async (newData: T) => {
    // Store previous state for rollback
    prevDataRef.current = state.data;

    // Optimistically update UI
    setState({
      data: newData,
      isPending: true,
      error: null,
    });

    // Cancel previous request if still in flight
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await updateFn(newData);

      setState({
        data: result,
        isPending: false,
        error: null,
      });

      onSuccess?.(result);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Rollback on error
      setState({
        data: prevDataRef.current,
        isPending: false,
        error: err,
      });

      onError?.(err, prevDataRef.current);
    } finally {
      onSettled?.();
      abortControllerRef.current = null;
    }
  }, [state.data, updateFn, onSuccess, onError, onSettled]);

  return {
    ...state,
    update,
  };
}
```

### Usage in Admin Component

```typescript
function AdminAccountEditor({ accountId, initialData }: Props) {
  const { data, isPending, error, update } = useOptimisticUpdate({
    initialData,
    updateFn: async (updatedAccount) => {
      const res = await fetch(`/api/admin/accounts/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAccount),
      });
      
      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
      return res.json();
    },
    onError: (error, rollbackData) => {
      toast.error(`Update failed: ${error.message}`);
      // UI is already rolled back via state
    },
  });

  return (
    <>
      {error && <ErrorAlert error={error} />}
      <form>
        <input
          value={data.name}
          onChange={(e) => update({ ...data, name: e.target.value })}
          disabled={isPending}
        />
        {isPending && <Spinner />}
      </form>
    </>
  );
}
```

### Key Benefits
- Instant UI feedback (no loading delay)
- Automatic rollback on network errors
- Version tracking prevents conflicts
- User can immediately see if operation failed

### Limitations
- Works best for single-field updates
- Version conflicts still possible with concurrent edits
- Requires careful state synchronization

---

## 2. Retry Logic for Failed Operations

### Problem
Transient network failures shouldn't fail permanent operations. Exponential backoff prevents cascading failures.

### Current Implementation Example
**File:** `server/routes/admin/auth.ts`

The server already implements failed login attempt tracking:
```typescript
// After failed login
const newFailedAttempts = (adminUser.failed_login_attempts || 0) + 1;

// Lock account after 5 failed attempts
if (newFailedAttempts >= 5) {
  updateData.locked_until = new Date(Date.now() + 30 * 60000).toISOString();
}
```

### Recommended Pattern: Exponential Backoff Retry Hook

```typescript
// src/lib/retry.ts

export interface RetryConfig {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export interface RetryState {
  attempt: number;
  nextRetryIn: number | null;
  lastError: Error | null;
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  shouldRetry: (error: unknown) => {
    // Retry on network errors, 5xx, and timeouts
    if (error instanceof Error) {
      return error.message.includes('timeout') ||
             error.message.includes('network') ||
             error.message.includes('ECONNREFUSED');
    }
    return false;
  },
};

/**
 * Exponential backoff retry with jitter
 * Helps prevent thundering herd problem
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {},
): Promise<T> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= mergedConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const shouldRetry = mergedConfig.shouldRetry(error, attempt);
      if (!shouldRetry || attempt === mergedConfig.maxAttempts) {
        throw lastError;
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = Math.min(
        mergedConfig.initialDelayMs * Math.pow(mergedConfig.backoffMultiplier, attempt - 1),
        mergedConfig.maxDelayMs,
      );

      // Add random jitter (10-20% of delay)
      const jitter = exponentialDelay * (0.1 + Math.random() * 0.1);
      const delayMs = exponentialDelay + jitter;

      console.log(`Retry attempt ${attempt} after ${delayMs}ms: ${lastError.message}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

// React hook wrapper
export function useRetryable<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {},
) {
  const [state, setState] = useState<RetryState>({
    attempt: 0,
    nextRetryIn: null,
    lastError: null,
  });

  const execute = useCallback(async () => {
    try {
      return await retryWithBackoff(fn, config);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({
        attempt: config.maxAttempts || DEFAULT_CONFIG.maxAttempts,
        nextRetryIn: null,
        lastError: err,
      });
      throw err;
    }
  }, [fn, config]);

  return { ...state, execute };
}
```

### Usage in Admin Operations

```typescript
function AccountBulkActions({ accountIds }: Props) {
  const { execute: suspendAccounts, attempt, lastError } = useRetryable(
    async () => {
      const res = await fetch('/api/admin/accounts/suspend-bulk', {
        method: 'POST',
        body: JSON.stringify({ ids: accountIds }),
      });
      if (!res.ok) throw new Error(`Suspend failed: ${res.status}`);
      return res.json();
    },
    {
      maxAttempts: 3,
      initialDelayMs: 1000,
      shouldRetry: (error) => {
        // Don't retry validation errors (4xx)
        return !String(error).includes('422');
      },
    },
  );

  const handleSuspend = async () => {
    try {
      await suspendAccounts();
      toast.success('Accounts suspended');
    } catch (error) {
      toast.error(`Failed after ${attempt} attempts: ${lastError?.message}`);
    }
  };

  return <button onClick={handleSuspend}>Suspend Selected</button>;
}
```

### Server-Side Retry Pattern

```typescript
// server/middleware/retryable.ts

export function createRetryableRoute(
  handler: (req: Request, res: Response) => Promise<void>,
  config: RetryConfig = {},
) {
  return async (req: Request, res: Response) => {
    const { maxAttempts = 3, initialDelayMs = 1000 } = config;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await handler(req, res);
        return;
      } catch (error) {
        if (attempt === maxAttempts) {
          // Last attempt failed
          return res.status(500).json({
            error: 'Operation failed',
            attempts: attempt,
            lastError: error instanceof Error ? error.message : String(error),
          });
        }

        // Calculate backoff
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  };
}
```

### Key Benefits
- Automatic recovery from transient failures
- Exponential backoff prevents server overload
- Jitter prevents thundering herd
- Customizable retry conditions

### When to Use
- API calls to external services
- Database operations
- File uploads/downloads
- Long-running operations

---

## 3. Partial Failure in Bulk Operations

### Problem
Bulk operations (suspend 100 accounts) may partially fail. Need to track which items succeeded/failed.

### Recommended Pattern: Bulk Operation Handler

```typescript
// src/lib/bulkOperations.ts

export interface BulkOpResult<T> {
  succeeded: T[];
  failed: Array<{ item: T; error: string }>;
  skipped: T[];
}

export interface BulkOpOptions<T> {
  items: T[];
  operation: (item: T, signal: AbortSignal) => Promise<void>;
  onProgress?: (result: BulkOpResult<T>) => void;
  batchSize?: number;
  stopOnError?: boolean;
  timeoutMs?: number;
}

export async function executeBulkOperation<T>(
  options: BulkOpOptions<T>,
): Promise<BulkOpResult<T>> {
  const {
    items,
    operation,
    onProgress,
    batchSize = 10,
    stopOnError = false,
    timeoutMs = 30000,
  } = options;

  const result: BulkOpResult<T> = {
    succeeded: [],
    failed: [],
    skipped: [],
  };

  // Process in batches to avoid overwhelming server
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const promises = batch.map(async (item) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        await operation(item, controller.signal);
        result.succeeded.push(item);
      } catch (error) {
        if (stopOnError) {
          throw error;
        }

        result.failed.push({
          item,
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        clearTimeout(timeout);
      }
    });

    try {
      await Promise.all(promises);
    } catch (error) {
      // Mark remaining items as skipped
      result.skipped.push(...items.slice(i + batchSize));
      throw error;
    }

    onProgress?.(result);
  }

  return result;
}

// React hook
export function useBulkOperation<T>(
  operation: (item: T, signal: AbortSignal) => Promise<void>,
  options: Omit<BulkOpOptions<T>, 'items' | 'operation'> = {},
) {
  const [result, setResult] = useState<BulkOpResult<T> | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (items: T[]) => {
      setIsPending(true);
      setError(null);

      abortControllerRef.current = new AbortController();

      try {
        const res = await executeBulkOperation({
          items,
          operation,
          ...options,
          onProgress: (progress) => {
            setResult(progress);
            options.onProgress?.(progress);
          },
        });

        setResult(res);
        return res;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [operation, options],
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsPending(false);
  }, []);

  return { result, isPending, error, execute, cancel };
}
```

### Usage in Admin UI

```typescript
function BulkSuspendAccounts({ selectedIds }: Props) {
  const { result, isPending, error, execute, cancel } = useBulkOperation(
    async (accountId: string, signal: AbortSignal) => {
      const res = await fetch(`/api/admin/accounts/${accountId}/suspend`, {
        method: 'POST',
        signal,
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
    },
    { batchSize: 5 },
  );

  const handleBulkSuspend = async () => {
    try {
      await execute(selectedIds);
    } catch (err) {
      // Error is already in state
    }
  };

  return (
    <div>
      <button onClick={handleBulkSuspend} disabled={isPending}>
        Suspend {selectedIds.length} Accounts
      </button>

      {result && (
        <div className="mt-4 space-y-2">
          <div className="text-green-600">
            Succeeded: {result.succeeded.length}
          </div>
          {result.failed.length > 0 && (
            <div className="text-red-600">
              Failed: {result.failed.length}
              <ul className="mt-1 text-sm">
                {result.failed.map(({ item, error }) => (
                  <li key={item.id}>{item.name}: {error}</li>
                ))}
              </ul>
            </div>
          )}
          {result.skipped.length > 0 && (
            <div className="text-amber-600">
              Skipped: {result.skipped.length} (operation stopped)
            </div>
          )}
        </div>
      )}

      {isPending && (
        <button onClick={cancel}>Cancel Operation</button>
      )}
    </div>
  );
}
```

### Server-Side Bulk Handler

```typescript
// server/routes/admin/accounts.ts

router.post('/suspend-bulk', requireAdmin, async (req: Request, res: Response) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Invalid account IDs' });
  }

  const results = {
    succeeded: [] as string[],
    failed: [] as Array<{ id: string; error: string }>,
  };

  const supabase = getServiceSupabaseClient();

  for (const id of ids) {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ status: 'suspended' })
        .eq('id', id);

      if (error) throw error;

      results.succeeded.push(id);

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_admin_user_id: req.adminUser?.id,
        p_action: 'account.suspended',
        p_action_category: 'account_management',
        p_target_type: 'organization',
        p_target_id: id,
        p_severity: 'warning',
      });
    } catch (error) {
      results.failed.push({
        id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  res.json(results);
});
```

### Key Benefits
- Clear visibility of success/failure per item
- Continues processing remaining items
- Easy progress reporting
- Prevents cascading failures

---

## 4. Network Error Recovery

### Problem
Offline users, slow networks, and connection drops need graceful handling.

### Recommended Pattern: Network Resilience

```typescript
// src/lib/networkResilience.ts

export interface NetworkState {
  isOnline: boolean;
  latency: number;
  connectionType: string;
}

export function useNetworkResilience() {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: navigator.onLine,
    latency: 0,
    connectionType: (navigator as any).connection?.effectiveType || 'unknown',
  });

  useEffect(() => {
    const handleOnline = () => {
      setNetworkState((prev) => ({ ...prev, isOnline: true }));
      console.log('Network: back online');
    };

    const handleOffline = () => {
      setNetworkState((prev) => ({ ...prev, isOnline: false }));
      console.log('Network: went offline');
    };

    const handleConnectionChange = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        setNetworkState((prev) => ({
          ...prev,
          connectionType: connection.effectiveType,
          latency: connection.rtt || 0,
        }));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = (navigator as any).connection;
    connection?.addEventListener('change', handleConnectionChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      connection?.removeEventListener('change', handleConnectionChange);
    };
  }, []);

  return networkState;
}

// Request with network awareness
export async function fetchWithNetworkResilience<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const isSlowNetwork = (navigator as any).connection?.saveData;

  if (!navigator.onLine) {
    throw new Error('No internet connection');
  }

  // Set shorter timeout for slow networks
  const timeout = isSlowNetwork ? 30000 : 10000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### Network Status Banner

```typescript
// src/components/admin/NetworkStatus.tsx

export function NetworkStatus() {
  const { isOnline, connectionType } = useNetworkResilience();

  if (isOnline) {
    return (
      <div className="bg-green-50 text-green-800 px-4 py-2 text-sm">
        Online • {connectionType}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded shadow-lg">
      <div className="font-semibold">You're offline</div>
      <div className="text-sm mt-1">Check your connection and try again</div>
    </div>
  );
}
```

### Queue Failed Operations

```typescript
// src/lib/operationQueue.ts

export interface QueuedOperation {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  body?: unknown;
  createdAt: Date;
  retryCount: number;
}

export class OperationQueue {
  private queue: Map<string, QueuedOperation> = new Map();
  private isProcessing = false;

  async enqueue(
    method: string,
    url: string,
    body?: unknown,
  ): Promise<string> {
    const id = crypto.randomUUID();
    const operation: QueuedOperation = {
      id,
      method: method as any,
      url,
      body,
      createdAt: new Date(),
      retryCount: 0,
    };

    this.queue.set(id, operation);
    this.processQueue();

    return id;
  }

  private async processQueue() {
    if (this.isProcessing || !navigator.onLine) return;

    this.isProcessing = true;

    try {
      for (const [id, operation] of this.queue) {
        try {
          const response = await fetch(operation.url, {
            method: operation.method,
            body: operation.body ? JSON.stringify(operation.body) : undefined,
          });

          if (response.ok) {
            this.queue.delete(id);
          } else if (response.status >= 500 || response.status === 429) {
            // Retry on server errors
            operation.retryCount++;
            if (operation.retryCount > 3) {
              this.queue.delete(id);
            }
          } else {
            // Don't retry client errors
            this.queue.delete(id);
          }
        } catch (error) {
          operation.retryCount++;
          if (operation.retryCount > 3) {
            this.queue.delete(id);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  getQueuedCount(): number {
    return this.queue.size;
  }
}

export const operationQueue = new OperationQueue();
```

### Key Benefits
- Detects offline state automatically
- Queues operations when offline
- Retries when connection restored
- Adapts timeout based on connection quality

---

## 5. Conflict Resolution (Concurrent Edits)

### Problem
Multiple admins editing the same resource simultaneously can cause conflicts.

### Current Implementation
**File:** `server/routes/admin/auth.ts` & `src/hooks/useAutoSave.ts`

Already implements version-based conflict detection:
```typescript
// Version conflict handling
if (response.status === 409) {
  const errorData = await response.json();
  throw new Error(`Version conflict: current version: ${errorData.current_version}`);
}
```

### Recommended Pattern: Conflict Resolution Strategy

```typescript
// src/lib/conflictResolution.ts

export type ConflictResolutionStrategy = 'last-write-wins' | 'first-write-wins' | 'merge' | 'manual';

export interface ConflictInfo {
  field: string;
  serverValue: unknown;
  localValue: unknown;
  lastModifiedBy: string;
  lastModifiedAt: Date;
}

export async function detectConflict<T extends { version?: number }>(
  localData: T,
  serverVersion: number,
): Promise<ConflictInfo[] | null> {
  if (!localData.version || localData.version !== serverVersion - 1) {
    // Version mismatch indicates conflict
    return [];
  }
  return null;
}

// Manual conflict resolution UI
export function ConflictResolutionDialog({
  conflicts,
  onResolve,
  onCancel,
}: {
  conflicts: ConflictInfo[];
  onResolve: (resolution: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [resolution, setResolution] = useState<Record<string, unknown>>({});

  const handleResolve = () => {
    onResolve(resolution);
  };

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conflict Detected</DialogTitle>
          <DialogDescription>
            This resource was modified elsewhere. Choose which version to keep.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {conflicts.map(({ field, serverValue, localValue, lastModifiedBy, lastModifiedAt }) => (
            <div key={field} className="border rounded p-3">
              <label className="block font-semibold mb-2">{field}</label>

              <div className="space-y-2">
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    name={field}
                    value={JSON.stringify(serverValue)}
                    onChange={(e) =>
                      setResolution({
                        ...resolution,
                        [field]: serverValue,
                      })
                    }
                    checked={JSON.stringify(resolution[field]) === JSON.stringify(serverValue)}
                  />
                  <div>
                    <div className="font-medium">Server version</div>
                    <div className="text-sm text-gray-600">
                      {JSON.stringify(serverValue)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Modified by {lastModifiedBy} at {lastModifiedAt.toLocaleTimeString()}
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    name={field}
                    value={JSON.stringify(localValue)}
                    onChange={(e) =>
                      setResolution({
                        ...resolution,
                        [field]: localValue,
                      })
                    }
                    checked={JSON.stringify(resolution[field]) === JSON.stringify(localValue)}
                  />
                  <div>
                    <div className="font-medium">Your version</div>
                    <div className="text-sm text-gray-600">
                      {JSON.stringify(localValue)}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <button onClick={onCancel} variant="outline">
            Cancel
          </button>
          <button onClick={handleResolve} variant="default">
            Resolve Conflicts
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for handling conflicts
export function useConflictResolution<T extends { version?: number }>(
  strategy: ConflictResolutionStrategy = 'last-write-wins',
) {
  const [conflict, setConflict] = useState<ConflictInfo[] | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleConflict = useCallback(
    (conflicts: ConflictInfo[]) => {
      if (strategy === 'manual') {
        setConflict(conflicts);
        setShowDialog(true);
      }
    },
    [strategy],
  );

  const resolveConflict = useCallback(
    (resolution: Record<string, unknown>) => {
      setShowDialog(false);
      setConflict(null);
      return resolution;
    },
    [],
  );

  return { conflict, showDialog, handleConflict, resolveConflict };
}
```

### Server-Side Version Management

```typescript
// server/routes/admin/accounts.ts

router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, expectedVersion } = req.body;

  const supabase = getServiceSupabaseClient();

  try {
    // Get current version
    const { data: current, error: fetchError } = await supabase
      .from('organizations')
      .select('version, *')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Check version conflict
    if (current.version !== expectedVersion) {
      return res.status(409).json({
        error: 'Version conflict',
        current_version: current.version,
        server_data: current,
      });
    }

    // Update with new version
    const { data: updated, error: updateError } = await supabase
      .from('organizations')
      .update({
        ...data,
        version: current.version + 1,
        updated_at: new Date().toISOString(),
        updated_by: req.adminUser?.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log action
    await supabase.rpc('log_admin_action', {
      p_admin_user_id: req.adminUser?.id,
      p_action: 'account.updated',
      p_action_category: 'account_management',
      p_target_type: 'organization',
      p_target_id: id,
      p_old_values: current,
      p_new_values: updated,
    });

    res.json(updated);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Key Benefits
- Version tracking prevents silent overwrites
- Manual resolution for complex conflicts
- Audit trail of conflicting edits
- User awareness of concurrent modifications

---

## 6. React Error Boundaries for Admin Components

### Current Implementation
**File:** `src/components/dev/ErrorBoundary.tsx`

```typescript
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }
}
```

### Enhanced Admin Error Boundary

```typescript
// src/components/admin/AdminErrorBoundary.tsx

interface AdminErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, retry: () => void) => React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface AdminErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
  timestamp: Date | null;
}

export class AdminErrorBoundary extends React.Component<
  AdminErrorBoundaryProps,
  AdminErrorBoundaryState
> {
  constructor(props: AdminErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
      timestamp: null,
    };
  }

  static getDerivedStateFromError(error: unknown): Partial<AdminErrorBoundaryState> {
    return {
      hasError: true,
      error: error instanceof Error ? error : new Error(String(error)),
      timestamp: new Date(),
    };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    const newError = error instanceof Error ? error : new Error(String(error));

    this.setState((prev) => ({
      errorCount: prev.errorCount + 1,
    }));

    // Report to error tracking (Sentry)
    if (window.__SENTRY__) {
      window.__SENTRY__.captureException(newError, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        level: 'error',
      });
    }

    this.props.onError?.(newError, errorInfo);

    console.error('[AdminErrorBoundary] Error caught:', {
      error: newError,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Auto-reset after 30 seconds if single error
    if (this.state.errorCount <= 1) {
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 30000);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorCount: 0,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      const isCritical = this.state.errorCount > 3;

      return (
        <div className="min-h-screen bg-red-50 p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-red-500">
              <h1 className="text-2xl font-bold text-red-700 mb-4">
                Something went wrong
              </h1>

              <div className="bg-red-50 p-4 rounded mb-6 border border-red-200">
                <p className="text-sm font-mono text-red-900 break-words">
                  {this.state.error.message}
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-red-600 hover:text-red-700">
                      Stack trace
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto bg-white p-2 rounded border">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>

              {isCritical && (
                <div className="bg-amber-50 p-4 rounded mb-6 border border-amber-200">
                  <p className="text-sm text-amber-800">
                    This error occurred {this.state.errorCount} times. Please refresh the page
                    or contact support.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = '/admin/dashboard'}
                  className="w-full px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-6">
                Timestamp: {this.state.timestamp?.toISOString()}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Usage in Admin Layout

```typescript
// src/pages/admin/AdminLayout.tsx

export default function AdminLayout() {
  return (
    <AdminErrorBoundary
      onError={(error, errorInfo) => {
        // Send to error tracking
        console.error('Admin error:', error);
      }}
      fallback={(error, retry) => (
        <div className="p-8">
          <h2>Admin Panel Error</h2>
          <p>{error.message}</p>
          <button onClick={retry}>Retry</button>
        </div>
      )}
    >
      <div className="min-h-screen bg-gray-900">
        {/* ... admin content ... */}
      </div>
    </AdminErrorBoundary>
  );
}
```

### Key Benefits
- Isolates errors to specific admin sections
- Prevents cascading failures
- Provides recovery options
- Integrates with error tracking (Sentry)
- Better UX for admin users

---

## 7. User-Friendly Error Messages

### Problem
Technical error messages confuse users. Need contextual, actionable messages.

### Error Classification

```typescript
// src/lib/errors.ts

export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  CONFLICT = 'conflict',
  NOT_FOUND = 'not_found',
  SERVER_ERROR = 'server_error',
  UNKNOWN = 'unknown',
}

export interface AppError extends Error {
  category: ErrorCategory;
  code?: string;
  userMessage: string;
  statusCode?: number;
  details?: Record<string, unknown>;
  retryable: boolean;
}

export function classifyError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof TypeError) {
    return {
      name: error.name,
      message: error.message,
      category: ErrorCategory.NETWORK,
      userMessage: 'Network error. Please check your connection and try again.',
      retryable: true,
    };
  }

  if (error instanceof SyntaxError) {
    return {
      name: error.name,
      message: error.message,
      category: ErrorCategory.SERVER_ERROR,
      userMessage: 'Invalid response from server. Please try again.',
      retryable: true,
    };
  }

  // Handle fetch errors
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return {
        ...error,
        category: ErrorCategory.NETWORK,
        userMessage: 'Request took too long. Please try again.',
        retryable: true,
      };
    }

    if (error.message.includes('network') || error.message.includes('offline')) {
      return {
        ...error,
        category: ErrorCategory.NETWORK,
        userMessage: 'No internet connection. Please check your network.',
        retryable: true,
      };
    }
  }

  return {
    name: error instanceof Error ? error.name : 'UnknownError',
    message: error instanceof Error ? error.message : String(error),
    category: ErrorCategory.UNKNOWN,
    userMessage: 'Something unexpected happened. Please try again.',
    retryable: false,
  };
}

// Error mapping for specific API responses
export function mapApiErrorToUserMessage(status: number, body: unknown): string {
  switch (status) {
    case 400:
      return 'Please check your input and try again.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You don\'t have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This resource was modified elsewhere. Please refresh and try again.';
    case 422:
      return 'The data you provided is invalid. Please review and try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Our team has been notified. Please try again later.';
    case 503:
      return 'Service unavailable. We\'re performing maintenance. Please try again soon.';
    default:
      return 'An error occurred. Please try again.';
  }
}
```

### Error Display Components

```typescript
// src/components/admin/ErrorAlert.tsx

export function ErrorAlert({
  error,
  onRetry,
  onDismiss,
}: {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  const getCategoryIcon = (category: ErrorCategory) => {
    switch (category) {
      case ErrorCategory.NETWORK:
        return <WifiOff className="w-5 h-5" />;
      case ErrorCategory.AUTHENTICATION:
        return <Lock className="w-5 h-5" />;
      case ErrorCategory.AUTHORIZATION:
        return <Shield className="w-5 h-5" />;
      case ErrorCategory.CONFLICT:
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4">
      <div className="flex gap-3">
        <div className="text-red-500 mt-0.5">
          {getCategoryIcon(error.category)}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">Error</h3>
          <p className="text-red-800 text-sm mt-1">{error.userMessage}</p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-red-700 text-xs mt-2 font-mono">{error.message}</p>
          )}
        </div>
      </div>
      {(onRetry || onDismiss) && (
        <div className="flex gap-2 mt-4">
          {onRetry && error.retryable && (
            <button
              onClick={onRetry}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-3 py-1 text-sm text-red-700 hover:bg-red-100 rounded"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

### Hook for Error Handling

```typescript
// src/hooks/useErrorHandler.ts

export function useErrorHandler() {
  const [error, setError] = useState<AppError | null>(null);

  const handle = useCallback((err: unknown) => {
    const appError = classifyError(err);
    setError(appError);
    console.error('[Error Handler]', appError);
  }, []);

  const clear = useCallback(() => {
    setError(null);
  }, []);

  return { error, handle, clear };
}

// Usage
function AdminOperation() {
  const { error, handle, clear } = useErrorHandler();

  const performAction = async () => {
    try {
      await someOperation();
    } catch (err) {
      handle(err);
    }
  };

  return (
    <>
      {error && (
        <ErrorAlert
          error={error}
          onDismiss={clear}
          onRetry={error.retryable ? performAction : undefined}
        />
      )}
      <button onClick={performAction}>Perform Action</button>
    </>
  );
}
```

---

## Integration Checklist

- [ ] Implement `useOptimisticUpdate` hook for individual operations
- [ ] Add `retryWithBackoff` utility with exponential backoff
- [ ] Create `useBulkOperation` hook for batch processing
- [ ] Add `useNetworkResilience` hook for network state
- [ ] Implement `OperationQueue` for offline operation queueing
- [ ] Set up version-based conflict detection on server
- [ ] Create `AdminErrorBoundary` wrapper component
- [ ] Add error classification system with user messages
- [ ] Configure error display components
- [ ] Integrate Sentry for error tracking
- [ ] Add retry buttons to error states
- [ ] Test with throttled/offline network conditions

---

## Testing Strategies

### Simulate Network Conditions

```bash
# Chrome DevTools
- Network tab → Throttling dropdown
- Offline, Slow 3G, Fast 3G options

# Or programmatically in tests
fetch.mock({
  timeout: 3000,
  networkError: true,
});
```

### Test Error Boundaries

```typescript
test('ErrorBoundary catches errors', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

### Test Concurrent Edits

```typescript
test('Detects version conflicts', async () => {
  // Simulate two clients editing same resource
  const account = { id: '1', name: 'Test', version: 1 };

  // Client 1 updates
  const update1 = updateAccount('1', { ...account, name: 'Updated1', version: 1 });

  // Client 2 updates simultaneously
  const update2 = updateAccount('1', { ...account, name: 'Updated2', version: 1 });

  await expect(Promise.all([update1, update2])).rejects.toThrow('409');
});
```

---

## References

- Error Boundaries: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- Retry Patterns: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
- Conflict Resolution: https://crdt.tech/
- Network Resilience: https://web.dev/articles/web-vitals/
- Sentry Docs: https://docs.sentry.io/

