export interface ContentBlock {
  id: number;
  page: string;
  section: string;
  content_type: "text" | "html" | "json";
  content: string;
  position: number;
  active: boolean;
  updated_at: string;
}

export type ContentMap = Record<string, string>;
