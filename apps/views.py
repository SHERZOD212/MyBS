from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.utils import timezone
from rest_framework.viewsets import ModelViewSet

from .models import Bus, Driver, DailyTripLog, TechnicalStatus, MaintenanceSchedule
from .serializers import (
    BusSerializer,
    DriverSerializer,
    DriverDetailSerializer,
    DailyTripLogSerializer,
    DailyTripLogDetailSerializer,
    TechnicalStatusSerializer,
    MaintenanceScheduleSerializer,
    LoginSerializer,
    RegisterSerializer,
)

from rest_framework_simplejwt.tokens import RefreshToken


# Bus → Автобус
# Driver → Водитель
# Route → Маршрут
# Daily Trip Log → Журнал рейсов
# Technical Status → Техническое состояние
# Maintenance Schedule → График технического обслуживания
@extend_schema(tags=["Автобус"])
class BusViewSet(ModelViewSet):
    queryset = Bus.objects.all()
    serializer_class = BusSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=["get"], url_path="active_routes")
    def active_routes(self, request):
        buses = Bus.objects.exclude(route="")
        serializer = self.get_serializer(buses, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="fix_route")
    def fix_route(self, request, pk=None):
        bus = self.get_object()
        bus.route = f"{bus.route} (Tekshirilgan)"
        bus.save()
        return Response({"status": f"{bus.num}-avtobus yo'nalishi yangilandi!"})


@extend_schema(tags=["Водитель"])
class DriverViewSet(ModelViewSet):
    queryset = Driver.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return DriverDetailSerializer

        return DriverSerializer

    @action(detail=False, methods=["get"], url_path="blacklist")
    def blacklist(self, request):
        bad_drivers = Driver.objects.filter(black=True)
        serializer = self.get_serializer(bad_drivers, many=True)
        return Response(serializer.data)


@extend_schema(tags=["Журнал рейсов"])
class DailyTripLogViewSet(ModelViewSet):
    queryset = DailyTripLog.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return DailyTripLogDetailSerializer
        return DailyTripLogSerializer

    @action(detail=False, methods=["get"], url_path="today_logs")
    def today_logs(self, request):
        today = timezone.now().date()
        logs = DailyTripLog.objects.filter(date=today)
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)


@extend_schema(tags=["Техническое состояние"])
class TechnicalStatusViewSet(ModelViewSet):
    queryset = TechnicalStatus.objects.all()
    serializer_class = TechnicalStatusSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=["get"], url_path="dangerous_buses")
    def dangerous_buses(self, request):
        bad_tech = TechnicalStatus.objects.filter(status__in=["danger", "repair"])
        serializer = self.get_serializer(bad_tech, many=True)
        return Response(serializer.data)


@extend_schema(tags=["График технического обслуживания"])
class MaintenanceScheduleViewSet(ModelViewSet):
    queryset = MaintenanceSchedule.objects.all()
    serializer_class = MaintenanceScheduleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=["get"], url_path="upcoming")
    def upcoming_maintenance(self, request):
        upcoming = MaintenanceSchedule.objects.filter(days_remaining__lte=7).order_by(
            "days_remaining"
        )
        serializer = self.get_serializer(upcoming, many=True)
        return Response(serializer.data)


@extend_schema(tags=["Auth"])
class LoginView(GenericAPIView):
    permission_classes = []
    serializer_class = LoginSerializer

    @extend_schema(description="Foydalanuvchi username va paroli orqali tizimga kirish")
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Login muvaffaqiyatli",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "id": user.id,
                "username": user.username,
                "email": user.email,
            }
        )


@extend_schema(tags=["Auth"])
class RegisterView(GenericAPIView):
    permission_classes = []
    serializer_class = RegisterSerializer

    @extend_schema(description="Yangi foydalanuvchini ro'yxatdan o'tkazish")
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Ro'yxatdan o'tish muvaffaqiyatli",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )
