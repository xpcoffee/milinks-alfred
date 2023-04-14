import { LinkGroup } from "milinks";

/**
 * TODO - actually validate the schema
 */
export function parseDataString(groupString: string): LinkGroup {
  try {
    return JSON.parse(groupString);
  } catch (e) {
    console.error("Unable to parse link group into JSON: " + e);
    process.exit(1);
  }
}
