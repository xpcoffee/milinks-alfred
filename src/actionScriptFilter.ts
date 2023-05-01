import { FilterListItem } from "./alfred/types";
import { toAlfredFilterList } from "./transforms"

/**
 * Alfred script filter
 *
 * Environment variables
 *    MILINKS_FILE_PATH: a string. the location of the top-level MiLinks group
 *    MILINKS_SEARCH_ALL: a boolean integer; 0 or 1. if set to 1, search behaviour will search all tags at the same time
 *    MILINKS_GROUP: a JSON string. if set, will be used as the top-level group instead of the contents of MILINKS_FILE_PATH.
 */
(async function addLinkOrGroup() {
  const [_script, _preamble, query] = process.argv;
  console.log(JSON.stringify(toAlfredFilterList(getActionFilterItems(query))));
})();

function getActionFilterItems(query?: string): FilterListItem[] {
  const [title, url] = query?.split(" ") ?? [undefined, undefined]

  function getLinkSubtitle() {
    const name = (title && `[link name: ${title}]`) || "[link name]"
    const link = (url && `[link name: ${url}]`) || "[link url]"
    return `${name} ${link}`
  }

  function getLinkVariables() {
    const variables: Record<string, string> = {}
    if (title) {
      variables["linkAlias"] = title
    }
    if (url) {
      variables["linkUrl"] = url
    }
    return variables
  }

  function getGroupSubtitle() {
    return (title && `[group name: ${title}]`) || "[group name]"
  }

  function getGroupVariables() {
    const variables: Record<string, string> = {}
    if (title) {
      variables["groupAlias"] = title
    }
    return variables
  }

  return [
    {
      uid: "addLink",
      title: "Add link",
      arg: "addLink",
      valid: !!query,
      subtitle: getLinkSubtitle(),
      variables: getLinkVariables()
    },
    {
      uid: "createGroup",
      title: "Create link group",
      arg: "createGroup",
      valid: !!query,
      subtitle: getGroupSubtitle(),
      variables: getGroupVariables()
    }
  ]
}
