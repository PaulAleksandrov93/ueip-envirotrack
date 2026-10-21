import datetime
import shutil
import tempfile

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from backend.models import Document, MeasurementInstrument, ResponsibleList


class InstrumentSearchTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        today = timezone.now().date()
        cls.hygrometer = MeasurementInstrument.objects.create(
            name='Термогигрометр', type='ИВА-6Н-Д', serial_number='12345', registration_number='46434-11',
            metrological_characteristics='ПГ ±2 %', calibration_date=datetime.date(2026, 5, 12),
            calibration_interval=12, year_of_manufacture=2019,
        )
        cls.barometer = MeasurementInstrument.objects.create(
            name='Барометр', type='БАММ-1', serial_number='A-778', registration_number='5738-76',
            metrological_characteristics='ПГ ±0,2 кПа', calibration_date=today - datetime.timedelta(days=500),
            calibration_interval=12, year_of_manufacture=2015,
        )

    def found(self, q):
        response = self.client.get('/api/filterMeasurementInstruments/', {'q': q})
        self.assertEqual(response.status_code, 200)
        return {item['id'] for item in response.json()}

    def test_text_fields(self):
        self.assertEqual(self.found('гигро'), {self.hygrometer.id})
        self.assertEqual(self.found('бамм'), {self.barometer.id})
        self.assertEqual(self.found('A-778'), {self.barometer.id})
        self.assertEqual(self.found('46434'), {self.hygrometer.id})
        self.assertEqual(self.found('кПа'), {self.barometer.id})

    def test_words_are_combined(self):
        self.assertEqual(self.found('ПГ 2019'), {self.hygrometer.id})
        self.assertEqual(self.found('Барометр 2019'), set())

    def test_numbers_and_dates(self):
        self.assertEqual(self.found('2015'), {self.barometer.id})
        self.assertEqual(self.found('12.05.2026'), {self.hygrometer.id})
        self.assertEqual(self.found('05.2026'), {self.hygrometer.id})
        self.assertEqual(self.found('11.05.2027'), {self.hygrometer.id})

    def test_suitability_words(self):
        self.assertEqual(self.found('годен'), {self.hygrometer.id})
        self.assertEqual(self.found('брак'), {self.barometer.id})

    def test_works_with_column_filters(self):
        response = self.client.get('/api/filterMeasurementInstruments/', {'q': 'ПГ', 'type': 'БАММ'})
        self.assertEqual({item['id'] for item in response.json()}, {self.barometer.id})


class DocumentAdminUploadTests(TestCase):
    def setUp(self):
        self.media = tempfile.mkdtemp()
        self.override = override_settings(MEDIA_ROOT=self.media, ALLOWED_HOSTS=['testserver'])
        self.override.enable()
        self.admin = User.objects.create_superuser('boss', '', 'pass12345')
        self.client.force_login(self.admin)

    def tearDown(self):
        self.override.disable()
        shutil.rmtree(self.media, ignore_errors=True)

    def upload(self, url, filename, content=b'%PDF-1.4 test', name=''):
        return self.client.post(url, {'name': name, 'file': SimpleUploadedFile(filename, content)})

    def test_new_upload_replaces_previous_file(self):
        self.upload('/admin/backend/document/add/', 'old.pdf')
        old = Document.objects.get()
        old_path = old.file.path

        response = self.upload('/admin/backend/document/add/', 'new.pdf')
        self.assertEqual(response.status_code, 302)

        current = Document.objects.get()
        self.assertNotEqual(current.pk, old.pk)
        self.assertEqual(current.name, 'Руководство пользователя')
        self.assertTrue(current.file.name.endswith('new.pdf'))
        import os
        self.assertFalse(os.path.exists(old_path))

        api = self.client.get('/api/documents/').json()
        self.assertEqual(api['file'], current.file.url)

    def test_rejects_unsupported_format(self):
        response = self.upload('/admin/backend/responsiblelist/add/', 'virus.exe', b'MZ')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(ResponsibleList.objects.exists())
        self.assertContains(response, 'exe')

    def test_custom_name_is_kept(self):
        self.upload('/admin/backend/responsiblelist/add/', 'list.xlsx', b'PK', name='Ответственные 2026')
        self.assertEqual(ResponsibleList.objects.get().name, 'Ответственные 2026')

    def test_list_page_shows_file_and_size(self):
        self.upload('/admin/backend/document/add/', 'guide.pdf')
        response = self.client.get('/admin/backend/document/')
        self.assertContains(response, 'guide.pdf')
        self.assertContains(response, 'КБ')
