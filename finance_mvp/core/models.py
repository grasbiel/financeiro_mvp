import datetime
from django.db import models
from django.contrib.auth.models import User


class Category(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    archived = models.BooleanField(default=False)
    color_slot = models.PositiveSmallIntegerField(
        default=1,
        choices=[(i, str(i)) for i in range(1, 9)],
    )

    class Meta:
        ordering = ["name"]
        unique_together = [("user", "name")]

    def __str__(self):
        return f"{self.name} ({self.user.username})"


class Transaction(models.Model):
    KIND_CHOICES = [("income", "Receita"), ("expense", "Despesa")]
    EMOTIONAL_TRIGGER_CHOICES = [
        ("Necessidade Básica", "Necessidade Básica"),
        ("Planejamento/Objetivo", "Planejamento/Objetivo"),
        ("Prazer/Entretenimento", "Prazer/Entretenimento"),
        ("Impulso Emocional", "Impulso Emocional"),
        ("Pressão Social/Status", "Pressão Social/Status"),
        ("Conforto/Compulsão", "Conforto/Compulsão"),
        ("Curiosidade/Exploração", "Curiosidade/Exploração"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    kind = models.CharField(max_length=10, choices=KIND_CHOICES, default="expense")
    value = models.DecimalField(max_digits=10, decimal_places=2)  # sempre positivo
    date = models.DateField()
    description = models.TextField(blank=True, null=True)
    emotional_trigger = models.CharField(
        max_length=30, choices=EMOTIONAL_TRIGGER_CHOICES,
        default="Necessidade Básica", null=True, blank=True,
    )
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    # Referência opcional à recorrência que gerou este lançamento
    recurring_transaction = models.ForeignKey(
        "RecurringTransaction", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="materialized_transactions",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        indexes = [
            models.Index(fields=["user", "-date"]),
            models.Index(fields=["user", "category"]),
        ]

    def __str__(self):
        return f"{self.user.username} | {self.kind} | {self.value} ({self.date})"


class RecurringTransaction(models.Model):
    FREQUENCY_CHOICES = [("monthly", "Mensal"), ("weekly", "Semanal")]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    kind = models.CharField(max_length=10, choices=Transaction.KIND_CHOICES, default="expense")
    value = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    emotional_trigger = models.CharField(
        max_length=30, choices=Transaction.EMOTIONAL_TRIGGER_CHOICES,
        default="Necessidade Básica", null=True, blank=True,
    )
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, default="monthly")
    # Para frequência mensal: dia do mês (1-28); semanal: dia da semana (0=seg, 6=dom)
    day_of_month = models.PositiveSmallIntegerField(null=True, blank=True)  # 1-28
    day_of_week = models.PositiveSmallIntegerField(null=True, blank=True)   # 0-6
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    active = models.BooleanField(default=True)
    last_materialized_at = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} | {self.frequency} | {self.value}"

    def next_dates_after(self, from_date: datetime.date) -> list[datetime.date]:
        """Retorna todas as datas de materialização entre from_date (exclusive) e hoje."""
        today = datetime.date.today()
        dates: list[datetime.date] = []
        cursor = from_date

        if self.frequency == "monthly":
            day = self.day_of_month or self.start_date.day
            # Avança mês a mês
            year, month = cursor.year, cursor.month
            while True:
                month += 1
                if month > 12:
                    month = 1
                    year += 1
                try:
                    candidate = datetime.date(year, month, min(day, 28))
                except ValueError:
                    candidate = datetime.date(year, month, 28)
                if candidate > today:
                    break
                if self.end_date and candidate > self.end_date:
                    break
                if candidate > from_date:
                    dates.append(candidate)
        else:  # weekly
            dow = self.day_of_week if self.day_of_week is not None else cursor.weekday()
            # Próxima ocorrência do weekday a partir de cursor+1
            days_ahead = (dow - cursor.weekday()) % 7 or 7
            candidate = cursor + datetime.timedelta(days=days_ahead)
            while candidate <= today:
                if self.end_date and candidate > self.end_date:
                    break
                if candidate > from_date:
                    dates.append(candidate)
                candidate += datetime.timedelta(weeks=1)
        return dates


class Goal(models.Model):
    """Meta de gasto mensal por categoria."""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    month = models.PositiveSmallIntegerField()   # 1-12
    year = models.PositiveSmallIntegerField()
    amount_limit = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("user", "category", "month", "year")]
        ordering = ["year", "month", "category__name"]

    def __str__(self):
        return f"{self.user.username} | {self.category.name} | {self.month}/{self.year} | {self.amount_limit}"
