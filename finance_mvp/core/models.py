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
    
class Transaction (models.Model):
    EMOTIONAL_TRIGGER_CHOICES= [
        ("Necessidade Básica", "Necessidade Básica"),
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
        default= "Necessidade Básica",
        null= True,
        blank= True
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
