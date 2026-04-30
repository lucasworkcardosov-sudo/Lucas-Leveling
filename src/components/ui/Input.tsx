import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-600">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'flex h-12 w-full border-2 border-black bg-white px-4 py-2 text-sm font-medium ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all',
            error && 'border-red-500 ring-red-500',
            className
          )}
          {...props}
        />
        {error && <span className="text-[10px] text-red-500 font-bold uppercase">{error}</span>}
      </div>
    );
  }
);
