import api from './axios';

export interface GISLocation {
  id: string;
  name: string;
  description?: string;
  content_type?: number | null;
  content_type_model?: string | null;
  object_id?: string | null;
  geometry_type: 'Point' | 'Polygon' | 'MultiPolygon';
  srid: number;
  geometry: string;
  centroid?: { x: number; y: number } | null;
  bounding_box?: [number, number, number, number] | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
  is_active?: boolean;
  is_deleted?: boolean;
}

export interface GISLocationListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GISLocation[];
}

export async function getGISLocations(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  geometry_type?: string;
  srid?: number;
  ordering?: string;
} = {}) {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params.pageSize) {
    queryParams.page_size = params.pageSize;
  }

  if (params.page && params.page > 1) {
    queryParams.offset = (params.page - 1) * (params.pageSize ?? 20);
  }

  if (params.search) {
    queryParams.search = params.search;
  }

  if (params.geometry_type) {
    queryParams.geometry_type = params.geometry_type;
  }

  if (params.srid) {
    queryParams.srid = params.srid;
  }

  if (params.ordering) {
    queryParams.ordering = params.ordering;
  }

  const response = await api.get<GISLocationListResponse>('gis-locations/', {
    params: queryParams,
  });
  return response.data;
}

export async function getGISLocation(id: string) {
  const response = await api.get<GISLocation>(`gis-locations/${id}/`);
  return response.data;
}

export async function updateGISLocation(id: string, payload: Partial<GISLocation>) {
  const response = await api.patch<GISLocation>(`gis-locations/${id}/`, payload);
  return response.data;
}
