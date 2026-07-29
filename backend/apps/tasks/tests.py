from datetime import timedelta

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from apps.projects.models import Project
from apps.stands.models import Stand, StandStage, StandStageTransition
from .models import (
    EngineerTicket,
    EngineerTicketHistory,
    ProjectTask,
    ServiceType,
    SiteInspection,
    SiteVisit,
    TaskHistory,
)


User = get_user_model()


class TasksAPITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='opsuser@example.com', password='pass')
        self.user.is_superuser = True
        self.user.is_staff = True
        self.user.save()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.project = Project.objects.create(code='PRJ100', name='Operations Project')
        self.stand = Stand.objects.create(
            project=self.project,
            code='STAND100',
            name='Operations Stand',
            status=Stand.STATUS_ACTIVE,
            area_sq_m=150,
        )
        self.stage = StandStage.objects.create(code='START', name='Start', ordinal=1)
        self.next_stage = StandStage.objects.create(code='NEXT', name='Next', ordinal=2)
        StandStageTransition.objects.create(from_stage=self.stage, to_stage=self.next_stage)
        self.stand.current_stage = self.stage
        self.stand.save()

    def test_create_service_type(self):
        payload = {
            'code': 'ELECTRICAL',
            'name': 'Electrical Service',
            'description': 'Electrical work description',
        }
        response = self.client.post('/api/v1/service-types/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['code'], 'ELECTRICAL')
        self.assertEqual(ServiceType.objects.count(), 1)

    def test_create_project_task_and_history(self):
        service_type = ServiceType.objects.create(code='SERV001', name='General Service')
        payload = {
            'project': str(self.project.id),
            'stand': str(self.stand.id),
            'service_type': str(service_type.id),
            'title': 'Install power cabinet',
            'description': 'Cabinet to be installed on site',
            'priority': 'High',
            'status': 'Open',
            'estimated_hours': '12.50',
        }
        response = self.client.post('/api/v1/project-tasks/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        task_id = response.data['id']

        update_payload = {
            'row_version': response.data['row_version'],
            'status': 'In Progress',
            'assignee': str(self.user.id),
            'spent_hours': '2.00',
        }
        update_response = self.client.patch(f'/api/v1/project-tasks/{task_id}/', update_payload, format='json')
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(ProjectTask.objects.get(id=task_id).status, 'In Progress')
        self.assertEqual(TaskHistory.objects.filter(task_id=task_id).count(), 1)

    def test_project_task_optimistic_locking(self):
        task = ProjectTask.objects.create(
            project=self.project,
            stand=self.stand,
            title='Lock test',
            status='Open',
            priority='Medium',
            row_version=1,
        )
        payload = {
            'row_version': 0,
            'status': 'Blocked',
        }
        response = self.client.patch(f'/api/v1/project-tasks/{task.id}/', payload, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('row_version', response.data['errors'])

    def test_engineer_ticket_lifecycle_and_history(self):
        payload = {
            'project': str(self.project.id),
            'stand': str(self.stand.id),
            'title': 'Ticket Lifecycle Test',
            'description': 'Track engineer ticket workflow',
            'priority': 'High',
            'status': 'Open',
        }
        response = self.client.post('/api/v1/engineer-tickets/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        ticket_id = response.data['id']

        update_payload = {
            'status': 'Assigned',
            'assignee': str(self.user.id),
        }
        response = self.client.patch(f'/api/v1/engineer-tickets/{ticket_id}/', update_payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(EngineerTicket.objects.get(id=ticket_id).status, 'Assigned')
        self.assertEqual(EngineerTicketHistory.objects.filter(ticket_id=ticket_id).count(), 1)

    def test_site_visit_overlapping_booking(self):
        payload = {
            'stand': str(self.stand.id),
            'engineer': str(self.user.id),
            'scheduled_start': timezone.now().isoformat(),
            'scheduled_end': (timezone.now() + timezone.timedelta(hours=2)).isoformat(),
        }
        response = self.client.post('/api/v1/site-visits/', payload, format='json')
        self.assertEqual(response.status_code, 201)

        overlap_payload = {
            'stand': str(self.stand.id),
            'engineer': str(self.user.id),
            'scheduled_start': (timezone.now() + timedelta(minutes=30)).isoformat(),
            'scheduled_end': (timezone.now() + timedelta(hours=1, minutes=30)).isoformat(),
        }
        response = self.client.post('/api/v1/site-visits/', overlap_payload, format='json')
        self.assertEqual(response.status_code, 400)

    def test_site_inspection_failure_creates_ticket_and_holds_stand(self):
        payload = {
            'stand': str(self.stand.id),
            'inspector': str(self.user.id),
            'result': 'Fail',
            'comments': 'Safety issues detected',
        }
        response = self.client.post('/api/v1/site-inspections/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        inspection_id = response.data['id']
        inspection = SiteInspection.objects.get(id=inspection_id)
        self.assertIsNotNone(inspection.follow_up_ticket)
        self.stand.refresh_from_db()
        self.assertEqual(self.stand.status, Stand.STATUS_ON_HOLD)

    def test_site_inspection_approval_creates_stage_history(self):
        payload = {
            'stand': str(self.stand.id),
            'inspector': str(self.user.id),
            'result': 'Pass',
            'comments': 'Inspection passed',
            'target_stage': str(self.next_stage.id),
        }
        response = self.client.post('/api/v1/site-inspections/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        self.stand.refresh_from_db()
        self.assertEqual(self.stand.current_stage, self.next_stage)
        self.assertEqual(self.stand.status, Stand.STATUS_ACTIVE)
