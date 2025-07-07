from django.db import models
from django.contrib.auth.models import User
from django.db.models import UniqueConstraint, Q
import datetime

# Create your models here.

from django.contrib.auth.models import User

class Category(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} ({self.user.username})"
    
class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey('Category', on_delete=models.SET_NULL, null= True, blank= True)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField()

    
    class Meta:
        constraints = [
            UniqueConstraint(
                fields=['user', 'category'],
                condition = Q(start_date__month = models.F('end_date__month')),
                name= 'unique_mothly_budget_for_category'
            )
        ]

    def __str__(self):
        cat_name = self.category.name if self.category else "Geral"
        return f"Orçamento de {cat_name} ({self.month}/{self.year}) - {self.user.username}"
    
    def current_month():
        return datetime.datetime.now().month
    
    def current_year():
        return datetime.datetime.now().year

class Transaction (models.Model):
    EMOTIONAL_TRIGGER_CHOICES= [
        ("Necessidade Básica", "Necessicade Básica"),
        ("Planejamento/Objetivo", "Planejamento/Objetivo"),
        ("Prazer/Entretenimento", "Prazer/Entretenimento"),
        ("Impulso Emocional", "Impulso Emocional"),
        ("Pressão Social/Status", "Pressão Social/Status"),
        ("Conforto/Compulsão", "Conforto/Compulsão"),
        ("Curiosidade/Exploração", "Curiosidade/Exploração")
    ]


    user = models.ForeignKey(User, on_delete=models.CASCADE)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    description = models.TextField(blank=True, null= True)

    emotional_trigger = models.CharField(
        max_length=30,
        choices= EMOTIONAL_TRIGGER_CHOICES,
        default= "Necessidade Básica"
    )
    
    # Campo opcional de categoria
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null= True,
        blank = True
    )

    def __str__(self):
        return f"{self.user.username} - {self.value} ({self.date})"
