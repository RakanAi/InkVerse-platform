/**
 * Returns how many books should be shown for a given window width.
 * @param {number} width
 * @param {{minWidth:number,count:number}[]} rules
 */
export function getVisibleCount(width, rules) {
  for (const r of rules) {
    if (width >= r.minWidth) return r.count;
  }
  return rules[rules.length - 1]?.count ?? 3;
}