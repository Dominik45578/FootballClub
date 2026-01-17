import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    // BAZA:
    // transition-all: Płynne animowanie koloru i rozmiaru.
    // hover:scale-105: Powiększenie przycisku.
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-in-out cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border border-border transform-gpu hover:scale-105 active:scale-95",
    {
      variants: {
        variant: {
          default:
          // ZMIANA NA BARDZIEJ BIAŁE TŁO:
          // Zmieniłem white_20% na white_40%.
          // Teraz po najechaniu do koloru Primary dodawane jest aż 40% bieli.
          // Tło będzie wyraźnie jaśniejsze, co da efekt mocnego "podświetlenia".
              "bg-primary text-primary-foreground shadow-sm hover:bg-[color-mix(in_srgb,var(--primary),white_40%)]",
          destructive:
          // Analogicznie dla czerwonego przycisku - 40% bieli przy hover.
              "bg-destructive text-white hover:bg-[color-mix(in_srgb,var(--destructive),white_40%)] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
          outline:
              "border border-border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
          secondary:
              "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          ghost:
              "hover:bg-accent hover:text-accent-foreground shadow-none hover:shadow-sm",
          link:
              "text-primary underline-offset-4 hover:underline shadow-none hover:scale-100 active:scale-100 py-0 h-auto!",
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