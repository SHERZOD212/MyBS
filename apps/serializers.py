from datetime import date
from django.contrib.auth import get_user_model, authenticate
from django.db.models.fields import IntegerField
from django.forms.fields import TimeField
from rest_framework.exceptions import ValidationError
from rest_framework.fields import (
    SerializerMethodField,
    CharField,
    TimeField,
    IntegerField,
)
from rest_framework.serializers import ModelSerializer, Serializer
from django.contrib.auth.password_validation import validate_password

from .models import Bus,Driver,DailyTripLog,TechnicalStatus,MaintenanceSchedule,Fine,WorkAttendance,Salary



# ==========================================
# 1. Bus (Avtobuslar) Serializers
# ==========================================
class BusSerializer(ModelSerializer):
    class Meta:
        model = Bus
        fields = "__all__"


# ==========================================
# 2. Driver (Haydovchilar) Serializers
# ==========================================
class DriverSerializer(ModelSerializer):
    schedule_display = CharField(source="get_schedule_display", read_only=True)
    shift = CharField(required=False, allow_null=True)

    class Meta:
        model = Driver
        fields = "__all__"

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # if instance.shift_start and instance.shift_end:
        #     start_str = instance.shift_start.strftime("%H:%M")
        #     end_str = instance.shift_end.strftime("%H:%M")
        #     ret["shift"] = f"{start_str} - {end_str}"
        # else:
        #     ret["shift"] = "06:00 - 18:00"
        return ret

    def to_internal_value(self, data):
        if "shift" in data:
            shift_val = data["shift"]
            if shift_val and " - " in shift_val:
                try:
                    start_str, end_str = shift_val.split(" - ")
                    data["shift_start"] = start_str.strip()
                    data["shift_end"] = end_str.strip()
                except ValueError:
                    pass
        return super().to_internal_value(data)


class DriverDetailSerializer(ModelSerializer):
    bus = BusSerializer(read_only=True)
    schedule_display = CharField(source="get_schedule_display", read_only=True)
    shift = CharField(required=False, allow_null=True)

    class Meta:
        model = Driver
        fields = "__all__"

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.shift_start and instance.shift_end:
            start_str = instance.shift_start.strftime("%H:%M")
            end_str = instance.shift_end.strftime("%H:%M")
            ret["shift"] = f"{start_str} - {end_str}"
        else:
            ret["shift"] = "06:00 - 18:00"
        return ret

    def to_internal_value(self, data):
        if "shift" in data:
            shift_val = data["shift"]
            if shift_val and " - " in shift_val:
                try:
                    start_str, end_str = shift_val.split(" - ")
                    data["shift_start"] = start_str.strip()
                    data["shift_end"] = end_str.strip()
                except ValueError:
                    pass
        return super().to_internal_value(data)


# ==========================================
# 3. DailyTripLog (Kunlik Qatnovlar) Serializers
# ==========================================
class DailyTripLogSerializer(ModelSerializer):
    class Meta:
        model = DailyTripLog
        fields = "__all__"

    def validate(self, attrs):
        if attrs.get("trips_completed", 0) < 0 or attrs.get("trips_missed", 0) < 0:
            raise ValidationError("Qatnovlar soni manfiy bo'lishi mumkin emas!")
        return attrs


class DailyTripLogDetailSerializer(ModelSerializer):
    bus = BusSerializer(read_only=True)
    driver = DriverSerializer(read_only=True)

    class Meta:
        model = DailyTripLog
        fields = "__all__"


# ==========================================
# 4. Fine (Shtraflar) Serializers
# ==========================================
class FineSerializer(ModelSerializer):
    driver_display = CharField(source="driver.name", read_only=True)

    class Meta:
        model = Fine
        fields = "__all__"

    def validate(self, attrs):
        if attrs.get("amount", 0) <= 0:
            raise ValidationError("Jarima summasi noldan katta bo'lishi shart!")
        return attrs


class FineDetailSerializer(ModelSerializer):
    driver = DriverDetailSerializer(read_only=True)
    driver_display = CharField(source="driver.name", read_only=True)

    class Meta:
        model = Fine
        fields = "__all__"

# ==========================================
# 5. WorkAttendance (Ish Vaqti) Serializers
# ==========================================

class WorkAttendanceSerializer(ModelSerializer):
    driver_display = CharField(source="driver.name", read_only=True)

    check_in = TimeField(
        format="%H:%M",
        input_formats=["%H:%M", "%H:%M:%S"],
        required=False,
        allow_null=True,
    )

    check_out = TimeField(
        format="%H:%M",
        input_formats=["%H:%M", "%H:%M:%S"],
        required=False,
        allow_null=True,
    )

    working_hours = IntegerField(source="actual_hours", read_only=True)

    class Meta:
        model = WorkAttendance
        fields = "__all__"

    def validate(self, attrs):
        actual = attrs.get("actual_hours", 0)
        planned = attrs.get("planned_hours", 8)

        if actual < 0 or planned < 0:
            raise ValidationError("Ish soatlari manfiy bo'lishi mumkin emas!")

        attrs["overtime_hours"] = max(0, actual - planned)

        return attrs


class WorkAttendanceDetailSerializer(ModelSerializer):
    driver = DriverDetailSerializer(read_only=True)
    driver_display = CharField(source="driver.name", read_only=True)

    check_in = TimeField(
        format="%H:%M",
        input_formats=["%H:%M", "%H:%M:%S"],
        required=False,
        allow_null=True,
    )

    check_out = TimeField(
        format="%H:%M",
        input_formats=["%H:%M", "%H:%M:%S"],
        required=False,
        allow_null=True,
    )

    working_hours = IntegerField(source="actual_hours", read_only=True)

    class Meta:
        model = WorkAttendance
        fields = "__all__"

    def validate(self, attrs):
        actual = attrs.get("actual_hours", 0)
        planned = attrs.get("planned_hours", 8)

        if actual < 0 or planned < 0:
            raise ValidationError("Ish soatlari manfiy bo'lishi mumkin emas!")

        attrs["overtime_hours"] = max(0, actual - planned)

        return attrs
# ==========================================
# 6. Salary (Oylik Maosh) Serializers
# ==========================================
class SalarySerializer(ModelSerializer):
    driver_display = CharField(source="driver.name", read_only=True)

    class Meta:
        model = Salary
        # fields = "__all__"
        exclude = 'total_paid',

    def to_internal_value(self, data):
        # Nusxa olamiz, chunki QueryDict/dict obyektini bevosita o'zgartirish xato berishi mumkin
        data = data.copy()
        if "month" in data and data["month"] is not None and data["month"] != "":
            try:
                # Frontend 0-11 formatda yuborsa, bazaga 1-12 formatda yozish uchun +1 qo'shamiz
                data["month"] = int(data["month"]) + 1
            except ValueError:
                pass
        return super().to_internal_value(data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Frontend ma'lumotni o'qiyotganda (GET), unga tushunarli bo'lishi uchun qaytarib 0-indexed qilamiz (-1)
        if "month" in ret and ret["month"] is not None:
            ret["month"] = ret["month"] - 1
        return ret

    def validate(self, attrs):
        fixed = attrs.get("fixed_salary", 0)
        bonus = attrs.get("bonus", 0)
        driver = attrs.get("driver")
        year = attrs.get("year")
        month = attrs.get("month")

        if driver and year and month:
            from django.db.models import Sum
            fines_sum = Fine.objects.filter(
                driver=driver,
                date__year=year,
                date__month=month
            ).aggregate(total=Sum('amount'))['total'] or 0
            attrs["fines_deduction"] = fines_sum
        else:
            attrs["fines_deduction"] = attrs.get("fines_deduction", 0)

        fines = attrs["fines_deduction"]

        if fixed < 0 or bonus < 0 or fines < 0:
            raise ValidationError("Moliyaviy qiymatlar manfiy bo'lishi mumkin emas!")

        attrs["total_paid"] = max(0, (fixed + bonus) - fines)
        return attrs


class SalaryDetailSerializer(ModelSerializer):
    driver = DriverDetailSerializer(read_only=True)
    driver_display = CharField(source="driver.name", read_only=True)
    month_display = SerializerMethodField()

    class Meta:
        model = Salary
        fields = "__all__"

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Detail serializerda ham frontend adashmasligi uchun oyni 0-indexed qilib qaytaramiz
        if "month" in ret and ret["month"] is not None:
            ret["month"] = ret["month"] - 1
        return ret

    def get_month_display(self, obj):
        months = [
            "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
            "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
        ]
        try:
            return months[obj.month - 1]
        except (IndexError, TypeError, ValueError):
            return f"{obj.month}-oy"
# ==========================================
# 7. TechnicalStatus (Texnik Holat) Serializers
# ==========================================
class TechnicalStatusSerializer(ModelSerializer):
    category_display = CharField(source="get_category_display", read_only=True)
    status_display = CharField(source="get_status_display", read_only=True)
    bus_display = CharField(source="bus.num", read_only=True)
    km_left = SerializerMethodField()

    class Meta:
        model = TechnicalStatus
        fields = "__all__"

    def get_km_left(self, obj):
        return max(0, obj.max_km - obj.current_km)


# ==========================================
# 8. MaintenanceSchedule (Texnik Reja) Serializers
# ==========================================
class MaintenanceScheduleSerializer(ModelSerializer):
    class Meta:
        model = MaintenanceSchedule
        fields = "__all__"

    def validate(self, attrs):
        planned_date = attrs.get("planned_date")
        if planned_date:
            delta = planned_date - date.today()
            attrs["days_remaining"] = max(0, delta.days)
        return attrs


# ==========================================
# 9. Auth (Login & Register) Serializers
# ==========================================
User = get_user_model()


class LoginSerializer(Serializer):
    username = CharField()
    password = CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs["username"], password=attrs["password"])

        if not user:
            raise ValidationError("Username yoki parol noto'g'ri")

        attrs["user"] = user
        return attrs


class RegisterSerializer(ModelSerializer):
    password = CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "password",
        )

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email"),
            password=validated_data["password"],
        )
