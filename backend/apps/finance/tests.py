from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.projects.models import Project
from apps.stands.models import Stand
from apps.tasks.models import ServiceType
from .models import Payment, PaymentReceipt
from .services import PaymentService, PaymentReceiptService

User = get_user_model()


class FinanceModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='finance@example.com', password='pass')
        self.project = Project.objects.create(code='PROJ1', name='Finance Project', created_by=self.user, updated_by=self.user)
        self.stand = Stand.objects.create(project=self.project, code='ST1', name='Finance Stand', created_by=self.user, updated_by=self.user)
        self.service_type = ServiceType.objects.create(code='SERV001', name='Service Payment', created_by=self.user, updated_by=self.user)

    def test_create_project_payment(self):
        payment = PaymentService.create(
            payment_type=Payment.PAYMENT_PROJECT,
            project=self.project,
            amount=Decimal('1000.00'),
            currency='USD',
            exchange_rate=Decimal('1.000000'),
            notes='Project payment',
            created_by=self.user,
            updated_by=self.user,
        )
        self.assertEqual(payment.status, Payment.STATUS_POSTED)
        self.assertEqual(payment.base_amount, Decimal('1000.00'))
        self.assertTrue(payment.reference.startswith('PAY-'))

    def test_reverse_payment(self):
        payment = PaymentService.create(
            payment_type=Payment.PAYMENT_PROJECT,
            project=self.project,
            amount=Decimal('200.00'),
            currency='USD',
            exchange_rate=Decimal('1.000000'),
            notes='Project payment',
            created_by=self.user,
            updated_by=self.user,
        )
        reversal = PaymentService.reverse(payment, 'Duplicate entry', user=self.user)
        self.assertEqual(reversal.payment_type, Payment.PAYMENT_REVERSAL)
        self.assertEqual(reversal.amount, Decimal('-200.00'))
        self.assertEqual(reversal.original_payment, payment)

    def test_issue_and_verify_receipt(self):
        payment = PaymentService.create(
            payment_type=Payment.PAYMENT_STAND,
            stand=self.stand,
            amount=Decimal('500.00'),
            currency='USD',
            exchange_rate=Decimal('1.000000'),
            notes='Stand payment',
            created_by=self.user,
            updated_by=self.user,
        )
        receipt = PaymentReceiptService.issue(payment, {'amount': '500.00', 'reference': payment.reference}, user=self.user)
        self.assertTrue(receipt.receipt_number.startswith('RPT-'))
        self.assertEqual(receipt.status, PaymentReceipt.STATUS_ISSUED)
        verified = PaymentReceiptService.verify(receipt, receipt.verification_hash, user=self.user)
        self.assertTrue(verified)
        self.assertEqual(receipt.status, PaymentReceipt.STATUS_VERIFIED)

    def test_reprint_receipt_and_verify_reprint(self):
        payment = PaymentService.create(
            payment_type=Payment.PAYMENT_STAND,
            stand=self.stand,
            amount=Decimal('250.00'),
            currency='USD',
            exchange_rate=Decimal('1.000000'),
            notes='Stand payment',
            created_by=self.user,
            updated_by=self.user,
        )
        receipt = PaymentReceiptService.issue(payment, {'amount': '250.00', 'reference': payment.reference}, user=self.user)
        reprint = PaymentReceiptService.reprint(receipt, user=self.user)
        self.assertEqual(reprint.original_receipt, receipt)
        self.assertEqual(reprint.status, PaymentReceipt.STATUS_REPRINTED)

        verified = PaymentReceiptService.verify(reprint, reprint.verification_hash, user=self.user)
        self.assertTrue(verified)
        self.assertEqual(reprint.status, PaymentReceipt.STATUS_VERIFIED)
