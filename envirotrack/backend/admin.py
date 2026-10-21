from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.admin import GroupAdmin as DjangoGroupAdmin
from django.contrib.auth.models import User, Group
from django.core.files.uploadedfile import UploadedFile
from django.core.validators import FileExtensionValidator
from django.urls import reverse
from django.utils import timezone
from django.utils.html import format_html
from datetime import timedelta

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
admin.site.site_url = '/rooms-parameters'

User._meta.verbose_name = 'Пользователь'
User._meta.verbose_name_plural = 'Пользователи'
Group._meta.verbose_name = 'Группа'
Group._meta.verbose_name_plural = 'Группы'


class AdditionalParametersInline(admin.StackedInline):
    model = AdditionalParameters
    extra = 0
    verbose_name_plural = 'Дополнительные параметры'


DOCUMENT_EXTENSIONS = ('pdf', 'doc', 'docx', 'xls', 'xlsx', 'odt')
DOCUMENT_MAX_MB = 50  # совпадает с client_max_body_size в nginx.conf


def document_form(model, default_name):
    class DocumentFileForm(forms.ModelForm):
        name = forms.CharField(
            label='Название документа', required=False, max_length=255,
            help_text=f'Под этим именем файл скачивается из меню. Если оставить пустым — «{default_name}».',
        )
        file = forms.FileField(
            label='Файл',
            validators=[FileExtensionValidator(DOCUMENT_EXTENSIONS)],
            help_text=(
                f"Форматы: {', '.join(DOCUMENT_EXTENSIONS)}; до {DOCUMENT_MAX_MB} МБ. "
                'После сохранения старый файл удаляется, пользователи сразу получают новый.'
            ),
        )

        class Meta:
            fields = ('name', 'file')

        def clean_name(self):
            return self.cleaned_data['name'].strip() or default_name

        def clean_file(self):
            uploaded = self.cleaned_data['file']
            if isinstance(uploaded, UploadedFile) and uploaded.size > DOCUMENT_MAX_MB * 1024 * 1024:
                raise forms.ValidationError(f'Файл больше {DOCUMENT_MAX_MB} МБ.')
            return uploaded

    DocumentFileForm.Meta.model = model
    return DocumentFileForm


class LatestFileAdminMixin:
    """Хранит одну актуальную версию файла: удаляет предыдущие записи и файлы на диске."""

    readonly_fields = ('uploaded_at',)
    ordering = ('-uploaded_at',)
    list_display = ('name', 'file_link', 'file_size', 'uploaded_at')
    search_fields = ('name',)

    def file_link(self, obj):
        if obj.file:
            return format_html('<a href="{}" target="_blank">{}</a>', obj.file.url, obj.file.name.rsplit('/', 1)[-1])
        return '—'

    file_link.short_description = 'Файл'

    def file_size(self, obj):
        try:
            size = obj.file.size
        except (OSError, ValueError):
            return 'нет на диске'
        return f'{size / 1024 / 1024:.1f} МБ' if size >= 1024 * 1024 else f'{max(size // 1024, 1)} КБ'

    file_size.short_description = 'Размер'

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


class CalibrationStatusFilter(admin.SimpleListFilter):
    title = 'поверка'
    parameter_name = 'calibration'

    def lookups(self, request, model_admin):
        return (
            ('expired', 'Просрочена'),
            ('soon', 'Истекает в течение 30 дней'),
            ('ok', 'Действует'),
        )

    def queryset(self, request, queryset):
        today = timezone.localdate()
        if self.value() == 'expired':
            return queryset.filter(next_calibration_date__lt=today)
        if self.value() == 'soon':
            return queryset.filter(next_calibration_date__gte=today, next_calibration_date__lte=today + timedelta(days=30))
        if self.value() == 'ok':
            return queryset.filter(next_calibration_date__gt=today + timedelta(days=30))
        return queryset


@admin.register(MeasurementInstrument)
class MeasurementInstrumentAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'serial_number', 'registration_number', 'calibration_date', 'next_calibration_date', 'calibration_status')
    list_display_links = ('name', 'type')
    list_filter = (CalibrationStatusFilter, 'type', 'year_of_manufacture')
    search_fields = ('name', 'type', 'serial_number', 'registration_number', 'metrological_characteristics')
    date_hierarchy = 'calibration_date'
    ordering = ('next_calibration_date',)
    readonly_fields = ('next_calibration_date', 'suitability')
    fieldsets = (
        ('Средство измерений', {'fields': ('name', 'type', 'serial_number', 'registration_number', 'year_of_manufacture')}),
        ('Метрология', {'fields': ('metrological_characteristics',)}),
        ('Поверка', {
            'fields': ('calibration_date', 'calibration_interval', 'next_calibration_date', 'suitability'),
            'description': 'Дата следующей поверки и пригодность рассчитываются автоматически при сохранении.',
        }),
    )

    @admin.display(description='Статус', ordering='next_calibration_date')
    def calibration_status(self, obj):
        if not obj.next_calibration_date:
            return format_html('<span class="et-badge">{}</span>', 'нет даты')
        days = (obj.next_calibration_date - timezone.localdate()).days
        if days < 0:
            return format_html('<span class="et-badge et-badge--danger">просрочена на {} дн.</span>', -days)
        if days <= 30:
            return format_html('<span class="et-badge et-badge--warning">осталось {} дн.</span>', days)
        return format_html('<span class="et-badge et-badge--success">{}</span>', 'годен')


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
    form = document_form(Document, 'Руководство пользователя')


@admin.register(ResponsibleList)
class ResponsibleListAdmin(LatestFileAdminMixin, admin.ModelAdmin):
    form = document_form(ResponsibleList, 'Список ответственных')


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


# ---------- Главная страница: разделы по смыслу и сводка ----------

ADMIN_SECTIONS = (
    ('journal', 'Журнал', ('enviromentalparameters', 'buildingenviromentalparameters')),
    ('instruments', 'Средства измерений', ('measurementinstrument',)),
    ('directories', 'Справочники', ('building', 'room', 'responsible', 'profession')),
    ('documents', 'Документы для пользователей', ('document', 'responsiblelist')),
    ('access', 'Пользователи и доступ', ('user', 'group', 'userfilterpreference')),
    ('service', 'Служебные данные', ('parameterset', 'extendedparameterset', 'parametersetforstorage', 'buildingparameterset')),
)
# Токены JWT ведутся автоматически, вручную их не правят.
HIDDEN_ADMIN_APPS = {'token_blacklist'}

_default_get_app_list = admin.site.get_app_list


def grouped_app_list(request, app_label=None):
    app_list = _default_get_app_list(request, app_label)
    if app_label:
        return app_list

    models = {}
    for app in app_list:
        if app['app_label'] in HIDDEN_ADMIN_APPS:
            continue
        for model in app['models']:
            models[model['object_name'].lower()] = model

    sections = []
    for label, title, names in ADMIN_SECTIONS:
        section_models = [models.pop(name) for name in names if name in models]
        if section_models:
            sections.append({
                'name': title, 'app_label': label, 'app_url': section_models[0]['admin_url'],
                'has_module_perms': True, 'models': section_models,
            })
    if models:
        sections.append({
            'name': 'Прочее', 'app_label': 'other', 'app_url': '', 'has_module_perms': True,
            'models': sorted(models.values(), key=lambda m: m['name']),
        })
    return sections


admin.site.get_app_list = grouped_app_list


def dashboard_context():
    today = timezone.localdate()
    week_start = today - timedelta(days=6)
    soon = today + timedelta(days=30)
    instruments = MeasurementInstrument.objects.all()

    documents = []
    for model, title in ((Document, 'Руководство пользователя'), (ResponsibleList, 'Список ответственных')):
        obj = model.objects.order_by('-uploaded_at').first()
        documents.append({
            'title': title,
            'obj': obj,
            'file_name': obj.file.name.rsplit('/', 1)[-1] if obj and obj.file else '',
            'add_url': reverse(f'admin:backend_{model._meta.model_name}_add'),
        })

    return {
        'today': today,
        'week_start': week_start,
        'rooms_today': EnviromentalParameters.objects.filter(created_at=today).count(),
        'rooms_week': EnviromentalParameters.objects.filter(created_at__gte=week_start).count(),
        'buildings_today': BuildingEnviromentalParameters.objects.filter(created_at=today).count(),
        'buildings_week': BuildingEnviromentalParameters.objects.filter(created_at__gte=week_start).count(),
        'instruments_total': instruments.count(),
        'instruments_expired': instruments.filter(next_calibration_date__lt=today).count(),
        'instruments_soon': instruments.filter(next_calibration_date__gte=today, next_calibration_date__lte=soon).count(),
        'upcoming': instruments.filter(next_calibration_date__lte=soon).order_by('next_calibration_date')[:8],
        'documents': documents,
    }


_default_index = admin.site.index


def index_with_dashboard(request, extra_context=None):
    return _default_index(request, {**(extra_context or {}), 'dashboard': dashboard_context()})


admin.site.index = index_with_dashboard
