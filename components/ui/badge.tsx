import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-[22px] w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2.5 text-[12.5px] leading-none font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        // Cobalt fill — reserved for "Apply" and a "strong" match only.
        default: "bg-primary text-primary-foreground",
        // Muted: Skip, Draft, "missing".
        secondary: "border-border bg-secondary text-muted-foreground",
        destructive: "border-border text-destructive",
        outline: "border-border bg-card text-foreground",
        // Graphite fill — pipeline stage.
        ink: "bg-foreground text-background",
        ghost: "hover:bg-muted hover:text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Verified/unverified reads as shape, not color: filled dot vs hollow ring.
function BadgeMarker({ marker }: { marker: "verified" | "unverified" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        marker === "verified"
          ? "bg-current"
          : "border-[1.5px] border-current"
      )}
    />
  )
}

function Badge({
  className,
  variant = "default",
  marker,
  children,
  render,
  ...props
}: useRender.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    marker?: "verified" | "unverified"
  }) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
        children: marker ? (
          <>
            <BadgeMarker marker={marker} />
            {children}
          </>
        ) : (
          children
        ),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
