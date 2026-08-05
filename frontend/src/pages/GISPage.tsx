import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap, LayersControl, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import InputLabel from '@mui/material/InputLabel';
import CircularProgress from '@mui/material/CircularProgress';
import useAuth from '../auth/useAuth';
import { useGISLocations, useUpdateGISLocation } from '../hooks/useGIS';
import type { GISLocation } from '../api/gis';

const defaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const geometryTypes = ['Point', 'Polygon', 'MultiPolygon'];

function ResetView({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [bounds, map]);

  return null;
}

function BoundsWatcher({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds | null) => void }) {
  const map = useMap();

  useEffect(() => {
    const updateBounds = () => {
      onBoundsChange(map.getBounds());
    };

    updateBounds();
    map.on('moveend', updateBounds);

    return () => {
      map.off('moveend', updateBounds);
    };
  }, [map, onBoundsChange]);

  return null;
}

function parseWKTToLatLngs(geometry: string): L.LatLngExpression | L.LatLngExpression[] | L.LatLngExpression[][] {
  const trimmed = geometry.trim();

  if (trimmed.startsWith('POINT(')) {
    const coords = trimmed.slice(6, -1).split(' ').map(Number);
    return [coords[1], coords[0]] as L.LatLngExpression;
  }

  if (trimmed.startsWith('POLYGON((')) {
    const content = trimmed.slice(8, -2);
    return content
      .split(',')
      .map((pair) => pair.trim().split(' ').map(Number))
      .map(([x, y]) => [y, x] as [number, number]);
  }

  if (trimmed.startsWith('MULTIPOLYGON(((')) {
    const content = trimmed.slice(12, -3);
    return content.split(')),((').map((ringText) =>
      ringText
        .split(',')
        .map((pair) => pair.trim().split(' ').map(Number))
        .map(([x, y]) => [y, x] as [number, number]),
    );
  }

  return [];
}

function renderGeometryLayer(location: GISLocation) {
  const geometry = parseWKTToLatLngs(location.geometry);
  const popup = (
    <Popup>
      <Typography variant="subtitle2">{location.name}</Typography>
      <Typography variant="body2">{location.geometry_type}</Typography>
      <Typography variant="body2">{location.description}</Typography>
    </Popup>
  );

  if (location.geometry_type === 'Point' && Array.isArray(geometry)) {
    return (
      <Marker key={location.id} position={geometry as L.LatLngExpression} icon={defaultIcon}>
        {popup}
      </Marker>
    );
  }

  if (location.geometry_type === 'Polygon' && Array.isArray(geometry)) {
    return (
      <Polygon key={location.id} positions={geometry as L.LatLngExpression[]} pathOptions={{ color: '#1e88e5' }}>
        {popup}
      </Polygon>
    );
  }

  if (location.geometry_type === 'MultiPolygon' && Array.isArray(geometry)) {
    return (geometry as L.LatLngExpression[][]).map((ring, index) => (
      <Polygon key={`${location.id}-${index}`} positions={ring} pathOptions={{ color: '#43a047' }}>
        {index === 0 ? popup : null}
      </Polygon>
    ));
  }

  return null;
}

export default function GISPage() {
  const auth = useAuth();
  const [search, setSearch] = useState('');
  const [geometryType, setGeometryType] = useState('');
  const [srid, setSrid] = useState('4326');
  const [selectedLocation, setSelectedLocation] = useState<GISLocation | null>(null);
  const [onlyVisibleOnMap, setOnlyVisibleOnMap] = useState(false);
  const [visibleBounds, setVisibleBounds] = useState<L.LatLngBounds | null>(null);
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');
  const [geometryText, setGeometryText] = useState('');

  const updateMutation = useUpdateGISLocation();
  const actualSrid = Number(srid) || undefined;
  const { data, isLoading, refetch } = useGISLocations({
    page: 1,
    pageSize: 100,
    search,
    geometry_type: geometryType || undefined,
    srid: actualSrid,
    ordering: '-created_at',
  });

  const locations = data?.results ?? [];

  const activeLocations = useMemo(() => locations.filter((location) => !location.is_deleted && location.is_active), [locations]);

  const filteredLocations = useMemo(() => {
    if (!onlyVisibleOnMap || !visibleBounds) return activeLocations;
    return activeLocations.filter((location) => {
      if (!location.centroid) return false;
      return visibleBounds.contains(L.latLng(location.centroid.y, location.centroid.x));
    });
  }, [activeLocations, onlyVisibleOnMap, visibleBounds]);

  const bounds = useMemo(() => {
    const latlngs = activeLocations
      .flatMap((location) => (location.centroid ? [[location.centroid.y, location.centroid.x]] as [number, number][] : []));
    if (latlngs.length === 0) return null;
    return L.latLngBounds(latlngs);
  }, [activeLocations]);

  useEffect(() => {
    if (!selectedLocation) return;
    setLocationName(selectedLocation.name);
    setDescription(selectedLocation.description ?? '');
    setGeometryText(selectedLocation.geometry);
  }, [selectedLocation]);

  const handleSearch = () => {
    refetch();
  };

  const handleLocationSelect = useCallback((location: GISLocation) => {
    setSelectedLocation(location);
  }, []);

  const handleSaveCoordinates = async () => {
    if (!selectedLocation) return;
    await updateMutation.mutateAsync({
      id: selectedLocation.id,
      payload: {
        name: locationName,
        description,
        geometry: geometryText,
      },
    });
    await refetch();
  };

  if (!auth.hasPermission('gis.Read')) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6">You do not have permission to view GIS locations.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="overline" color="text.secondary" gutterBottom>
        GIS
      </Typography>
      <Typography variant="h4" gutterBottom>
        Spatial operations
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Browse project, stand, and inspection locations on the enterprise map.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={3}>
          <Card sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Filters
            </Typography>
            <TextField
              label="Search locations"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              margin="dense"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel id="geometry-type-label">Geometry type</InputLabel>
              <Select
                labelId="geometry-type-label"
                value={geometryType}
                label="Geometry type"
                onChange={(e) => setGeometryType(e.target.value)}
              >
                <MenuItem value="">All types</MenuItem>
                {geometryTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="SRID"
              value={srid}
              onChange={(e) => setSrid(e.target.value)}
              fullWidth
              margin="dense"
            />
            <FormControlLabel
              control={<Checkbox checked={onlyVisibleOnMap} onChange={(e) => setOnlyVisibleOnMap(e.target.checked)} />}
              label="Only visible locations"
            />
            <Button sx={{ mt: 2 }} variant="contained" fullWidth onClick={handleSearch}>
              Apply filters
            </Button>
          </Card>

          <Card sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Location list
            </Typography>
            {isLoading ? (
              <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            ) : filteredLocations.length === 0 ? (
              <Typography>No locations found.</Typography>
            ) : (
              <Box sx={{ display: 'grid', gap: 1 }}>
                {filteredLocations.map((location) => (
                  <Paper
                    key={location.id}
                    variant="outlined"
                    sx={{ p: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => handleLocationSelect(location)}
                  >
                    <Typography fontWeight={700}>{location.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {location.geometry_type} • {location.description ?? 'No description'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {location.centroid ? `Lat ${location.centroid.y.toFixed(6)}, Lon ${location.centroid.x.toFixed(6)}` : 'No centroid'}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </Card>

          {selectedLocation && (
            <Card sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Selected location
              </Typography>
              <TextField
                label="Name"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                fullWidth
                margin="dense"
              />
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                margin="dense"
                multiline
                minRows={2}
              />
              <TextField
                label="Geometry WKT"
                value={geometryText}
                onChange={(e) => setGeometryText(e.target.value)}
                fullWidth
                margin="dense"
                multiline
                minRows={4}
              />
              <Button
                sx={{ mt: 2 }}
                variant="contained"
                fullWidth
                onClick={handleSaveCoordinates}
                disabled={updateMutation.status === 'pending'}
              >
                Save coordinates
              </Button>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} lg={9}>
          <Card sx={{ height: 'calc(100vh - 120px)', minHeight: 520 }}>
            <MapContainer
              center={bounds ? [bounds.getCenter().lat, bounds.getCenter().lng] : [0, 0]}
              zoom={bounds ? 5 : 2}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="OpenStreetMap">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                </LayersControl.BaseLayer>
                <LayersControl.Overlay checked name="GIS locations">
                  <LayerGroup>
                    {filteredLocations.map((location) => renderGeometryLayer(location))}
                  </LayerGroup>
                </LayersControl.Overlay>
              </LayersControl>
              {bounds && <ResetView bounds={bounds} />}
              <BoundsWatcher onBoundsChange={setVisibleBounds} />
            </MapContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
