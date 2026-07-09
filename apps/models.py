from django.db.models import Model, ForeignKey, SET_NULL, CASCADE, TextChoices
from django.db.models.fields import CharField, BooleanField, TimeField, IntegerField, DateField, DecimalField, TextField

# ==========================================
# 1. Bus (Avtobuslar) Modeli
# ==========================================
class Bus(Model):
    num = CharField(max_length=20, unique=True, verbose_name="Avtobus raqami")
    route = CharField(max_length=20, verbose_name="Yo'nalish (Route)")

    class Meta:
        verbose_name = "Avtobus"
        verbose_name_plural = "Avtobuslar"

    def __str__(self):
        return f"{self.num} ({self.route})"


# ==========================================
# 2. Driver (Haydovchilar) Modeli
# ==========================================
class Driver(Model):
    class Schedule(TextChoices):
        EVEN = 'even', 'Juft kunlar (Even)'
        ODD = 'odd', 'Toq kunlar (Odd)'

    name = CharField(max_length=100, verbose_name="Haydovchi ismi")
    bus = ForeignKey(Bus, on_delete=SET_NULL, null=True, blank=True, related_name='drivers', verbose_name="Biriktirilgan avtobus")
    schedule = CharField(max_length=10, choices=Schedule.choices, default=Schedule.EVEN, verbose_name="Ish tartibi (Grafik)")
    black = BooleanField(default=False, verbose_name="Qora ro'yxat / Maxsus holat")
    shift_start = TimeField(default="06:00", verbose_name="Smena boshi", blank=True, null=True)
    shift_end = TimeField(default="18:00", verbose_name="Smena oxiri", blank=True, null=True)
    total_trips = IntegerField(default=0, verbose_name="Jami qatnovlar soni")
    phone = CharField(max_length=20, blank=True, null=True, verbose_name="Telefon raqami")

    class Meta:
        verbose_name = "Haydovchi"
        verbose_name_plural = "Haydovchilar"

    def __str__(self):
        return self.name


# ==========================================
# 3. DailyTripLog (Kunlik Qatnovlar) Modeli
# ==========================================
class DailyTripLog(Model):
    date = DateField(verbose_name="Sana")
    bus = ForeignKey(Bus, on_delete=CASCADE, related_name='daily_logs', verbose_name="Avtobus")
    driver = ForeignKey(Driver, on_delete=CASCADE, related_name='daily_logs', verbose_name="Haydovchi")
    trips_completed = IntegerField(default=0, verbose_name="Bajarilgan qatnovlar")
    trips_missed = IntegerField(default=0, verbose_name="Qolib ketgan qatnovlar")

    class Meta:
        unique_together = ('date', 'bus', 'driver')
        verbose_name = "Kunlik qatnov"
        verbose_name_plural = "Kunlik qatnovlar"

    def __str__(self):
        return f"{self.date} | {self.bus.num} - {self.driver.name}"


# ==========================================
# 4. Fine (Jarimalar / Shtraflar) Modeli
# ==========================================
class Fine(Model):
    driver = ForeignKey(Driver, on_delete=CASCADE, related_name='fines', verbose_name="Haydovchi")
    date = DateField(verbose_name="Jarima sanasi")
    amount = DecimalField(max_digits=12, decimal_places=2, verbose_name="Jarima summasi (so'm)")
    reason = CharField(max_length=255, verbose_name="Jarima sababi")

    class Meta:
        verbose_name = "Jarima"
        verbose_name_plural = "Jarimalar"

    def __str__(self):
        return f"{self.driver.name} - {self.amount} so'm ({self.date})"


# ==========================================
# 5. WorkAttendance (Ish Vaqti Tabeli) Modeli
# ==========================================
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
        verbose_name = "Ish vaqti"
        verbose_name_plural = "Ish vaqtlari (Tabel)"

    def __str__(self):
        return f"{self.driver.name} | {self.date} | {self.actual_hours} soat"


# ==========================================
# 6. Salary (Oylik Maosh / Zarplata) Modeli
# ==========================================
class Salary(Model):
    driver = ForeignKey(Driver, on_delete=CASCADE, related_name='salaries', verbose_name="Haydovchi")
    year = IntegerField(verbose_name="Yil")
    month = IntegerField(verbose_name="Oy (1-12)") # Bazada 1-12 saqlanadi, serializerda esa frontend uchun 0-11 qilinadi
    fixed_salary = DecimalField(max_digits=12, decimal_places=2, verbose_name="Kafolatlangan oylik (Fiksa)")
    bonus = DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Mukofot puli / Bonus")
    fines_deduction = DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Jarimadan ushlab qolingan")
    total_paid = DecimalField(max_digits=12, decimal_places=2, verbose_name="Qo'lga tegadigan jami summa")

    class Meta:
        unique_together = ('driver', 'year', 'month') # Bitta haydovchiga bir oyda faqat 1 marta oylik hisoblanishi uchun unikallik cheklovi
        verbose_name = "Oylik maosh"
        verbose_name_plural = "Oylik maoshlar (Zarplata)"

    def __str__(self):
        return f"{self.driver.name} - {self.year}/{self.month} uchun maosh"


# ==========================================
# 7. TechnicalStatus (Texnik Holat) Modeli
# ==========================================
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

    bus = ForeignKey(Bus, on_delete=CASCADE, related_name='tech_statuses', verbose_name="Avtobus")
    category = CharField(max_length=20, choices=TechnicalCategory.choices, verbose_name="Kategoriya")
    last_service_date = DateField(verbose_name="Oxirgi texnik ko'rik sanasi")
    current_km = IntegerField(verbose_name="Hozirgi yurgan masofasi (km)")
    max_km = IntegerField(default=50000, verbose_name="Maksimal ruxsat etilgan masofa (km)")
    status = CharField(max_length=10, choices=TechnicalStatusChoice.choices, default=TechnicalStatusChoice.OK, verbose_name="Holati")

    class Meta:
        unique_together = ('bus', 'category')
        verbose_name = "Texnik holat"
        verbose_name_plural = "Texnik holatlar"

    def __str__(self):
        return f"{self.bus.num} - {self.category} ({self.status})"


# ==========================================
# 8. MaintenanceSchedule (Texnik Reja) Modeli
# ==========================================
class MaintenanceSchedule(Model):
    bus = ForeignKey(Bus, on_delete=CASCADE, related_name='maintenance_schedules', verbose_name="Avtobus")
    maintenance_type = CharField(max_length=100, verbose_name="Xizmat turi (TO-1, TO-2...)")
    planned_date = DateField(verbose_name="Rejalashtirilgan sana")
    days_remaining = IntegerField(verbose_name="Qolgan kunlar soni")

    class Meta:
        verbose_name = "Texnik reja"
        verbose_name_plural = "Texnik xizmat rejalari"

    def __str__(self):
        return f"{self.bus.num} - {self.maintenance_type}"