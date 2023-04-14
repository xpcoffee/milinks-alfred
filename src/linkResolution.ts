import axios from "axios";
import { LinkGroup, LinkGroupRef } from "milinks";
import { parseLinkFile } from "./dataFile";

/**
 * TODO - validate the schema
 */
export async function resolveLinkGroupRef({
  url,
  alias,
}: LinkGroupRef): Promise<LinkGroup | undefined> {
  const fileUrlPrefix = "file://";

  if (url.startsWith(fileUrlPrefix)) {
    const filePath = url.slice(fileUrlPrefix.length);
    return parseLinkFile(filePath);
  } else {
    const response = await axios(url);
    const jsonResult = response.data;

    if (alias) {
      jsonResult["name"] = alias;
    }

    return jsonResult;
  }
}
