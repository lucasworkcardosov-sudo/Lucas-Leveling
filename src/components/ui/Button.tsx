import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-black text-white hover:bg-zinc-800 border-2 border-black active:translate-y-0.5 transition-transform duration-75',
      secondary: 'bg-lime-400 text-black hover:bg-lime-500 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-shadow duration-75 active:translate-y-0.5',
      outline: 'bg-transparent border-2 border-black hover:bg-zinc-100 active:translate-y-0.5',
      ghost: 'bg-transparent hover:bg-zinc-100',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'flex items-center justify-center px-6 py-3 font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          className
        )}
        disabled={isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
