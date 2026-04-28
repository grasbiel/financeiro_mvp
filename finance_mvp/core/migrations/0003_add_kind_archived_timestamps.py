# Migração manual — Fase 1
# Adiciona: Transaction.kind, Transaction.created_at, Transaction.updated_at
#           Category.archived, Category.color_slot
# Índices: (user, -date) e (user, category) em Transaction
# unique_together (user, name) em Category

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_delete_budget"),
    ]

    operations = [
        # ── Category ──────────────��────────────────────────────��──────────────
        migrations.AddField(
            model_name="category",
            name="archived",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="category",
            name="color_slot",
            field=models.PositiveSmallIntegerField(
                choices=[(1, "1"), (2, "2"), (3, "3"), (4, "4"),
                         (5, "5"), (6, "6"), (7, "7"), (8, "8")],
                default=1,
            ),
        ),
        migrations.AlterUniqueTogether(
            name="category",
            unique_together={("user", "name")},
        ),

        # ── Transaction ───────────────────────────────────────────────────────
        migrations.AddField(
            model_name="transaction",
            name="kind",
            field=models.CharField(
                choices=[("income", "Receita"), ("expense", "Despesa")],
                default="expense",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="transaction",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="transaction",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),

        # ── Índices ─────────────────────────────��──────────────────────────���──
        migrations.AddIndex(
            model_name="transaction",
            index=models.Index(fields=["user", "-date"], name="core_trans_user_date_idx"),
        ),
        migrations.AddIndex(
            model_name="transaction",
            index=models.Index(fields=["user", "category"], name="core_trans_user_cat_idx"),
        ),

        # ── Ordenação padrão ──────────────────────────────────────────────────
        migrations.AlterModelOptions(
            name="transaction",
            options={"ordering": ["-date", "-created_at"]},
        ),
        migrations.AlterModelOptions(
            name="category",
            options={"ordering": ["name"]},
        ),
    ]
