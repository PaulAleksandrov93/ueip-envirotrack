from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.admin import GroupAdmin as DjangoGroupAdmin
from django.contrib.auth.models import User, Group
from django.utils.html import format_html

from .models import (
    Responsible,
    Room,
    EnviromentalParameters,
    Profession,
    MeasurementInstrument,
    ParameterSet,
    Building,
    AdditionalParameters,
    BuildingParameterSet,
    BuildingEnviromentalParameters,
    ExtendedParameterSet,
    ParameterSetForStorage,
    Document,
    ResponsibleList,
    UserFilterPreference,
)

admin.site.site_header = 'Администрирование журнала регистрации параметров окружающей среды'
admin.site.site_title = 'Администрирование журнала'
admin.site.index_title = 'Панель управления'

User._meta.verbose_name = 'Пользователь'
User._meta.verbose_name_plural = 'Пользователи'
Group._meta.verbose_name = 'Группа'
Group._meta.verbose_name_plural = 'Группы'


class AdditionalParametersInline(admin.StackedInline):
    model = AdditionalParameters
    extra = 0
    verbose_name_plural = 'Дополнительные параметры'


class LatestFileAdminMixin:
    """Хранит одну актуальную версию файла: удаляет предыдущие записи и файлы на диске."""

    def file_link(self, obj):
        if obj.file:
            return format_html('<a href="{}" target="_blank">{}</a>', obj.file.url, obj.file.name)
        return '—'

    file_link.short_description = 'Файл'

    def save_model(self, request, obj, form, change):
        if change and 'file' in form.changed_data:
            previous = self.model.objects.filter(pk=obj.pk).first()
            if previous and previous.file:
                previous.file.delete(save=False)
        super().save_model(request, obj, form, change)
        for old in self.model.objects.exclude(pk=obj.pk):
            if old.file:
                old.file.delete(save=False)
            old.delete()


@admin.register(Profession)
class ProfessionAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Responsible)
class ResponsibleAdmin(admin.ModelAdmin):
    list_display = ('last_name', 'first_name', 'patronymic', 'profession', 'user')
    search_fields = ('last_name', 'first_name', 'patronymic')
    list_filter = ('profession',)
    autocomplete_fields = ('user', 'profession')


@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
    list_display = ('building_number', 'voltage_min', 'voltage_max', 'frequency_min', 'frequency_max')
    search_fields = ('building_number',)
    filter_horizontal = ('responsible_persons',)


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_number', 'building', 'list_responsibles', 'is_storage', 'has_additional_parameters')
    list_filter = ('building', 'is_storage', 'has_additional_parameters')
    search_fields = ('room_number', 'building__building_number')
    filter_horizontal = ('responsible_persons',)
    autocomplete_fields = ('building',)

    def list_responsibles(self, obj):
        return ', '.join([person.last_name for person in obj.responsible_persons.all()])

    list_responsibles.short_description = 'Ответственные'

    def get_inline_instances(self, request, obj=None):
        if obj and obj.has_additional_parameters:
            return [AdditionalParametersInline(self.model, self.admin_site)]
        return []

    def change_view(self, request, object_id, form_url='', extra_context=None):
        obj = self.get_object(request, object_id)
        if obj:
            self.inlines = [AdditionalParametersInline] if obj.has_additional_parameters else []
        return super().change_view(request, object_id, form_url, extra_context)


@admin.register(MeasurementInstrument)
class MeasurementInstrumentAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'serial_number', 'calibration_date', 'next_calibration_date', 'suitability')
    list_filter = ('suitability', 'type')
    search_fields = ('name', 'type', 'serial_number', 'registration_number')
    date_hierarchy = 'calibration_date'


@admin.register(ParameterSet)
class ParameterSetAdmin(admin.ModelAdmin):
    list_display = ('id', 'temperature_celsius', 'humidity_percentage', 'pressure_kpa', 'pressure_mmhg', 'time')
    search_fields = ('id',)


@admin.register(ExtendedParameterSet)
class ExtendedParameterSetAdmin(admin.ModelAdmin):
    list_display = ('id', 'temperature_celsius', 'humidity_percentage', 'voltage', 'frequency', 'radiation', 'time')
    search_fields = ('id',)


@admin.register(ParameterSetForStorage)
class ParameterSetForStorageAdmin(admin.ModelAdmin):
    list_display = ('id', 'temperature_celsius', 'humidity_percentage', 'time')
    search_fields = ('id',)


@admin.register(BuildingParameterSet)
class BuildingParameterSetAdmin(admin.ModelAdmin):
    list_display = ('id', 'voltage', 'frequency', 'harmonic_coefficient', 'waveform_shape', 'time')
    search_fields = ('id', 'waveform_shape')


@admin.register(EnviromentalParameters)
class EnviromentalParametersAdmin(admin.ModelAdmin):
    list_display = ('id', 'room', 'responsible', 'created_at', 'created_by')
    list_filter = ('created_at', 'room__building')
    search_fields = ('room__room_number', 'responsible__last_name')
    date_hierarchy = 'created_at'
    autocomplete_fields = ('room', 'responsible', 'created_by', 'modified_by')
    filter_horizontal = ('measurement_instruments', 'parameter_sets', 'extended_parameter_sets', 'parameter_sets_for_storage')


@admin.register(BuildingEnviromentalParameters)
class BuildingEnviromentalParametersAdmin(admin.ModelAdmin):
    list_display = ('id', 'building', 'responsible', 'created_at', 'created_by')
    list_filter = ('created_at', 'building')
    search_fields = ('building__building_number', 'responsible__last_name')
    date_hierarchy = 'created_at'
    autocomplete_fields = ('building', 'responsible', 'created_by', 'modified_by')
    filter_horizontal = ('measurement_instruments', 'parameter_sets')


@admin.register(Document)
class DocumentAdmin(LatestFileAdminMixin, admin.ModelAdmin):
    list_display = ('name', 'file_link', 'uploaded_at')
    search_fields = ('name',)
    ordering = ('-uploaded_at',)
    readonly_fields = ('uploaded_at',)


@admin.register(ResponsibleList)
class ResponsibleListAdmin(LatestFileAdminMixin, admin.ModelAdmin):
    list_display = ('name', 'file_link', 'uploaded_at')
    search_fields = ('name',)
    ordering = ('-uploaded_at',)
    readonly_fields = ('uploaded_at',)


@admin.register(UserFilterPreference)
class UserFilterPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'scope', 'updated_at')
    list_filter = ('scope',)
    search_fields = ('user__username', 'user__last_name')
    readonly_fields = ('updated_at',)


class TranslatedUserAdmin(DjangoUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    search_fields = ('username', 'first_name', 'last_name', 'email')


class TranslatedGroupAdmin(DjangoGroupAdmin):
    search_fields = ('name',)


admin.site.unregister(User)
admin.site.unregister(Group)
admin.site.register(User, TranslatedUserAdmin)
admin.site.register(Group, TranslatedGroupAdmin)
