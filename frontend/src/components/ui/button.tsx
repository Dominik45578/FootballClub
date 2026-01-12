import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[filter,transform,box-shadow] duration-150 ease-in-out cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 filter btn-brighten [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border border-border hover:brightness-150",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:brightness-150 active:brightness-95 transform-gpu btn-focus",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 hover:brightness-130 active:brightness-95 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-border bg-background shadow-xs hover:bg-accent hover:brightness-130 hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:brightness-130",
        ghost:
          "hover:bg-accent hover:brightness-150 hover:shadow-lg hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  style,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  // styl bazowy oparty o zmienne CSS, zapewnia że element ma tło nawet gdy
  // klasy utility (np. bg-primary) nie są wygenerowane przez Tailwind
  const variantStyle: React.CSSProperties =
    variant === "default"
      ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', borderColor: 'var(--border)' }
      : variant === "destructive"
      ? { backgroundColor: 'var(--destructive)', color: 'white', borderColor: 'var(--border)' }
      : variant === "outline"
      ? { backgroundColor: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--border)' }
      : variant === "secondary"
      ? { backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)', borderColor: 'var(--border)' }
      : {}

  const combinedStyle = { ...variantStyle, ...style }

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      style={combinedStyle}
      {...props}
    />
  )
}

export { Button, buttonVariants }
