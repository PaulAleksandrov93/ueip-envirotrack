# generate_test_data.py

import os
import sys
import django
import random
from datetime import datetime, timedelta

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'envirotrack.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

django.setup()

from django.contrib.auth.models import User
from django.db import transaction
from backend.models import (
    Building, Room, Responsible, Profession, MeasurementInstrument,
    EnviromentalParameters, ParameterSet
)

def create_basic_data_if_needed():
    """
    Создает базовые объекты если их нет
    """
    print("=" * 60)
    print("ПОДГОТОВКА БАЗОВЫХ ДАННЫХ")
    print("=" * 60)
    
    # 1. Проверяем и создаем пользователя
    try:
        user = User.objects.filter(is_superuser=True).first()
        if not user:
            user = User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='admin123'
            )
            print(f"✓ Создан суперпользователь: {user.username}")
        else:
            print(f"✓ Используем существующего пользователя: {user.username}")
    except Exception as e:
        print(f"✗ Ошибка при создании пользователя: {e}")
        user = User.objects.first()
    
    # 2. Профессия
    profession, created = Profession.objects.get_or_create(
        name="Инженер-метролог",
        defaults={'name': "Инженер-метролог"}
    )
    if created:
        print(f"✓ Создана профессия: {profession.name}")
    else:
        print(f"✓ Профессия уже существует: {profession.name}")
    
    # 3. Ответственный
    responsible, created = Responsible.objects.get_or_create(
        last_name="Иванов",
        first_name="Иван",
        patronymic="Иванович",
        defaults={'profession': profession}
    )
    if created:
        print(f"✓ Создан ответственный: {responsible}")
    else:
        print(f"✓ Ответственный уже существует: {responsible}")
    
    # 4. Здание (НЕОБХОДИМО для создания помещения)
    building, created = Building.objects.get_or_create(
        building_number="1",
        defaults={
            'voltage_min': 220,
            'voltage_max': 240,
            'frequency_min': 49,
            'frequency_max': 51,
        }
    )
    if created:
        print(f"✓ Создано здание: {building.building_number}")
    else:
        print(f"✓ Здание уже существует: {building.building_number}")
    
    # 5. Помещение (ТЕПЕРЬ СВЯЗАНО СО ЗДАНИЕМ)
    room, created = Room.objects.get_or_create(
        building=building,  # <-- ВАЖНО: связываем со зданием
        room_number="101",
        defaults={
            'temperature_min': 18.0,
            'temperature_max': 25.0,
            'humidity_min': 30.0,
            'humidity_max': 60.0,
            'pressure_min_kpa': 95.0,
            'pressure_max_kpa': 105.0,
            'pressure_min_mmhg': 710.0,
            'pressure_max_mmhg': 790.0,
            'is_storage': False,
            'has_additional_parameters': False,
        }
    )
    if created:
        # Добавляем ответственного к помещению
        room.responsible_persons.add(responsible)
        print(f"✓ Создано помещение: {room.room_number}")
    else:
        print(f"✓ Помещение уже существует: {room.room_number}")
    
    # 6. Средство измерений
    instrument, created = MeasurementInstrument.objects.get_or_create(
        name="Термометр цифровой",
        type="электронный",
        serial_number="TEMP-001",
        defaults={
            'calibration_date': datetime.now().date(),
            'calibration_interval': 12,
            'year_of_manufacture': 2023,
            'registration_number': 'REG-001',
            'metrological_characteristics': '±0.5°C',
            'suitability': True
        }
    )
    if created:
        print(f"✓ Создано средство измерений: {instrument.name}")
    else:
        print(f"✓ Средство измерений уже существует: {instrument.name}")
    
    # 7. Добавляем ответственного к зданию
    building.responsible_persons.add(responsible)
    print(f"✓ Ответственный добавлен к зданию: {building.building_number}")
    
    print("=" * 60)
    return {
        'user': user,
        'building': building,
        'room': room,
        'responsible': responsible,
        'instrument': instrument
    }

@transaction.atomic
def create_test_parameters(num_records=10000):
    """
    Создает тестовые записи параметров
    """
    print("\n" + "=" * 60)
    print(f"СОЗДАНИЕ ТЕСТОВЫХ ЗАПИСЕЙ ({num_records} записей)")
    print("=" * 60)
    
    # Получаем базовые данные
    data = create_basic_data_if_needed()
    
    # Проверяем текущее количество записей
    current_count = EnviromentalParameters.objects.count()
    print(f"\nТекущее количество записей в базе: {current_count}")
    
    if current_count >= num_records:
        print(f"✓ Уже достаточно записей ({current_count} >= {num_records})")
        return current_count
    
    records_to_create = num_records - current_count
    print(f"✓ Будет создано новых записей: {records_to_create}")
    
    # Настройки пачек
    batch_size = 1000
    created_total = 0
    
    for batch_num in range(0, records_to_create, batch_size):
        current_batch = min(batch_size, records_to_create - batch_num)
        
        print(f"\n📦 Пакет {batch_num//batch_size + 1}: создаю {current_batch} записей...")
        
        # Создаем записи параметров
        env_params = []
        for i in range(current_batch):
            # Случайная дата за последние 365 дней
            days_ago = random.randint(0, 365)
            created_date = datetime.now().date() - timedelta(days=days_ago)
            
            env_param = EnviromentalParameters(
                room=data['room'],
                responsible=data['responsible'],
                created_at=created_date,
                created_by=data['user'],
                modified_by=data['user']
            )
            env_params.append(env_param)
        
        # Массовое создание записей
        created_env_params = EnviromentalParameters.objects.bulk_create(env_params)
        
        # Создаем и связываем наборы параметров
        param_sets = []
        env_param_to_param_set = []
        
        for idx, env_param in enumerate(created_env_params):
            # Создаем набор параметров
            param_set = ParameterSet(
                temperature_celsius=round(random.uniform(18.0, 25.0), 2),
                humidity_percentage=round(random.uniform(30.0, 60.0), 1),
                pressure_kpa=round(random.uniform(95.0, 105.0), 2),
                pressure_mmhg=round(random.uniform(710.0, 790.0), 2),
                time=datetime.now().time()
            )
            param_sets.append(param_set)
            env_param_to_param_set.append((env_param, param_set))
        
        # Массовое создание наборов параметров
        ParameterSet.objects.bulk_create(param_sets)
        
        # Связываем записи с наборами параметров
        for env_param, param_set in env_param_to_param_set:
            env_param.parameter_sets.add(param_set)
            
            # В 70% случаев добавляем средство измерений
            if random.random() < 0.7:
                env_param.measurement_instruments.add(data['instrument'])
        
        created_total += len(created_env_params)
        progress = (created_total / records_to_create) * 100
        
        print(f"   ✅ Создано в этом пакете: {len(created_env_params)}")
        print(f"   📊 Общий прогресс: {progress:.1f}% ({created_total}/{records_to_create})")
    
    # Финальная статистика
    final_count = EnviromentalParameters.objects.count()
    
    print("\n" + "=" * 60)
    print("✅ ГЕНЕРАЦИЯ ЗАВЕРШЕНА!")
    print("=" * 60)
    print(f"📈 Всего записей в базе: {final_count}")
    print(f"📅 Диапазон дат: последние 365 дней")
    print(f"🏢 Здание: {data['building'].building_number}")
    print(f"🏠 Помещение: {data['room'].room_number}")
    print(f"👤 Ответственный: {data['responsible']}")
    print(f"🔧 Средство измерений: {data['instrument'].name}")
    print("=" * 60)
    
    return final_count

def main():
    """
    Основная функция
    """
    try:
        # Создаем 10000 записей (можно изменить)
        count = create_test_parameters(10000)
        
        # Дополнительная проверка
        print("\n" + "=" * 60)
        print("ПРОВЕРКА СОЗДАННЫХ ДАННЫХ")
        print("=" * 60)
        
        # Пример выборки для проверки
        sample = EnviromentalParameters.objects.select_related('room', 'responsible').order_by('-created_at')[:5]
        print(f"\nПоследние 5 записей:")
        for i, record in enumerate(sample, 1):
            print(f"  {i}. Здание: {record.room.building.building_number}, "
                  f"Помещение: {record.room.room_number}, "
                  f"Дата: {record.created_at}, "
                  f"Ответственный: {record.responsible}")
        
        print(f"\n✅ Тестовые данные успешно созданы!")
        print(f"✅ Всего записей: {count}")
        
    except Exception as e:
        print(f"\n❌ ОШИБКА: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())