import type { ReactNode } from "react";
import { classNames } from "../../lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  return (
    <div
      className={classNames(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center"
      )}
    >
      <div>
        {eyebrow && <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">{eyebrow}</p>}
        <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
