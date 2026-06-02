# from rest_framework import serializers
# from .models import Bus, Driver
#
# class BusSerializer(ModelSerializer):
#     # Qo'shimcha ravishda avtobusga biriktirilgan haydovchilar sonini ham ko'rish mumkin
#     drivers_count = IntegerField(source='drivers.count', read_only=True)
#
#     class Meta:
#         model = Bus
#         fields = ['id', 'num', 'route', 'drivers_count']
#

from datetime import date

from rest_framework.exceptions import ValidationError
from rest_framework.fields import SerializerMethodField, CharField
from rest_framework.serializers import ModelSerializer

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