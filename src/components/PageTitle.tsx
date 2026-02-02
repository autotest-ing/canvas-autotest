import { cn } from "@/lib/utils";

interface PageTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTitle({ children, className }: PageTitleProps) {
  return (
    <h1 className={cn("text-xl md:text-2xl font-semibold text-foreground", className)}>
      {children}
      <span className="inline-block w-1.5 h-1.5 ml-1 rounded-full bg-green-500" />
    </h1>
  );
}
