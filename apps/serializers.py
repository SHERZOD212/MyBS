from datetime import date

from django.contrib.auth import get_user_model, authenticate
from rest_framework.exceptions import ValidationError
from rest_framework.fields import SerializerMethodField, CharField, EmailField
from rest_framework.serializers import ModelSerializer, Serializer
from django.contrib.auth.password_validation import validate_password

from .models import Bus, Driver, DailyTripLog, TechnicalStatus, MaintenanceSchedule


class BusSerializer(ModelSerializer):
    class Meta:
        model = Bus
        fields = '__all__'


class DriverSerializer(ModelSerializer):

    schedule_display = CharField(source='get_schedule_display', read_only=True)

    class Meta:
        model = Driver
        fields = '__all__'


class DriverDetailSerializer(ModelSerializer):

    bus = BusSerializer(read_only=True)
    schedule_display = CharField(source='get_schedule_display', read_only=True)

    class Meta:
        model = Driver
        fields = '__all__'



class DailyTripLogSerializer(ModelSerializer):
    class Meta:
        model = DailyTripLog
        fields = '__all__'


    def validate(self, attrs):
        if attrs.get('trips_completed', 0) < 0 or attrs.get('trips_missed', 0) < 0:
            raise ValidationError("Qatnovlar soni manfiy bo'lishi mumkin emas!")
        return attrs


class DailyTripLogDetailSerializer(ModelSerializer):

    bus = BusSerializer(read_only=True)
    driver = DriverSerializer(read_only=True)

    class Meta:
        model = DailyTripLog
        fields = '__all__'



class TechnicalStatusSerializer(ModelSerializer):
    category_display = CharField(source='get_category_display', read_only=True)
    status_display = CharField(source='get_status_display', read_only=True)
    km_left = SerializerMethodField()

    class Meta:
        model = TechnicalStatus
        fields = '__all__'

    def get_km_left(self, obj):

        return max(0, obj.max_km - obj.current_km)


class MaintenanceScheduleSerializer(ModelSerializer):

    class Meta:
        model = MaintenanceSchedule
        fields = '__all__'

    def validate(self, attrs):

        planned_date = attrs.get('planned_date')
        if planned_date:
            delta = planned_date - date.today()
            attrs['days_remaining'] = max(0, delta.days)
        return attrs



User = get_user_model()

class LoginSerializer(Serializer):
    username = CharField()
    password = CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            username=attrs["username"],
            password=attrs["password"]
        )

        if not user:
            raise ValidationError(
                "Username yoki parol noto'g'ri"
            )

        attrs["user"] = user
        return attrs




class RegisterSerializer(ModelSerializer):
    password = CharField(write_only=True, required=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user