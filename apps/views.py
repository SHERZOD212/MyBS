
from django.contrib.auth import login
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .models import Bus, Driver, DailyTripLog, TechnicalStatus, MaintenanceSchedule
from .serializers import (
    BusSerializer,
    DriverSerializer, DriverDetailSerializer,
    DailyTripLogSerializer, DailyTripLogDetailSerializer,
    TechnicalStatusSerializer,
    MaintenanceScheduleSerializer, LoginSerializer
)

@extend_schema(tags=['Bus'])
class BusViewSet(ModelViewSet):
    queryset = Bus.objects.all()
    serializer_class = BusSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=['get'], url_path='active_routes')
    def active_routes(self, request):
        buses = Bus.objects.exclude(route="")
        serializer = self.get_serializer(buses, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='fix_route')
    def fix_route(self, request, pk=None):
        bus = self.get_object()
        bus.route = f"{bus.route} (Tekshirilgan)"
        bus.save()
        return Response(
            {"status": f"{bus.num}-avtobus yo'nalishi yangilandi!"},
            status=status.HTTP_200_OK
        )

@extend_schema(tags=['Driver'])
class DriverViewSet(ModelViewSet):
    queryset = Driver.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return DriverDetailSerializer

        return DriverSerializer

    @action(detail=False, methods=['get'], url_path='blacklist')
    def blacklist(self, request):
        bad_drivers = Driver.objects.filter(black=True)
        serializer = self.get_serializer(bad_drivers, many=True)
        return Response(serializer.data)

@extend_schema(tags=['Daily Trip'])
class DailyTripLogViewSet(ModelViewSet):
    queryset = DailyTripLog.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return DailyTripLogDetailSerializer
        return DailyTripLogSerializer

    @action(detail=False, methods=['get'], url_path='today_logs')
    def today_logs(self, request):
        today = timezone.now().date()
        logs = DailyTripLog.objects.filter(date=today)
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)

@extend_schema(tags=['Technical Status'])
class TechnicalStatusViewSet(ModelViewSet):
    queryset = TechnicalStatus.objects.all()
    serializer_class = TechnicalStatusSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=['get'], url_path='dangerous_buses')
    def dangerous_buses(self, request):
        bad_tech = TechnicalStatus.objects.filter(status__in=['danger', 'repair'])
        serializer = self.get_serializer(bad_tech, many=True)
        return Response(serializer.data)

@extend_schema(tags=['Maintenance Schedule'])
class MaintenanceScheduleViewSet(ModelViewSet):
    queryset = MaintenanceSchedule.objects.all()
    serializer_class = MaintenanceScheduleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=['get'], url_path='upcoming')
    def upcoming_maintenance(self, request):
        upcoming = MaintenanceSchedule.objects.filter(days_remaining__lte=7).order_by('days_remaining')
        serializer = self.get_serializer(upcoming, many=True)
        return Response(serializer.data)



@extend_schema(tags=['Login'])
class LoginView(APIView):
    permission_classes = []


    @extend_schema(
        tags=['Authentication'],
        description="Foydalanuvchi email va paroli orqali tizimga kirish",
        responses={200: LoginSerializer}
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        login(request, user)

        return Response({
            "message": "Login muvaffaqiyatli",
            "id": user.id,
            "username": user.username,
            "email": user.email,
        })