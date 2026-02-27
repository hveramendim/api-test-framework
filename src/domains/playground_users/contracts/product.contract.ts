import { expect } from "vitest";
import type {
  ReqProductsResponse,
  ReqResProducts,
  ReqResSupport
} from "../models/reqresProducts.model";

export function assertProductsListContract(data: ReqProductsResponse) {
  expect(data).toHaveProperty("page");
  expect(data).toHaveProperty("per_page");
  expect(data).toHaveProperty("total");
  expect(data).toHaveProperty("total_pages");
  expect(data).toHaveProperty("data");

  expect(typeof data.page).toBe("number");
  expect(typeof data.per_page).toBe("number");
  expect(typeof data.total).toBe("number");
  expect(typeof data.total_pages).toBe("number");

  expect(Array.isArray(data.data)).toBe(true);

  if (data.data.length > 0) {
    assertProductsContract(data.data[0]);
    assertSupportContract(data.support)
  }
}

export function assertProductsContract(r: ReqResProducts) {
  expect(r).toHaveProperty("id");
  expect(r).toHaveProperty("name");
  expect(r).toHaveProperty("year");
  expect(r).toHaveProperty("color");
  expect(r).toHaveProperty("pantone_value");

  expect(typeof r.id).toBe("number");
  expect(typeof r.name).toBe("string");
  expect(typeof r.year).toBe("number");
  expect(typeof r.color).toBe("string");
  expect(typeof r.pantone_value).toBe("string");

  expect(r.name.length).toBeGreaterThan(0);
}

export function assertSupportContract(s: ReqResSupport) {
  expect(s).toHaveProperty("url");
  expect(s).toHaveProperty("text");

  expect(typeof s.url).toBe("string");
  expect(typeof s.text).toBe("string");

  expect(s.url).toContain("contentcaddy"); //validar contenido
}