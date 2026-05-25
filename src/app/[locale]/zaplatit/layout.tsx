import type { ReactNode } from "react";

export default function ZaplatitLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: "#fff",
      }}
    >
      {children}
    </div>
  );
}
