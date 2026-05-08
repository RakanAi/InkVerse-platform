import Segmented from "@/Shared/ui/Segmented";
import { LIBRARY_FILTERS } from "@/features/Library/library.presets";

export default function LibraryFilter({ value, onChange, counts }) {
  const options = LIBRARY_FILTERS.map((filter) => ({
    value: filter.value,
    label: (
      <span className="iv-libraryFilter__item">
        <span className="iv-libraryFilter__iconWrap" aria-hidden="true">
          <i className={`bi ${filter.icon}`} />
        </span>
        <span className="iv-libraryFilter__text">
          <span className="iv-libraryFilter__label">{filter.label}</span>
          <span className="iv-libraryFilter__count">{counts?.[filter.value] ?? 0}</span>
        </span>
      </span>
    ),
  }));

  return (
    <Segmented
      value={value}
      options={options}
      onChange={onChange}
      className="iv-libraryFilter"
      wrap
    />
  );
}
