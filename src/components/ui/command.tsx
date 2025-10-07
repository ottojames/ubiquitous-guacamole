import * as React from 'react';
import { cn } from '@/lib/cn';

export const Command = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('overflow-hidden rounded-2xl border border-neutral-200 bg-white text-brand-navy shadow-lg', className)}
      {...props}
    />
  )
);
Command.displayName = 'Command';

export const CommandList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('max-h-64 overflow-y-auto py-1', className)} {...props} />
  )
);
CommandList.displayName = 'CommandList';

export const CommandEmpty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-4 py-3 text-sm text-neutral-500', className)} {...props} />
  )
);
CommandEmpty.displayName = 'CommandEmpty';

export const CommandGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-2 py-1 text-sm text-neutral-500', className)} {...props} />
  )
);
CommandGroup.displayName = 'CommandGroup';

export interface CommandItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const CommandItem = React.forwardRef<HTMLButtonElement, CommandItemProps>(
  ({ className, active, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      role="option"
      className={cn(
        'flex w-full items-center justify-start gap-2 rounded-xl px-3 py-2 text-left text-sm text-neutral-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        active ? 'bg-primary/10 text-brand-navy' : 'hover:bg-neutral-100',
        className
      )}
      {...props}
    />
  )
);
CommandItem.displayName = 'CommandItem';
