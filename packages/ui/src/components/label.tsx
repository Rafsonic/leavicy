"use client"

import * as React from "react"

import { cn } from "../lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    // react-doctor-disable-next-line label-has-associated-control -- vendored shadcn primitive: consumers supply `htmlFor`; dev-rules.md forbids refactoring vendored shadcn/ui files.
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
