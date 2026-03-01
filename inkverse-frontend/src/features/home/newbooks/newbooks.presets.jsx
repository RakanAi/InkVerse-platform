export const NEWBOOKS_MAX_WIDTH = 1300;

export const NEWBOOKS_VISIBLE_BY_WIDTH = [
  { minWidth: 992, count: 6 },
  { minWidth: 768, count: 4 },
  { minWidth: 0, count: 3 },
];

export const NEWBOOKS_QUERY = {
  sortBy: "CreatedAt",
  isAscending: false,
  pageSize: 6,
  pageNumber: 1,
};