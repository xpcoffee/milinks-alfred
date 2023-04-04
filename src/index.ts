import { MiLinksSchema, Link, LinkOrGroup } from "milinks";
import { FilterList, FilterListItem } from "@types/alfred";
import FuzzySearch from "fuzzy-search";
import { readFileSync } from "fs";
import path from "path";
import { homedir } from "os";

type LinkWithGroupName = { groupName?: string } & Link;

/**
 * Script
 */
export function script() {
  const linksFilePath = process.env["MILINKS_FILE_PATH"];
  const [_script, _preamble, query] = process.argv;
  const nestedLinks = parseLinkFile(linksFilePath);
  const links = flattenLinks(nestedLinks);
  const filteredLinks = fuzzyFind(links, query);
  const alfredList = toFilterList(filteredLinks);
  console.log(JSON.stringify(alfredList));
}

function fuzzyFind(
  links: LinkWithGroupName[],
  query: string
): LinkWithGroupName[] {
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

function flattenLinks(links: MiLinksSchema): LinkWithGroupName[] {
  const result: LinkWithGroupName[] = [];

  function addLinks(
    accumulator: LinkWithGroupName[],
    node: LinkOrGroup,
    groupName?: string
  ) {
    if ("items" in node) {
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

function toFilterList(links: LinkWithGroupName[]): FilterList {
  function toFilterItem(link: LinkWithGroupName): FilterListItem {
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

  return {
    items: links.map(toFilterItem),
  };
}
