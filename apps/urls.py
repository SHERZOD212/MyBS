from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BusViewSet,
    DriverViewSet,
    DailyTripLogViewSet,
    TechnicalStatusViewSet,
    MaintenanceScheduleViewSet,
    FineViewSet,            # Yangi qo'shildi (Shtraflar uchun)
    WorkAttendanceViewSet,  # Yangi qo'shildi (Ish vaqti uchun)
    SalaryViewSet,          # Yangi qo'shildi (Oyliklar uchun)
    RegisterView,
    LoginView,
)

# Router sozlamalari
router = DefaultRouter()
router.register(r'buses', BusViewSet, basename='bus')
router.register(r'drivers', DriverViewSet, basename='driver')
router.register(r'daily-logs', DailyTripLogViewSet, basename='daily-log')
router.register(r'technical-statuses', TechnicalStatusViewSet, basename='technical-status')
router.register(r'maintenance-schedules', MaintenanceScheduleViewSet, basename='maintenance-schedule')

# Yangi modellar uchun routerlar
router.register(r'fines', FineViewSet, basename='fine')
router.register(r'work-attendances', WorkAttendanceViewSet, basename='work-attendance')
router.register(r'salaries', SalaryViewSet, basename='salary')

# URL patternlar
urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("", include(router.urls)),
]