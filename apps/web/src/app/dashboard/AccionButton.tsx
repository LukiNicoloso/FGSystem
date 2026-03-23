"use client";

import { useTransition } from "react";

interface Props {
  action: () => Promise<void>;
  label: string;
  className: string;
}

export default function AccionButton({ action, label, className }: Props) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => { action(); })}
      className={`disabled:opacity-50 transition-colors ${className}`}
    >
      {pending ? "..." : label}
    </button>
  );
}
