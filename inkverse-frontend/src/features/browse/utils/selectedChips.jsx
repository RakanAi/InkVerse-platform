export function buildSelectedChips(lookups, includeIds, excludeIds) {
  const byId = new Map((lookups || []).map((x) => [x.id ?? x.ID, x]));
  const res = [];

  for (const id of includeIds || []) {
    const item = byId.get(id);
    if (item) res.push({ id, name: item.name, type: "include" });
  }

  for (const id of excludeIds || []) {
    const item = byId.get(id);
    if (item) res.push({ id, name: item.name, type: "exclude" });
  }

  return res;
}