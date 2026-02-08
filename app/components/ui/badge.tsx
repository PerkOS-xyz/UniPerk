import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-uniperk-pink text-white shadow",
        secondary: "border-transparent bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100",
        outline: "text-gray-950 dark:text-gray-50",
        bronze: "border-transparent bg-tier-bronze text-white",
        silver: "border-transparent bg-tier-silver text-gray-900",
        gold: "border-transparent bg-tier-gold text-gray-900",
        platinum: "border-transparent bg-tier-platinum text-gray-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
