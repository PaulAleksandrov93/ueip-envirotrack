import datetime

from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from backend.models import Building, EnviromentalParameters, Responsible, Room, UserFilterPreference


class RoomFilterTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user('ivanov', password='pass12345')
        cls.other_user = User.objects.create_user('petrova', password='pass12345')
        cls.me = Responsible.objects.create(user=cls.user, last_name='Иванов', first_name='С', patronymic='П')
        cls.other = Responsible.objects.create(user=cls.other_user, last_name='Петрова', first_name='А', patronymic='В')

        b1 = Building.objects.create(building_number='1')
        b7 = Building.objects.create(building_number='7')
        cls.my_room = Room.objects.create(building=b1, room_number='101')
        cls.my_room.responsible_persons.add(cls.me)
        cls.other_room = Room.objects.create(building=b7, room_number='101')
        cls.other_room.responsible_persons.add(cls.other)

        today = datetime.date(2026, 10, 1)
        cls.my_record = EnviromentalParameters.objects.create(room=cls.my_room, responsible=cls.me, created_at=today)
        cls.other_record = EnviromentalParameters.objects.create(
            room=cls.other_room, responsible=cls.other, created_at=today - datetime.timedelta(days=5),
        )
        # Ivanov filled in a record for someone else's room — it still counts as "mine".
        cls.my_record_in_other_room = EnviromentalParameters.objects.create(
            room=cls.other_room, responsible=cls.me, created_at=today,
        )

    def ids(self, response):
        self.assertEqual(response.status_code, 200)
        return {item['id'] for item in response.json()}

    def test_mine_returns_own_rooms_and_own_records(self):
        self.client.force_authenticate(self.user)
        got = self.ids(self.client.get('/api/filterParameters/', {'mine': '1'}))
        self.assertEqual(got, {self.my_record.id, self.my_record_in_other_room.id})

    def test_mine_for_anonymous_is_empty(self):
        self.assertEqual(self.ids(self.client.get('/api/filterParameters/', {'mine': '1'})), set())

    def test_rooms_filter_uses_ids_not_numbers(self):
        got = self.ids(self.client.get('/api/filterParameters/', {'rooms': str(self.other_room.id)}))
        self.assertEqual(got, {self.other_record.id, self.my_record_in_other_room.id})

    def test_open_ended_date_range(self):
        got = self.ids(self.client.get('/api/filterParameters/', {'start_date': '2026-09-30'}))
        self.assertEqual(got, {self.my_record.id, self.my_record_in_other_room.id})

    def test_list_payload_has_building_number(self):
        data = self.client.get('/api/filterParameters/', {'rooms': str(self.my_room.id)}).json()
        self.assertEqual(data[0]['room']['building_number'], '1')


class FilterPreferenceTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user('ivanov', password='pass12345')
        cls.other_user = User.objects.create_user('petrova', password='pass12345')

    def test_requires_auth(self):
        self.assertEqual(self.client.get('/api/filter_preferences/rooms/').status_code, 401)

    def test_unknown_scope(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get('/api/filter_preferences/nope/').status_code, 404)

    def test_put_sanitizes_and_is_per_user(self):
        self.client.force_authenticate(self.user)
        response = self.client.put('/api/filter_preferences/rooms/', {
            'filters': {'rooms': [3, 'x', 1, 3], 'mine': 1, 'start_date': '2026-10-01', 'end_date': 'oops', 'junk': True},
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['filters'], {
            'responsible': [], 'rooms': [1, 3], 'mine': True, 'start_date': '2026-10-01', 'end_date': '',
        })

        self.client.force_authenticate(self.other_user)
        self.assertIsNone(self.client.get('/api/filter_preferences/rooms/').json()['filters'])

    def test_put_overwrites_and_delete_resets(self):
        self.client.force_authenticate(self.user)
        self.client.put('/api/filter_preferences/buildings/', {'filters': {'buildings': [1]}}, format='json')
        self.client.put('/api/filter_preferences/buildings/', {'filters': {'buildings': [2]}}, format='json')
        self.assertEqual(UserFilterPreference.objects.filter(user=self.user).count(), 1)
        self.assertEqual(self.client.get('/api/filter_preferences/buildings/').json()['filters']['buildings'], [2])

        self.assertEqual(self.client.delete('/api/filter_preferences/buildings/').status_code, 204)
        self.assertIsNone(self.client.get('/api/filter_preferences/buildings/').json()['filters'])
