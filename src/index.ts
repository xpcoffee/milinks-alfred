import {
  MiLinksSchema,
  Link,
  LinkOrGroup,
  LinkGroup,
  LinkGroupRef,
} from "milinks";
import { FilterList, FilterListItem } from "@types/alfred";
import FuzzySearch from "fuzzy-search";
import { readFileSync } from "fs";
import path from "path";
import { homedir } from "os";
import axios from "axios";

type AnnotatedLink = { groupName?: string } & Link;

/**
 * TODO
 *  - resolve group refs for search-all
 *  - find a way to bundle dependencies into alfred script
 *  - add README
 *  - extract bits that can be pulled into nodejs library
 */

/**
 * Alfred script filter
 *
 * Environment variables
 *    MILINKS_FILE_PATH: a string. the location of the top-level MiLinks group
 *    MILINKS_SEARCH_ALL: a boolean flag. if set, search behaviour will search all tags at the same time
 *    MILINKS_GROUP: a JSON string. if set, will be used as the top-level group instead of the contents of MILINKS_FILE_PATH.
 */
export async function script() {
  const searchAllLinks =
    process.env["MILINKS_SEARCH_ALL"]?.toLowerCase() === "true";
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

  async function searchDefault(): Promise<FilterList> {
    const items = await getFilterListItems(nestedLinks);
    return { items: fuzzyFindFilterListItems(items, query) };
  }

  const alfredList = searchAllLinks ? searchAll() : await searchDefault();

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

async function getFilterListItems(group: LinkGroup): Promise<FilterListItem[]> {
  function groupToListItem(gp: LinkGroup): FilterListItem {
    return {
      uid: Date.now().toString(),
      title: gp.name,
      arg: "group",
      variables: {
        MILINKS_GROUP: JSON.stringify(gp),
      },
    };
  }

  const items = await Promise.all(
    group.items.map<Promise<FilterListItem | undefined>>(async (item) => {
      if (item.type === "group") {
        return groupToListItem(item);
      } else if (item.type === "link") {
        return linkToFilterItem({ ...item, groupName: group.name });
      } else if (item.type === "groupRef") {
        const resolvedGroup = await resolveLinkGroupRef(item);
        return resolvedGroup ? groupToListItem(resolvedGroup) : undefined;
      }
    })
  );

  return items.filter((item): item is FilterListItem => item !== undefined);
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
    } else if (node.type === "link") {
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

/**
 * TODO - validate the schema
 */
async function resolveLinkGroupRef({
  url,
  alias,
}: LinkGroupRef): Promise<LinkGroup | undefined> {
  const fileUrlPrefix = "file://";

  if (url.startsWith(fileUrlPrefix)) {
    const filePath = url.slice(fileUrlPrefix.length);
    const fileContents = readFileSync(filePath, "utf-8");
    return JSON.parse(fileContents);
  } else {
    const response = await axios(url);
    const jsonResult = response.data;

    if (alias) {
      jsonResult["name"] = alias;
    }

    return jsonResult;
  }
}
