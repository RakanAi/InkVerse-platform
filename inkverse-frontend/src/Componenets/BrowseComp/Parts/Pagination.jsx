import Pagination from "react-bootstrap/Pagination";

export default function Pager({ pageNumber, totalPages, onPage }) {
  const current = Number(pageNumber || 1);
  const total = Number(totalPages || 0);

  if (total <= 1) return null;

  const items = [];

  const pushPage = (p) => {
    items.push(
      <Pagination.Item
        key={p}
        active={p === current}
        onClick={() => onPage(p)}
      >
        {p}
      </Pagination.Item>
    );
  };

  // First + Prev
  items.push(
    <Pagination.First
      key="first"
      disabled={current === 1}
      onClick={() => onPage(1)}
    />
  );
  items.push(
    <Pagination.Prev
      key="prev"
      disabled={current === 1}
      onClick={() => onPage(current - 1)}
    />
  );

  // Windowed pages: 1 ... [current-2..current+2] ... last
  pushPage(1);

  const start = Math.max(2, current - 2);
  const end = Math.min(total - 1, current + 2);

  if (start > 2) items.push(<Pagination.Ellipsis key="e1" disabled />);

  for (let p = start; p <= end; p++) pushPage(p);

  if (end < total - 1) items.push(<Pagination.Ellipsis key="e2" disabled />);

  if (total > 1) pushPage(total);

  // Next + Last
  items.push(
    <Pagination.Next
      key="next"
      disabled={current === total}
      onClick={() => onPage(current + 1)}
    />
  );
  items.push(
    <Pagination.Last
      key="last"
      disabled={current === total}
      onClick={() => onPage(total)}
    />
  );

  return (
    <div className="d-flex justify-content-center mt-4">
      <Pagination className="mb-0">{items}</Pagination>
    </div>
  );
}
