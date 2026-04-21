import React, { useEffect, useMemo, useRef, useState } from "react";

export default function MultiSelectDropdownSearchable({
  label,
  values = [],
  onChange,
  options = [],
  searchPlaceholder = "Search tags...",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };

    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((o) => `${o.label ?? ""}`.toLowerCase().includes(term));
  }, [options, query]);

  const toggle = (val) => {
    const set = new Set(values);
    if (set.has(val)) set.delete(val);
    else set.add(val);
    onChange(Array.from(set));
  };

  return (
    <div ref={rootRef} className={`iv-dd ${open ? "is-open" : ""} ${className}`}>
      <button
        type="button"
        className="iv-dd-btn"
        onClick={() => setOpen((x) => !x)}
      >
        <span className="iv-dd-text">
          {label}
          {values.length > 0 ? ` (${values.length})` : ""}
        </span>
        <span className="iv-dd-arrow">v</span>
      </button>

      <div className={`iv-dd-menu ${open ? "is-open" : ""}`}>
        <input
          type="text"
          className="iv-dd-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
        />

        {filteredOptions.length === 0 ? (
          <div className="iv-dd-empty">No results</div>
        ) : (
          filteredOptions.map((o) => {
            const active = values.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                className={`iv-dd-item ${active ? "is-active" : ""}`}
                onClick={() => toggle(o.value)}
              >
                <span className="iv-dd-item-content">
                  <span
                    className={`iv-dd-check ${active ? "is-checked" : ""}`}
                    aria-hidden="true"
                  >
                    {active ? "\u2713" : ""}
                  </span>
                  <span>{o.label}</span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
