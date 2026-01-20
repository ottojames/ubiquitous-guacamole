# Real-Time Notification System for Admin Panels
## Comprehensive Research & Implementation Guide

**Date**: January 2025  
**Focus**: Architecture, patterns, and React implementation for Ralph's Civic Notices admin panel

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Notification Architecture Patterns](#notification-architecture-patterns)
3. [Real-Time Implementation (WebSockets/SSE)](#real-time-implementation)
4. [Database Persistence & Read Status](#database-persistence)
5. [UI Components & Patterns](#ui-components--patterns)
6. [Email/SMS Integration](#emailsms-integration)
7. [Security Considerations](#security-considerations)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Code Examples](#code-examples)

---

## Architecture Overview

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                      Admin Panel UI (React)                      │
├─────────────────────────────────────────────────────────────────┤
│  Bell Icon (Badge)  │ Toast Layer  │ Notification Dropdown      │
└─────────────────────────────────────────────────────────────────┘
              │
              ↓ (Real-time subscriptions + polling fallback)
┌─────────────────────────────────────────────────────────────────┐
│         Real-Time Transport Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  WebSocket (Primary) │ SSE (Fallback) │ Polling (Fallback)      │
└─────────────────────────────────────────────────────────────────┘
              │
              ↓ (via Supabase Realtime or custom WebSocket)
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Services                              │
├─────────────────────────────────────────────────────────────────┤
│  Notification Queue  │ Channel Processor │ Delivery Service      │
└─────────────────────────────────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Persistence Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL         │ Notification Table │ Audit Trail           │
└─────────────────────────────────────────────────────────────────┘
              │
              ↓ (External integrations)
┌─────────────────────────────────────────────────────────────────┐
│              External Notification Channels                      │
├─────────────────────────────────────────────────────────────────┤
│  Email (Resend)  │ SMS (Twilio)  │ Push (OneSignal)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Notification Architecture Patterns

### 1. Push vs Pull Architecture

#### **Push Architecture (Primary)**
- **Definition**: Server proactively sends notifications to clients
- **Transport**: WebSocket, SSE, or web push
- **Latency**: ~100ms-1s
- **Server Load**: Moderate (maintains connections)
- **Best For**: Real-time critical alerts, activity feeds

**Pros:**
- Real-time delivery with minimal delay
- Great user experience for time-sensitive notifications
- Efficient for high-frequency notifications

**Cons:**
- Requires persistent connection management
- Higher server resource usage
- Harder to scale globally

#### **Pull Architecture (Secondary/Fallback)**
- **Definition**: Client requests notifications from server
- **Transport**: HTTP polling
- **Latency**: 5s-60s (configurable)
- **Server Load**: Minimal
- **Best For**: Low-priority background notifications

**Pros:**
- Simple to implement
- No connection management needed
- Scalable to many clients

**Cons:**
- Higher latency
- Network overhead with frequent polling
- Poor user experience for urgent alerts

#### **Hybrid Approach (Recommended)**
```
┌─────────────────────┐
│   Client Opens      │
│  Admin Panel        │
└──────────┬──────────┘
           │
           ├─→ Try WebSocket Connection (Supabase Realtime)
           │   │
           │   ├─→ Success: Subscribe to real-time events
           │   │
           │   └─→ Fail: Fallback to SSE
           │       │
           │       ├─→ Success: Stream events via Server-Sent Events
           │       │
           │       └─→ Fail: Fallback to HTTP Polling (5-30s interval)
           │
           └─→ Always fetch initial notifications on mount
```

---

## Real-Time Implementation

### 2.1 WebSocket Approach with Supabase Realtime

**Recommended for Ralph's Civic Notices** (already using Supabase)

#### Advantages:
- Native Supabase integration
- No additional WebSocket server needed
- Built-in auth & security
- RLS support for permissions

#### Implementation Pattern:

```typescript
// types/notifications.ts
export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';
export type NotificationType = 
  | 'org_approved'
  | 'org_rejected'
  | 'notice_flagged'
  | 'user_invited'
  | 'payment_received'
  | 'moderation_alert';

export interface Notification {
  id: string;
  admin_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  action_url?: string;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  read_at?: string;
  dismissed_at?: string;
  metadata: Record<string, any>;
  channels: NotificationChannel[];
}

export interface AdminNotificationPreference {
  admin_id: string;
  channels: Partial<Record<NotificationChannel, boolean>>;
  priority_threshold: NotificationPriority;
  quiet_hours_start?: string; // HH:MM format
  quiet_hours_end?: string;
  created_at: string;
  updated_at: string;
}
```

#### Database Schema (SQL):

```sql
-- Notifications table
CREATE TABLE admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('org_approved', 'org_rejected', 'notice_flagged', 'user_invited', 'payment_received', 'moderation_alert')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  channels TEXT[] DEFAULT ARRAY['in_app'],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_admin_notifications_admin_id_created_at 
  ON admin_notifications(admin_id, created_at DESC);
CREATE INDEX idx_admin_notifications_admin_id_is_read 
  ON admin_notifications(admin_id, is_read) WHERE NOT is_read;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;

-- Notification preferences table
CREATE TABLE admin_notification_preferences (
  admin_id UUID PRIMARY KEY REFERENCES admin_users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  priority_threshold TEXT DEFAULT 'medium' CHECK (priority_threshold IN ('low', 'medium', 'high', 'critical')),
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  digest_frequency TEXT DEFAULT 'instant' CHECK (digest_frequency IN ('instant', 'hourly', 'daily')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Audit trail for all notifications sent
CREATE TABLE admin_notification_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES admin_notifications(id),
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'sms', 'push')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivery_status TEXT CHECK (delivery_status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message TEXT,
  external_id VARCHAR(255), -- Reference from Resend/Twilio/etc
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notification_audit_notification_id 
  ON admin_notification_audit(notification_id);
```

#### RLS Policies:

```sql
-- Admins can only see their own notifications
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_see_own_notifications"
  ON admin_notifications
  FOR SELECT
  USING (admin_id = auth.uid());

CREATE POLICY "admins_update_own_notifications"
  ON admin_notifications
  FOR UPDATE
  USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

-- Preferences
ALTER TABLE admin_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_own_preferences"
  ON admin_notification_preferences
  FOR ALL
  USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());
```

#### React Hook for Real-Time Subscriptions:

```typescript
// hooks/useNotifications.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/realtime-js';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/types/notifications';

interface UseNotificationsOptions {
  enabled?: boolean;
  pollingInterval?: number; // fallback polling in ms
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { enabled = true, pollingInterval = 30000 } = options;
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (err) throw err;
      
      setNotifications(data || []);
      const unread = (data || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel('admin_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          if (!newNotification.is_read) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications(prev =>
            prev.map(n => (n.id === updated.id ? updated : n))
          );
          
          // Update unread count if read status changed
          const oldNotif = notifications.find(n => n.id === updated.id);
          if (oldNotif && oldNotif.is_read !== updated.is_read) {
            setUnreadCount(prev => prev + (updated.is_read ? -1 : 1));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Real-time notifications subscribed');
        } else if (status === 'CLOSED') {
          // Fallback to polling
          pollingRef.current = setInterval(fetchNotifications, pollingInterval);
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [enabled, fetchNotifications, pollingInterval]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    const { error: err } = await supabase
      .from('admin_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (err) {
      setError(err);
      return false;
    }
    return true;
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback(async (notificationId: string) => {
    const { error: err } = await supabase
      .from('admin_notifications')
      .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (err) {
      setError(err);
      return false;
    }
    return true;
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications
      .filter(n => !n.is_read)
      .map(n => n.id);

    if (unreadIds.length === 0) return true;

    const { error: err } = await supabase
      .from('admin_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', unreadIds);

    if (err) {
      setError(err);
      return false;
    }
    return true;
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    dismissNotification,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
```

### 2.2 Server-Sent Events (SSE) Fallback

**Better than polling for most cases, simpler than WebSocket**

```typescript
// server/routes/notifications.ts (Express)
import { Router, Response } from 'express';

const router = Router();

// Store active SSE clients
const sseClients = new Map<string, Response>();

// SSE endpoint for notifications
router.get('/notifications/stream', (req, res) => {
  const adminId = req.user?.id;
  if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Store client
  sseClients.set(adminId, res);

  // Send initial connection message
  res.write(': SSE connection established\n\n');

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(adminId);
  });
});

// Broadcast notification to admin
export function broadcastNotification(adminId: string, notification: Notification) {
  const client = sseClients.get(adminId);
  if (client) {
    client.write(`data: ${JSON.stringify(notification)}\n\n`);
  }
}

export default router;
```

#### Client-side SSE Implementation:

```typescript
// hooks/useNotificationsSSE.ts
import { useEffect, useState } from 'react';

export function useNotificationsSSE() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const eventSource = new EventSource('/api/notifications/stream');

    eventSource.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        setNotifications(prev => [notification, ...prev]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Parse error'));
      }
    };

    eventSource.onerror = () => {
      setError(new Error('SSE connection failed'));
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  return { notifications, error };
}
```

---

## Database Persistence

### 3.1 Notification Storage Pattern

#### Core Strategy:
- **In-App Notifications**: Persistent database (keep indefinitely, allow archiving)
- **Email/SMS**: Log delivery status for auditing
- **Read Status**: Track read_at timestamp for analytics
- **Soft Deletes**: Use `is_dismissed` flag rather than hard deletes

#### Database Queries:

```typescript
// lib/notificationService.ts
import { supabase } from './supabase';
import { Notification } from '@/types/notifications';

export const NotificationService = {
  // Create notification (internal - called by triggers/functions)
  async create(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('admin_notifications')
      .insert([notification])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get unread count for badge
  async getUnreadCount(adminId: string): Promise<number> {
    const { count, error } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('admin_id', adminId)
      .eq('is_read', false)
      .eq('is_dismissed', false);

    if (error) throw error;
    return count || 0;
  },

  // Get paginated notifications
  async getNotifications(
    adminId: string,
    {
      limit = 20,
      offset = 0,
      onlyUnread = false,
      types = null as string[] | null,
    } = {}
  ) {
    let query = supabase
      .from('admin_notifications')
      .select('*')
      .eq('admin_id', adminId)
      .eq('is_dismissed', false);

    if (onlyUnread) {
      query = query.eq('is_read', false);
    }

    if (types && types.length > 0) {
      query = query.in('type', types);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { notifications: data || [], total: count || 0 };
  },

  // Mark as read
  async markAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('admin_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mark all as read
  async markAllAsRead(adminId: string) {
    const { error } = await supabase
      .from('admin_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('admin_id', adminId)
      .eq('is_read', false);

    if (error) throw error;
  },

  // Dismiss notification
  async dismiss(notificationId: string) {
    const { data, error } = await supabase
      .from('admin_notifications')
      .update({
        is_dismissed: true,
        dismissed_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Batch dismiss old notifications (cleanup job)
  async archiveOldNotifications(adminId: string, daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_dismissed: true })
      .eq('admin_id', adminId)
      .lt('created_at', cutoffDate.toISOString())
      .eq('is_dismissed', false);

    if (error) throw error;
  },

  // Query by type with read status
  async getNotificationsByType(
    adminId: string,
    type: string
  ): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('admin_id', adminId)
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
```

### 3.2 Read Status Analytics

```typescript
// Query: Get notification read rates
const getNotificationAnalytics = async (adminId: string) => {
  const { data } = await supabase
    .from('admin_notifications')
    .select('is_read, type, created_at')
    .eq('admin_id', adminId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const total = data?.length || 0;
  const read = data?.filter(n => n.is_read).length || 0;
  const readRate = total > 0 ? (read / total * 100).toFixed(2) : 0;

  const byType = data?.reduce((acc: any, n: any) => {
    if (!acc[n.type]) acc[n.type] = { total: 0, read: 0 };
    acc[n.type].total++;
    if (n.is_read) acc[n.type].read++;
    return acc;
  }, {});

  return {
    total,
    read,
    readRate,
    byType,
  };
};
```

---

## UI Components & Patterns

### 4.1 Bell Icon with Badge

```typescript
// components/admin/NotificationBell.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, dismissNotification, markAllAsRead } =
    useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
        aria-label="Notifications"
        aria-expanded={open}
      >
        {/* Bell SVG */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full"
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onDismiss={dismissNotification}
          onMarkAllAsRead={markAllAsRead}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
```

### 4.2 Notification Dropdown Component

```typescript
// components/admin/NotificationDropdown.tsx
import React, { useState } from 'react';
import { Notification } from '@/types/notifications';
import { NotificationItem } from './NotificationItem';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => Promise<boolean>;
  onDismiss: (id: string) => Promise<boolean>;
  onMarkAllAsRead: () => Promise<boolean>;
  onClose: () => void;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAsRead,
  onDismiss,
  onMarkAllAsRead,
  onClose,
}: NotificationDropdownProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = activeFilter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b border-gray-100 flex gap-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`text-xs px-3 py-1 rounded-full transition ${
            activeFilter === 'all'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveFilter('unread')}
          className={`text-xs px-3 py-1 rounded-full transition ${
            activeFilter === 'unread'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            No notifications {activeFilter === 'unread' ? 'to show' : 'yet'}
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onDismiss={onDismiss}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 text-center">
          <a
            href="/admin/notifications"
            onClick={onClose}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            View all notifications
          </a>
        </div>
      )}
    </div>
  );
}
```

### 4.3 Individual Notification Item

```typescript
// components/admin/NotificationItem.tsx
import React from 'react';
import { Notification } from '@/types/notifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => Promise<boolean>;
  onDismiss: (id: string) => Promise<boolean>;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDismiss,
}: NotificationItemProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'high':
        return 'bg-orange-50 border-l-4 border-orange-500';
      case 'medium':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      default:
        return 'bg-blue-50 border-l-4 border-blue-500';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'org_approved':
        return '✓';
      case 'org_rejected':
        return '✗';
      case 'notice_flagged':
        return '⚠';
      case 'moderation_alert':
        return '🛡️';
      default:
        return 'ℹ';
    }
  };

  const handleMarkAsRead = async () => {
    if (!notification.is_read) {
      await onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      className={`px-4 py-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition ${
        getPriorityColor(notification.priority)
      }`}
      onClick={handleMarkAsRead}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className="text-lg mt-1 flex-shrink-0">{getIcon(notification.type)}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`text-sm font-medium ${
                notification.is_read ? 'text-gray-700' : 'text-gray-900'
              }`}
            >
              {notification.title}
            </p>
            {!notification.is_read && (
              <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
            )}
          </div>

          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
              })}
            </span>

            {notification.action_url && (
              <a
                href={notification.action_url}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                View
              </a>
            )}
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={async (e) => {
            e.stopPropagation();
            await onDismiss(notification.id);
          }}
          className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
```

### 4.4 Toast Notifications vs Dropdown Decision Matrix

| Feature | Toast | Dropdown |
|---------|-------|----------|
| **Auto-dismiss** | Yes (5-8s) | No |
| **Interactive** | Limited | Full |
| **Persistent** | No | Yes |
| **Actions** | Small buttons | Links, buttons |
| **Use Case** | Quick confirmations | Important alerts |
| **Best For** | "Notice published" | "Org pending approval" |
| **Stacking** | Yes | Single |

**Recommended Hybrid Approach:**
- **Toast**: Action confirmations ("✓ Notification marked as read")
- **Dropdown**: Active alerts, pending items
- **Separate Page**: Historical view, search, export

---

## Email/SMS Integration

### 5.1 Multi-Channel Notification Strategy

```typescript
// types/channelStrategy.ts
export interface ChannelStrategy {
  in_app: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
}

export const NOTIFICATION_CHANNELS: Record<string, ChannelStrategy> = {
  org_approved: {
    in_app: true,
    email: true,
    sms: false,
    push: false,
  },
  org_rejected: {
    in_app: true,
    email: true,
    sms: true, // Critical - send SMS too
    push: false,
  },
  notice_flagged: {
    in_app: true,
    email: true,
    sms: false,
    push: true,
  },
  moderation_alert: {
    in_app: true,
    email: false, // Digest only
    sms: false,
    push: false,
  },
  user_invited: {
    in_app: true,
    email: true,
    sms: false,
    push: false,
  },
};
```

### 5.2 Supabase Edge Function for Sending Emails

```typescript
// supabase/functions/send-notification/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const resendApiKey = Deno.env.get('RESEND_API_KEY');

const supabase = createClient(supabaseUrl!, supabaseKey!);

interface NotificationPayload {
  notification_id: string;
  admin_id: string;
  type: string;
  title: string;
  message: string;
  email?: string;
  phone?: string;
  channels: string[];
}

serve(async (req: Request) => {
  try {
    const payload: NotificationPayload = await req.json();
    
    // Get admin email if not provided
    let adminEmail = payload.email;
    if (!adminEmail) {
      const { data: admin } = await supabase
        .from('admin_users')
        .select('email')
        .eq('id', payload.admin_id)
        .single();
      adminEmail = admin?.email;
    }

    // Send email
    if (payload.channels.includes('email') && adminEmail) {
      const emailResponse = await sendEmail({
        to: adminEmail,
        subject: payload.title,
        html: generateEmailTemplate(payload),
      });

      // Log delivery
      await supabase.from('admin_notification_audit').insert({
        notification_id: payload.notification_id,
        channel: 'email',
        delivery_status: emailResponse.ok ? 'sent' : 'failed',
        external_id: emailResponse.id,
        error_message: emailResponse.error,
      });
    }

    // Send SMS (if critical)
    if (payload.channels.includes('sms') && payload.phone) {
      const smsResponse = await sendSMS({
        to: payload.phone,
        message: `${payload.title}: ${payload.message}`,
      });

      await supabase.from('admin_notification_audit').insert({
        notification_id: payload.notification_id,
        channel: 'sms',
        delivery_status: smsResponse.ok ? 'sent' : 'failed',
        external_id: smsResponse.id,
        error_message: smsResponse.error,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function sendEmail(
  { to, subject, html }: { to: string; subject: string; html: string }
) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Ralph\'s Civic Notices <no-reply@notices.example>',
      to,
      subject,
      html,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    return { ok: true, id: data.id };
  } else {
    const error = await response.text();
    return { ok: false, id: null, error };
  }
}

async function sendSMS(
  { to, message }: { to: string; message: string }
) {
  // Implementation with Twilio
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: twilioPhoneNumber!,
        Body: message,
      }),
    }
  );

  if (response.ok) {
    const data = await response.json();
    return { ok: true, id: data.sid };
  } else {
    const error = await response.text();
    return { ok: false, id: null, error };
  }
}

function generateEmailTemplate(payload: NotificationPayload): string {
  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #000; margin-bottom: 16px;">${payload.title}</h2>
      <p style="line-height: 1.6; color: #666; margin-bottom: 16px;">${payload.message}</p>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
        <p>Ralph's Civic Notices Admin Portal</p>
      </div>
    </div>
  `;
}
```

### 5.3 Database Trigger for Notifications

```sql
-- Trigger to send notifications when org is approved
CREATE OR REPLACE FUNCTION notify_org_approved()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- If status changed to 'active' (approved)
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    -- Get the admin who created the org
    SELECT user_id INTO admin_user_id 
    FROM organization_members 
    WHERE organization_id = NEW.id 
    AND role = 'admin' 
    LIMIT 1;

    -- Create in-app notification
    INSERT INTO admin_notifications (
      admin_id, 
      type, 
      priority, 
      title, 
      message, 
      action_url, 
      metadata, 
      channels
    ) VALUES (
      admin_user_id,
      'org_approved',
      'high',
      'Organization Approved',
      NEW.name || ' has been approved and is now active on the platform.',
      '/admin/organizations/' || NEW.id,
      jsonb_build_object('org_id', NEW.id, 'org_name', NEW.name),
      ARRAY['in_app', 'email']
    );

    -- Trigger email notification via Edge Function
    PERFORM pg_net.http_post(
      url := 'https://' || current_setting('app.supabase_url') || '/functions/v1/send-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_key')
      ),
      body := jsonb_build_object(
        'notification_id', (SELECT id FROM admin_notifications ORDER BY created_at DESC LIMIT 1),
        'admin_id', admin_user_id,
        'type', 'org_approved',
        'title', 'Organization Approved',
        'message', NEW.name || ' has been approved',
        'channels', ARRAY['email']
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_approval_trigger
AFTER UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION notify_org_approved();
```

---

## Security Considerations

### 6.1 Authentication & Authorization

```typescript
// middleware/notificationAuth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyAdminToken } from './adminAuth';

export async function requireNotificationAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const admin = await verifyAdminToken(req);
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify admin can access requested notifications
    const notificationId = req.params.id;
    if (notificationId) {
      const { data: notification } = await supabase
        .from('admin_notifications')
        .select('admin_id')
        .eq('id', notificationId)
        .single();

      if (!notification || notification.admin_id !== admin.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    req.admin = admin;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
}
```

### 6.2 RLS Policies (Already Defined Above)

- Admins can only access their own notifications
- Cannot view other admins' notifications
- Cannot modify notifications they don't own

### 6.3 Rate Limiting

```typescript
// middleware/notificationRateLimit.ts
import rateLimit from 'express-rate-limit';

export const notificationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  keyGenerator: (req) => req.admin?.id || 'unknown',
  skip: (req) => !req.admin,
});

export const sseStreamLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 100, // 100 concurrent streams
  keyGenerator: (req) => req.admin?.id || 'unknown',
  skip: (req) => !req.admin,
});
```

### 6.4 Data Encryption for Sensitive Metadata

```sql
-- Add encryption for notification metadata containing sensitive info
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE admin_notifications 
ADD COLUMN metadata_encrypted BYTEA;

-- Function to encrypt sensitive fields
CREATE OR REPLACE FUNCTION encrypt_sensitive_notification_data()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.metadata ? 'sensitive_data' THEN
    NEW.metadata_encrypted := encrypt(
      convert_to(NEW.metadata::text, 'UTF8'),
      convert_to(current_setting('app.encryption_key'), 'UTF8'),
      'aes'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Create notification tables with RLS policies
- [ ] Set up Supabase Realtime publication
- [ ] Implement `useNotifications` hook with fallbacks
- [ ] Create bell icon + basic dropdown UI
- [ ] Add notification dismissal & read status

### Phase 2: Multi-Channel (Week 3-4)
- [ ] Set up Resend API integration
- [ ] Create email notification templates
- [ ] Implement Edge Functions for email delivery
- [ ] Add admin notification preferences UI
- [ ] Set up audit logging for delivery status

### Phase 3: Triggers & Automation (Week 4-5)
- [ ] Create database triggers for common events:
  - Organization approved/rejected
  - Notice flagged
  - User invited
  - Payment received
- [ ] Implement notification generation service
- [ ] Test end-to-end flows

### Phase 4: Advanced Features (Week 6-7)
- [ ] SMS integration with Twilio (critical alerts only)
- [ ] Notification digests (hourly/daily)
- [ ] Quiet hours support
- [ ] Notification templates & customization
- [ ] Analytics dashboard

### Phase 5: Polish & Optimization (Week 8)
- [ ] Performance testing (1000+ concurrent connections)
- [ ] Mobile responsiveness
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Documentation & runbook
- [ ] Team training

---

## Code Examples

### 6.1 Complete Admin Notifications Page

```typescript
// pages/admin/NotificationsPage.tsx
import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationService } from '@/lib/notificationService';
import { Pagination } from '@/components/ui/Pagination';

export function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    dismissNotification,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const filteredNotifications = notifications
    .filter(n => filter === 'all' ? !n.is_dismissed : !n.is_read && !n.is_dismissed)
    .filter(n => typeFilter === '' || n.type === typeFilter);

  const paginatedNotifications = filteredNotifications.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  if (loading) {
    return <div className="p-8 text-center">Loading notifications...</div>;
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <div className="flex gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {unreadCount} unread
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as 'all' | 'unread');
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Notifications</option>
          <option value="unread">Unread Only</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">All Types</option>
          <option value="org_approved">Organization Approved</option>
          <option value="org_rejected">Organization Rejected</option>
          <option value="notice_flagged">Notice Flagged</option>
          <option value="moderation_alert">Moderation Alert</option>
        </select>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {paginatedNotifications.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No notifications to show</p>
          </div>
        ) : (
          paginatedNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onDismiss={dismissNotification}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredNotifications.length > itemsPerPage && (
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(filteredNotifications.length / itemsPerPage)}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

function NotificationCard({ notification, onMarkAsRead, onDismiss }: any) {
  return (
    <div
      className={`p-4 border rounded-lg transition ${
        notification.is_read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-300'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
          <p className="text-gray-600 mt-1">{notification.message}</p>
          {notification.action_url && (
            <a
              href={notification.action_url}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
            >
              View Details →
            </a>
          )}
          <p className="text-xs text-gray-500 mt-2">
            {new Date(notification.created_at).toLocaleString()}
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {!notification.is_read && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Mark Read
            </button>
          )}
          <button
            onClick={() => onDismiss(notification.id)}
            className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 6.2 Setting Up Notification Preferences

```typescript
// pages/admin/SettingsNotificationsTab.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function SettingsNotificationsTab() {
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    sms_enabled: false,
    in_app_enabled: true,
    push_enabled: false,
    priority_threshold: 'low',
    quiet_hours_start: null as string | null,
    quiet_hours_end: null as string | null,
    digest_frequency: 'instant',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('admin_notification_preferences')
      .select('*')
      .eq('admin_id', user.id)
      .single();

    if (data) {
      setPreferences(data);
    }
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('admin_notification_preferences')
        .upsert({
          admin_id: user.id,
          ...preferences,
        });

      if (error) throw error;
      alert('Preferences saved');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold mb-4">Notification Channels</h3>

        {/* In-App */}
        <label className="flex items-center gap-3 py-2">
          <input
            type="checkbox"
            checked={preferences.in_app_enabled}
            onChange={(e) =>
              setPreferences({ ...preferences, in_app_enabled: e.target.checked })
            }
            className="w-4 h-4"
          />
          <span>In-App Notifications (always enabled)</span>
        </label>

        {/* Email */}
        <label className="flex items-center gap-3 py-2">
          <input
            type="checkbox"
            checked={preferences.email_enabled}
            onChange={(e) =>
              setPreferences({ ...preferences, email_enabled: e.target.checked })
            }
            className="w-4 h-4"
          />
          <span>Email Notifications</span>
        </label>

        {/* SMS */}
        <label className="flex items-center gap-3 py-2">
          <input
            type="checkbox"
            checked={preferences.sms_enabled}
            onChange={(e) =>
              setPreferences({ ...preferences, sms_enabled: e.target.checked })
            }
            className="w-4 h-4"
          />
          <span>SMS Notifications (for critical alerts only)</span>
        </label>
      </div>

      {/* Quiet Hours */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Quiet Hours</h3>
        <p className="text-sm text-gray-600 mb-4">
          No notifications will be sent during these hours
        </p>

        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <input
              type="time"
              value={preferences.quiet_hours_start || ''}
              onChange={(e) =>
                setPreferences({ ...preferences, quiet_hours_start: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Time</label>
            <input
              type="time"
              value={preferences.quiet_hours_end || ''}
              onChange={(e) =>
                setPreferences({ ...preferences, quiet_hours_end: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Priority Threshold */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Alert Priority Threshold</h3>
        <select
          value={preferences.priority_threshold}
          onChange={(e) =>
            setPreferences({ ...preferences, priority_threshold: e.target.value })
          }
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="low">All Notifications</option>
          <option value="medium">Medium and Higher</option>
          <option value="high">High and Critical Only</option>
          <option value="critical">Critical Only</option>
        </select>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
}
```

---

## Summary Table: Architecture Decisions

| Component | Decision | Rationale |
|-----------|----------|-----------|
| **Real-Time Transport** | WebSocket (Supabase) + SSE fallback + Polling | Redundancy, existing Supabase integration |
| **Persistence** | PostgreSQL with RLS | Supabase native, strong security |
| **Read Status Tracking** | `is_read` + `read_at` timestamp | Analytics, recovery, UI state |
| **Email Service** | Resend API | Free tier, good DX, transactional-focused |
| **SMS Service** | Twilio | Critical alerts only, cost optimization |
| **UI Pattern** | Dropdown + Toast + Separate Page | Comprehensive coverage of use cases |
| **Badge Implementation** | Unread count in top-right | Standard, accessible, minimal overhead |
| **Archival Strategy** | Soft deletes + scheduled cleanup | Data recovery, audit trail preservation |
| **Rate Limiting** | Per-admin-ID + endpoint-specific | DDoS protection, fair usage |

---

## References & Further Reading

1. **Supabase Realtime**: https://supabase.com/docs/guides/realtime
2. **System Design**: https://www.systemdesignhandbook.com/guides/design-a-notification-system/
3. **Toast Best Practices**: https://blog.logrocket.com/ux-design/toast-notifications/
4. **Resend Email API**: https://resend.com/docs
5. **Edge Functions**: https://supabase.com/docs/guides/functions
6. **React Patterns**: https://react.dev/reference/react/useContext
7. **PostgreSQL Triggers**: https://www.postgresql.org/docs/current/plpgsql-trigger.html

