"""
Функции представлений для управления параметрами окружающей среды, комнатами, зданиями,
ответственными лицами, измерительными приборами и аутентификацией пользователей.
"""

import logging
from django.http import HttpResponseServerError
from rest_framework.response import Response
from django.http import HttpResponse
from rest_framework.decorators import api_view
from io import BytesIO
from openpyxl import Workbook
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from datetime import datetime, timedelta
from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone

from rest_framework.pagination import PageNumberPagination
from django.db.models import Prefetch

from openpyxl.styles import Font, Border, Side, Alignment
from openpyxl.utils import get_column_letter

from backend.models import Responsible, Room, EnviromentalParameters, MeasurementInstrument, ParameterSet, ExtendedParameterSet
from .serializers import EnvironmentalParametersSerializer, RoomSelectSerializer, ResponsibleSerializer, MeasurementInstrumentSerializer, \
                        ParameterSetSerializer, Building, BuildingEnviromentalParameters, BuildingParameterSetSerializer, \
                        BuildingParameterSet, BuildingEnvironmentalParametersSerializer, ExtendedParameterSetSerializer, BuildingSerializer, RoomSerializer, AdditionalParameters, \
                        ParameterSetForStorage, ParameterSetForStorageSerializer, DocumentSerializer, Document, ResponsibleList, ResponsibleListSerializer, EnvironmentalParametersListSerializer
import logging

from rest_framework.pagination import PageNumberPagination

logger = logging.getLogger(__name__)


def format_humidity(value):
    if value is None:
        return ''
    return round(float(value), 1)

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        # ...

        return token


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class CustomPagination(PageNumberPagination):
    page_size = 50  # Количество записей на странице
    page_size_query_param = 'page_size'
    max_page_size = 100


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getRoutes(request):
    """
    Возвращает список доступных маршрутов.

    Возвращает:
        Response: JSON-ответ с перечнем доступных маршрутов.
    """
    routes = [
        '/api/token',
        '/api/token/refresh',
    ]
    return Response(routes)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    Получает информацию о текущем аутентифицированном пользователе.

    Args:
        request (Request): Объект HTTP-запроса.

    Returns:
        Response: JSON-ответ, содержащий информацию о текущем пользователе.
    """
    user = request.user
    if user.is_authenticated:
        try:
            logger.info(f'Запрос на получение информации о текущем пользователе: {user.username}')
            responsible = Responsible.objects.get(user=user)
            serializer = ResponsibleSerializer(responsible)
            logger.info(f'Информация о пользователе {user.username} успешно получена')
            return Response(serializer.data)
        except Responsible.DoesNotExist:
            logger.warning(f'Ответственный для пользователя {user.username} не найден')
            return Response({'error': 'Responsible not found'}, status=404)
        except Exception as e:
            logger.error(f'Произошла ошибка при получении информации о текущем пользователе {user.username}: {e}', exc_info=True)
            return Response({'error': 'Внутренняя ошибка сервера'}, status=500)
    else:
        logger.warning('Пользователь не аутентифицирован')
        return Response({'error': 'User not authenticated'}, status=401)

@api_view(['GET'])
# @permission_classes([IsAuthenticated])
def getResponsibles(request):
    """
    Получает список всех ответственных.

    Args:
        request (Request): Объект HTTP-запроса.

    Returns:
        Response: JSON-ответ, содержащий список всех ответственных.
    """
    try:
        logger.info('Запрос на получение списка всех ответственных')
        responsibles = Responsible.objects.all()
        serializer = ResponsibleSerializer(responsibles, many=True)
        logger.info('Список всех ответственных успешно получен')
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f'Произошла ошибка при получении списка всех ответственных: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def getRooms(request):
    """
    Получает список всех комнат с возможностью фильтрации.
    """
    try:
        logger.info('Запрос на получение списка всех комнат')
        
        # Получаем параметры фильтрации
        building_id = request.GET.get('building')
        room_number = request.GET.get('room_number')
        
        rooms = Room.objects.all()
        
        # Применяем фильтры если они есть
        if building_id:
            rooms = rooms.filter(building_id=building_id)
        if room_number:
            rooms = rooms.filter(room_number__icontains=room_number)
        
        serializer = RoomSelectSerializer(rooms, many=True)
        logger.info('Список всех комнат успешно получен')
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f'Произошла ошибка при получении списка всех комнат: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
# @permission_classes([IsAuthenticated])
def getRoom(request, pk):
    """
    Получает информацию о комнате с дополнительными параметрами по её идентификатору.

    Args:
        request (Request): Объект HTTP-запроса.
        pk (int): Идентификатор комнаты.

    Returns:
        Response: JSON-ответ, содержащий информацию о комнате и её дополнительных параметрах.
    """
    try:
        logger.info(f'Запрос на получение информации о комнате с id={pk}')
        room = Room.objects.get(id=pk, has_additional_parameters=True)
        additional_parameters = room.additional_parameters
        serializer = RoomSelectSerializer(room)
        data = serializer.data
        if additional_parameters:
            data['additional_parameters'] = {
                'voltage_min': additional_parameters.voltage_min,
                'voltage_max': additional_parameters.voltage_max,
                'frequency_min': additional_parameters.frequency_min,
                'frequency_max': additional_parameters.frequency_max,
                'radiation_min': additional_parameters.radiation_min,
                'radiation_max': additional_parameters.radiation_max,
            }
        logger.info(f'Информация о комнате с id={pk} успешно получена')
        return Response(data)
    except Room.DoesNotExist:
        logger.warning(f'Комната с id={pk} не найдена')
        return Response({'error': 'Room not found'}, status=404)
    except Exception as e:
        logger.error(f'Произошла ошибка при получении информации о комнате с id={pk}: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




@api_view(['GET'])
def getBuildings(request):
    """
    Получает список всех зданий с возможностью фильтрации.
    """
    try:
        logger.info('Запрос на получение списка всех зданий')
        
        # Получаем параметры фильтрации
        building_number = request.GET.get('building_number')
        
        buildings = Building.objects.all()
        
        # Применяем фильтры если они есть
        if building_number:
            buildings = buildings.filter(building_number__icontains=building_number)
        
        serializer = BuildingSerializer(buildings, many=True)
        logger.info('Список всех зданий успешно получен')
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f'Произошла ошибка при получении списка зданий: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




@api_view(['GET', 'POST'])
# @permission_classes([IsAuthenticated])
def measurement_instrument_type_list(request):
    """
    Обрабатывает запросы на получение списка типов измерительных инструментов и создание нового типа.

    Args:
        request (Request): Объект HTTP-запроса.

    Returns:
        Response: JSON-ответ, содержащий список типов инструментов или созданный тип инструмента.
    """
    if request.method == 'GET':
        try:
            logger.info('Запрос на получение списка типов измерительных инструментов')
            measurement_instrument_types = MeasurementInstrument.objects.all()
            serializer = MeasurementInstrumentSerializer(measurement_instrument_types, many=True)
            logger.info('Список типов измерительных инструментов успешно получен')
            return Response(serializer.data)
        except Exception as e:
            logger.error(f'Произошла ошибка при получении списка типов измерительных инструментов: {e}', exc_info=True)
            return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'POST':
        try:
            logger.info('Запрос на создание нового типа измерительного инструмента')
            serializer = MeasurementInstrumentSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                logger.info('Новый тип измерительного инструмента успешно создан')
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                logger.warning('Запрос на создание нового типа измерительного инструмента не прошел валидацию')
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f'Произошла ошибка при создании нового типа измерительного инструмента: {e}', exc_info=True)
            return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def measurement_instrument_type_detail(request, pk):
    """
    Обрабатывает запросы на получение, обновление и удаление конкретного типа измерительного инструмента.

    Args:
        request (Request): Объект HTTP-запроса.
        pk (int): Первичный ключ типа измерительного инструмента.

    Returns:
        Response: JSON-ответ, содержащий информацию о типе инструмента, результат обновления или статус удаления.
    """
    try:
        measurement_instrument_type = MeasurementInstrument.objects.get(pk=pk)
        logger.info(f'Запрос на получение типа измерительного инструмента с id={pk}')
    except MeasurementInstrument.DoesNotExist:
        logger.error(f'Тип измерительного инструмента с id={pk} не найден')
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = MeasurementInstrumentSerializer(measurement_instrument_type)
        logger.info(f'Тип измерительного инструмента с id={pk} успешно получен')
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = MeasurementInstrumentSerializer(measurement_instrument_type, data=request.data)
        if serializer.is_valid():
            serializer.save()
            logger.info(f'Тип измерительного инструмента с id={pk} успешно обновлен')
            return Response(serializer.data)
        else:
            logger.warning(f'Неудачная попытка обновления типа измерительного инструмента с id={pk}')
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        measurement_instrument_type.delete()
        logger.info(f'Тип измерительного инструмента с id={pk} успешно удален')
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
def getEnviromentalParameters(request):
    try:
        pk = request.query_params.get('id')
        if pk:
            # Для одной записи - детальный сериализатор
            try:
                parameter = EnviromentalParameters.objects.select_related(
                    'room', 
                    'room__building',
                    'responsible',
                    'created_by',
                    'modified_by'
                ).prefetch_related(
                    Prefetch('measurement_instruments', 
                             queryset=MeasurementInstrument.objects.only('id', 'name', 'type', 'serial_number')),
                    Prefetch('parameter_sets', 
                             queryset=ParameterSet.objects.only('id', 'temperature_celsius', 'humidity_percentage',
                                                              'pressure_kpa', 'pressure_mmhg', 'time')),
                    Prefetch('extended_parameter_sets', 
                             queryset=ExtendedParameterSet.objects.only('id', 'temperature_celsius', 'humidity_percentage',
                                                                       'pressure_kpa', 'pressure_mmhg', 'time',
                                                                       'voltage', 'frequency', 'radiation')),
                    Prefetch('parameter_sets_for_storage', 
                             queryset=ParameterSetForStorage.objects.only('id', 'temperature_celsius', 
                                                                         'humidity_percentage', 'time'))
                ).get(id=pk)
                
                serializer = EnvironmentalParametersSerializer(parameter, many=False)
                return Response(serializer.data)
                
            except EnviromentalParameters.DoesNotExist:
                return Response({'error': 'Запись не найдена'}, status=404)
        
        # Для списка - оптимизированный запрос
        responsible = request.query_params.get('responsible')
        # room = request.query_params.get('room')
        room_id = request.query_params.get('room_id')
        room_number = request.query_params.get('room_number')
        date = request.query_params.get('date')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        page = request.query_params.get('page')
        page_size = request.query_params.get('page_size')
        
        # ОПТИМИЗИРОВАННЫЙ запрос с минимальным набором полей
        parameters = EnviromentalParameters.objects.select_related(
            'room', 
            'responsible'
        ).prefetch_related(
            # Только необходимые поля для списка
            Prefetch('measurement_instruments', 
                     queryset=MeasurementInstrument.objects.only('id', 'name', 'type', 'serial_number')),
            
            # Для параметрсетов используем отдельные запросы с только нужными полями
            Prefetch('parameter_sets', 
                     queryset=ParameterSet.objects.only(
                         'id', 'temperature_celsius', 'humidity_percentage',
                         'pressure_kpa', 'pressure_mmhg', 'time'
                     )),
            
            Prefetch('extended_parameter_sets', 
                     queryset=ExtendedParameterSet.objects.only(
                         'id', 'temperature_celsius', 'humidity_percentage',
                         'pressure_kpa', 'pressure_mmhg', 'time',
                         'voltage', 'frequency', 'radiation'
                     )),
            
            Prefetch('parameter_sets_for_storage', 
                     queryset=ParameterSetForStorage.objects.only(
                         'id', 'temperature_celsius', 'humidity_percentage', 'time'
                     ))
        ).only(
            'id', 'created_at',  # Только самые необходимые поля из основной таблицы
            'room_id', 'responsible_id'  # Foreign keys для select_related
        ).order_by('-created_at')

        
        if responsible:
            parameters = parameters.filter(responsible=responsible)
            
        if room_id and room_id.isdigit():
            # Фильтруем по ID помещения (число)
            parameters = parameters.filter(room_id=int(room_id))
        elif room_number:
            # Фильтруем по номеру помещения (строка)
            parameters = parameters.filter(room__room_number=room_number)
                
        # if date:
        #     try:
        #         created_start = datetime.strptime(date, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0)
        #         created_end = created_start + timedelta(days=1)
        #         parameters = parameters.filter(created_at__range=(created_start, created_end))
        #     except ValueError:
        #         pass
                
        # if start_date and end_date:
        #     try:
        #         start = datetime.strptime(start_date, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0)
        #         end = datetime.strptime(end_date, '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
        #         parameters = parameters.filter(created_at__range=(start, end))
        #     except ValueError:
        #         pass

        if date:
            try:
                # Для DateField можно фильтровать напрямую
                filter_date = datetime.strptime(date, '%Y-%m-%d').date()
                parameters = parameters.filter(created_at=filter_date)  # Простое сравнение
            except ValueError:
                pass
                
        if start_date and end_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0)
                end = datetime.strptime(end_date, '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
                parameters = parameters.filter(created_at__range=(start, end))
            except ValueError:
                pass
        
        if page and page_size:
            paginator = CustomPagination()
            paginator.page_size = int(page_size)
            paginated_parameters = paginator.paginate_queryset(parameters, request)
            
            # Используем ОПТИМИЗИРОВАННЫЙ сериализатор для списка
            serializer = EnvironmentalParametersListSerializer(paginated_parameters, many=True)
            return paginator.get_paginated_response(serializer.data)
        else:
            # Без пагинации - ограничиваем
            if not (responsible or room_number or date or start_date or end_date):
                parameters = parameters[:100]  # Безопасное ограничение
                
            serializer = EnvironmentalParametersListSerializer(parameters, many=True)
            return Response(serializer.data)

    except Exception as e:
        logger.error(f'Произошла ошибка во время выполнения getEnviromentalParameters: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
def getEnviromentalParameterById(request, pk):
    """Получение одной записи по ID (для страницы деталей)"""
    try:
        # Используем тот же оптимизированный запрос, что и для списка
        parameter = EnviromentalParameters.objects.select_related(
            'room', 
            'responsible'
        ).prefetch_related(
            Prefetch('measurement_instruments', queryset=MeasurementInstrument.objects.only('id', 'name', 'type', 'serial_number')),
            Prefetch('parameter_sets', queryset=ParameterSet.objects.all()),
            Prefetch('extended_parameter_sets', queryset=ExtendedParameterSet.objects.all()),
            Prefetch('parameter_sets_for_storage', queryset=ParameterSetForStorage.objects.all())
        ).get(id=pk)
        
        serializer = EnvironmentalParametersListSerializer(parameter, many=False)
        return Response(serializer.data)
        
    except EnviromentalParameters.DoesNotExist:
        logger.error(f'Параметры окружающей среды с id={pk} не найдены')
        return Response({'error': 'Enviromental parameters not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f'Произошла ошибка во время выполнения getEnviromentalParameterById: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getEnviromentalParameter(request, pk):
    """
    Возвращает конкретную запись с параметрами окружающей среды.

    Args:
        request (Request): Объект HTTP-запроса.
        pk (int): Первичный ключ записи с параметрами окружающей среды.

    Returns:
        Response: JSON-ответ с параметрами окружающей среды.
    """
    try:
        parameters = EnviromentalParameters.objects.get(id=pk)
        logger.info(f'Запрос на получение параметров окружающей среды с id={pk}')
        serializer = EnvironmentalParametersSerializer(parameters, many=False)
        return Response(serializer.data)
    except EnviromentalParameters.DoesNotExist:
        logger.error(f'Параметры окружающей среды с id={pk} не найдены')
        return Response({'error': 'Enviromental parameters not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f'Произошла ошибка во время выполнения getEnviromentalParameter: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createEnvironmentalParameters(request):
    try:
        logger.info("=== НАЧАЛО СОЗДАНИЯ ЗАПИСИ ===")
        logger.info(f"Полученные данные: {request.data}")
        
        # 1. Проверяем обязательные поля
        room_data = request.data.get('room')
        if not room_data:
            logger.error("Отсутствуют данные помещения")
            return Response({'error': 'Room data is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        room_number = room_data.get('room_number')
        if not room_number:
            logger.error("Отсутствует номер помещения")
            return Response({'error': 'Room number is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        logger.info(f"Ищем помещение: {room_number}")
        try:
            room = Room.objects.get(room_number=room_number)
            logger.info(f"Найдено помещение ID={room.id}, тип: has_additional={room.has_additional_parameters}, is_storage={room.is_storage}")
        except Room.DoesNotExist:
            logger.error(f"Помещение с номером {room_number} не найдено")
            return Response({'error': f'Room {room_number} not found'}, status=status.HTTP_400_BAD_REQUEST)
        
        created_at = request.data.get('created_at')
        if not created_at:
            logger.error("Отсутствует дата создания")
            return Response({'error': 'Created_at is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 2. Исправленная проверка существующей записи
        logger.info(f"Проверяем дубликаты для комнаты {room.id} на дату {created_at}")
        
    
        try:
            # Парсим дату из строки
            import datetime
            input_date = datetime.datetime.strptime(created_at, '%Y-%m-%d').date()
            
            # Находим начало и конец дня
            start_date = datetime.datetime.combine(input_date, datetime.time.min)
            end_date = datetime.datetime.combine(input_date, datetime.time.max)
            
            # Ищем записи в диапазоне этого дня
            existing_parameters = EnviromentalParameters.objects.filter(
                room=room, 
                created_at__range=(start_date, end_date)
            )
            
            if existing_parameters.exists():
                logger.warning(f'Найдена существующая запись ID={existing_parameters.first().id}')
                return Response({'error': 'An entry for this room and date already exists'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            else:
                logger.info("Дубликатов не найдено")
                
        except ValueError as e:
            logger.error(f"Ошибка парсинга даты {created_at}: {e}")
            return Response({'error': f'Invalid date format: {created_at}'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # 3. Ответственный
        responsible_data = request.data.get('responsible')
        if not responsible_data:
            logger.error("Отсутствуют данные ответственного")
            return Response({'error': 'Responsible data is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        logger.info(f"Создаем/получаем ответственного: {responsible_data}")
        responsible, created = Responsible.objects.get_or_create(
            first_name=responsible_data.get('first_name'),
            last_name=responsible_data.get('last_name'),
            defaults={'patronymic': responsible_data.get('patronymic', '')}
        )
        logger.info(f"Ответственный ID={responsible.id}, создан={created}")
        
        # 4. Подготавливаем данные для сериализатора
        data_for_serializer = {
            'room': {'room_number': room.room_number},
            'responsible': {
                'first_name': responsible.first_name,
                'last_name': responsible.last_name,
                'patronymic': responsible.patronymic
            },
            'created_at': created_at,
            'measurement_instruments': request.data.get('measurement_instruments', []),
        }
        
        # 5. В зависимости от типа помещения
        if room.has_additional_parameters:
            logger.info("Комната с дополнительными параметрами")
            extended_sets_data = request.data.get('extended_parameter_sets', [])
            if not extended_sets_data:
                logger.error("Нет extended_parameter_sets для комнаты с доп. параметрами")
                return Response({'error': 'Extended parameter sets required for this room type'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            data_for_serializer['extended_parameter_sets'] = extended_sets_data
            data_for_serializer['parameter_sets'] = []
            data_for_serializer['parameter_sets_for_storage'] = []
            
        elif room.is_storage:
            logger.info("Комната складского типа")
            storage_sets_data = request.data.get('parameter_sets_for_storage', [])
            if not storage_sets_data:
                logger.error("Нет parameter_sets_for_storage для склада")
                return Response({'error': 'Storage parameter sets required for storage rooms'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            data_for_serializer['parameter_sets_for_storage'] = storage_sets_data
            data_for_serializer['parameter_sets'] = []
            data_for_serializer['extended_parameter_sets'] = []
            
        else:
            logger.info("Обычная комната")
            param_sets_data = request.data.get('parameter_sets', [])
            if not param_sets_data:
                logger.error("Нет parameter_sets для обычной комнаты")
                return Response({'error': 'Parameter sets required'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            data_for_serializer['parameter_sets'] = param_sets_data
            data_for_serializer['extended_parameter_sets'] = []
            data_for_serializer['parameter_sets_for_storage'] = []
        
        # 6. Создаем через сериализатор
        logger.info(f"Данные для сериализатора: {data_for_serializer}")
        serializer = EnvironmentalParametersSerializer(data=data_for_serializer, context={'request': request})
        
        if serializer.is_valid():
            logger.info("Данные валидны, сохраняем...")
            instance = serializer.save()
            logger.info(f"Успешно создана запись с ID: {instance.id}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            logger.error("Ошибки валидации сериализатора: %s", serializer.errors)
            return Response({'error': 'Validation error', 'details': serializer.errors}, 
                          status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f'Критическая ошибка в createEnvironmentalParameters: {str(e)}', exc_info=True)
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return Response({'error': 'Internal server error', 'details': str(e)}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateEnvironmentalParameters(request, pk):
    try:
        logger.info(f'Запрос на обновление параметров окружающей среды с ID {pk}')
        environmental_params = EnviromentalParameters.objects.get(pk=pk)
    except EnviromentalParameters.DoesNotExist:
        logger.error(f'Параметры окружающей среды с ID {pk} не найдены')
        return Response(status=status.HTTP_404_NOT_FOUND)

    serializer = EnvironmentalParametersSerializer(instance=environmental_params, data=request.data, context={'request': request})
    
    modified_by_data = request.data.get('modified_by')
    user_id = modified_by_data.get('user')
    try:
        modified_by_user = User.objects.get(id=user_id)
        environmental_params.modified_by = modified_by_user
    except User.DoesNotExist:
        logger.error(f'Пользователь с ID {user_id} не существует')

    if serializer.is_valid():
        room_data = request.data.get('room')
        room_instance, _ = Room.objects.get_or_create(room_number=room_data.get('room_number'))
        created_at_data = request.data.get('created_at')
        
        existing_parameters = EnviromentalParameters.objects.filter(room=room_instance, created_at=created_at_data).exclude(pk=pk)
        if existing_parameters.exists():
            logger.warning('Запись на указанную дату уже существует')
            return Response({'error': 'An entry for this room and date already exists'}, status=status.HTTP_400_BAD_REQUEST)

        has_additional_parameters = room_instance.has_additional_parameters if room_instance else False
        if has_additional_parameters:
            measurement_instrument_data = request.data.get('measurement_instrument')
            measurement_instruments_data = request.data.get('measurement_instruments')
            created_at_data = request.data.get('created_at')
            extended_parameter_sets_data = request.data.get('extended_parameter_sets', [])
            measurement_instrument_instance, _ = MeasurementInstrument.objects.get_or_create(**measurement_instrument_data) if measurement_instrument_data else (None, False)
            measurement_instruments = []

            if measurement_instruments_data:
                for instrument_data in measurement_instruments_data:
                    measurement_instrument_instance, _ = MeasurementInstrument.objects.get_or_create(**instrument_data)
                    measurement_instruments.append(measurement_instrument_instance)

            extended_parameter_sets = []

            for extended_param_set_data in extended_parameter_sets_data:
                extended_parameter_set = ExtendedParameterSet.objects.create(
                    temperature_celsius=extended_param_set_data.get('temperature_celsius'),
                    humidity_percentage=extended_param_set_data.get('humidity_percentage'),
                    pressure_kpa=extended_param_set_data.get('pressure_kpa'),
                    pressure_mmhg=extended_param_set_data.get('pressure_mmhg'),
                    time=extended_param_set_data.get('time'),
                    voltage=extended_param_set_data.get('voltage'),
                    frequency=extended_param_set_data.get('frequency'),
                    radiation=extended_param_set_data.get('radiation')
                )
                extended_parameter_sets.append(extended_parameter_set)

            environmental_params.measurement_instruments.set(measurement_instruments)
            environmental_params.extended_parameter_sets.set(extended_parameter_sets)
            environmental_params.created_at = created_at_data
            environmental_params.save()
        elif room_instance.is_storage:
            measurement_instrument_data = request.data.get('measurement_instrument')
            measurement_instruments_data = request.data.get('measurement_instruments')
            created_at_data = request.data.get('created_at')
            parameter_sets_for_storage_data = request.data.get('parameter_sets_for_storage', [])
            
            measurement_instrument_instance, _ = MeasurementInstrument.objects.get_or_create(**measurement_instrument_data) if measurement_instrument_data else (None, False)

            measurement_instruments = []

            if measurement_instruments_data:
                for instrument_data in measurement_instruments_data:
                    measurement_instrument_instance, _ = MeasurementInstrument.objects.get_or_create(**instrument_data)
                    measurement_instruments.append(measurement_instrument_instance)

            parameter_sets_for_storage = []

            for param_set_data in parameter_sets_for_storage_data:
                parameter_set_for_storage = ParameterSetForStorage.objects.create(
                    temperature_celsius=param_set_data.get('temperature_celsius'),
                    humidity_percentage=param_set_data.get('humidity_percentage'),
                    time=param_set_data.get('time')
                )
                parameter_sets_for_storage.append(parameter_set_for_storage)
            
            environmental_params.measurement_instruments.set(measurement_instruments)
            environmental_params.parameter_sets_for_storage.set(parameter_sets_for_storage)
            environmental_params.created_at = created_at_data
            environmental_params.save()
        else:
            measurement_instrument_data = request.data.get('measurement_instrument')
            measurement_instruments_data = request.data.get('measurement_instruments')
            created_at_data = request.data.get('created_at')
            parameter_sets_data = request.data.get('parameter_sets', [])
            
            measurement_instrument_instance, _ = MeasurementInstrument.objects.get_or_create(**measurement_instrument_data) if measurement_instrument_data else (None, False)

            measurement_instruments = []

            if measurement_instruments_data:
                for instrument_data in measurement_instruments_data:
                    measurement_instrument_instance, _ = MeasurementInstrument.objects.get_or_create(**instrument_data)
                    measurement_instruments.append(measurement_instrument_instance)

            parameter_sets = []

            for param_set_data in parameter_sets_data:
                parameter_set = ParameterSet.objects.create(
                    temperature_celsius=param_set_data.get('temperature_celsius'),
                    humidity_percentage=param_set_data.get('humidity_percentage'),
                    pressure_kpa=param_set_data.get('pressure_kpa'),
                    pressure_mmhg=param_set_data.get('pressure_mmhg'),
                    time=param_set_data.get('time')
                )
                parameter_sets.append(parameter_set)

            environmental_params.measurement_instruments.set(measurement_instruments)
            environmental_params.parameter_sets.set(parameter_sets)
            environmental_params.created_at = created_at_data
            environmental_params.save()
            
        logger.info(f'Параметры окружающей среды с ID {pk} успешно обновлены')
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    logger.error("Serializer Errors: %s", serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deleteEnvironmentalParameters(request, pk):
    """
    Удаляет существующий набор параметров окружающей среды.

    Args:
        request (Request): Объект HTTP-запроса.
        pk (int): Первичный ключ параметров окружающей среды.

    Returns:
        Response: JSON-ответ, указывающий на успешное или неудачное выполнение операции.
    """
    try:
        logger.info(f'Запрос на удаление параметров окружающей среды с ID {pk}')
        environmental_params = EnviromentalParameters.objects.get(pk=pk)
    except EnviromentalParameters.DoesNotExist:
        logger.error(f'Параметры окружающей среды с ID {pk} не найдены')
        return Response(status=status.HTTP_404_NOT_FOUND)

    environmental_params.delete()
    logger.info(f'Параметры окружающей среды с ID {pk} успешно удалены')
    return Response(status=status.HTTP_204_NO_CONTENT)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getParameterSets(request):
    """
    Получает список всех наборов параметров.

    Args:
        request (Request): Объект HTTP-запроса.

    Returns:
        Response: JSON-ответ с данными наборов параметров.
    """
    try:
        logger.info('Запрос на получение всех наборов параметров')
        parameter_sets = ParameterSet.objects.all()
        serializer = ParameterSetSerializer(parameter_sets, many=True, context={'request': request})
        logger.info('Наборы параметров успешно получены')
        return Response(serializer.data)
    except Exception as e:
        logger.error(f'Произошла ошибка при получении наборов параметров: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getParameterSet(request, pk):
    """
    Получает конкретный набор параметров по первичному ключу.

    Args:
        request (Request): Объект HTTP-запроса.
        pk (int): Первичный ключ набора параметров.

    Returns:
        Response: JSON-ответ с данными набора параметров.
    """
    try:
        logger.info(f'Запрос на получение набора параметров с id: {pk}')
        parameter_set = ParameterSet.objects.get(id=pk)
        serializer = ParameterSetSerializer(parameter_set, many=False)
        logger.info(f'Набор параметров с id: {pk} успешно получен')
        return Response(serializer.data)
    except ParameterSet.DoesNotExist:
        logger.error(f'Набор параметров с id: {pk} не найден')
        return Response({'error': 'ParameterSet not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f'Произошла ошибка при получении набора параметров с id: {pk}: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createParameterSet(request):
    """
    Создает новый набор параметров.

    Args:
        request (Request): Объект HTTP-запроса.

    Returns:
        Response: JSON-ответ с данными созданного набора параметров.
    """
    try:
        logger.info('Запрос на создание нового набора параметров')
        time_str = request.data.get('time')
        if time_str:
            try:
                datetime.strptime(time_str, '%H:%M:%S')
            except ValueError:
                logger.error('Неверный формат времени')
                return Response({'error': 'Invalid time format'}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data
        if isinstance(data, list):
            created_sets = []
            for item in data:
                serializer = ParameterSetSerializer(data=item)
                if serializer.is_valid():
                    parameter_set = serializer.save()
                    created_sets.append(parameter_set)
                else:
                    logger.error('Ошибка валидации данных', extra={'errors': serializer.errors})
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            logger.info('Наборы параметров успешно созданы')
            return Response(ParameterSetSerializer(created_sets, many=True).data, status=status.HTTP_201_CREATED)
        else:
            serializer = ParameterSetSerializer(data=data)
            if serializer.is_valid():
                parameter_set = serializer.save()
                logger.info('Набор параметров успешно создан')
                return Response(ParameterSetSerializer(parameter_set).data, status=status.HTTP_201_CREATED)
            logger.error('Ошибка валидации данных', extra={'errors': serializer.errors})
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f'Произошла ошибка при создании набора параметров: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateParameterSet(request, pk):
    """
    Обновляет существующий набор параметров.

    Args:
        request (Request): Объект HTTP-запроса.
        pk (int): Первичный ключ набора параметров.

    Returns:
        Response: JSON-ответ с обновленными данными набора параметров.
    """
    try:
        logger.info(f'Запрос на обновление набора параметров с ID {pk}')
        try:
            parameter_set = ParameterSet.objects.get(pk=pk)
        except ParameterSet.DoesNotExist:
            logger.error(f'Набор параметров с ID {pk} не найден')
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = ParameterSetSerializer(instance=parameter_set, data=request.data)
        if serializer.is_valid():
            serializer.save()
            logger.info(f'Набор параметров с ID {pk} успешно обновлен')
            return Response(serializer.data)
        logger.error('Ошибка валидации данных', extra={'errors': serializer.errors})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f'Произошла ошибка при обновлении набора параметров с ID {pk}: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deleteParameterSet(request, pk):
    """
    Удаляет существующий набор параметров.

    Args:
        request (Request): Объект HTTP-запроса.
        pk (int): Первичный ключ набора параметров.

    Returns:
        Response: JSON-ответ, указывающий на успешное или неудачное выполнение операции.
    """
    try:
        logger.info(f'Запрос на удаление набора параметров с ID {pk}')
        try:
            parameter_set = ParameterSet.objects.get(pk=pk)
        except ParameterSet.DoesNotExist:
            logger.error(f'Набор параметров с ID {pk} не найден')
            return Response(status=status.HTTP_404_NOT_FOUND)

        parameter_set.delete()
        logger.info(f'Набор параметров с ID {pk} успешно удален')
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        logger.error(f'Произошла ошибка при удалении набора параметров с ID {pk}: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getExtendedParameterSets(request):
    """
    Получает список всех наборов расширенных параметров.

    Args:
        request (Request): Объект HTTP-запроса.

    Returns:
        Response: JSON-ответ, содержащий список всех наборов расширенных параметров.
    """
    try:
        logger.info('Запрос на получение всех наборов расширенных параметров')
        parameter_sets = ExtendedParameterSet.objects.all()
        serializer = ExtendedParameterSetSerializer(parameter_sets, many=True, context={'request': request})
        logger.info('Успешно получен список всех наборов расширенных параметров')
        return Response(serializer.data)
    except Exception as e:
        logger.error(f'Произошла ошибка при получении наборов расширенных параметров: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getExtendedParameterSet(request, pk):
    """
    Получает конкретный набор расширенных параметров по его первичному ключу.

    Args:
        request (Request): Объект HTTP-запроса.
        pk (int): Первичный ключ набора расширенных параметров.

    Returns:
        Response: JSON-ответ, содержащий данные набора расширенных параметров.
    """
    try:
        logger.info(f'Запрос на получение набора расширенных параметров с id: {pk}')
        parameter_set = ExtendedParameterSet.objects.get(id=pk)
        serializer = ExtendedParameterSetSerializer(parameter_set, many=False)
        logger.info(f'Успешно получен набор расширенных параметров с id: {pk}')
        return Response(serializer.data)
    except ExtendedParameterSet.DoesNotExist:
        logger.error(f'Набор расширенных параметров с id: {pk} не найден')
        return Response({'error': 'Extended Parameter Set not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f'Произошла ошибка при получении набора расширенных параметров с id: {pk}: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createExtendedParameterSet(request):
    """
    Создает новый набор расширенных параметров.

    Args:
        request (Request): Объект HTTP-запроса.

    Returns:
        Response: JSON-ответ, содержащий данные созданного набора расширенных параметров.
    """
    try:
        logger.info('Запрос на создание нового набора расширенных параметров')
        serializer = ExtendedParameterSetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            logger.info('Новый набор расширенных параметров успешно создан')
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            logger.error(f'Ошибка валидации данных при создании набора расширенных параметров: {serializer.errors}')
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f'Произошла ошибка при создании набора расширенных параметров: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateExtendedParameterSet(request, pk):
    """
    Обновляет существующий набор расширенных параметров.

    Args:
        request (Request): Объект HTTP-запроса.
        pk (int): Первичный ключ расширенных параметров.

    Returns:
        Response: JSON-ответ с обновленными данными расширенных параметров.
    """
    try:
        logger.info(f'Запрос на обновление набора расширенных параметров с id: {pk}')
        try:
            parameter_set = ExtendedParameterSet.objects.get(pk=pk)
        except ExtendedParameterSet.DoesNotExist:
            logger.error(f'Набор расширенных параметров с id {pk} не найден')
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = ExtendedParameterSetSerializer(instance=parameter_set, data=request.data)
        if serializer.is_valid():
            serializer.save()
            logger.info(f'Набор расширенных параметров с id {pk} успешно обновлен')
            return Response(serializer.data)
        else:
            logger.error(f'Ошибка валидации данных при обновлении набора расширенных параметров с id {pk}: {serializer.errors}')
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f'Произошла ошибка при обновлении набора расширенных параметров с id {pk}: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deleteExtendedParameterSet(request, pk):
    """
    Удаляет существующий набор расширенных параметров.

    Args:
        request (Request): Объект HTTP-запроса.
        pk (int): Первичный ключ расширенных параметров.

    Returns:
        Response: JSON-ответ, указывающий на успешное или неудачное выполнение операции.
    """
    try:
        logger.info(f'Запрос на удаление набора расширенных параметров с id: {pk}')
        try:
            parameter_set = ExtendedParameterSet.objects.get(pk=pk)
        except ExtendedParameterSet.DoesNotExist:
            logger.error(f'Набор расширенных параметров с id {pk} не найден')
            return Response(status=status.HTTP_404_NOT_FOUND)

        parameter_set.delete()
        logger.info(f'Набор расширенных параметров с id {pk} успешно удален')
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        logger.error(f'Произошла ошибка при удалении набора расширенных параметров с id {pk}: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getStorageParameterSets(request):
    """
    Получает все наборы параметров для КВХ.

    Args:
        request (Request): Объект HTTP-запроса.

    Returns:
        Response: JSON-ответ с наборами параметров для КВХ.
    """
    try:
        logger.info('Запрос на получение всех наборов параметров для КВХ')
        parameter_sets = ParameterSetForStorage.objects.all()
        serializer = ParameterSetForStorageSerializer(parameter_sets, many=True, context={'request': request})
        logger.info('Наборы параметров для КВХ успешно получены')
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f'Произошла ошибка при получении наборов параметров для КВХ: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getStorageParameterSet(request, pk):
    """
    Получает конкретный набор параметров для КВХ по идентификатору.

    Args:
        request (Request): Объект HTTP-запроса.
        pk (int): Первичный ключ набора параметров для КВХ.

    Returns:
        Response: JSON-ответ с набором параметров для КВХ.
    """
    try:
        logger.info(f'Запрос на получение набора параметров для КВХ с id={pk}')
        parameter_set = ParameterSetForStorage.objects.get(id=pk)
        serializer = ParameterSetForStorageSerializer(parameter_set, many=False)
        logger.info(f'Набор параметров для КВХ с id={pk} успешно получен')
        return Response(serializer.data)
    except ParameterSetForStorage.DoesNotExist:
        logger.error(f'Набор параметров для КВХ с id={pk} не найден')
        return Response({'error': 'Набор параметров для КВХ не найден'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f'Произошла ошибка при получении набора параметров для КВХ с id={pk}: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createStorageParameterSet(request):
    """
    Создает новый набор параметров для КВХ.

    Args:
        request (Request): Объект HTTP-запроса.

    Returns:
        Response: JSON-ответ с созданным набором параметров для КВХ или ошибками валидации.
    """
    try:
        logger.info('Запрос на создание нового набора параметров для КВХ')
        serializer = ParameterSetForStorageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            logger.info('Набор параметров для КВХ успешно создан')
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.warning(f'Ошибки валидации при создании набора параметров для КВХ: {serializer.errors}')
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f'Произошла ошибка при создании набора параметров для КВХ: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateStorageParameterSet(request, pk):
    """
    Обновляет существующий набор параметров для КВХ.

    Args:
        request (Request): Объект HTTP-запроса.
        pk (int): Первичный ключ набора параметров для КВХ.

    Returns:
        Response: JSON-ответ с обновленным набором параметров для хранения или ошибками валидации.
    """
    try:
        logger.info(f'Запрос на обновление набора параметров для КВХ с ID {pk}')
        try:
            parameter_set = ParameterSetForStorage.objects.get(pk=pk)
        except ParameterSetForStorage.DoesNotExist:
            logger.warning(f'Набор параметров для КВХ с ID {pk} не найден')
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = ParameterSetForStorageSerializer(instance=parameter_set, data=request.data)
        if serializer.is_valid():
            serializer.save()
            logger.info(f'Набор параметров для КВХ с ID {pk} успешно обновлен')
            return Response(serializer.data)
        logger.warning(f'Ошибки валидации при обновлении набора параметров для КВХ с ID {pk}: {serializer.errors}')
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f'Произошла ошибка при обновлении набора параметров для КВХ с ID {pk}: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deleteStorageParameterSet(request, pk):
    """
    Удаляет существующий набор параметров для КВХ.

    Args:
        request (Request): Объект HTTP-запроса.
        pk (int): Первичный ключ набора параметров для КВХ.

    Returns:
        Response: JSON-ответ, указывающий на успешное или неудачное выполнение операции.
    """
    try:
        logger.info(f'Запрос на удаление набора параметров для КВХ с ID {pk}')
        try:
            parameter_set = ParameterSetForStorage.objects.get(pk=pk)
        except ParameterSetForStorage.DoesNotExist:
            logger.warning(f'Набор параметров для КВХ с ID {pk} не найден')
            return Response(status=status.HTTP_404_NOT_FOUND)

        parameter_set.delete()
        logger.info(f'Набор параметров для КВХ с ID {pk} успешно удален')
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        logger.error(f'Произошла ошибка при удалении набора параметров для КВХ с ID {pk}: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# views.py
@api_view(['GET'])
def export_parameters_to_excel(request):
    try:
        logger.info(f"Export request from user: {request.user.username}")
        
        # Получаем параметры фильтрации из запроса
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        # Базовый запрос
        queryset = EnviromentalParameters.objects.all()
        
        # Применяем фильтрацию по дате
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d')
            queryset = queryset.filter(created_at__date__lte=end_date)
        
        # Сортируем по дате создания (сначала новые)
        queryset = queryset.order_by('-created_at')

        # Создание книги Excel
        wb = Workbook()
        ws = wb.active
        ws.title = "Параметры помещений"

        # Стили
        header_font = Font(bold=True, size=12)
        border = Border(left=Side(style='thin'), right=Side(style='thin'),
                       top=Side(style='thin'), bottom=Side(style='thin'))
        center_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)

        # Заголовки
        columns = [
            'Номер помещения', 
            'Ответственный', 
            'Средства измерений + Годен до', 
            'Дата создания записи',
            'Время создания набора параметров',
            'Температура (°C)', 
            'Влажность (%)', 
            'Давление (кПа)', 
            'Давление (мм рт. ст.)', 
            'Напряжение (В)', 
            'Частота (Гц)', 
            'Радиационный фон'
        ]
        
        for col_num, column_title in enumerate(columns, 1):
            cell = ws.cell(row=1, column=col_num, value=column_title)
            cell.font = header_font
            cell.alignment = center_alignment
            cell.border = border

        # Установка ширины столбцов
        column_widths = [15, 20, 25, 15, 20, 15, 15, 15, 15, 15, 15, 15]
        for i, width in enumerate(column_widths, 1):
            ws.column_dimensions[get_column_letter(i)].width = width

        row_num = 2

        for param in queryset:
            # Форматируем средства измерений (максимум 5 СИ)
            instruments_info = []
            for i, instrument in enumerate(param.measurement_instruments.all()[:5]):
                # Используем next_calibration_date из модели
                valid_until = instrument.next_calibration_date.strftime('%d.%m.%Y') if instrument.next_calibration_date else 'Н/Д'
                instruments_info.append(f"{instrument.name} {instrument.type} ({instrument.serial_number}) - Годен до: {valid_until}")
            
            # Основная строка с параметрами
            main_row = [
                param.room.room_number if param.room else '',
                f'{param.responsible.last_name} {param.responsible.first_name} {param.responsible.patronymic}' if param.responsible else '',
                '\n'.join(instruments_info),
                param.created_at.strftime('%d.%m.%Y') if param.created_at else '',
                '',  # Время создания набора параметров будет заполнено ниже
                '', '', '', '', '', '', ''  # Пустые значения для параметров
            ]
            
            # Добавляем основную строку
            for col_num, value in enumerate(main_row, 1):
                cell = ws.cell(row=row_num, column=col_num, value=value)
                cell.border = border
                if col_num == 3:  # Столбец с СИ
                    cell.alignment = Alignment(vertical='top', wrap_text=True)
            
            # Устанавливаем высоту строки для СИ
            instrument_count = min(param.measurement_instruments.count(), 5)
            ws.row_dimensions[row_num].height = 20 + (instrument_count * 15)  # Динамическая высота
            
            row_num += 1

            # Добавляем параметры из parameter_sets
            for param_set in param.parameter_sets.all():
                ws.append([
                    '', '', '', '',  # Пустые значения для основных полей
                    param_set.time.strftime('%H:%M:%S') if param_set.time else '',
                    param_set.temperature_celsius if param_set.temperature_celsius is not None else '',
                    format_humidity(param_set.humidity_percentage),
                    param_set.pressure_kpa if param_set.pressure_kpa is not None else '',
                    param_set.pressure_mmhg if param_set.pressure_mmhg is not None else '',
                    '', '', ''  # Пустые значения для напряжения, частоты, радиации
                ])
                # Применяем стили к новой строке
                for col_num in range(1, 13):
                    ws.cell(row=row_num, column=col_num).border = border
                row_num += 1

            # Добавляем параметры из extended_parameter_sets
            for extended_param_set in param.extended_parameter_sets.all():
                ws.append([
                    '', '', '', '',  # Пустые значения для основных полей
                    extended_param_set.time.strftime('%H:%M:%S') if extended_param_set.time else '',
                    extended_param_set.temperature_celsius if extended_param_set.temperature_celsius is not None else '',
                    format_humidity(extended_param_set.humidity_percentage),
                    extended_param_set.pressure_kpa if extended_param_set.pressure_kpa is not None else '',
                    extended_param_set.pressure_mmhg if extended_param_set.pressure_mmhg is not None else '',
                    extended_param_set.voltage if extended_param_set.voltage is not None else '',
                    extended_param_set.frequency if extended_param_set.frequency is not None else '',
                    extended_param_set.radiation if extended_param_set.radiation is not None else ''
                ])
                # Применяем стили к новой строке
                for col_num in range(1, 13):
                    ws.cell(row=row_num, column=col_num).border = border
                row_num += 1
                
            # Добавляем параметры из parameter_sets_for_storage
            for param_set_for_storage in param.parameter_sets_for_storage.all():
                ws.append([
                    '', '', '', '',  # Пустые значения для основных полей
                    param_set_for_storage.time.strftime('%H:%M:%S') if param_set_for_storage.time else '',
                    param_set_for_storage.temperature_celsius if param_set_for_storage.temperature_celsius is not None else '',
                    format_humidity(param_set_for_storage.humidity_percentage),
                    '', '', '', '', ''  # Пустые значения для остальных параметров
                ])
                # Применяем стили к новой строке
                for col_num in range(1, 13):
                    ws.cell(row=row_num, column=col_num).border = border
                row_num += 1

        # Формируем имя файла
        current_date = datetime.now().strftime('%d.%m.%Y')
        filename = f'Параметры по помещениям от {current_date}.xlsx'

        # Создание HTTP-ответа
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        response.write(buffer.getvalue())
        buffer.close()

        return response

    except Exception as e:
        logger.error(f"Error exporting parameters: {str(e)}")
        return HttpResponseServerError("Internal Server Error")

# Выгрузка в Excel данных о параметрах для зданий

@api_view(['GET'])
def export_parameters_for_buildings_to_excel(request):
    try:
        logger.info(f"Export request from user: {request.user.username}")
        
        # Получаем параметры фильтрации из запроса
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        # Базовый запрос
        queryset = BuildingEnviromentalParameters.objects.all()
        
        # Применяем фильтрацию по дате
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d')
            queryset = queryset.filter(created_at__date__lte=end_date)
        
        # Сортируем по дате создания (сначала новые)
        queryset = queryset.order_by('-created_at')

        # Создание книги Excel
        wb = Workbook()
        ws = wb.active
        ws.title = "Параметры зданий"

        # Стили
        header_font = Font(bold=True, size=12)
        border = Border(left=Side(style='thin'), right=Side(style='thin'),
                       top=Side(style='thin'), bottom=Side(style='thin'))
        center_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)

        # Заголовки
        columns = [
            'Номер здания', 
            'Ответственный', 
            'Средства измерений + Годен до', 
            'Дата создания записи',
            'Время создания набора параметров',
            'Напряжение (В)', 
            'Частота (Гц)'
        ]
        
        for col_num, column_title in enumerate(columns, 1):
            cell = ws.cell(row=1, column=col_num, value=column_title)
            cell.font = header_font
            cell.alignment = center_alignment
            cell.border = border

        # Установка ширины столбцов
        column_widths = [15, 20, 25, 15, 20, 15, 15]
        for i, width in enumerate(column_widths, 1):
            ws.column_dimensions[get_column_letter(i)].width = width

        row_num = 2

        for param in queryset:
            # Форматируем средства измерений (максимум 5 СИ)
            instruments_info = []
            for i, instrument in enumerate(param.measurement_instruments.all()[:5]):
                # Используем next_calibration_date из модели
                valid_until = instrument.next_calibration_date.strftime('%d.%m.%Y') if instrument.next_calibration_date else 'Н/Д'
                instruments_info.append(f"{instrument.name} {instrument.type} ({instrument.serial_number}) - Годен до: {valid_until}")
            
            # Основная строка с параметрами
            main_row = [
                param.building.building_number if param.building else '',
                f'{param.responsible.last_name} {param.responsible.first_name} {param.responsible.patronymic}' if param.responsible else '',
                '\n'.join(instruments_info),
                param.created_at.strftime('%d.%m.%Y') if param.created_at else '',
                '',  # Время создания набора параметров будет заполнено ниже
                '', ''  # Пустые значения для параметров
            ]
            
            # Добавляем основную строку
            for col_num, value in enumerate(main_row, 1):
                cell = ws.cell(row=row_num, column=col_num, value=value)
                cell.border = border
                if col_num == 3:  # Столбец с СИ
                    cell.alignment = Alignment(vertical='top', wrap_text=True)
            
            # Устанавливаем высоту строки для СИ
            instrument_count = min(param.measurement_instruments.count(), 5)
            ws.row_dimensions[row_num].height = 20 + (instrument_count * 15)  # Динамическая высота
            
            row_num += 1

            # Добавляем параметры из parameter_sets
            for param_set in param.parameter_sets.all():
                ws.append([
                    '', '', '', '',  # Пустые значения для основных полей
                    param_set.time.strftime('%H:%M:%S') if param_set.time else '',
                    param_set.voltage if param_set.voltage is not None else '',
                    param_set.frequency if param_set.frequency is not None else ''
                ])
                # Применяем стили к новой строке
                for col_num in range(1, 8):
                    ws.cell(row=row_num, column=col_num).border = border
                row_num += 1

        # Формируем имя файла
        current_date = datetime.now().strftime('%d.%m.%Y')
        filename = f'Параметры по зданиям от {current_date}.xlsx'

        # Создание HTTP-ответа
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        response.write(buffer.getvalue())
        buffer.close()

        return response

    except Exception as e:
        logger.error(f"Error exporting building parameters: {str(e)}")
        return HttpResponseServerError("Internal Server Error")

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getBuildingParameterSets(request):
    try:
        logger.info(f"Пользователь {request.user.username} запросил все наборы параметров зданий")
        parameter_sets = BuildingParameterSet.objects.all()
        serializer = BuildingParameterSetSerializer(parameter_sets, many=True, context={'request': request})
        logger.info(f"Успешно получены и сериализованы {len(parameter_sets)} наборы параметров зданий")
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Ошибка при получении наборов параметров зданий: {str(e)}")
        return Response({"detail": "Внутренняя ошибка сервера"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getBuildingParameterSet(request, pk):
    try:
        logger.info(f"Пользователь {request.user.username} запросил набор параметров здания с id: {pk}")
        parameter_set = BuildingParameterSet.objects.get(id=pk)
        serializer = BuildingParameterSetSerializer(parameter_set, many=False)
        logger.info(f"Успешно получен и сериализован набор параметров здания с id: {pk}")
        return Response(serializer.data)
    except BuildingParameterSet.DoesNotExist:
        logger.warning(f"Набор параметров здания с id: {pk} не найден")
        return Response({"detail": "Набор параметров не найден"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Ошибка при получении набора параметров здания с id: {pk}: {str(e)}")
        return Response({"detail": "Внутренняя ошибка сервера"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createBuildingParameterSet(request):
    try:
        logger.info(f"Пользователь {request.user.username} пытается создать новый набор параметров здания")
        logger.debug(f"Данные запроса: {request.data}")

        # Преобразовать время в формат 'HH:MM:SS'
        time_str = request.data.get('time')
        if time_str:
            try:
                datetime.strptime(time_str, '%H:%M:%S')
            except ValueError:
                logger.warning(f"Некорректный формат времени: {time_str}")
                return Response({'error': 'Invalid time format'}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data
        if isinstance(data, list):
            created_sets = []
            for item in data:
                serializer = BuildingParameterSetSerializer(data=item)
                if serializer.is_valid():
                    parameter_set = serializer.save()
                    created_sets.append(parameter_set)
                    logger.info(f"Успешно создан набор параметров здания с id: {parameter_set.id}")
                else:
                    logger.warning(f"Ошибка валидации данных: {serializer.errors}")
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            return Response(BuildingParameterSetSerializer(created_sets, many=True).data, status=status.HTTP_201_CREATED)
        else:
            serializer = BuildingParameterSetSerializer(data=data)
            if serializer.is_valid():
                parameter_set = serializer.save()
                logger.info(f"Успешно создан набор параметров здания с id: {parameter_set.id}")
                return Response(BuildingParameterSetSerializer(parameter_set).data, status=status.HTTP_201_CREATED)
            logger.warning(f"Ошибка валидации данных: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Ошибка при создании набора параметров здания: {str(e)}")
        return Response({'detail': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateBuildingParameterSet(request, pk):
    try:
        logger.info(f"Пользователь {request.user.username} пытается обновить набор параметров здания с id: {pk}")
        parameter_set = BuildingParameterSet.objects.get(pk=pk)
    except BuildingParameterSet.DoesNotExist:
        logger.warning(f"Набор параметров здания с id {pk} не найден")
        return Response(status=status.HTTP_404_NOT_FOUND)

    serializer = BuildingParameterSetSerializer(instance=parameter_set, data=request.data)
    if serializer.is_valid():
        serializer.save()
        logger.info(f"Набор параметров здания с id {pk} успешно обновлен")
        return Response(serializer.data)
    
    logger.warning(f"Ошибка валидации данных при обновлении набора параметров здания с id {pk}: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deleteBuildingParameterSet(request, pk):
    try:
        logger.info(f"Пользователь {request.user.username} пытается удалить набор параметров здания с id: {pk}")
        parameter_set = BuildingParameterSet.objects.get(pk=pk)
    except BuildingParameterSet.DoesNotExist:
        logger.warning(f"Набор параметров здания с id {pk} не найден")
        return Response(status=status.HTTP_404_NOT_FOUND)

    parameter_set.delete()
    logger.info(f"Набор параметров здания с id {pk} успешно удален")
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
# @permission_classes([IsAuthenticated])
def getBuildingEnvironmentalParameters(request):
    try:
        user = request.user
        logger.info(f"Запрос от пользователя: {user.username}")

        responsible = request.query_params.get('responsible')
        building = request.query_params.get('building')
        date = request.query_params.get('date')

        logger.info(f"Фильтры запроса - responsible: {responsible}, building: {building}, date: {date}")

        parameters = BuildingEnviromentalParameters.objects.all().prefetch_related('building', 'responsible')

        if responsible:
            parameters = parameters.filter(responsible=responsible)
            logger.info(f"Фильтрация по ответственному: {responsible}")
        if building:
            parameters = parameters.filter(building=building)
            logger.info(f"Фильтрация по зданию: {building}")
        if date:
            created_start = datetime.strptime(date, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0)
            created_end = created_start + timedelta(days=1)
            parameters = parameters.filter(created_at__range=(created_start, created_end))
            logger.info(f"Фильтрация по дате: {created_start} - {created_end}")

        parameters = parameters.order_by('-created_at')  # Добавляем сортировку по дате создания записи
        logger.info("Параметры отсортированы по дате создания")

        serializer = BuildingEnvironmentalParametersSerializer(parameters, many=True, context={'request': request})
        return Response(serializer.data)

    except Exception as e:
        logger.error(f'Произошла ошибка во время выполнения getBuildingEnvironmentalParameters: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getBuildingEnvironmentalParameter(request, pk):
    try:
        user = request.user
        logger.info(f"Запрос от пользователя: {user.username} для получения параметра окружающей среды здания с ID: {pk}")

        parameters = BuildingEnviromentalParameters.objects.get(id=pk)
        logger.info(f"Найден параметр окружающей среды здания с ID: {pk}")

        serializer = BuildingEnvironmentalParametersSerializer(parameters, many=False)
        return Response(serializer.data)
    
    except BuildingEnviromentalParameters.DoesNotExist:
        logger.warning(f"Параметр окружающей среды здания с ID: {pk} не найден")
        return Response({'error': 'Параметр окружающей среды не найден'}, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        logger.error(f'Произошла ошибка во время выполнения getBuildingEnvironmentalParameter: {e}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createBuildingEnvironmentalParameters(request):
    try:
        user = request.user
        logger.info(f"Запрос на создание параметров окружающей среды здания от пользователя: {user.username}")

        building_data = request.data.get('building')
        building = Building.objects.get(building_number=building_data.get('building_number'))
        created_at = request.data.get('created_at')
        existing_parameters = BuildingEnviromentalParameters.objects.filter(building=building, created_at=created_at)
        
        if existing_parameters.exists():
            logger.warning('Запись для этого здания и даты уже существует')
            return Response({'error': 'An entry for this building and date already exists'}, status=status.HTTP_400_BAD_REQUEST)

        responsible_data = request.data.get('responsible')
        responsible, _ = Responsible.objects.get_or_create(
            first_name=responsible_data.get('first_name'),
            last_name=responsible_data.get('last_name'),
            patronymic=responsible_data.get('patronymic')
        )

        measurement_instruments_data = request.data.get('measurement_instruments', [])
        measurement_instruments = []
        for instrument_data in measurement_instruments_data:
            instrument_dict = {
                'name': instrument_data.get('name'),  
                'type': instrument_data.get('type'),
                'serial_number': instrument_data.get('serial_number'),
                'calibration_date': instrument_data.get('calibration_date'),
                'calibration_interval': instrument_data.get('calibration_interval')
            }
            measurement_instruments.append(instrument_dict)

        parameter_sets_data = request.data.get('parameter_sets', [])
        parameter_set_ids = []

        existing_parameter_set_ids = BuildingParameterSet.objects.values_list('id', flat=True)
        for param_set_data in parameter_sets_data:
            parameter_set_id = param_set_data.get('id')
            if parameter_set_id in existing_parameter_set_ids:
                parameter_set_ids.append(parameter_set_id)
                logger.info(f"Найден ParameterSet с id {parameter_set_id}")
            else:
                serializer = BuildingParameterSetSerializer(data=param_set_data)
                if serializer.is_valid():
                    parameter_set = serializer.save()
                    parameter_set_ids.append(parameter_set.id)
                    logger.info(f"Создан новый ParameterSet с id {parameter_set.id}")
                else:
                    logger.error(f"Ошибки в данных ParameterSet: {serializer.errors}")
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        data = {
            'building': building_data,
            'responsible': responsible_data,
            'measurement_instruments': measurement_instruments,
            'parameter_sets': parameter_sets_data,
            'created_at': request.data.get('created_at')
        }

        serializer = BuildingEnvironmentalParametersSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            logger.info("Параметры окружающей среды здания успешно созданы")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            logger.error(f"Ошибки в данных BuildingEnvironmentalParameters: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Building.DoesNotExist:
        logger.error("Здание не найдено")
        return Response({'error': 'Building not found'}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"Произошла ошибка во время выполнения createBuildingEnvironmentalParameters: {e}", exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateBuildingEnvironmentalParameters(request, pk):
    try:
        user = request.user
        logger.info(f"Запрос на обновление параметров окружающей среды здания от пользователя: {user.username}, id параметров: {pk}")

        try:
            environmental_params = BuildingEnviromentalParameters.objects.get(pk=pk)
        except BuildingEnviromentalParameters.DoesNotExist:
            logger.warning(f"Параметры окружающей среды здания с id {pk} не найдены")
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = BuildingEnvironmentalParametersSerializer(instance=environmental_params, data=request.data, context={'request': request})
        environmental_params.parameter_sets.all().delete()
        
        if serializer.is_valid():
            building_data = request.data.get('building')
            parameter_sets_data = request.data.get('parameter_sets', [])
            measurement_instrument_data = request.data.get('measurement_instrument')
            measurement_instruments_data = request.data.get('measurement_instruments', [])
            modified_by_data = request.data.get('modified_by')
            user_id = modified_by_data.get('user')

            building, created = Building.objects.get_or_create(building_number=building_data.get('building_number')) if building_data else (None, False)

            parameter_sets = []
            for param_set_data in parameter_sets_data:
                parameter_set = BuildingParameterSet.objects.create(**param_set_data)
                parameter_sets.append(parameter_set)
                logger.info(f"Создан новый параметр набора с id {parameter_set.id}")

            measurement_instrument_instance, _ = MeasurementInstrument.objects.get_or_create(**measurement_instrument_data) if measurement_instrument_data else (None, False)
            measurement_instruments = []
            if measurement_instruments_data:
                for instrument_data in measurement_instruments_data:
                    measurement_instrument_instance, _ = MeasurementInstrument.objects.get_or_create(**instrument_data)
                    measurement_instruments.append(measurement_instrument_instance)

            environmental_params.building = building
            created_at = request.data.get('created_at')
            if created_at:
                environmental_params.created_at = created_at

            environmental_params.parameter_sets.set(parameter_sets)
            environmental_params.measurement_instruments.set(measurement_instruments)

            try:
                modified_by_user = User.objects.get(id=user_id)
                environmental_params.modified_by = modified_by_user
                logger.info(f"Параметры изменены пользователем: {modified_by_user.username}")
            except User.DoesNotExist:
                logger.warning(f'Пользователь с id {user_id} не существует.')

            environmental_params.save()
            logger.info(f"Параметры окружающей среды здания с id {pk} успешно обновлены")
            return Response(serializer.data)

        logger.error(f"Ошибки в данных обновления параметров окружающей среды: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"Произошла ошибка во время обновления параметров окружающей среды здания: {e}", exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deleteBuildingEnvironmentalParameters(request, pk):
    try:
        user = request.user
        logger.info(f"Запрос на удаление параметров окружающей среды здания от пользователя: {user.username}, id параметров: {pk}")

        try:
            environmental_params = BuildingEnviromentalParameters.objects.get(pk=pk)
        except BuildingEnviromentalParameters.DoesNotExist:
            logger.warning(f"Параметры окружающей среды здания с id {pk} не найдены")
            return Response(status=status.HTTP_404_NOT_FOUND)

        environmental_params.delete()
        logger.info(f"Параметры окружающей среды здания с id {pk} успешно удалены")
        return Response(status=status.HTTP_204_NO_CONTENT)

    except Exception as e:
        logger.error(f"Произошла ошибка во время удаления параметров окружающей среды здания: {e}", exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
# @permission_classes([IsAuthenticated])
def filterEnvironmentalParameters(request):
    try:
        user = request.user
        logger.info(f"Запрос на фильтрацию параметров окружающей среды от пользователя: {user.username}")

        responsible_id = request.query_params.get('responsible')
        room_number = request.query_params.get('room')
        date = request.query_params.get('date')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        logger.info(f"Параметры фильтрации: responsible_id={responsible_id}, room_number={room_number}, date={date}, start_date={start_date}, end_date={end_date}")

        parameters = EnviromentalParameters.objects.all()

        if responsible_id:
            parameters = parameters.filter(responsible__id=responsible_id)

        if room_number:
            parameters = parameters.filter(room__room_number=room_number)

        if date:
            parameters = parameters.filter(created_at=date)

        if start_date and end_date:
            parameters = parameters.filter(created_at__range=[start_date, end_date])

        parameters = parameters.order_by('-created_at')

        serializer = EnvironmentalParametersSerializer(parameters, many=True)
        logger.info(f"Фильтрация завершена успешно, найдено {parameters.count()} параметров")
        return Response(serializer.data)

    except Exception as e:
        logger.error(f"Произошла ошибка при фильтрации параметров: {e}", exc_info=True)
        return Response({'error': 'Произошла ошибка при фильтрации параметров'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
# @permission_classes([IsAuthenticated])
def filterBuildingEnvironmentalParameters(request):
    try:
        user = request.user
        logger.info(f"Запрос на фильтрацию параметров окружающей среды для зданий от пользователя: {user.username}")

        responsible_id = request.query_params.get('responsible')
        building_number = request.query_params.get('building')
        date = request.query_params.get('date')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        logger.info(f"Параметры фильтрации: responsible_id={responsible_id}, building_number={building_number}, date={date}, start_date={start_date}, end_date={end_date}")

        parameters = BuildingEnviromentalParameters.objects.all()

        if responsible_id:
            parameters = parameters.filter(responsible__id=responsible_id)

        if building_number:
            parameters = parameters.filter(building__building_number=building_number)

        if date:
            parameters = parameters.filter(created_at=date)

        if start_date and end_date:
            parameters = parameters.filter(created_at__range=[start_date, end_date])

        parameters = parameters.order_by('-created_at')

        serializer = BuildingEnvironmentalParametersSerializer(parameters, many=True)
        logger.info(f"Фильтрация завершена успешно, найдено {parameters.count()} параметров")
        return Response(serializer.data)

    except Exception as e:
        logger.error(f"Произошла ошибка при фильтрации параметров: {e}", exc_info=True)
        return Response({'error': 'Произошла ошибка при фильтрации параметров'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def filterMeasurementInstruments(request):
    try:
        query_params = request.query_params
        filters = Q()
        today = timezone.now().date()
        # СТАНДАРТНЫЕ ФИЛЬТРЫ
        if query_params.get('registration_number'):
            filters &= Q(registration_number__icontains=query_params['registration_number'])
        if query_params.get('name'):
            filters &= Q(name__icontains=query_params['name'])
        if query_params.get('type'):
            filters &= Q(type__icontains=query_params['type'])
        if query_params.get('serial_number'):
            filters &= Q(serial_number__icontains=query_params['serial_number'])
        if query_params.get('metrological_characteristics'):
            filters &= Q(metrological_characteristics__icontains=query_params['metrological_characteristics'])
        if query_params.get('calibration_date'):
            filters &= Q(calibration_date=query_params['calibration_date'])
        if query_params.get('calibration_interval'):
            filters &= Q(calibration_interval=query_params['calibration_interval'])
        if query_params.get('next_calibration_date'):
            filters &= Q(next_calibration_date=query_params['next_calibration_date'])
        if query_params.get('year_of_manufacture'):
            filters &= Q(year_of_manufacture=query_params['year_of_manufacture'])
        
        instruments = MeasurementInstrument.objects.filter(filters).order_by('-next_calibration_date')
        
        # ФИЛЬТРАЦИЯ ПО ПРИГОДНОСТИ (по актуальной дате)
        suitability_filter = query_params.get('suitability')
        if suitability_filter:
            filtered_instruments = []
            for instrument in instruments:
                # Вычисляем пригодность на лету
                is_suitable_now = instrument.next_calibration_date >= today if instrument.next_calibration_date else instrument.suitability
                
                if (suitability_filter == 'true' and is_suitable_now) or \
                   (suitability_filter == 'false' and not is_suitable_now) or \
                   (suitability_filter == ''):
                    filtered_instruments.append(instrument)
            instruments = filtered_instruments
        
        # Сериализуем
        serializer = MeasurementInstrumentSerializer(instruments, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f'Ошибка в filterMeasurementInstruments: {str(e)}', exc_info=True)
        return Response({'error': 'Внутренняя ошибка сервера', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def document_list_view(request):
    """Последнее загруженное руководство пользователя."""
    document = Document.objects.order_by('-uploaded_at').first()
    if not document:
        return Response(None)
    serializer = DocumentSerializer(document, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
def responsible_list_list_view(request):
    """Последний загруженный список ответственных."""
    document = ResponsibleList.objects.order_by('-uploaded_at').first()
    if not document:
        return Response(None)
    serializer = ResponsibleListSerializer(document, context={'request': request})
    return Response(serializer.data)