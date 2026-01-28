import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type PopoverContextValue = {
  open: boolean;
  setOpen: (next: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
};

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

function usePopoverContext() {
  const ctx = useContext(PopoverContext);
  if (!ctx) {
    throw new Error("Popover components must be used within <Popover>");
  }
  return ctx;
}

interface PopoverProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  className,
  children,
  ...rest
}: PopoverProps) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);

  const isControlled = openProp !== undefined;
  const open = isControlled ? Boolean(openProp) : uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
    },
    [isControlled, onOpenChange]
  );

  const value = useMemo<PopoverContextValue>(() => ({ open, setOpen, triggerRef, contentRef }), [open, setOpen]);

  return (
    <PopoverContext.Provider value={value}>
      <div className={cn("relative", className)} {...rest}>
        {children}
      </div>
    </PopoverContext.Provider>
  );
}

interface PopoverTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
  children: React.ReactElement;
}

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") {
        ref(node);
      } else {
        try {
          (ref as React.MutableRefObject<T | null>).current = node;
        } catch {
          /* noop */
        }
      }
    }
  };
}

export const PopoverTrigger = React.forwardRef<HTMLElement, PopoverTriggerProps>(
  ({ asChild = false, children, onClick, onKeyDown, ...rest }, ref) => {
    const { open, setOpen, triggerRef } = usePopoverContext();
    const child = React.isValidElement(children) ? children : <span>{children}</span>;
    const childRef = (child as unknown as { ref?: React.Ref<HTMLElement> }).ref;

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      child.props.onClick?.(event);
      if (!event.defaultPrevented) {
        onClick?.(event);
        if (!event.defaultPrevented) {
          setOpen(!open);
        }
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
      child.props.onKeyDown?.(event);
      if (!event.defaultPrevented) {
        onKeyDown?.(event);
        if (event.key === "Escape") {
          setOpen(false);
        }
      }
    };

    const mergedProps = {
      "aria-expanded": open,
      "aria-haspopup": "dialog" as const,
      ...rest,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      ref: mergeRefs(ref, triggerRef, childRef as React.Ref<HTMLElement> | undefined),
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(child, mergedProps);
    }

    return React.cloneElement(child, mergedProps);
  }
);
PopoverTrigger.displayName = "PopoverTrigger";

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ align = "center", sideOffset = 8, className, style, children, ...rest }, ref) => {
    const { open, setOpen, triggerRef, contentRef } = usePopoverContext();
    const mergedRef = mergeRefs<HTMLDivElement>(ref, contentRef);

    useEffect(() => {
      if (!open) return;

      const handlePointerDown = (event: Event) => {
        const target = event.target as Node;
        if (contentRef.current?.contains(target)) return;
        if (triggerRef.current?.contains(target)) return;
        setOpen(false);
      };

      const handleKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setOpen(false);
        }
      };

      document.addEventListener("mousedown", handlePointerDown);
      document.addEventListener("touchstart", handlePointerDown);
      document.addEventListener("keydown", handleKey);
      return () => {
        document.removeEventListener("mousedown", handlePointerDown);
        document.removeEventListener("touchstart", handlePointerDown);
        document.removeEventListener("keydown", handleKey);
      };
    }, [contentRef, open, setOpen, triggerRef]);

    if (!open) return null;

    const alignmentClass =
      align === "start"
        ? "left-0"
        : align === "end"
        ? "right-0"
        : "left-1/2 -translate-x-1/2";

    return (
      <div
        ref={mergedRef}
        role="dialog"
        aria-modal="false"
        className={cn(
          "absolute top-full z-[1100] mt-2 min-w-[12rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl",
          alignmentClass,
          className
        )}
        style={{ marginTop: sideOffset, ...style }}
        data-state={open ? "open" : "closed"}
        {...rest}
      >
        {children}
      </div>
    );
  }
);
PopoverContent.displayName = "PopoverContent";
