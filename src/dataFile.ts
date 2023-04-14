import { readFileSync } from "fs";
import { LinkGroup } from "milinks";
import { homedir } from "os";
import path from "path";
import { parseDataString } from "./dataParsing";

export function parseLinkFile(filePath?: string): LinkGroup {
  if (!filePath) {
    console.error("No MiLinks file path.");
    process.exit(1);
  }

  try {
    const linksString = readFileSync(expandHome(filePath), "utf-8");
    return parseDataString(linksString);
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
