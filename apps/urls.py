from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BusViewSet

# Router yaratamiz
router = DefaultRouter()
router.register(r'buses', BusViewSet, basename='bus') # 'buses' endpointi uchun

urlpatterns = [
    # API marshrutlarini ulash (Rasmdagi kabi v1 strukturasi uchun)
    path('api/v1/', include(router.urls)),
]