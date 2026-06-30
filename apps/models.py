from django.db.models import Model, ForeignKey, SET_NULL, CASCADE, TextChoices
from django.db.models.fields import CharField, BooleanField, TimeField, IntegerField, DateField, DecimalField, TextField


# 1. Avtobuslar modeli
class Bus(Model):
    num = CharField(max_length=20, unique=True, verbose_name="Avtobus raqami")
    route = CharField(max_length=20, verbose_name="Yo'nalish (Route)")

    def __str__(self):
        return f"{self.num} ({self.route})"


# 2. Haydovchilar modeli
class Driver(Model):
    class Schedule(TextChoices):
        EVEN = 'even', 'Juft kunlar (Even)'
        ODD = 'odd', 'Toq kunlar (Odd)'

    name = CharField(max_length=100, verbose_name="Haydovchi ismi")
    bus = ForeignKey('apps.Bus', on_delete=SET_NULL, null=True, blank=True, related_name='drivers')
    schedule = CharField(max_length=10, choices=Schedule.choices, default=Schedule.EVEN)
    black = BooleanField(default=False, verbose_name="Qora ro'yxat / Maxsus holat")
    shift_start = TimeField(default="06:00", verbose_name="Smena boshi")
    shift_end = TimeField(default="18:00", verbose_name="Smena oxiri")
    total_trips = IntegerField(default=0, verbose_name="Jami qatnovlar soni")
    phone = CharField(max_length=20, blank=True, null=True, verbose_name="Telefon raqami") # HTML modalda borligi uchun qo'shildi

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
        unique_together = ('date', 'bus', 'driver')

    def __str__(self):
        return f"{self.date} | {self.bus.num} - {self.driver.name}"


# 4. Jarimalar / Shtraflar modeli (HTML dagi "nav-shtraf" sahifasi uchun)
class Fine(Model):
    driver = ForeignKey(Driver, on_delete=CASCADE, related_name='fines', verbose_name="Haydovchi")
    date = DateField(verbose_name="Jarima sanasi")
    amount = DecimalField(max_length=12, max_digits=12, decimal_places=2, verbose_name="Jarima summasi (so'm)")
    reason = CharField(max_length=255, verbose_name="Jarima sababi")

    def __str__(self):
        return f"{self.driver.name} - {self.amount} so'm ({self.date})"


# 5. Ish vaqti tabeli (HTML dagi "nav-rabochee-vremya" sahifasi uchun)
class WorkAttendance(Model):
    driver = ForeignKey(Driver, on_delete=CASCADE, related_name='attendances', verbose_name="Haydovchi")
    date = DateField(verbose_name="Sana")
    planned_hours = IntegerField(default=8, verbose_name="Rejalashtirilgan vaqt (soat)")
    actual_hours = IntegerField(default=0, verbose_name="Haqiqiy ishlagan vaqti (soat)")
    overtime_hours = IntegerField(default=0, verbose_name="Ortiqcha ishlagan vaqti (soat)")
    status = CharField(max_length=50, default="Ishda", verbose_name="Status / Izoh") # Masalan: "Ishda", "Kelmadi", "Kasal"
    check_in = TimeField(default="06:00", null=True, blank=True, verbose_name="Kelgan vaqti")
    check_out = TimeField(default="22:30", null=True, blank=True, verbose_name="Ketgan vaqti")

    class Meta:
        unique_together = ('driver', 'date')

    def __str__(self):
        return f"{self.driver.name} | {self.date} | {self.actual_hours} soat"


# 6. Oylik maosh / Zarplata modeli (HTML dagi "nav-zarplata" sahifasi uchun)
class Salary(Model):
    driver = ForeignKey(Driver, on_delete=CASCADE, related_name='salaries', verbose_name="Haydovchi")
    year = IntegerField(verbose_name="Yil")
    month = IntegerField(verbose_name="Oy (0-11 yoki 1-12)") # HTML select inputda 0-11 formatda kelmoqda
    fixed_salary = DecimalField(max_length=12, max_digits=12, decimal_places=2, verbose_name="Kafolatlangan oylik (Fiksa)")
    bonus = DecimalField(max_length=12, max_digits=12, decimal_places=2, default=0, verbose_name="Mukofot puli / Bonus")
    fines_deduction = DecimalField(max_length=12, max_digits=12, decimal_places=2, default=0, verbose_name="Jrimadan ushlab qolingan")
    total_paid = DecimalField(max_length=12, max_digits=12, decimal_places=2, verbose_name="Qo'lga tegadigan jami summa")

    class Meta:
        unique_together = ('driver', 'year', 'month')

    def __str__(self):
        return f"{self.driver.name} - {self.year}/{self.month} uchun maosh"


# 7. Texnik holat (Tires, Brakes, Oil)
class TechnicalStatus(Model):
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
        REPAIR = 'repair', "Ta'mir talab"

    bus = ForeignKey(Bus, on_delete=CASCADE, related_name='tech_statuses')
    category = CharField(max_length=20, choices=TechnicalCategory.choices)
    last_service_date = DateField(verbose_name="Oxirgi texnik ko'rik sanasi")
    current_km = IntegerField(verbose_name="Hozirgi yurgan masofasi (km)")
    max_km = IntegerField(default=50000, verbose_name="Maksimal ruxsat etilgan masofa (km)")
    status = CharField(max_length=10, choices=TechnicalStatusChoice.choices, default=TechnicalStatusChoice.OK)

    class Meta:
        unique_together = ('bus', 'category')

    def __str__(self):
        return f"{self.bus.num} - {self.category} ({self.status})"


# 8. Texnik xizmat ko'rsatish rejasi (Maintenance Schedule)
class MaintenanceSchedule(Model):
    bus = ForeignKey(Bus, on_delete=CASCADE, related_name='maintenance_schedules')
    maintenance_type = CharField(max_length=100, verbose_name="Xizmat turi (TO-1, TO-2...)")
    planned_date = DateField(verbose_name="Rejalashtirilgan sana")
    days_remaining = IntegerField(verbose_name="Qolgan kunlar soni")

    def __str__(self):
        return f"{self.bus.num} - {self.maintenance_type}"