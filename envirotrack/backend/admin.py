# from django.contrib import admin
# from .models import Responsible, Room, EnviromentalParameters, Profession, \
#                 MeasurementInstrument, ParameterSet, Building, AdditionalParameters, \
#                 BuildingParameterSet, ExtendedParameterSet, ParameterSetForStorage

# admin.site.register(Responsible)
# admin.site.register(EnviromentalParameters)
# admin.site.register(Profession)
# admin.site.register(ParameterSet)
# admin.site.register(ParameterSetForStorage)
# admin.site.register(ExtendedParameterSet)
# admin.site.register(BuildingParameterSet)
# admin.site.register(MeasurementInstrument)
# admin.site.register(Building)

# class AdditionalParametersInline(admin.StackedInline):
#     model = AdditionalParameters
#     verbose_name_plural = 'Дополнительные параметры'

# @admin.register(Room)
# class RoomAdmin(admin.ModelAdmin):
#     list_display = ('room_number', 'list_responsibles', 'has_additional_parameters')
    
#     def list_responsibles(self, obj):
#         return ", ".join([responsible.last_name for responsible in obj.responsible_persons.all()])
#     list_responsibles.short_description = 'Ответственные'
    
#     def get_inline_instances(self, request, obj=None):
#         if obj and obj.has_additional_parameters:
#             return [AdditionalParametersInline(self.model, self.admin_site)]
#         return []

#     def change_view(self, request, object_id, form_url='', extra_context=None):
#         obj = self.get_object(request, object_id)
#         if obj:
#             if obj.has_additional_parameters:
#                 self.inlines = [AdditionalParametersInline]
#             else:
#                 self.inlines = []
#         return super().change_view(request, object_id, form_url, extra_context)


from django.contrib import admin
from django.contrib.admin import AdminSite
from django.contrib.auth.models import User, Group
from .models import Responsible, Room, EnviromentalParameters, Profession, \
                    MeasurementInstrument, ParameterSet, Building, AdditionalParameters, \
                    BuildingParameterSet, ExtendedParameterSet, ParameterSetForStorage

class CustomAdminSite(AdminSite):
    site_title = 'Администрирование Журнал регистрации параметров окружающей среды'
    site_header = 'Администрирование Журнал регистрации параметров окружающей среды'
    index_title = 'Добро пожаловать в админку'

custom_admin_site = CustomAdminSite(name='custom_admin')

custom_admin_site.register(User)
custom_admin_site.register(Group)
custom_admin_site.register(Responsible)
custom_admin_site.register(EnviromentalParameters)
custom_admin_site.register(Profession)
custom_admin_site.register(ParameterSet)
custom_admin_site.register(ParameterSetForStorage)
custom_admin_site.register(ExtendedParameterSet)
custom_admin_site.register(BuildingParameterSet)
custom_admin_site.register(MeasurementInstrument)
custom_admin_site.register(Building)

class AdditionalParametersInline(admin.StackedInline):
    model = AdditionalParameters
    verbose_name_plural = 'Дополнительные параметры'

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_number', 'list_responsibles', 'has_additional_parameters')
    
    def list_responsibles(self, obj):
        return ", ".join([responsible.last_name for responsible in obj.responsible_persons.all()])
    list_responsibles.short_description = 'Ответственные'
    
    def get_inline_instances(self, request, obj=None):
        if obj and obj.has_additional_parameters:
            return [AdditionalParametersInline(self.model, self.admin_site)]
        return []

    def change_view(self, request, object_id, form_url='', extra_context=None):
        obj = self.get_object(request, object_id)
        if obj:
            if obj.has_additional_parameters:
                self.inlines = [AdditionalParametersInline]
            else:
                self.inlines = []
        return super().change_view(request, object_id, form_url, extra_context)

