import uuid

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from .validators import compute_centroid_and_bbox, parse_wkt, validate_srid


if settings.GIS_ENABLED:
    from django.contrib.gis.db import models as gis_models
    GeometryField = gis_models.GeometryField
    GistIndex = gis_models.GistIndex
else:
    GeometryField = models.TextField
    GistIndex = None


class GISBaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now, editable=False, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='%(class)s_created',
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='%(class)s_updated',
    )
    is_active = models.BooleanField(default=True, db_index=True)
    is_deleted = models.BooleanField(default=False, db_index=True)

    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=['is_active', 'is_deleted', 'created_at'], name='%(app_label)s_%(class)s_active_deleted_created_idx'),
        ]


class GISLocation(GISBaseModel):
    GEOMETRY_POINT = 'Point'
    GEOMETRY_POLYGON = 'Polygon'
    GEOMETRY_MULTIPOLYGON = 'MultiPolygon'

    GEOMETRY_CHOICES = [
        (GEOMETRY_POINT, 'Point'),
        (GEOMETRY_POLYGON, 'Polygon'),
        (GEOMETRY_MULTIPOLYGON, 'MultiPolygon'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    content_type = models.ForeignKey(ContentType, on_delete=models.PROTECT, null=True, blank=True)
    object_id = models.UUIDField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    geometry_type = models.CharField(max_length=20, choices=GEOMETRY_CHOICES, db_index=True)
    srid = models.IntegerField(default=4326, db_index=True)
    geometry = GeometryField(srid=4326) if settings.GIS_ENABLED else models.TextField()
    centroid = models.JSONField(null=True, blank=True)
    bounding_box = models.JSONField(null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)

    class Meta:
        verbose_name = 'GIS location'
        verbose_name_plural = 'GIS locations'
        indexes = [
            models.Index(fields=['geometry_type'], name='gislocation_geomtype_idx'),
            models.Index(fields=['srid'], name='gislocation_srid_idx'),
        ]
        if GistIndex is not None:
            indexes.append(GistIndex(fields=['geometry'], name='gislocation_geometry_gist_idx'))

    def clean(self):
        validate_srid(self.srid)
        geom_text = str(self.geometry) if self.geometry is not None else ''
        geom_type, coords = parse_wkt(geom_text)
        if geom_type.lower() != self.geometry_type.lower():
            raise ValidationError({'geometry': 'Geometry type does not match geometry string.'})

    def save(self, *args, **kwargs):
        geom_text = str(self.geometry) if self.geometry is not None else ''
        geom_type, coords = parse_wkt(geom_text)
        centroid, bbox = compute_centroid_and_bbox(geom_type, coords)
        self.geometry_type = geom_type.title()
        self.centroid = centroid
        self.bounding_box = bbox
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.name} ({self.geometry_type})'
