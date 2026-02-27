export type ReqResProducts = {
  id: number;
  name: string;
  year: number;
  color: string;
  pantone_value: string;
};

export type ReqResSupport = {
  url: string;
  text: number;
};

export type ReqProductsResponse = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  data: ReqResProducts[];
  support: ReqResSupport;
};
