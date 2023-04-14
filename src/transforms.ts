import { LinkGroup, LinkOrGroup } from "milinks";
import {
  FilterListItem as AlfredFilterListItem,
  FilterList as AlfredFilterList,
} from "./alfred/types";
import { resolveLinkGroupRef } from "./linkResolution";
import { AnnotatedLink } from "./types";

export async function toFlatAlfredFilterListItems(
  links: LinkGroup
): Promise<AlfredFilterListItem[]> {
  const result: AlfredFilterListItem[] = [];

  async function addLinks(
    accumulator: AlfredFilterListItem[],
    node: LinkOrGroup,
    groupName?: string
  ) {
    async function flattenGroup(group: LinkGroup) {
      const newGroupName = [groupName, group.name]
        .filter((i) => i !== undefined && i?.length)
        .join("/");
      await Promise.all(
        group.items.map((item) => addLinks(accumulator, item, newGroupName))
      );
    }

    if (node.type === "group") {
      await flattenGroup(node);
    } else if (node.type === "link") {
      accumulator.push(toAlfredFilterItem({ ...node, groupName }));
    } else if (node.type === "groupRef") {
      const resolvedGroup = await resolveLinkGroupRef(node);
      resolvedGroup && (await flattenGroup(resolvedGroup));
    }
  }

  await addLinks(result, links);
  return result;
}

export async function toAlfredFilterListItems(
  group: LinkGroup
): Promise<AlfredFilterListItem[]> {
  const items = await Promise.all(
    group.items.map<Promise<AlfredFilterListItem | undefined>>(async (item) => {
      if (item.type === "group") {
        return groupToListItem(item);
      } else if (item.type === "link") {
        return toAlfredFilterItem({ ...item, groupName: group.name });
      } else if (item.type === "groupRef") {
        const resolvedGroup = await resolveLinkGroupRef(item);
        return resolvedGroup ? groupToListItem(resolvedGroup) : undefined;
      }
    })
  );

  return items.filter(
    (item): item is AlfredFilterListItem => item !== undefined
  );
}

function groupToListItem(gp: LinkGroup): AlfredFilterListItem {
  return {
    uid: Date.now().toString(),
    title: gp.name,
    arg: "group",
    variables: {
      MILINKS_GROUP: JSON.stringify(gp),
    },
  };
}

export function toAlfredFilterList(
  items: AlfredFilterListItem[]
): AlfredFilterList {
  return { items };
}

export function toAlfredFilterItem(link: AnnotatedLink): AlfredFilterListItem {
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
