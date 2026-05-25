import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-sage/25 bg-[#dfeee5]/70 px-3 py-1.5 text-xs font-black text-teal",
        className,
      )}
      {...props}
    />
  );
}
