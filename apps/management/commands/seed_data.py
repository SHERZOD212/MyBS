import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
from apps.models import (
    Bus,
    Driver,
    DailyTripLog,
    TechnicalStatus,
    MaintenanceSchedule,
    Fine,
    WorkAttendance,
    Salary
)

class Command(BaseCommand):
    help = "Seeds database with mock data for testing and development"

    def handle(self, *args, **options):
        self.stdout.write("Seeding data...")

        # 1. Create Superuser / Admin User
        User = get_user_model()
        admin_user, created = User.objects.get_or_create(username="admin")
        if created:
            admin_user.set_password("admin123")
            admin_user.email = "admin@example.com"
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.save()
            self.stdout.write(self.style.SUCCESS("Admin user 'admin' with password 'admin123' created successfully!"))
        else:
            self.stdout.write("Admin user 'admin' already exists.")

        # Clear existing data to avoid conflicts on unique constraints
        DailyTripLog.objects.all().delete()
        Fine.objects.all().delete()
        WorkAttendance.objects.all().delete()
        Salary.objects.all().delete()
        TechnicalStatus.objects.all().delete()
        MaintenanceSchedule.objects.all().delete()
        Driver.objects.all().delete()
        Bus.objects.all().delete()

        # 2. Create Buses
        buses_data = [
            {"num": "01 | 777 AAA", "route": "T-5"},
            {"num": "01 | 888 BBB", "route": "T-12"},
            {"num": "01 | 999 CCC", "route": "T-99"},
            {"num": "01 | 111 DDD", "route": "T-10"},
            {"num": "01 | 222 EEE", "route": "T-100"},
        ]
        buses = []
        for b_data in buses_data:
            bus = Bus.objects.create(**b_data)
            buses.append(bus)
        self.stdout.write(f"Created {len(buses)} buses.")

        # 3. Create Drivers
        drivers_data = [
            {
                "name": "Sherzod Karimov",
                "bus": buses[0],
                "schedule": Driver.Schedule.EVEN,
                "black": False,
                "shift_start": datetime.time(6, 0),
                "shift_end": datetime.time(18, 0),
                "total_trips": 124,
                "phone": "+998901234567"
            },
            {
                "name": "Jasur Olimov",
                "bus": buses[1],
                "schedule": Driver.Schedule.ODD,
                "black": False,
                "shift_start": datetime.time(7, 0),
                "shift_end": datetime.time(19, 0),
                "total_trips": 98,
                "phone": "+998935556677"
            },
            {
                "name": "Diyorbek Toshmatov",
                "bus": buses[2],
                "schedule": Driver.Schedule.EVEN,
                "black": False,
                "shift_start": datetime.time(6, 30),
                "shift_end": datetime.time(18, 30),
                "total_trips": 110,
                "phone": "+998971112233"
            },
            {
                "name": "Farrux G'ofurov",
                "bus": buses[3],
                "schedule": Driver.Schedule.ODD,
                "black": False,
                "shift_start": datetime.time(8, 0),
                "shift_end": datetime.time(20, 0),
                "total_trips": 85,
                "phone": "+998998889900"
            },
            {
                "name": "Sardor Ahmedov",
                "bus": buses[4],
                "schedule": Driver.Schedule.EVEN,
                "black": False,
                "shift_start": datetime.time(6, 0),
                "shift_end": datetime.time(18, 0),
                "total_trips": 130,
                "phone": "+998946665544"
            },
            {
                "name": "Bobur Rahimov",
                "bus": None,
                "schedule": Driver.Schedule.EVEN,
                "black": False,
                "shift_start": datetime.time(6, 0),
                "shift_end": datetime.time(18, 0),
                "total_trips": 45,
                "phone": "+998909876543"
            },
            {
                "name": "Kamoliddin Saydullaev",
                "bus": None,
                "schedule": Driver.Schedule.ODD,
                "black": False,
                "shift_start": datetime.time(7, 0),
                "shift_end": datetime.time(19, 0),
                "total_trips": 32,
                "phone": "+998912223344"
            },
            {
                "name": "Anvar Jumayev",
                "bus": None,
                "schedule": Driver.Schedule.EVEN,
                "black": True, # repair/blocked
                "shift_start": datetime.time(6, 0),
                "shift_end": datetime.time(18, 0),
                "total_trips": 60,
                "phone": "+998974445566"
            },
        ]
        drivers = []
        for d_data in drivers_data:
            driver = Driver.objects.create(**d_data)
            drivers.append(driver)
        self.stdout.write(f"Created {len(drivers)} drivers.")

        # 4. Create Fines
        fines_data = [
            {
                "driver": drivers[0],
                "date": datetime.date(2026, 5, 12),
                "amount": Decimal("150000.00"),
                "reason": "Tezlikni oshirish (Radar)"
            },
            {
                "driver": drivers[0],
                "date": datetime.date(2026, 6, 5),
                "amount": Decimal("100000.00"),
                "reason": "Yo'l chizig'ini bosish"
            },
            {
                "driver": drivers[1],
                "date": datetime.date(2026, 6, 14),
                "amount": Decimal("200000.00"),
                "reason": "Qizil chiroqda o'tish"
            },
            {
                "driver": drivers[2],
                "date": datetime.date(2026, 5, 20),
                "amount": Decimal("50000.00"),
                "reason": "Noto'g'ri to'xtash"
            },
            {
                "driver": drivers[3],
                "date": datetime.date(2026, 6, 22),
                "amount": Decimal("300000.00"),
                "reason": "Telefon orqali gaplashish"
            },
        ]
        for f_data in fines_data:
            Fine.objects.create(**f_data)
        self.stdout.write("Created fines.")

        # 5. Create DailyTripLogs (for today and past 3 days)
        today = datetime.date.today()
        for i in range(4):
            log_date = today - datetime.timedelta(days=i)
            # Decide day type (even/odd date number)
            is_even_day = log_date.day % 2 == 0
            target_schedule = 'even' if is_even_day else 'odd'

            for driver in drivers:
                if driver.bus and driver.schedule == target_schedule and not driver.black:
                    DailyTripLog.objects.get_or_create(
                        date=log_date,
                        bus=driver.bus,
                        driver=driver,
                        defaults={
                            "trips_completed": 8 if i > 0 else 5,
                            "trips_missed": 0 if i > 0 else 1
                        }
                    )
        self.stdout.write("Created daily trip logs.")

        # 6. Create WorkAttendance (Tabel)
        # We generate attendance for each driver for May (month=5) and June (month=6)
        start_date = datetime.date(2026, 5, 1)
        end_date = datetime.date(2026, 6, 27)
        delta = end_date - start_date

        attendances_to_create = []
        for i in range(delta.days + 1):
            curr_date = start_date + datetime.timedelta(days=i)
            is_even_day = curr_date.day % 2 == 0
            day_schedule = 'even' if is_even_day else 'odd'

            for driver in drivers:
                if driver.black:
                    status = "Kasal/Ruxsatda"
                    actual = 0
                elif driver.schedule == day_schedule:
                    status = "Ishda"
                    actual = 8 if i % 10 != 0 else 9 # occasionally overtime
                else:
                    status = "Dam olmoqda"
                    actual = 0

                attendances_to_create.append(
                    WorkAttendance(
                        driver=driver,
                        date=curr_date,
                        planned_hours=8 if status == "Ishda" else 0,
                        actual_hours=actual,
                        overtime_hours=actual - 8 if actual > 8 else 0,
                        status=status,
                        check_in=datetime.time(6, 0) if actual > 0 else None,
                        check_out=datetime.time(22, 30) if actual > 0 else None
                    )
                )

        WorkAttendance.objects.bulk_create(attendances_to_create)
        self.stdout.write("Created work attendance logs.")

        # 7. Create Salaries
        salaries_data = []
        for driver in drivers:
            # May salaries (month=4)
            may_fines_sum = sum(f.amount for f in Fine.objects.filter(driver=driver, date__month=5))
            fixed = Decimal("5000000.00")
            bonus = Decimal("400000.00") if not driver.black else Decimal("0.00")
            
            salaries_data.append(
                Salary(
                    driver=driver,
                    year=2026,
                    month=4, # May
                    fixed_salary=fixed,
                    bonus=bonus,
                    fines_deduction=may_fines_sum,
                    total_paid=(fixed + bonus) - may_fines_sum
                )
            )

            # June salaries (month=5)
            june_fines_sum = sum(f.amount for f in Fine.objects.filter(driver=driver, date__month=6))
            salaries_data.append(
                Salary(
                    driver=driver,
                    year=2026,
                    month=5, # June
                    fixed_salary=fixed,
                    bonus=bonus,
                    fines_deduction=june_fines_sum,
                    total_paid=(fixed + bonus) - june_fines_sum
                )
            )

        Salary.objects.bulk_create(salaries_data)
        self.stdout.write("Created salary records.")

        # 8. Create TechnicalStatus (Tires, Brakes for all buses)
        for bus in buses:
            TechnicalStatus.objects.create(
                bus=bus,
                category=TechnicalStatus.TechnicalCategory.TIRES,
                last_service_date=timezone.now().date() - datetime.timedelta(days=45),
                current_km=32000 if bus.id % 2 == 0 else 46000,
                max_km=50000,
                status=TechnicalStatus.TechnicalStatusChoice.OK if bus.id % 2 == 0 else TechnicalStatus.TechnicalStatusChoice.WARNING
            )
            TechnicalStatus.objects.create(
                bus=bus,
                category=TechnicalStatus.TechnicalCategory.BRAKES,
                last_service_date=timezone.now().date() - datetime.timedelta(days=60),
                current_km=15000 if bus.id % 3 == 0 else 49200,
                max_km=50000,
                status=TechnicalStatus.TechnicalStatusChoice.OK if bus.id % 3 == 0 else TechnicalStatus.TechnicalStatusChoice.DANGER
            )
        self.stdout.write("Created technical statuses.")

        # 9. Create MaintenanceSchedule
        MaintenanceSchedule.objects.create(
            bus=buses[0],
            maintenance_type="TO-1 (Shinalarni almashtirish)",
            planned_date=timezone.now().date() + datetime.timedelta(days=3),
            days_remaining=3
        )
        MaintenanceSchedule.objects.create(
            bus=buses[1],
            maintenance_type="TO-2 (Tormoz tizimini ta'mirlash)",
            planned_date=timezone.now().date() + datetime.timedelta(days=5),
            days_remaining=5
        )
        self.stdout.write("Created maintenance schedules.")
        self.stdout.write(self.style.SUCCESS("Database seeded successfully with dummy/mock data!"))
