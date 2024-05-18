from django.contrib import admin
from .models import Responsible, Room, EnviromentalParameters, Profession, \
                MeasurementInstrument, ParameterSet, Building, AdditionalParameters, \
                BuildingParameterSet, ExtendedParameterSet, ParameterSetForStorage

admin.site.register(Responsible)
admin.site.register(EnviromentalParameters)
admin.site.register(Profession)
admin.site.register(ParameterSet)
admin.site.register(ParameterSetForStorage)
admin.site.register(ExtendedParameterSet)
admin.site.register(BuildingParameterSet)
admin.site.register(MeasurementInstrument)
admin.site.register(Building)

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


