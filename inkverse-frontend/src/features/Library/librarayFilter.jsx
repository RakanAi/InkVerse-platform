import Segmented from "@/Shared/ui/Segmented";

const FILTERS = [
  {
    value: "All",
    label: (
      <span className="iv-lib-seg-item">
        <i className="bi bi-collection" />
        <span> All</span>
      </span>
    ),
  },
  {
    value: "Reading",
    label: (
      <span className="iv-lib-seg-item">
        <i className="bi bi-book" />
        <span> Reading</span>
      </span>
    ),
  },
  {
    value: "Completed",
    label: (
      <span className="iv-lib-seg-item">
        <i className="bi bi-check2-circle" />
        <span> Finished</span>
      </span>
    ),
  },
  {
    value: "Planned",
    label: (
      <span className="iv-lib-seg-item">
        <i className="bi bi-bookmark" />
        <span> Planning</span>
      </span>
    ),
  },
  {
    value: "Dropped",
    label: (
      <span className="iv-lib-seg-item">
        <i className="bi bi-x-circle" />
        <span> Dropped</span>
      </span>
    ),
  },
  {
    value: "History",
    label: (
      <span className="iv-lib-seg-item">
        <i className="bi bi-clock-history" />
        <span> History</span>
      </span>
    ),
  },
];

export default function LibraryFilter({ value, onChange }) {
  return (
    <Segmented
      value={value}
      options={FILTERS}
      onChange={onChange}
      size="sm"
      renderOption={(option) => (
        <span className="iv-lib-seg-item">
          <i className={`bi ${option.icon}`} />
          <span>{option.label}</span>
        </span>
      )}
    />
  );
}
