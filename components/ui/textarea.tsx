import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full resize-y rounded-surface border border-line bg-white px-4 py-4 leading-relaxed outline-none focus:border-teal focus:ring-4 focus:ring-teal/10",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
