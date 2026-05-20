"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && query.trim()) {
      router.push(`/inzeraty?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#F8F8F8",
        border: "1px solid #EFEFEF",
        borderRadius: 999,
        padding: "12px 20px",
        width: "100%",
      }}
    >
      <Search size={20} color="#919191" strokeWidth={2} className="shrink-0" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Vyhledat v Bazaru"
        style={{
          border: "none",
          background: "transparent",
          outline: "none",
          color: "#919191",
          fontSize: 16,
          width: "100%",
        }}
      />
    </div>
  );
}
