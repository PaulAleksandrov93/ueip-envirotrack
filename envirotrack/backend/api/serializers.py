from rest_framework import serializers
from backend.models import Responsible, Room, EnviromentalParameters, MeasurementInstrument, \
                        ParameterSet, Building, BuildingEnviromentalParameters, BuildingParameterSet, \
                        ExtendedParameterSet, AdditionalParameters, ParameterSetForStorage
from rest_framework.response import Response
from rest_framework import status


class ResponsibleSerializer(serializers.ModelSerializer):
    profession = serializers.StringRelatedField()

    class Meta:
        model = Responsible
        fields = '__all__'


class BuildingSerializer(serializers.ModelSerializer):
    responsible_persons = ResponsibleSerializer(many=True)
    class Meta:
        model = Building
        fields = '__all__'

class RoomSerializer(serializers.ModelSerializer):
    responsible_persons = ResponsibleSerializer(many=True)
    class Meta:
        model = Room
        fields = '__all__'


class RoomNumberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['room_number']
        
        
class AdditionalParametersSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdditionalParameters
        fields = '__all__'


class RoomSelectSerializer(serializers.ModelSerializer):
    additional_parameters = AdditionalParametersSerializer(required=False)

    class Meta:
        model = Room
        fields = ['id', 'room_number', 'temperature_min', 'temperature_max', 'humidity_min',
                  'humidity_max', 'pressure_min_kpa', 'pressure_max_kpa',
                  'pressure_min_mmhg', 'pressure_max_mmhg', 'is_storage', 'has_additional_parameters', 'additional_parameters']

    def create(self, validated_data):
        # Удаляем поле has_additional_parameters из validated_data перед созданием объекта комнаты
        validated_data.pop('has_additional_parameters', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Удаляем поле has_additional_parameters из validated_data перед обновлением объекта комнаты
        validated_data.pop('has_additional_parameters', None)
        return super().update(instance, validated_data)    

        
class BuildingSelectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Building
        fields = ['id', 'building_number', 'voltage_min', 'voltage_max', 'frequency_min', \
            'frequency_max']
        

class ResposibleNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Responsible
        fields = ['first_name', 'last_name']


class MeasurementInstrumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeasurementInstrument
        fields = '__all__'



class ParameterSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParameterSet
        fields = '__all__'
   
     
class ExtendedParameterSetSerializer(ParameterSetSerializer):
    class Meta:
        model = ExtendedParameterSet
        fields = '__all__'
        

class ParameterSetForStorageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParameterSetForStorage
        fields = '__all__'
 

class EnvironmentalParametersSerializer(serializers.ModelSerializer):
    room = RoomSelectSerializer()
    responsible = ResponsibleSerializer()
    measurement_instruments = MeasurementInstrumentSerializer(many=True)  
    created_by = serializers.StringRelatedField()  
    modified_by = serializers.StringRelatedField()  
    parameter_sets = ParameterSetSerializer(many=True, required=False)  
    extended_parameter_sets = ExtendedParameterSetSerializer(many=True, required=False)
    parameter_sets_for_storage = ParameterSetForStorageSerializer(many=True, required=False)  

    class Meta:
        model = EnviromentalParameters
        fields = '__all__'


    def update(self, instance, validated_data):
        room_data = validated_data.pop('room', None)
        responsible_data = validated_data.pop('responsible', None)
        measurement_instrument_data = validated_data.pop('measurement_instruments', None)

        if room_data:
            room, created = Room.objects.get_or_create(room_number=room_data.get('room_number'))
            instance.room = room

        if responsible_data:
            responsible, created = Responsible.objects.get_or_create(
                first_name=responsible_data.get('first_name'),
                last_name=responsible_data.get('last_name')
            )
            instance.responsible = responsible

        if measurement_instrument_data:
            measurement_instruments = []
            for instrument_data in measurement_instrument_data:
                if isinstance(instrument_data, dict):  # Проверяем, является ли инструмент словарем
                    measurement_instrument, created = MeasurementInstrument.objects.get_or_create(**instrument_data)
                    measurement_instruments.append(measurement_instrument)
                else:
                    return Response({'error': 'Недопустимые данные. Ожидался словарь, но был получен MeasurementInstrument.'}, status=status.HTTP_400_BAD_REQUEST)
            instance.measurement_instruments.set(measurement_instruments)

        if self.context['request'].user.is_authenticated:
            instance.modified_by = self.context['request'].user

        parameter_sets_data = validated_data.pop('parameter_sets', [])
        extended_parameter_sets_data = validated_data.pop('extended_parameter_sets', [])  
        parameter_sets_for_storage_data = validated_data.pop('parameter_sets_for_storage', [])

        instance.parameter_sets.clear()
        instance.extended_parameter_sets.clear()
        instance.parameter_sets_for_storage.clear()

        for param_set_data in parameter_sets_data:
            serializer = ParameterSetSerializer(data=param_set_data)
            if serializer.is_valid():
                parameter_set = serializer.save()
                instance.parameter_sets.add(parameter_set)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        for extended_param_set_data in extended_parameter_sets_data:
            serializer = ExtendedParameterSetSerializer(data=extended_param_set_data)
            if serializer.is_valid():
                extended_parameter_set = serializer.save()
                instance.extended_parameter_sets.add(extended_parameter_set)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        for param_set_for_storage_data in parameter_sets_for_storage_data:
            serializer = ParameterSetForStorageSerializer(data=param_set_for_storage_data)
            if serializer.is_valid():
                parameter_set_for_storage = serializer.save()
                instance.parameter_sets_for_storage.add(parameter_set_for_storage)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        instance.save()

        return instance


    def create(self, validated_data):
        room_data = validated_data.pop('room', None)
        responsible_data = validated_data.pop('responsible', None)
        measurement_instrument_data = validated_data.pop('measurement_instruments', None)

        room = None
        if room_data:
            room, created = Room.objects.get_or_create(room_number=room_data.get('room_number'))

        responsible = None
        if responsible_data:
            responsible, created = Responsible.objects.get_or_create(
                first_name=responsible_data.get('first_name'),
                last_name=responsible_data.get('last_name')
            )

        measurement_instruments = None
        if measurement_instrument_data:
            measurement_instruments = []
            for instrument_data in measurement_instrument_data:
                if isinstance(instrument_data, dict):
                    measurement_instrument, created = MeasurementInstrument.objects.get_or_create(**instrument_data)
                    measurement_instruments.append(measurement_instrument)
                else:
                    return Response({'error': 'Недопустимые данные. Ожидался словарь, но был получен MeasurementInstrument.'}, status=status.HTTP_400_BAD_REQUEST)

        if self.context['request'].user.is_authenticated:
            validated_data['created_by'] = self.context['request'].user

        parameter_sets_data = validated_data.pop('parameter_sets', [])
        extended_parameter_sets_data = validated_data.pop('extended_parameter_sets', [])  
        parameter_sets_for_storage_data = validated_data.pop('parameter_sets_for_storage', [])

        instance = EnviromentalParameters.objects.create(
            room=room,
            responsible=responsible,
            **validated_data
        )

        if measurement_instruments:
            instance.measurement_instruments.set(measurement_instruments)

        for param_set_data in parameter_sets_data:
            serializer = ParameterSetSerializer(data=param_set_data)
            if serializer.is_valid():
                parameter_set = serializer.save()
                instance.parameter_sets.add(parameter_set)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        for extended_param_set_data in extended_parameter_sets_data:
            serializer = ExtendedParameterSetSerializer(data=extended_param_set_data)
            if serializer.is_valid():
                extended_parameter_set = serializer.save()
                instance.extended_parameter_sets.add(extended_parameter_set)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        for param_set_for_storage_data in parameter_sets_for_storage_data:
            serializer = ParameterSetForStorageSerializer(data=param_set_for_storage_data)
            if serializer.is_valid():
                parameter_set_for_storage = serializer.save()
                instance.parameter_sets_for_storage.add(parameter_set_for_storage)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return instance
    
   
class BuildingParameterSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuildingParameterSet
        fields = '__all__'


class BuildingEnvironmentalParametersSerializer(serializers.ModelSerializer):
    building = BuildingSelectSerializer()  
    responsible = ResponsibleSerializer()
    measurement_instruments = MeasurementInstrumentSerializer(many=True)  # Множественный выбор средств измерения
    created_by = serializers.StringRelatedField()  
    modified_by = serializers.StringRelatedField()  
    parameter_sets = BuildingParameterSetSerializer(many=True)

    class Meta:
        model = BuildingEnviromentalParameters
        fields = '__all__'


    def update(self, instance, validated_data):
        building_data = validated_data.pop('building', None)
        responsible_data = validated_data.pop('responsible', None)
        measurement_instrument_data = validated_data.pop('measurement_instruments', None)  # Исправлено на множественное число

        if building_data:
            building, created = Building.objects.get_or_create(building_number=building_data.get('building_number'))
            instance.building = building

        if responsible_data:
            responsible, created = Responsible.objects.get_or_create(
                first_name=responsible_data.get('first_name'),
                last_name=responsible_data.get('last_name')
            )
            instance.responsible = responsible

        if measurement_instrument_data:
            measurement_instruments = []
            for instrument_data in measurement_instrument_data:
                if isinstance(instrument_data, dict):  # Проверяем, является ли инструмент словарем
                    measurement_instrument, created = MeasurementInstrument.objects.get_or_create(**instrument_data)
                    measurement_instruments.append(measurement_instrument)
                else:
                    return Response({'error': 'Недопустимые данные. Ожидался словарь, но был получен MeasurementInstrument.'}, status=status.HTTP_400_BAD_REQUEST)
            instance.measurement_instruments.set(measurement_instruments)

        if self.context['request'].user.is_authenticated:
            instance.modified_by = self.context['request'].user

        # Операции с параметрсетами
        parameter_sets_data = validated_data.pop('parameter_sets', [])

        # Удаляем все связи с параметрсетами
        instance.parameter_sets.clear()

        for param_set_data in parameter_sets_data:
            parameter_set_id = param_set_data.get('id')

            if parameter_set_id:
                try:
                    parameter_set = BuildingParameterSet.objects.get(id=parameter_set_id)
                except BuildingParameterSet.DoesNotExist:
                    return Response({'error': f'ParameterSet with id {parameter_set_id} does not exist'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                serializer = BuildingParameterSetSerializer(data=param_set_data)
                if serializer.is_valid():
                    parameter_set = serializer.save()
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            instance.parameter_sets.add(parameter_set)

        instance.save()

        return instance


    def create(self, validated_data):
        building_data = validated_data.pop('building', None)
        responsible_data = validated_data.pop('responsible', None)
        measurement_instrument_data = validated_data.pop('measurement_instruments', None)

        building = None
        if building_data:
            building, created = Building.objects.get_or_create(building_number=building_data.get('building_number'))

        responsible = None
        if responsible_data:
            responsible, created = Responsible.objects.get_or_create(
                first_name=responsible_data.get('first_name'),
                last_name=responsible_data.get('last_name')
            )

        measurement_instruments = None
        if measurement_instrument_data:
            measurement_instruments = []
            for instrument_data in measurement_instrument_data:
                if isinstance(instrument_data, dict):
                    measurement_instrument, created = MeasurementInstrument.objects.get_or_create(**instrument_data)
                    measurement_instruments.append(measurement_instrument)
                else:
                    return Response({'error': 'Недопустимые данные. Ожидался словарь, но был получен MeasurementInstrument.'}, status=status.HTTP_400_BAD_REQUEST)

        if self.context['request'].user.is_authenticated:
            validated_data['created_by'] = self.context['request'].user

        # Операции с параметрсетами
        parameter_sets_data = validated_data.pop('parameter_sets', [])

        instance = BuildingEnviromentalParameters.objects.create(
            building=building,
            responsible=responsible,
            **validated_data
        )

        if measurement_instruments:
            instance.measurement_instruments.set(measurement_instruments)

        for param_set_data in parameter_sets_data:
            serializer = BuildingParameterSetSerializer(data=param_set_data)
            if serializer.is_valid():
                parameter_set = serializer.save()
                instance.parameter_sets.add(parameter_set)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return instance