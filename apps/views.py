from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Bus
from .serializers import BusSerializer

class BusViewSet(viewsets.ModelViewSet):
    queryset = Bus.objects.all()
    serializer_class = BusSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] # Rasmdagi qulflar (Authorization) uchun

    @action(detail=False, methods=['get'], url_path='active_routes')
    def active_routes(self, request):
        # Bu yerda o'zingiz xohlagan maxsus filtrni yozasiz
        # Masalan: Faqat yo'nalishi bo'sh bo'lmagan avtobuslar
        buses = Bus.objects.exclude(route="")
        serializer = self.get_serializer(buses, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='fix_route')
    def fix_route(self, request, pk=None):
        bus = self.get_object()
        # Bu yerda maxsus funksiyani bajaramiz (masalan, yo'nalish matniga belgi qo'shish)
        bus.route = f"{bus.route} (Tekshirilgan)"
        bus.save()
        return Response(
            {"status": f"{bus.num}-avtobus yo'nalishi yangilandi!"},
            status=status.HTTP_200_OK
        )