from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BusViewSet

# Router yaratamiz
router = DefaultRouter()
router.register(r'buses', BusViewSet, basename='bus') # 'buses' endpointi uchun

urlpatterns = [
    path('', include(router.urls)),
]