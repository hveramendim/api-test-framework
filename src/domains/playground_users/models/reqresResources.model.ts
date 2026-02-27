export type ReqResResources = {
  id: number;
  name: string;
  year: number;
  color: string;
  pantone_value: string;
};

export type ReqResResourcesResponse = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  data: ReqResResources[];
};
