export type FilterList = {
  items: FilterListItem[];
};

export type FilterListItem = {
  uid: string;
  title?: string;
  mods?: {
    cmd?: Choice;
    option?: Choice;
    shift?: Choice;
  };
} & Choice;

type Choice = {
  arg: string;
  valid?: boolean;
  subtitle?: string;
  variables?: Record<string, string>;
};
