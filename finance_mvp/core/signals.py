from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Transaction, Budget
from django.core.mail import send_mail
from django.utils import timezone
from django.db.models import Sum

@receiver(post_save, sender=Transaction)
def check_budget(sender, instance, **kwargs):
    # checa apenas despesas
    if instance.value >= 0:
        return
    
    user = instance.user
    hoje = instance.date
    month = hoje.month
    year = hoje.year

    # soma despesas do mês e compara ao budget
    total_despesas = Transaction.objects.filter(
        user=user, value__lt=0, date__year=year, date__month=month
    ).aggregate(total=Sum('value'))['total'] or 0

    try:
        budget= Budget.objects.get(user = user, month= month, year= year)

    except Budget.DoesNotExist:
        return
    
    limite = -float(budget.amount_limit) # budget armazenado como positivo
    if total_despesas <= 0 and (abs(total_despesas)) / limite >= 0.0:
        # enviar e-mail de alerta
        send_mail(
            subject='Alerta de Orçamento',
            message=f'Você atingiu R$ {abs(total_despesas):.2f} de {budget.amount_limit:.2f} no mês atual.',
            from_email='no-reply@finance_mvp.com',
            recipient_list=[user.email],
        )