# urls.py (api)

from django.urls import path
from . import views
from . views import MyTokenObtainPairView

from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

urlpatterns = [
    path('', views.getRoutes),
    path('parameters/', views.getEnviromentalParameters, name='all_parameters'),
    path('parameters/create/', views.createEnvironmentalParameters, name='create-environmental-parameters'),
    path('parameters/<str:pk>/', views.getEnviromentalParameter, name="parameterlist"),
    path('parameters/update/<str:pk>/', views.updateEnvironmentalParameters, name='update-environmental-parameters'),
    path('parameters/delete/<str:pk>/', views.deleteEnvironmentalParameters, name='delete-environmental-parameters'),
    
    path('rooms/', views.getRooms, name='room-list'), 
    path('rooms/<int:pk>/', views.getRoom, name='room-detail'), 
    path('buildings/', views.getBuildings, name='building-list'), 
    
    path('current_user/', views.get_current_user),
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('measurement_instrument_types/', views.measurement_instrument_type_list, name='measurement_instrument_type_list'),
    path('measurement_instrument_types/<int:pk>/', views.measurement_instrument_type_detail, name='measurement_instrument_type_detail'),
    
    # URL-шаблоны для фильтрации данных
    path('filterParameters/', views.filterEnvironmentalParameters, name='filter_parameters'),
    path('filterBuildingParameters/', views.filterBuildingEnvironmentalParameters, name='filter_building_parameters'),
    
    path('responsibles/', views.getResponsibles, name='responsibles-list'),
    path('parameter_sets/', views.getParameterSets, name='parameter-set-list'),  
    path('parameter_sets/create/', views.createParameterSet, name='create-parameter-set'),
    path('parameter_sets/<str:pk>/', views.getParameterSet, name="parameter-set-detail"),
    path('parameter_sets/update/<str:pk>/', views.updateParameterSet, name='update-parameter-set'),
    path('parameter_sets/delete/<str:pk>/', views.deleteParameterSet, name='delete-parameter-set'),
    
    # URL-шаблоны для выгрузки данных в Excel-файл
    path('export-parameters/', views.export_parameters_to_excel, name='export_parameters'),
    path('export-parameters-buildings/', views.export_parameters_for_buildings_to_excel, name='export_parameters_buildings'),
    
    # URL-шаблоны для представлений, связанных с BuildingParameterSet
    path('building_parameter_sets/', views.getBuildingParameterSets, name='building-parameter-set-list'),
    path('building_parameter_sets/<int:pk>/', views.getBuildingParameterSet, name='building-parameter-set-detail'),
    path('building_parameter_sets/create/', views.createBuildingParameterSet, name='create-building-parameter-set'),
    path('building_parameter_sets/update/<int:pk>/', views.updateBuildingParameterSet, name='update-building-parameter-set'),
    path('building_parameter_sets/delete/<int:pk>/', views.deleteBuildingParameterSet, name='delete-building-parameter-set'),

    # URL-шаблоны для представлений, связанных с BuildingEnvironmentalParameters
    path('building_environmental_parameters/', views.getBuildingEnvironmentalParameters, name='building-environmental-parameters-list'),
    path('building_environmental_parameters/<int:pk>/', views.getBuildingEnvironmentalParameter, name='building-environmental-parameters-detail'),
    path('building_environmental_parameters/create/', views.createBuildingEnvironmentalParameters, name='create-building-environmental-parameters'),
    path('building_environmental_parameters/update/<int:pk>/', views.updateBuildingEnvironmentalParameters, name='update-building-environmental-parameters'),
    path('building_environmental_parameters/delete/<int:pk>/', views.deleteBuildingEnvironmentalParameters, name='delete-building-environmental-parameters'),

    # URL-шаблоны для представлений, связанных с ExtendedParameterSet
    path('extended_parameter_sets/', views.getExtendedParameterSets, name='extended-parameter-set-list'),
    path('extended_parameter_sets/<int:pk>/', views.getExtendedParameterSet, name='extended-parameter-set-detail'),
    path('extended_parameter_sets/create/', views.createExtendedParameterSet, name='create-extended-parameter-set'),
    path('extended_parameter_sets/update/<int:pk>/', views.updateExtendedParameterSet, name='update-extended-parameter-set'),
    path('extended_parameter_sets/delete/<int:pk>/', views.deleteExtendedParameterSet, name='delete-extended-parameter-set'),
    
    # URL-шаблоны для представлений, связанных с StorageParameterSet
    path('storage_parameter_sets/', views.getStorageParameterSets, name='storage-parameter-set-list'),
    path('storage_parameter_sets/<int:pk>/', views.getStorageParameterSet, name='storage-parameter-set-detail'),
    path('storage_parameter_sets/create/', views.createStorageParameterSet, name='create-storage-parameter-set'),
    path('storage_parameter_sets/update/<int:pk>/', views.updateStorageParameterSet, name='update-storage-parameter-set'),
    path('storage_parameter_sets/delete/<int:pk>/', views.deleteStorageParameterSet, name='delete-storage-parameter-set'),

]
