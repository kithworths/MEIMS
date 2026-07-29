from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import GISLocation

User = get_user_model()


class GISLocationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='gis@example.com', password='pass')

    def test_create_point_location(self):
        location = GISLocation.objects.create(
            name='Office',
            geometry_type=GISLocation.GEOMETRY_POINT,
            srid=4326,
            geometry='POINT(30 10)',
            created_by=self.user,
            updated_by=self.user,
        )
        self.assertEqual(location.centroid, {'x': 30.0, 'y': 10.0})
        self.assertEqual(location.bounding_box, [30.0, 10.0, 30.0, 10.0])

    def test_create_polygon_location(self):
        location = GISLocation.objects.create(
            name='Parcel',
            geometry_type=GISLocation.GEOMETRY_POLYGON,
            srid=4326,
            geometry='POLYGON((0 0,0 1,1 1,1 0,0 0))',
            created_by=self.user,
            updated_by=self.user,
        )
        self.assertIn('x', location.centroid)
        self.assertIn('y', location.centroid)
        self.assertEqual(location.bounding_box, [0.0, 0.0, 1.0, 1.0])
