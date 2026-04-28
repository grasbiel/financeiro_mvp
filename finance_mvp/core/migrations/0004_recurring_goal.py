# Migração manual — Fase 2
# Cria RecurringTransaction e Goal
# Adiciona FK recurring_transaction em Transaction

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0003_add_kind_archived_timestamps"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── RecurringTransaction ──────────────────────────────────────────────
        migrations.CreateModel(
            name="RecurringTransaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("kind", models.CharField(choices=[("income", "Receita"), ("expense", "Despesa")], default="expense", max_length=10)),
                ("value", models.DecimalField(decimal_places=2, max_digits=10)),
                ("description", models.TextField(blank=True, null=True)),
                ("emotional_trigger", models.CharField(blank=True, choices=[
                    ("Necessidade Básica", "Necessidade Básica"),
                    ("Planejamento/Objetivo", "Planejamento/Objetivo"),
                    ("Prazer/Entretenimento", "Prazer/Entretenimento"),
                    ("Impulso Emocional", "Impulso Emocional"),
                    ("Pressão Social/Status", "Pressão Social/Status"),
                    ("Conforto/Compulsão", "Conforto/Compulsão"),
                    ("Curiosidade/Exploração", "Curiosidade/Exploração"),
                ], default="Necessidade Básica", max_length=30, null=True)),
                ("frequency", models.CharField(choices=[("monthly", "Mensal"), ("weekly", "Semanal")], default="monthly", max_length=10)),
                ("day_of_month", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("day_of_week", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("start_date", models.DateField()),
                ("end_date", models.DateField(blank=True, null=True)),
                ("active", models.BooleanField(default=True)),
                ("last_materialized_at", models.DateField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("category", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="core.category")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),

        # ── FK em Transaction → RecurringTransaction ──────────────────────────
        migrations.AddField(
            model_name="transaction",
            name="recurring_transaction",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="materialized_transactions",
                to="core.recurringtransaction",
            ),
        ),

        # ── Goal ──────────────────────────────────────────────────────────────
        migrations.CreateModel(
            name="Goal",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("month", models.PositiveSmallIntegerField()),
                ("year", models.PositiveSmallIntegerField()),
                ("amount_limit", models.DecimalField(decimal_places=2, max_digits=10)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("category", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="core.category")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["year", "month", "category__name"],
                     "unique_together": {("user", "category", "month", "year")}},
        ),
    ]
