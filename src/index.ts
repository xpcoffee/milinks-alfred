import { MiLinksSchema, Link, LinkOrGroup, LinkGroup } from "milinks";
import { FilterList, FilterListItem } from "@types/alfred";
import FuzzySearch from "fuzzy-search";
import { readFileSync } from "fs";
import path from "path";
import { homedir } from "os";

type AnnotatedLink = { groupName?: string } & Link;

/**
 * Alfred script filter
 *
 * Environment variables
 *    MILINKS_FILE_PATH: a string. the location of the top-level MiLinks group
 *    MILINKS_SEARCH_ALL: a boolean flag. if set, search behaviour will search all tags at the same time
 *    MILINKS_GROUP: a JSON string. if set, will be used as the top-level group instead of the contents of MILINKS_FILE_PATH.
 */
export function script() {
  const searchAllLinks = !!process.env["MILINKS_SEARCH_ALL"];
  const linksFilePath = process.env["MILINKS_FILE_PATH"];
  const groupString = process.env["MILINKS_GROUP"];
  const [_script, _preamble, query] = process.argv;

  const nestedLinks = groupString
    ? parseGroupString(groupString)
    : parseLinkFile(linksFilePath);

  function searchAll(): FilterList {
    const links = flattenLinks(nestedLinks);
    const filteredLinks = fuzzyFindLinks(links, query);
    return linksToFilterList(filteredLinks);
  }

  function searchDefault(): FilterList {
    const items = getFilterListItems(nestedLinks);
    return { items: fuzzyFindFilterListItems(items, query) };
  }

  const alfredList = searchAllLinks ? searchAll() : searchDefault();

  console.log(JSON.stringify(alfredList));
}

/**
 * TODO - actually validate the schema
 */
function parseGroupString(groupString: string): LinkGroup {
  try {
    return JSON.parse(groupString);
  } catch (e) {
    console.error("Unable to parse link group into JSON: " + e);
    process.exit(1);
  }
}

/**
 * TODO - actually validate the schema
 */
function parseLinkFile(filePath?: string): MiLinksSchema {
  if (!filePath) {
    console.error("No MiLinks file path.");
    process.exit(1);
  }

  try {
    const linksString = readFileSync(expandHome(filePath), "utf-8");
    return JSON.parse(linksString);
  } catch (e) {
    console.error("Unable to parse link file into JSON: " + e);
    process.exit(1);
  }
}

function expandHome(filePath: string) {
  if (filePath[0] === "~") {
    return path.join(homedir(), filePath.slice(1));
  }
  return filePath;
}

function getFilterListItems(group: LinkGroup): FilterListItem[] {
  const items = group.items.map<FilterListItem>((item) => {
    if (item.type === "group") {
      return {
        uid: Date.now().toString(),
        title: item.name,
        arg: "group",
        variables: {
          MILINKS_GROUP: JSON.stringify(item),
        },
      };
    } else {
      return linkToFilterItem({ ...item, groupName: group.name });
    }
  });

  return items;
}

function flattenLinks(links: MiLinksSchema): AnnotatedLink[] {
  const result: AnnotatedLink[] = [];

  function addLinks(
    accumulator: AnnotatedLink[],
    node: LinkOrGroup,
    groupName?: string
  ) {
    if (node.type === "group") {
      const newGroupName = [groupName, node.name]
        .filter((i) => i !== undefined && i?.length)
        .join("/");
      node.items.forEach((item) => addLinks(accumulator, item, newGroupName));
    } else {
      accumulator.push({ ...node, groupName });
    }
  }

  addLinks(result, links);
  return result;
}

/**
 * Filter links using fuzzy find
 */
function fuzzyFindLinks(
  links: AnnotatedLink[],
  query: string
): AnnotatedLink[] {
  if (!query) {
    return links;
  }

  const terms = query.split(" ");

  let filteredLinks = links;
  terms.forEach((term) => {
    filteredLinks = new FuzzySearch(filteredLinks, [
      "description",
      "title",
      "groupName",
    ]).search(term);
  });

  return filteredLinks;
}

function fuzzyFindFilterListItems(
  filterListItems: FilterListItem[],
  query
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

function linksToFilterList(links: AnnotatedLink[]): FilterList {
  return {
    items: links.map(linkToFilterItem),
  };
}

function linkToFilterItem(link: AnnotatedLink): FilterListItem {
  const subtitle = [link.groupName, link.description, link.url]
    .filter((item) => item !== undefined && item?.length)
    .join(" | ");

  return {
    uid: link.title,
    title: link.title,
    subtitle,
    arg: link.url,
    variables: {
      url: link.url,
    },
  };
}
