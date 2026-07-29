import re
from django.core.exceptions import ValidationError


SUPPORTED_GEOMETRY_TYPES = ('POINT', 'POLYGON', 'MULTIPOLYGON')


def validate_srid(value: int) -> None:
    if value is None:
        raise ValidationError('SRID is required.')
    if not isinstance(value, int) or value <= 0:
        raise ValidationError('SRID must be a positive integer.')


def parse_wkt(geometry: str):
    if not geometry or not geometry.strip():
        raise ValidationError('Geometry WKT is required.')

    text = geometry.strip()
    geom_type, shape = text.split('(', 1)
    geom_type = geom_type.strip().upper()
    if geom_type not in SUPPORTED_GEOMETRY_TYPES:
        raise ValidationError(f'Unsupported geometry type: {geom_type}.')

    if geom_type == 'POINT':
        if not shape.endswith(')'):
            raise ValidationError('Invalid POINT WKT.')
        coords = shape[:-1].strip()
        parts = re.split(r'\s+', coords)
        if len(parts) != 2:
            raise ValidationError('POINT must have exactly two coordinates.')
        try:
            x = float(parts[0])
            y = float(parts[1])
        except ValueError:
            raise ValidationError('POINT coordinates must be numeric.')
        return geom_type, [(x, y)]

    if geom_type == 'POLYGON':
        inner = shape.strip()
        if not inner.startswith('(') or not inner.endswith('))'):
            raise ValidationError('Invalid POLYGON WKT.')
        rings = inner[1:-1].strip()
        coords_text = rings.split('),(')
        rings_coords = []
        for ring_text in coords_text:
            ring_text = ring_text.replace('(', '').replace(')', '').strip()
            points = []
            for point_text in ring_text.split(','):
                parts = re.split(r'\s+', point_text.strip())
                if len(parts) != 2:
                    raise ValidationError('POLYGON coordinate pairs must contain two values.')
                try:
                    x = float(parts[0])
                    y = float(parts[1])
                except ValueError:
                    raise ValidationError('POLYGON coordinates must be numeric.')
                points.append((x, y))
            if len(points) < 4:
                raise ValidationError('POLYGON must contain at least four points.')
            rings_coords.append(points)
        return geom_type, rings_coords

    if geom_type == 'MULTIPOLYGON':
        if not shape.startswith('(') or not shape.endswith('))'):
            raise ValidationError('Invalid MULTIPOLYGON WKT.')
        body = shape[1:-1].strip()
        polygon_texts = re.split(r'\)\s*\)\s*,\s*\(\s*\(', body)
        multipolygon_coords = []
        for poly_text in polygon_texts:
            poly_text = poly_text.strip('() ')
            polygon = []
            ring_texts = re.split(r'\)\s*,\s*\(', poly_text)
            for ring_text in ring_texts:
                ring_text = ring_text.strip('() ')
                points = []
                for point_text in ring_text.split(','):
                    parts = re.split(r'\s+', point_text.strip())
                    if len(parts) != 2:
                        raise ValidationError('MULTIPOLYGON coordinate pairs must contain two values.')
                    try:
                        x = float(parts[0])
                        y = float(parts[1])
                    except ValueError:
                        raise ValidationError('MULTIPOLYGON coordinates must be numeric.')
                    points.append((x, y))
                if points:
                    polygon.append(points)
            if polygon:
                multipolygon_coords.append(polygon)
        if not multipolygon_coords:
            raise ValidationError('MULTIPOLYGON must contain at least one polygon.')
        return geom_type, multipolygon_coords

    raise ValidationError('Could not parse WKT geometry.')


def compute_centroid_and_bbox(geom_type: str, coords):
    if geom_type == 'POINT':
        x, y = coords[0]
        return {'x': x, 'y': y}, [x, y, x, y]

    flattened = []
    if geom_type == 'POLYGON':
        for ring in coords:
            flattened.extend(ring)
    elif geom_type == 'MULTIPOLYGON':
        for polygon in coords:
            for ring in polygon:
                flattened.extend(ring)

    xs = [pt[0] for pt in flattened]
    ys = [pt[1] for pt in flattened]
    if not xs or not ys:
        raise ValidationError('Geometry must contain coordinate values.')

    bbox = [min(xs), min(ys), max(xs), max(ys)]
    centroid = {'x': sum(xs) / len(xs), 'y': sum(ys) / len(ys)}
    return centroid, bbox
