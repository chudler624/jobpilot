import { cn } from "cn"

// Verified vs. unverified is communicated by shape, never by color:
// a filled dot means the claim traces to evidence, a hollow ring means it
// doesn't yet. Both are graphite — "unverified" is an ordinary expected
// state, not a warning.
export function VerifiedMarker({
  verified,
  className,
}: {
  verified: boolean
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-[9px] shrink-0 rounded-full",
        verified ? "bg-foreground" : "border-[1.5px] border-foreground",
        className
      )}
    />
  )
}
