import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn("text-[0.72rem] font-black uppercase tracking-[0.06em] text-[#426d90]", className)}
      {...props}
    />
  );
}
