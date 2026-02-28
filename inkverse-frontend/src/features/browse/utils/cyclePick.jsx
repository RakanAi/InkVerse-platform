// click cycles: include -> exclude -> none
export function cyclePick({ includeArr, excludeArr, id }) {
  const inc = new Set(includeArr || []);
  const exc = new Set(excludeArr || []);

  if (inc.has(id)) {
    inc.delete(id);
    exc.add(id);
  } else if (exc.has(id)) {
    exc.delete(id);
  } else {
    inc.add(id);
  }

  return { include: Array.from(inc), exclude: Array.from(exc) };
}