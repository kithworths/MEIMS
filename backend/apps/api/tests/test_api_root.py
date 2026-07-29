from django.test import Client, TestCase


class ApiRootTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_api_root_returns_ok(self):
        response = self.client.get('/api/')

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])
        self.assertEqual(response.json()['data']['service'], 'MEIMS')
        self.assertEqual(response.json()['data']['status'], 'ok')

    def test_health_endpoint_returns_ok(self):
        response = self.client.get('/api/health/')

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])
        self.assertEqual(response.json()['data']['status'], 'ok')
        self.assertEqual(response.json()['data']['database'], 'configured')
