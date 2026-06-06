from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BusViewSet,
    DriverViewSet,
    DailyTripLogViewSet,
    TechnicalStatusViewSet,
    MaintenanceScheduleViewSet,
    LoginView,
)

# Router yaratamiz
router = DefaultRouter()
router.register(r'buses', BusViewSet, basename='bus')
router.register(r'drivers', DriverViewSet, basename='driver')
router.register(r'daily-logs', DailyTripLogViewSet, basename='daily-log')
router.register(r'technical-statuses', TechnicalStatusViewSet, basename='technical-status')
router.register(r'maintenance-schedules', MaintenanceScheduleViewSet, basename='maintenance-schedule')

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('', include(router.urls)),
]