from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from backend.models import Responsible, Room, EnviromentalParameters, MeasurementInstrument
from django.contrib.auth.models import User

class EnviromentalParametersTests(APITestCase):
    def setUp(self):
        # Создаем тестовые данные
        self.responsible = Responsible.objects.create(
            last_name='Doe',
            first_name='John',
            patronymic='Smith'
        )
        self.room = Room.objects.create(
            room_number='101'
        )
        self.instrument = MeasurementInstrument.objects.create(
            name='Test Instrument',
            type='Test Type',
            serial_number='123',
            calibration_date='2023-09-30',
            calibration_interval=6
        )
        self.parameter = EnviromentalParameters.objects.create(
            temperature_celsius=25.0,
            humidity_percentage=50.0,
            pressure_kpa=101.0,
            pressure_mmhg=760.0,
            date_time='2023-09-30T12:00:00Z',
            room=self.room,
            responsible=self.responsible,
            measurement_instrument=self.instrument
        )

    def test_get_environ_params_list(self):
        url = reverse('get-environmental-parameters')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_create_environ_params(self):
        url = reverse('create-environmental-parameters')
        data = {
            'temperature_celsius': 20.0,
            'humidity_percentage': 60.0,
            'pressure_kpa': 100.0,
            'pressure_mmhg': 750.0,
            'date_time': '2023-09-30T13:00:00Z',
            'room': self.room.id,
            'responsible': self.responsible.id,
            'measurement_instrument': self.instrument.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(EnviromentalParameters.objects.count(), 2)

    def test_get_environ_param_detail(self):
        url = reverse('get-environmental-parameter', args=[self.parameter.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.parameter.id)

    def test_update_environ_param(self):
        url = reverse('update-environmental-parameter', args=[self.parameter.id])
        data = {
            'temperature_celsius': 22.0,
            'humidity_percentage': 55.0,
            'pressure_kpa': 102.0,
            'pressure_mmhg': 765.0,
            'date_time': '2023-09-30T14:00:00Z',
            'room': self.room.id,
            'responsible': self.responsible.id,
            'measurement_instrument': self.instrument.id
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.parameter.refresh_from_db()
        self.assertEqual(self.parameter.temperature_celsius, 22.0)
        self.assertEqual(self.parameter.humidity_percentage, 55.0)
        self.assertEqual(self.parameter.pressure_kpa, 102.0)
        self.assertEqual(self.parameter.pressure_mmhg, 765.0)
        self.assertEqual(str(self.parameter.date_time), '2023-09-30 14:00:00+00:00')

    def test_delete_environ_param(self):
        url = reverse('delete-environmental-parameter', args=[self.parameter.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(EnviromentalParameters.objects.count(), 0)
        
        
class JWTAuthenticationTests(APITestCase):
    def setUp(self):
        # Создаем тестового пользователя
        self.user = User.objects.create_user(username='testuser', password='testpassword')

    def test_obtain_jwt_token(self):
        url = '/api/token/'
        data = {'username': 'testuser', 'password': 'testpassword'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_refresh_jwt_token(self):
        url = '/api/token/refresh/'
        data = {'refresh': 'refresh_token_here'}  # Подставьте реальный refresh token
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
