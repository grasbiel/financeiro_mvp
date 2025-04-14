from django.db import models
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
    amount_limit = models.DecimalField(max_digits=10, decimal_places=2)
    
    month= models.IntegerField(default=12) # 1-12 e define um default
    year= models.IntegerField(default=2025) # 2025 define um default

    def __str__(self):
        cat_name = self.category.name if self.category else "Geral"
        return f"Orçamento de {cat_name} ({self.month}/{self.year}) - {self.user.username}"
    
    def current_month():
        return datetime.datetime.now().month
    
    def current_year():
        return datetime.datetime.now().year

class Transaction (models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    description = models.TextField(blank=True, null= True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank= True)

    # Campo opcional de categoria
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null= True,
        blank = True
    )

    def __str__(self):
        return f"{self.user.username} - {self.value} ({self.date})"
