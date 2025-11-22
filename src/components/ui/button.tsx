import * as React from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const baseStyles =
  'inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60';

const variantStyles: Record<ButtonVariant, string> = {
  default: 'bg-primary text-white shadow-sm hover:bg-primary/90',
  secondary: 'bg-white text-brand-navy border border-neutral-200 hover:bg-neutral-50',
  outline: 'border border-neutral-200 text-brand-navy hover:bg-neutral-50',
  ghost: 'text-brand-navy hover:bg-neutral-100',
};

const sizeStyles: Record<ButtonSize, string> = {
  default: 'h-11 px-5',
  sm: 'h-9 px-3',
  lg: 'h-14 px-6',
  icon: 'h-11 w-11 p-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
