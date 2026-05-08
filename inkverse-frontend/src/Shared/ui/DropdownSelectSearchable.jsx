import React, { useEffect, useMemo, useRef, useState } from "react";
import DropdownChevron from "./DropdownChevron";

export default function DropdownSelectSearchable({
  value,
  onChange,
  options = [],
  renderLabel,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((o) => `${o.label ?? ""}`.toLowerCase().includes(term));
  }, [options, query]);

  const buttonText = selected
    ? renderLabel
      ? renderLabel(selected)
      : selected.label
    : placeholder;

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

  return (
    <div ref={rootRef} className={`iv-dd ${open ? "is-open" : ""} ${className}`}>
      <button
        type="button"
        className="iv-dd-btn"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((x) => !x)}
      >
        <span className="iv-dd-text">{buttonText}</span>
        <DropdownChevron />
      </button>

      <div className={`iv-dd-menu ${open ? "is-open" : ""}`} aria-hidden={!open}>
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
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                className={`iv-dd-item ${active ? "is-active" : ""}`}
                onClick={() => {
                  onChange?.(o.value);
                  setOpen(false);
                }}
                tabIndex={open ? 0 : -1}
              >
                {renderLabel ? renderLabel(o) : o.label}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
