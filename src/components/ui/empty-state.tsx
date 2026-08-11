import React from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-md mx-auto rounded-3xl border border-dashed border-border/60 bg-secondary/20">
      <div className="mb-6 h-16 w-16 rounded-2xl bg-secondary/50 flex items-center justify-center text-foreground ring-1 ring-border/50 shadow-sm opacity-80">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 rounded-full bg-foreground text-background text-sm font-bold hover:bg-foreground/90 transition-all shadow-soft hover:-translate-y-0.5"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
