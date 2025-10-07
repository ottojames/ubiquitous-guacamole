import * as React from 'react';

type RequiredHintProps = React.HTMLAttributes<HTMLSpanElement> & {
  id?: string;
  children?: React.ReactNode;
};

export default function RequiredHint({ id, children = 'Required', className, ...rest }: RequiredHintProps) {
  const classes = ['text-xs font-medium text-red-600', className].filter(Boolean).join(' ');
  return (
    <span id={id} className={classes} {...rest}>
      {children}
    </span>
  );
}
