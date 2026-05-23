from rest_framework import serializers
from .models import Bus, Driver

class BusSerializer(serializers.ModelSerializer):
    # Qo'shimcha ravishda avtobusga biriktirilgan haydovchilar sonini ham ko'rish mumkin
    drivers_count = serializers.IntegerField(source='drivers.count', read_only=True)

    class Meta:
        model = Bus
        fields = ['id', 'num', 'route', 'drivers_count']