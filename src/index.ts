import { parseLinkFile } from "./dataFile";
import { parseDataString } from "./dataParsing";
import { fuzzyFindFilterListItems } from "./filtering";
import {
  toFlatAlfredFilterListItems,
  toAlfredFilterListItems,
  toAlfredFilterList,
} from "./transforms";

/**
 * TODO
 *  - add README
 *  - add ability to bootstrap root file if not found
 *  - add ability to add a link
 *  - add ability to delete a link
 *  - add ability to modify a link
 *  - add ability to add a group
 *  - add ability to delete a group
 *  - add ability to rename a group
 *  - add ability to add a group ref
 *  - add ability to add alias a group ref
 */

/**
 * Alfred script filter
 *
 * Environment variables
 *    MILINKS_FILE_PATH: a string. the location of the top-level MiLinks group
 *    MILINKS_SEARCH_ALL: a boolean integer; 0 or 1. if set to 1, search behaviour will search all tags at the same time
 *    MILINKS_GROUP: a JSON string. if set, will be used as the top-level group instead of the contents of MILINKS_FILE_PATH.
 */
(async function browseLinks() {
  const searchAllLinks =
    process.env["MILINKS_SEARCH_ALL"]?.toLowerCase() === "1";
  const linksFilePath = process.env["MILINKS_FILE_PATH"];
  const groupString = process.env["MILINKS_GROUP"];
  const [_script, _preamble, query] = process.argv;

  const nestedLinks = groupString
    ? parseDataString(groupString)
    : parseLinkFile(linksFilePath);

  console.error(`search all ${process.env["MILINKS_SEARCH_ALL"]}`);
  const getSearchItems = searchAllLinks
    ? toFlatAlfredFilterListItems
    : toAlfredFilterListItems;

  const items = await getSearchItems(nestedLinks);
  const filteredItems = fuzzyFindFilterListItems(items, query);
  console.log(JSON.stringify(toAlfredFilterList(filteredItems)));
})();
