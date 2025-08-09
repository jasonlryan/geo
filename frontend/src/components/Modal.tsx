"use client";
import { ReactNode, useEffect } from "react";

export default function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-[80vw] max-w-[1600px] max-h-[90vh] rounded-xl shadow-2xl border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-medium">{title}</h3>
          <button className="text-sm underline" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="p-4 overflow-auto max-h-[82vh]">{children}</div>
      </div>
    </div>
  );
}
