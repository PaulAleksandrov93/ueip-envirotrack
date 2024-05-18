# models.py

from django.db import models
from django.contrib.auth.models import User
from dateutil.relativedelta import relativedelta
import datetime


class Profession(models.Model):
    name = models.CharField(max_length=50, verbose_name='Название')

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = 'Профессия'
        verbose_name_plural = 'Профессии'


class Responsible(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, verbose_name='Пользователь')
    last_name = models.CharField(max_length=50, verbose_name='Фамилия')
    first_name = models.CharField(max_length=50, verbose_name='Имя')
    patronymic = models.CharField(max_length=50, verbose_name='Отчество')
    profession = models.ForeignKey(Profession, on_delete=models.SET_NULL, null=True, verbose_name='Профессия')
    

    def __str__(self):        
        return f'{self.last_name} {self.first_name} {self.patronymic}'
    
    class Meta:
        verbose_name = 'Ответственный'
        verbose_name_plural = 'Ответственные'
    
    
class Building(models.Model):
    building_number = models.CharField(max_length=10, verbose_name='Номер здания')
    responsible_persons = models.ManyToManyField(Responsible, related_name="buildings", verbose_name='Ответственный')
    voltage_min = models.FloatField(default=0, verbose_name='Минимальное напряжение питающей сети (В)')
    voltage_max = models.FloatField(default=1000, verbose_name='Максимальное напряжение питающей сети (В)')
    frequency_min = models.FloatField(default=0, verbose_name='Минимальная частота переменного тока (Гц)')
    frequency_max = models.FloatField(default=60, verbose_name='Максимальная частота переменного тока (Гц)')

    def __str__(self):
        return f'Здание № {self.building_number}'
    
    class Meta:
        verbose_name = 'Здание'
        verbose_name_plural = 'Здания'


class Room(models.Model):
    building = models.ForeignKey(Building, on_delete=models.CASCADE, verbose_name='Здание', related_name='rooms')
    room_number = models.CharField(max_length=10, verbose_name='Номер помещения')
    responsible_persons = models.ManyToManyField(Responsible, related_name="rooms", verbose_name='Ответственный')
    temperature_min = models.FloatField(default=0, verbose_name='Минимальная температура')
    temperature_max = models.FloatField(default=100, verbose_name='Максимальная температура')
    humidity_min = models.FloatField(default=0, verbose_name='Минимальная влажность')
    humidity_max = models.FloatField(default=100, verbose_name='Максимальная влажность')
    pressure_min_kpa = models.FloatField(default=0, verbose_name='Минимальное давление (кПа)')
    pressure_max_kpa = models.FloatField(default=100, verbose_name='Максимальное давление (кПа)')
    pressure_min_mmhg = models.FloatField(default=0, verbose_name='Минимальное давление (мм рт. ст.)')
    pressure_max_mmhg = models.FloatField(default=760, verbose_name='Максимальное давление (мм рт. ст.)')
    is_storage = models.BooleanField(default=False, verbose_name='Кладовая временного хранения')
    has_additional_parameters = models.BooleanField(default=False, verbose_name='Использует дополнительные параметры')
    
    
    def get_additional_parameters(self):
        if self.has_additional_parameters:
            additional_params = self.additional_parameters
            return {
                'voltage_min': additional_params.voltage_min,
                'voltage_max': additional_params.voltage_max,
                'frequency_min': additional_params.frequency_min,
                'frequency_max': additional_params.frequency_max,
                'radiation_min': additional_params.radiation_min,
                'radiation_max': additional_params.radiation_max,
            }
        return None
    
    def __str__(self):
        return f'{self.building} - Помещение № {self.room_number}'
    
    class Meta:
        verbose_name = 'Помещение'
        verbose_name_plural = 'Помещения'


class AdditionalParameters(models.Model):
    room = models.OneToOneField(Room, on_delete=models.CASCADE, related_name='additional_parameters', verbose_name='Помещение', null=True, blank=True)
    voltage_min = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True, verbose_name='Минимальное напряжение (В)')
    voltage_max = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True, verbose_name='Максимальное напряжение (В)')
    frequency_min = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True, verbose_name='Минимальная частота (Гц)')
    frequency_max = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True, verbose_name='Максимальная частота (Гц)')
    radiation_min = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True, verbose_name='Минимальный радиационный фон')
    radiation_max = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True, verbose_name='Максимальный радиационный фон')

    class Meta:
        verbose_name = 'Дополнительные параметры'
        verbose_name_plural = 'Дополнительные параметры'


class MeasurementInstrument(models.Model):
    name = models.CharField(max_length=255, verbose_name='Название')
    type = models.CharField(max_length=255, verbose_name='Тип')
    serial_number = models.CharField(max_length=50, verbose_name='Заводской номер')
    registration_number = models.CharField(default='', max_length=50, verbose_name='Регистрационный номер СИ')
    metrological_characteristics = models.CharField(default='', max_length=255, verbose_name='Метрологические характеристики СИ')
    calibration_date = models.DateField(verbose_name='Дата поверки')
    calibration_interval = models.PositiveIntegerField(verbose_name='Межповерочный интервал')
    next_calibration_date = models.DateField(verbose_name='Дата следующей поверки', null=True, blank=True)
    year_of_manufacture = models.PositiveIntegerField(default=2000, verbose_name='Год выпуска СИ')
    suitability = models.BooleanField(verbose_name='Пригодность СИ', default=True) 

    
    def save(self, *args, **kwargs):
        # Вычисляем дату следующей поверки
        if self.calibration_date and self.calibration_interval:
            next_calibration_date = self.calibration_date + relativedelta(months=self.calibration_interval) - datetime.timedelta(days=1)
            self.next_calibration_date = next_calibration_date
        super().save(*args, **kwargs)

    def __str__(self):
        return f' Название: {self.name} {self.type} Заводской номер: {self.serial_number}'

    class Meta:
        verbose_name = 'Средство измерений'
        verbose_name_plural = 'Средства измерений'
    


class ParameterSet(models.Model):
    temperature_celsius = models.DecimalField(max_digits=5, decimal_places=2)
    humidity_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    pressure_kpa = models.DecimalField(max_digits=7, decimal_places=2, blank=True)
    pressure_mmhg = models.DecimalField(max_digits=7, decimal_places=2, blank=True)
    time = models.TimeField()

    def __str__(self):
        return f'Parameter Set {self.id}'

    class Meta:
        verbose_name = 'Набор параметров'
        verbose_name_plural = 'Наборы параметров'


class ExtendedParameterSet(ParameterSet):
    voltage = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    frequency = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    radiation = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)

    class Meta:
        verbose_name = 'Расширенный набор параметров'
        verbose_name_plural = 'Расширенные наборы параметров'
        
class ParameterSetForStorage(models.Model):
    temperature_celsius = models.DecimalField(max_digits=5, decimal_places=2)
    humidity_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    time = models.TimeField()

    def __str__(self):
        return f'Parameter Set For Storage {self.id}'

    class Meta:
        verbose_name = 'Набор параметров для КВХ'
        verbose_name_plural = 'Наборы параметров КВХ'
        
        
class BuildingParameterSet(models.Model):
    voltage = models.FloatField(verbose_name='Напряжение питающей сети (В)')
    frequency = models.FloatField(verbose_name='Частота переменного тока (Гц)')
    time = models.TimeField()

    def __str__(self):
        return f'Parameter Set for Building {self.id}'

    class Meta:
        verbose_name = 'Набор параметров для здания'
        verbose_name_plural = 'Наборы параметров для здания'


class EnviromentalParameters(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    responsible = models.ForeignKey(Responsible, related_name='environmental_parameters', on_delete=models.SET_NULL, null=True)
    measurement_instruments = models.ManyToManyField(MeasurementInstrument, null=True)

    created_at = models.DateField(null=True)  # Дата и время создания
    created_by = models.ForeignKey(User, related_name='created_parameters', on_delete=models.SET_NULL, null=True)  # Кто создал
    modified_at = models.DateTimeField(auto_now=True, null=True)  # Дата и время последнего изменения
    modified_by = models.ForeignKey(User, related_name='modified_parameters', on_delete=models.SET_NULL, null=True)  # Кто изменил

    parameter_sets = models.ManyToManyField(ParameterSet, related_name='environmental_parameters_parameter_sets', blank=True)
    extended_parameter_sets = models.ManyToManyField(ExtendedParameterSet, related_name='environmental_parameters_extended_parameter_sets', blank=True)  
    parameter_sets_for_storage = models.ManyToManyField(ParameterSetForStorage, related_name='environmental_parameters_parameter_sets_for_storage', blank=True)
    

    def __str__(self):
        return f'{self.room.room_number} - {self.created_at}'

    class Meta:
        verbose_name = 'Запись с параметрами окружающей среды'
        verbose_name_plural = 'Записи с параметрами окружающей среды'


class BuildingEnviromentalParameters(models.Model):
    building = models.ForeignKey(Building, on_delete=models.CASCADE, verbose_name='Здание', related_name='building_environmental_parameters')
    responsible = models.ForeignKey(Responsible, related_name='building_environmental_parameters', on_delete=models.SET_NULL, null=True)
    measurement_instruments = models.ManyToManyField(MeasurementInstrument, null=True)
    
    created_at = models.DateField(null=True)  
    created_by = models.ForeignKey(User, related_name='created_building_parameters', on_delete=models.SET_NULL, null=True)
    modified_at = models.DateTimeField(auto_now=True)
    modified_by = models.ForeignKey(User, related_name='modified_building_parameters', on_delete=models.SET_NULL, null=True)

    parameter_sets = models.ManyToManyField(BuildingParameterSet, related_name='building_environmental_parameters', blank=True)

    def __str__(self):
        return f'Parameters for Building {self.building}'

    class Meta:
        verbose_name = 'Параметры окружающей среды для здания'
        verbose_name_plural = 'Параметры окружающей среды для зданий'
        
        
        
