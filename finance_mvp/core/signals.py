from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Transaction, Budget
from django.core.mail import send_mail
from django.utils import timezone
from django.db.models import Sum, Q

@receiver(post_save, sender=Transaction)
def check_budget(sender, instance, **kwargs):
     # 1. Executa apenas para despesas
    if instance.value >= 0:
        return

    transaction_date = instance.date
    user = instance.user
    category = instance.category

    # 2. Busca por um orçamento relevante (geral ou de categoria) para a data da transação
    try:
        # Busca um orçamento específico para a categoria da transação
        budget_q = Q(user=user, category=category, start_date__lte=transaction_date, end_date__gte=transaction_date)
        # Se não houver categoria na transação, busca um orçamento geral (sem categoria)
        if category is None:
            budget_q = Q(user=user, category__isnull=True, start_date__lte=transaction_date, end_date__gte=transaction_date)

        budget = Budget.objects.get(budget_q)

    except Budget.DoesNotExist:
        # Se não existe orçamento para esta data/categoria, não faz nada
        return
    except Budget.MultipleObjectsReturned:
        # Caso exista mais de um orçamento, pega o primeiro. Idealmente, a lógica de negócio deveria impedir isso.
        budget = Budget.objects.filter(budget_q).first()


    # 3. Calcula o total de despesas no período do orçamento encontrado
    total_spent = Transaction.objects.filter(
        user=user,
        category=budget.category,
        value__lt=0,
        date__range=(budget.start_date, budget.end_date)
    ).aggregate(total=Sum('value'))['total'] or 0
    