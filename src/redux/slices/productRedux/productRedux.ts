import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { get, patch, post } from "../../../inteceptor";
import { dispatch } from "../../store";

export type ProductCategory = {
  description: string | null;
  id: number;
  iconUrl: string | null;
  inheritedRequiredAttributeIds: number[];
  isActive: boolean;
  logoUrl: string | null;
  name: string;
  parentId: number | null;
  priority: number;
  requiredAttributeIds: number[];
  seoId: number | null;
  slug: string;
};

export type ProductCategoryInput = {
  description?: string | null;
  iconUrl?: string | null;
  isActive?: boolean;
  logoUrl?: string | null;
  name: string;
  parentId: number | null;
  priority: number;
  requiredAttributeIds?: number[];
  seo?: ProductSeoInput | null;
  slug?: string;
};

export type ProductAttributeOption = {
  attributeId: number;
  colorHex: string | null;
  description: string | null;
  iconUrl: string | null;
  id: number;
  isActive: boolean;
  label: string;
  priority: number;
  value: string;
};

export type ProductAttribute = {
  description: string | null;
  displayName: string;
  id: number;
  isActive: boolean;
  isEffectOnDescription: boolean;
  isEffectOnImages: boolean;
  isEffectOnPricing: boolean;
  name: string;
  options: ProductAttributeOption[];
  postUnit: string | null;
  preUnit: string | null;
  priority: number;
};

export type ProductImageInput = {
  altText: string | null;
  isPrimary: boolean;
  priority: number;
  url: string;
};

export type ProductSeoInput = {
  canonicalUrl?: string | null;
  keywords?: string | null;
  metaDescription?: string | null;
  metaTitle?: string | null;
  ogImageUrl?: string | null;
};

export type ProductInput = {
  categoryId: number | null;
  description: string | null;
  hasVariations: boolean;
  iconUrl: string | null;
  images: ProductImageInput[];
  isActive: boolean;
  isAvailableOnWeb: boolean;
  logoUrl: string | null;
  lowestSellingPrice: number;
  maxPurchasingPrice: number;
  mrpPrice: number;
  name: string;
  optionIds: number[];
  parentId: number | null;
  priority: number;
  seo: ProductSeoInput | null;
  shortDescription: string | null;
  sku: string | null;
};

export type ProductListItem = {
  category: { id: number; name: string } | null;
  hasVariations: boolean;
  id: number;
  isActive: boolean;
  isAvailableOnWeb: boolean;
  lowestSellingPrice: string;
  maxPurchasingPrice: string;
  mrpPrice: string;
  name: string;
  parentId: number | null;
  priority: number | null;
  sku: string | null;
  variationCount: number;
};

export type ProductDetail = ProductListItem & {
  categoryId: number | null;
  description: string | null;
  iconUrl: string | null;
  images: Array<ProductImageInput & { id: number; productId: number; timestamp: number }>;
  logoUrl: string | null;
  options: Array<{
    attributeDisplayName: string;
    attributeId: number;
    attributeName: string;
    colorHex: string | null;
    label: string;
    optionId: number;
    productId: number;
    value: string;
  }>;
  seo: (ProductSeoInput & { seoId: number }) | null;
  shortDescription: string | null;
  variations: ProductDetail[];
};

export type ProductListResponse = {
  items: ProductListItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

type ProductState = {
  attributes: ProductAttribute[];
  categories: ProductCategory[];
  current: ProductDetail | null;
  error: string | null;
  items: ProductListItem[];
  pagination: ProductListResponse["pagination"];
};

const initialState: ProductState = {
  attributes: [],
  categories: [],
  current: null,
  error: null,
  items: [],
  pagination: { page: 1, pageSize: 15, total: 0, totalPages: 0 },
};

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    attributesReceived(state, action: PayloadAction<ProductAttribute[]>) { state.attributes = action.payload; state.error = null; },
    categoriesReceived(state, action: PayloadAction<ProductCategory[]>) { state.categories = action.payload; state.error = null; },
    currentReceived(state, action: PayloadAction<ProductDetail>) { state.current = action.payload; state.error = null; },
    failed(state, action: PayloadAction<string>) { state.error = action.payload; },
    productsReceived(state, action: PayloadAction<ProductListResponse>) {
      state.items = action.payload.items;
      state.pagination = action.payload.pagination;
      state.error = null;
    },
  },
});

export default productSlice.reducer;

const messageOf = (error: unknown) => error instanceof Error ? error.message : "Product request failed.";
const commit = <T>(request: Promise<T>, success: (value: T) => PayloadAction<T>) => request.then((value) => {
  dispatch(success(value));
  return value;
}).catch((error) => {
  dispatch(productSlice.actions.failed(messageOf(error)));
  throw error;
});

export const getProducts = async (query: Record<string, unknown>): Promise<ProductListResponse> =>
  commit(get<ProductListResponse>("products", query).then((response) => response.data), productSlice.actions.productsReceived);

export const getProduct = async (id: number): Promise<ProductDetail> =>
  commit(get<ProductDetail>(`products/${id}`).then((response) => response.data), productSlice.actions.currentReceived);

export const createProduct = async (input: ProductInput): Promise<ProductDetail> =>
  (await post<ProductDetail, ProductInput>("products", input, undefined, false)).data;

export const updateProduct = async (id: number, input: Partial<Omit<ProductInput, "hasVariations" | "isActive" | "parentId">>): Promise<ProductDetail> =>
  (await patch<ProductDetail>(`products/${id}`, input, undefined, false)).data;

export const updateProductStatus = async (id: number, isActive: boolean): Promise<ProductDetail> =>
  (await patch<ProductDetail>(`products/${id}/status`, { isActive }, undefined, false)).data;

export const getProductCategories = async (query: Record<string, unknown> = {}): Promise<ProductCategory[]> =>
  commit(get<ProductCategory[]>("products/categories", query).then((response) => response.data), productSlice.actions.categoriesReceived);

export const createProductCategory = async (input: ProductCategoryInput): Promise<ProductCategory> =>
  (await post<ProductCategory, ProductCategoryInput>("products/categories", input, undefined, false)).data;

export const updateProductCategory = async (id: number, input: Partial<ProductCategoryInput>): Promise<ProductCategory> =>
  (await patch<ProductCategory>(`products/categories/${id}`, input, undefined, false)).data;

export const updateProductCategoryStatus = async (id: number, isActive: boolean): Promise<ProductCategory> =>
  (await patch<ProductCategory>(`products/categories/${id}/status`, { isActive }, undefined, false)).data;

export const getProductAttributes = async (query: Record<string, unknown> = {}): Promise<ProductAttribute[]> =>
  commit(get<ProductAttribute[]>("products/attributes", query).then((response) => response.data), productSlice.actions.attributesReceived);

export const createProductAttribute = async (input: Omit<ProductAttribute, "id" | "options">): Promise<ProductAttribute> =>
  (await post<ProductAttribute>("products/attributes", input, undefined, false)).data;

export const updateProductAttribute = async (id: number, input: Partial<Omit<ProductAttribute, "id" | "isActive" | "options">>): Promise<ProductAttribute> =>
  (await patch<ProductAttribute>(`products/attributes/${id}`, input, undefined, false)).data;

export const updateProductAttributeStatus = async (id: number, isActive: boolean): Promise<ProductAttribute> =>
  (await patch<ProductAttribute>(`products/attributes/${id}/status`, { isActive }, undefined, false)).data;

export const createProductAttributeOption = async (attributeId: number, input: Omit<ProductAttributeOption, "attributeId" | "id">): Promise<ProductAttributeOption> =>
  (await post<ProductAttributeOption>(`products/attributes/${attributeId}/options`, input, undefined, false)).data;

export const updateProductAttributeOption = async (id: number, input: Partial<Omit<ProductAttributeOption, "attributeId" | "id" | "isActive">>): Promise<ProductAttributeOption> =>
  (await patch<ProductAttributeOption>(`products/attribute-options/${id}`, input, undefined, false)).data;

export const updateProductAttributeOptionStatus = async (id: number, isActive: boolean): Promise<ProductAttributeOption> =>
  (await patch<ProductAttributeOption>(`products/attribute-options/${id}/status`, { isActive }, undefined, false)).data;
