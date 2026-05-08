import EmptyState from "../../../Shared/ui/EmptyState";

function resolveClassName(value, row, index) {
  return typeof value === "function" ? value(row, index) : value || "";
}

export default function AdminTable({
  columns,
  rows,
  rowKey,
  emptyTitle = "Nothing to show",
  emptySubtitle = "Try a different query or add new data.",
  footer,
  compact = false,
  rowClassName,
  className = "",
  tableClassName = "",
}) {
  if (!rows?.length) {
    return <EmptyState title={emptyTitle} subtitle={emptySubtitle} />;
  }

  return (
    <div
      className={`admin-table-shell ${compact ? "admin-table-shell--compact" : ""} ${className}`.trim()}
    >
      <div className="admin-table-scroll">
        <table
          className={`admin-table ${compact ? "admin-table--compact" : ""} ${tableClassName}`.trim()}
        >
          <thead>
            <tr>
              {columns.map((column) => {
                const alignClass = column.align
                  ? `admin-table__cell--${column.align}`
                  : "";
                const content = column.onHeaderClick ? (
                  <button
                    type="button"
                    className={`admin-table__sort ${alignClass}`.trim()}
                    onClick={column.onHeaderClick}
                  >
                    <span>{column.label}</span>
                    {column.sortIndicator ? (
                      <span className="admin-table__sort-indicator">
                        {column.sortIndicator}
                      </span>
                    ) : null}
                  </button>
                ) : (
                  column.label
                );

                return (
                  <th
                    key={column.key}
                    className={alignClass}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    {content}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr
                key={typeof rowKey === "function" ? rowKey(row) : row[rowKey]}
                className={resolveClassName(rowClassName, row, index)}
              >
                {columns.map((column) => {
                  const cellClassName = [
                    column.align ? `admin-table__cell--${column.align}` : "",
                    resolveClassName(column.cellClassName, row, index),
                  ]
                    .filter(Boolean)
                    .join(" ");

                  const value = column.render
                    ? column.render(row, index)
                    : row[column.key];

                  return (
                    <td
                      key={column.key}
                      className={cellClassName}
                      style={column.width ? { width: column.width } : undefined}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {footer ? <div className="admin-table__footer">{footer}</div> : null}
    </div>
  );
}
