import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as gisApi from '../api/gis';

export interface GISQueryOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  geometry_type?: string;
  srid?: number;
  ordering?: string;
}

export function useGISLocations(options: GISQueryOptions = {}) {
  const { page = 1, pageSize = 20, search, geometry_type, srid, ordering } = options;
  return useQuery<gisApi.GISLocationListResponse, Error>({
    queryKey: ['gis-locations', page, pageSize, search, geometry_type, srid, ordering],
    queryFn: () => gisApi.getGISLocations({ page, pageSize, search, geometry_type, srid, ordering }),
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function useGISLocation(id?: string) {
  return useQuery<gisApi.GISLocation, Error>({
    queryKey: ['gis-location', id],
    queryFn: async () => {
      if (!id) throw new Error('GIS location id is required');
      return gisApi.getGISLocation(id);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useUpdateGISLocation() {
  const qc = useQueryClient();
  return useMutation<gisApi.GISLocation, Error, { id: string; payload: Partial<gisApi.GISLocation> }>(
    {
      mutationFn: ({ id, payload }) => gisApi.updateGISLocation(id, payload),
      onSuccess: (_data, variables) => {
        qc.invalidateQueries({ queryKey: ['gis-locations'] });
        qc.invalidateQueries({ queryKey: ['gis-location', variables.id] });
      },
    },
  );
}
