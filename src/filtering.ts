import FuzzySearch from "fuzzy-search";
import { FilterListItem } from "./alfred/types";
import { AnnotatedLink } from "./types";

export function fuzzyFindFilterListItems(
  filterListItems: FilterListItem[],
  query: string
): FilterListItem[] {
  if (!query) {
    return filterListItems;
  }

  const terms = query.split(" ");

  let filteredItems = filterListItems;
  terms.forEach((term) => {
    filteredItems = new FuzzySearch(filteredItems, ["title"]).search(term);
  });

  return filteredItems;
}
