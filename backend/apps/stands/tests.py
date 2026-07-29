from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.projects.models import Project
from .models import StageHistory, Stand, StandStage, StandStageTransition


User = get_user_model()


class StandStageTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='stageuser@example.com', password='pass')
        self.user.is_superuser = True
        self.user.is_staff = True
        self.user.save()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_stand_stage(self):
        payload = {
            'code': 'MOBILIZATION',
            'name': 'Mobilization',
            'description': 'Initial mobilization stage',
            'ordinal': 10,
        }
        response = self.client.post('/api/v1/stand-stages/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['code'], 'MOBILIZATION')
        self.assertEqual(StandStage.objects.count(), 1)

    def test_code_validation(self):
        payload = {'code': 'invalid code', 'name': 'Invalid', 'ordinal': 1}
        response = self.client.post('/api/v1/stand-stages/', payload, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('code', response.data['errors'])

    def test_create_stand_stage_transition(self):
        from_stage = StandStage.objects.create(code='STAGE_ONE', name='Stage One', ordinal=1)
        to_stage = StandStage.objects.create(code='STAGE_TWO', name='Stage Two', ordinal=2)
        payload = {
            'from_stage': str(from_stage.id),
            'to_stage': str(to_stage.id),
            'requires_approval': True,
        }
        response = self.client.post('/api/v1/stand-stage-transitions/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['from_stage'], from_stage.id)
        self.assertEqual(response.data['to_stage'], to_stage.id)
        self.assertTrue(response.data['requires_approval'])
        self.assertEqual(StandStageTransition.objects.count(), 1)

    def test_duplicate_stand_stage_transition(self):
        from_stage = StandStage.objects.create(code='STAGE_ONE', name='Stage One', ordinal=1)
        to_stage = StandStage.objects.create(code='STAGE_TWO', name='Stage Two', ordinal=2)
        StandStageTransition.objects.create(from_stage=from_stage, to_stage=to_stage)
        payload = {
            'from_stage': str(from_stage.id),
            'to_stage': str(to_stage.id),
            'requires_approval': False,
        }
        response = self.client.post('/api/v1/stand-stage-transitions/', payload, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('non_field_errors', response.data['errors'])

    def test_invalid_same_stage_transition(self):
        stage = StandStage.objects.create(code='STAGE_ONE', name='Stage One', ordinal=1)
        payload = {
            'from_stage': str(stage.id),
            'to_stage': str(stage.id),
            'requires_approval': False,
        }
        response = self.client.post('/api/v1/stand-stage-transitions/', payload, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('to_stage', response.data['errors'])

    def test_create_stand(self):
        project = Project.objects.create(code='PRJ001', name='Test Project')
        stage = StandStage.objects.create(code='STAGE_ONE', name='Stage One', ordinal=1)
        payload = {
            'project': str(project.id),
            'code': 'STAND001',
            'name': 'Stand One',
            'description': 'First stand',
            'stand_type': 'Retail',
            'current_stage': str(stage.id),
            'gis_location_id': str(stage.id),
            'address': '123 Main St',
            'area_sq_m': '250.00',
            'status': 'Active',
        }
        response = self.client.post('/api/v1/stands/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['code'], 'STAND001')
        self.assertEqual(response.data['project'], project.id)
        self.assertEqual(response.data['current_stage'], stage.id)
        self.assertEqual(response.data['area_sq_m'], '250.00')

    def test_stand_code_unique_within_project(self):
        project = Project.objects.create(code='PRJ001', name='Test Project')
        stage = StandStage.objects.create(code='STAGE_ONE', name='Stage One', ordinal=1)
        Stand.objects.create(
            project=project,
            code='STAND001',
            name='Stand One',
            current_stage=stage,
            status='Active',
            area_sq_m=100,
        )
        payload = {
            'project': str(project.id),
            'code': 'STAND001',
            'name': 'Stand Duplicate',
            'current_stage': str(stage.id),
            'status': 'Active',
            'area_sq_m': '100.00',
        }
        response = self.client.post('/api/v1/stands/', payload, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('non_field_errors', response.data['errors'])

    def test_stand_area_validation(self):
        project = Project.objects.create(code='PRJ001', name='Test Project')
        payload = {
            'project': str(project.id),
            'code': 'STAND002',
            'name': 'Stand Two',
            'address': '456 Side St',
            'area_sq_m': '-50.00',
            'status': 'Planned',
        }
        response = self.client.post('/api/v1/stands/', payload, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('area_sq_m', response.data['errors'])

    def test_create_stage_history_updates_stand_current_stage(self):
        project = Project.objects.create(code='PRJ001', name='Test Project')
        from_stage = StandStage.objects.create(code='STAGE_ONE', name='Stage One', ordinal=1)
        to_stage = StandStage.objects.create(code='STAGE_TWO', name='Stage Two', ordinal=2)
        stand = Stand.objects.create(
            project=project,
            code='STAND001',
            name='Stand One',
            current_stage=from_stage,
            status='Active',
            area_sq_m=100,
        )
        StandStageTransition.objects.create(from_stage=from_stage, to_stage=to_stage)
        payload = {
            'stand': str(stand.id),
            'from_stage': str(from_stage.id),
            'to_stage': str(to_stage.id),
            'reason': 'Moving to next stage',
        }
        response = self.client.post('/api/v1/stage-history/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        stand.refresh_from_db()
        self.assertEqual(stand.current_stage, to_stage)
        self.assertEqual(StageHistory.objects.count(), 1)

    def test_stage_history_invalid_when_transition_not_allowed(self):
        project = Project.objects.create(code='PRJ002', name='Test Project')
        from_stage = StandStage.objects.create(code='STAGE_ONE', name='Stage One', ordinal=1)
        to_stage = StandStage.objects.create(code='STAGE_THREE', name='Stage Three', ordinal=3)
        stand = Stand.objects.create(
            project=project,
            code='STAND002',
            name='Stand Two',
            current_stage=from_stage,
            status='Active',
            area_sq_m=150,
        )
        payload = {
            'stand': str(stand.id),
            'from_stage': str(from_stage.id),
            'to_stage': str(to_stage.id),
            'reason': 'Attempt invalid transition',
        }
        response = self.client.post('/api/v1/stage-history/', payload, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('non_field_errors', response.data['errors'])

    def test_override_stage_history_requires_reason(self):
        project = Project.objects.create(code='PRJ003', name='Test Project')
        from_stage = StandStage.objects.create(code='STAGE_ONE', name='Stage One', ordinal=1)
        to_stage = StandStage.objects.create(code='STAGE_FOUR', name='Stage Four', ordinal=4)
        stand = Stand.objects.create(
            project=project,
            code='STAND003',
            name='Stand Three',
            current_stage=from_stage,
            status='Active',
            area_sq_m=200,
        )
        payload = {
            'stand': str(stand.id),
            'from_stage': str(from_stage.id),
            'to_stage': str(to_stage.id),
            'is_override': True,
        }
        response = self.client.post('/api/v1/stage-history/', payload, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('reason', response.data['errors'])

    def test_override_stage_history_allows_admin_transition(self):
        project = Project.objects.create(code='PRJ004', name='Test Project')
        from_stage = StandStage.objects.create(code='STAGE_ONE', name='Stage One', ordinal=1)
        to_stage = StandStage.objects.create(code='STAGE_FIVE', name='Stage Five', ordinal=5)
        stand = Stand.objects.create(
            project=project,
            code='STAND004',
            name='Stand Four',
            current_stage=from_stage,
            status='Active',
            area_sq_m=250,
        )
        payload = {
            'stand': str(stand.id),
            'from_stage': str(from_stage.id),
            'to_stage': str(to_stage.id),
            'is_override': True,
            'reason': 'Administrator correction',
        }
        response = self.client.post('/api/v1/stage-history/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        stand.refresh_from_db()
        self.assertEqual(stand.current_stage, to_stage)
        self.assertEqual(StageHistory.objects.count(), 1)
