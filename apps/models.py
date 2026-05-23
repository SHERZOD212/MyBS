from django.db import models
from django.contrib.auth.models import User
from django.db.models import Model
from django.db.models.fields import CharField, BooleanField, TimeField, IntegerField, DateField

from django.db.models import Model,ForeignKey,SET_NULL,CASCADE,TextChoices

# 1. Avtobuslar modeli
class Bus(Model):
    num = CharField(max_length=20, unique=True, verbose_name="Avtobus raqami")
    route = CharField(max_length=20, verbose_name="Yo'nalish (Route)")

    def __str__(self):
        return f"{self.num} ({self.route})"


# 2. Haydovchilar modeli
class ScheduleChoice(TextChoices):
    EVEN = 'even', 'Juft kunlar (Even)'
    ODD = 'odd', 'Toq kunlar (Odd)'


class Driver(Model):
    name = CharField(max_length=100,verbose_name="Foydalanuvchi ismi")
    bus = ForeignKey('apps.Bus',on_delete=SET_NULL,null=True,blank=True,related_name='drivers')
    schedule = CharField(max_length=10,choices=ScheduleChoice.choices,default=ScheduleChoice.EVEN)
    black = BooleanField(default=False,verbose_name="Qora ro'yxat / Maxsus holat")
    shift_start = TimeField(verbose_name="Smena boshi")
    shift_end = TimeField(verbose_name="Smena oxiri")
    total_trips = IntegerField(default=0,verbose_name="Jami qatnovlar soni")

    def __str__(self):
        return self.name


# 3. Kunlik qatnovlar statistikasi (Daily logs)
class DailyTripLog(Model):
    date = DateField(verbose_name="Sana")
    bus = ForeignKey(Bus, on_delete=CASCADE, related_name='daily_logs')
    driver = ForeignKey(Driver, on_delete=CASCADE, related_name='daily_logs')
    trips_completed = IntegerField(default=0, verbose_name="Bajarilgan qatnovlar")
    trips_missed = IntegerField(default=0, verbose_name="Qolib ketgan qatnovlar")

    class Meta:
        unique_together = ('date', 'bus', 'driver')  # Bir kunda bir avtobusga bitta log

    def __str__(self):
        return f"{self.date} | {self.bus.num} - {self.driver.name}"


# 4. Texnik holat (Tires, Brakes, Oil)
from django.db.models import TextChoices


class TechnicalCategory(TextChoices):
    TIRES = 'tires', 'Shinalar (Tires)'
    BRAKES = 'brakes', 'Tormoz (Brakes)'
    OIL = 'oil', 'Moy / Antifriz (Oil)'
    ENGINE = 'engine', 'Dvigatel (Engine)'
    BATTERY = 'battery', 'Akkumulyator (Battery)'


class TechnicalStatusChoice(TextChoices):
    OK = 'ok', 'Yaxshi (OK)'
    WARNING = 'warn', 'Ogohlantirish (Warning)'
    DANGER = 'danger', 'Xavfli (Danger)'
    REPAIR = 'repair', 'Ta’mir talab'


class TechnicalStatus(Model):
    bus = ForeignKey('apps.Bus',on_delete=CASCADE,related_name='tech_statuses')
    category = CharField(max_length=20,choices=TechnicalCategory.choices)
    last_service_date = DateField(verbose_name="Oxirgi texnik ko'rik sanasi")
    current_km = IntegerField(verbose_name="Hozirgi yurgan masofasi (km)")
    max_km = IntegerField(default=50000,verbose_name="Maksimal ruxsat etilgan masofa (km)")
    status = CharField(max_length=10,choices=TechnicalStatusChoice.choices,default=TechnicalStatusChoice.OK)

    class Meta:
        unique_together = ('bus', 'category')

    def __str__(self):
        return f"{self.bus.num} - {self.category} ({self.status})"


# 5. Texnik xizmat ko'rsatish rejasi (Maintenance Schedule)
class MaintenanceSchedule(Model):
    bus = ForeignKey(Bus, on_delete=CASCADE, related_name='maintenance_schedules')
    maintenance_type = CharField(max_length=100, verbose_name="Xizmat turi (TO-1, TO-2...)")
    planned_date = DateField(verbose_name="Rejalashtirilgan sana")
    days_remaining = IntegerField(
        verbose_name="Qolgan kunlar soni")  # Buni backend'da avtomatik hisoblatsa ham bo'ladi

    def __str__(self):
        return f"{self.bus.num} - {self.maintenance_type}"
