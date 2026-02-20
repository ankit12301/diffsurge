import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-gray-900 text-white shadow-[0_1px_2px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] hover:bg-gray-800 active:scale-[0.98]",
  secondary:
    "bg-white text-gray-700 border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98]",
  ghost:
    "text-gray-500 hover:text-gray-900 hover:bg-gray-50 active:scale-[0.98]",
  outline:
    "border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-[0.98]",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[13px] gap-1.5",
  md: "h-10 px-5 text-[13px] gap-2",
  lg: "h-11 px-6 text-[14px] gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-medium transition-all duration-150 cursor-pointer whitespace-nowrap select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, type ButtonProps };
