from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.utils import timezone
from rest_framework.viewsets import ModelViewSet

from .models import (
    Bus,
    Driver,
    DailyTripLog,
    TechnicalStatus,
    MaintenanceSchedule,
    Fine,
    WorkAttendance,
    Salary,
)
from .serializers import (
    BusSerializer,
    DriverSerializer,
    DriverDetailSerializer,
    DailyTripLogSerializer,
    DailyTripLogDetailSerializer,
    TechnicalStatusSerializer,
    MaintenanceScheduleSerializer,
    FineSerializer,
    FineDetailSerializer,
    WorkAttendanceSerializer,
    WorkAttendanceDetailSerializer,
    SalarySerializer,
    SalaryDetailSerializer,
    LoginSerializer,
    RegisterSerializer,
)

from rest_framework_simplejwt.tokens import RefreshToken


# ==========================================
# 1. Bus (Avtobuslar) ViewSet
# ==========================================
@extend_schema(tags=["Avtobuslar"])
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


# ==========================================
# 2. Driver (Haydovchilar) ViewSet
# ==========================================
@extend_schema(tags=["Haydovchilar"])
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


# ==========================================
# 3. DailyTripLog (Kunlik Qatnovlar) ViewSet
# ==========================================
@extend_schema(tags=["Kunlik Qatnovlar"])
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


# ==========================================
# 4. Fine (Shtraflar) ViewSet
# ==========================================
@extend_schema(tags=["Jarimalar / Shtraflar"])
class FineViewSet(ModelViewSet):
    queryset = Fine.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return FineDetailSerializer
        return FineSerializer

    @action(detail=False, methods=["get"], url_path="by_driver")
    def by_driver(self, request):
        driver_id = request.query_params.get("driver_id")
        if driver_id:
            fines = Fine.objects.filter(driver_id=driver_id)
            serializer = self.get_serializer(fines, many=True)
            return Response(serializer.data)
        return Response(
            {"error": "driver_id parametri kerak"}, status=status.HTTP_400_BAD_REQUEST
        )


# ==========================================
# 5. WorkAttendance (Ish Vaqti) ViewSet
# ==========================================
@extend_schema(tags=["Ish Vaqti / Tabel"])
class WorkAttendanceViewSet(ModelViewSet):
    queryset = WorkAttendance.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return WorkAttendanceDetailSerializer
        return WorkAttendanceSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        # Agar parametr kelmasa, joriy yil va oyni default qilib olamiz
        year = self.request.query_params.get("year", timezone.now().year)
        month = self.request.query_params.get("month")

        if year:
            queryset = queryset.filter(date__year=year)

        if month is not None and month != "":
            try:
                # Agar frontend 0-indexed yuborayotgan bo'lsa (Iyun = 5) -> unga 1 qo'shib 6 qiladi
                django_month = int(month) + 1
                queryset = queryset.filter(date__month=django_month)
            except ValueError:
                pass
        else:
            # Agar frontend oy yubormasa, joriy oyni filtrlaydi
            queryset = queryset.filter(date__month=timezone.now().month)

        return queryset

    @action(detail=False, methods=["get"], url_path="monthly_report")
    def monthly_report(self, request):
        year = request.query_params.get("year", timezone.now().year)
        month = request.query_params.get("month")

        # Bu yerda ham oy nazorati
        if month is not None and month != "":
            django_month = int(month) + 1
        else:
            django_month = timezone.now().month

        attendances = WorkAttendance.objects.filter(
            date__year=year, date__month=django_month
        )
        serializer = self.get_serializer(attendances, many=True)
        return Response(serializer.data)


# ==========================================
# 6. Salary (Oylik Maosh) ViewSet
# ==========================================
@extend_schema(tags=["Oylik Maosh"])
class SalaryViewSet(ModelViewSet):
    queryset = Salary.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return SalaryDetailSerializer
        return SalarySerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        year = self.request.query_params.get("year", timezone.now().year)
        month = self.request.query_params.get("month")

        if year:
            queryset = queryset.filter(year=year)

        if month is not None and month != "":
            try:
                django_month = int(month) + 1
                queryset = queryset.filter(month=django_month)
            except ValueError:
                pass
        else:
            queryset = queryset.filter(month=timezone.now().month)

        return queryset

    @action(detail=False, methods=["get"], url_path="filter_salary")
    def filter_salary(self, request):
        year = request.query_params.get("year", timezone.now().year)
        month = request.query_params.get("month")

        queryset = Salary.objects.all()
        if year:
            queryset = queryset.filter(year=year)

        if month is not None and month != "":
            try:
                django_month = int(month) + 1
                queryset = queryset.filter(month=django_month)
            except ValueError:
                pass
        else:
            queryset = queryset.filter(month=timezone.now().month)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
# ==========================================
# 7. TechnicalStatus (Texnik Holat) ViewSet
# ==========================================
@extend_schema(tags=["Texnik Holat"])
class TechnicalStatusViewSet(ModelViewSet):
    queryset = TechnicalStatus.objects.all()
    serializer_class = TechnicalStatusSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=["get"], url_path="dangerous_buses")
    def dangerous_buses(self, request):
        bad_tech = TechnicalStatus.objects.filter(status__in=["danger", "repair"])
        serializer = self.get_serializer(bad_tech, many=True)
        return Response(serializer.data)


# ==========================================
# 8. MaintenanceSchedule (Texnik Reja) ViewSet
# ==========================================
@extend_schema(tags=["Texnik Xizmat Rejasi"])
class MaintenanceScheduleViewSet(ModelViewSet):
    queryset = MaintenanceSchedule.objects.all()
    serializer_class = MaintenanceScheduleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=["get"], url_path="upcoming")
    def upcoming_maintenance(self, request):
        upcoming = MaintenanceSchedule.objects.filter(days_remaining__exact=7).order_by(
            "days_remaining"
        )
        serializer = self.get_serializer(upcoming, many=True)
        return Response(serializer.data)

# ==========================================
# 9. Auth Views (Login & Register)
# ==========================================
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
