from django.shortcuts import render

# Create your views here.

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics, permissions, serializers
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Q
from .models import Transaction, Category, Budget
import datetime
from .serializers import (
    TransactionSerializer,
    UserSerializer,
    CategorySerializer,
    BudgetSerializer
    )
from django.contrib.auth.models import User


class CategoryListCreateView (generics.ListCreateAPIView): 
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Listar somente as categorias do usuário Logado
        return Category.objects.filter(user= self.request.user)
    
    def perform_create(self, serializer):
        # Ao criar, definimos que a categoria pertence ao user logado
        serializer.save(user=self.request.user)

class CategoryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filtrar categorias somente do user 
        return Category.objects.filter(user= self.request.user)
    

# 1 Cadastro de Usuário (Signup)

class SignupView (generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

# 2) Listar/Criar transações (usando generics para exemplificar)
class TransactionListCreateView(generics.ListCreateAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Retorna as transações do Usuário logado
        return Transaction.objects.filter(user=self.request.user).order_by('-date')
    
    def perform_create(self, serializer):
        # Define o user como o user logado
        category = serializer.validated_data.get('category', None)
        value = serializer.validated_data.get('value')
        date = serializer.validated_data.get('date')

        # Valida categoria
        if category and category.user != self.request.user:
            raise serializers.ValidationError("Categoria inválida para este usuário.")

        # Se for despesa (value < 0), verifica budgets
        if value < 0:
            self.check_budget(date, category, abs(value))

        serializer.save(user= self.request.user)

    def perform_update(self, serializer):
        # Se o user atualiza valor ou categoria, também precisamos checar
        category = serializer.validated_data.get('category', None)
        value = serializer.validated_data.get('value')
        date = serializer.validated_data.get('date')

        if category and category.user != self.request.user:
            raise serializers.ValidationError("Categoria inválida para este usuário")
        
        if value < 0:
            self.check_budget(date, category, abs(value), transaction_id = self.kwargs['pk'])

        serializer.save()

    def check_budget(self, trans_date, category, expense_value, transaction_id= None):

        """"
        Verifica se, ao somar esta despesa + outras do mês,
        ultrapassa algum budget(geral ou da categoria).
        Se sim, lança ValidationError
        """

        user = self.request.user
        month = trans_date.month
        year = trans_date.year

        # 1. Localiza budgets do user que sejam:
        # - do mesmo month/year e sem categoria (geral)
        # - do mesmo month/year e com a mesma categoria

        matching_budgets = Budget.objects.filter(
            user = user,
            month = month,
            year = year
        ).filter(
            Q(category__isnull=True) | Q(category=category)
        )

        if not matching_budgets.exists():
            # Se não houver budget definido, não bloqueia nada
            return
        
        # Precisamos somar as despesas existentes do user nesse mês
        # Para o budget "geral", soma de todas as despesas do mês
        # Para o budget "por categoria", soma só daquelas desta categoria
        # Obs: Excluímos a transação atual, pois se for update,
        # Podemos recalcular sem contar o valor antigo duplicado

        from django.db.models import F

        # Filtra transações do user daquele mês
        # e remove a transação atual (se for update)

        base_qs = Transaction.objects.filter(
            user = user,
            date__year=year,
            date__month=month,
            value__lt=0
        )

        if transaction_id:
            base_qs = base_qs.exclude(pk=transaction_id)

        # Soma de despesas geral do mês
        total_despesas_mes = base_qs.aggregate(total=Sum('value'))['total'] or 0
        total_despesas_mes = abs(total_despesas_mes) # Pois o valor é negativo

        # Soma de despesas da categoria (Se for update)

        if category:
            total_despesas_cat = base_qs.filter(category=category).aggregate(total=Sum('value'))['total'] or 0
            total_despesas_cat = abs(total_despesas_cat)

        else:
            total_despesas_cat = 0
        
        # Agora, simulamos a inclusão/edição da despesa nova
        # e vemos se excede o budget
        for budget in matching_budgets:
            # valor já gasto + despesa atual
            if budget.category:
                # Budget específico da categoria
                current_spent = total_despesas_cat + expense_value

            else:
                # Budget geral
                current_spent = total_despesas_mes + expense_value

            if current_spent > float(budget.amount_limit):
                category_name= budget.category.name if budget.category else "Geral"
                raise serializers.ValidationError(
                    f'Limite de orçamento excedido: ({category_name}, Mês {month}/{year},'
                    f'Limite de R$ {budget.amount_limit}).'
                )
            


        
# 3) Detalhe/Atualizar/Deletar transação
class TransactionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)
    
    def perform_update(self, serializer):
        category = serializer.validated_data.get('category', None)
        if category and category.user != self.request.user:
            raise serializers.ValidationError("Categoria inválida para este usuário")
        serializer.save()
    
# 4) Resumo Mensal
from rest_framework.views import APIView

class MonthlySummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        year = now.year
        month = now.month

        # Ajustamos o início e fim do mês
        month_start = datetime.date(year, month, 1)
        # Para o fim, poderíamos usar calendar, mas simplificando:
        month_end = datetime.date(year, month, 28) + datetime.timedelta(days=4)
        month_end = month_end - datetime.timedelta

class BudgetListCreateView (generics.ListCreateAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user = self.request.user).order_by('year', 'month')

    # Confere se a category pertence ao usuário e não há outro budget duplicado para aquele month/year/category
    def perform_create(self, serializer):
        # Garante que o budget pertence ao user logado
        category = serializer.validated_data.get('category')
        if category and category.user != self.request.user:
            raise serializers.ValidationError("Categoria inválida para este usuário.")
        

        # Verificar se já existe um Budget para o mesmo mês/ano e mesma categoria
        month = serializer.validated_data['month']
        year = serializer.validated_data['year']
        existing_qs = Budget.objects.filter(
            user = self.request.user,
            month = month,
            year = year,
            category = category
        )

        if existing_qs.exists():
            raise serializers.ValidationError("Já existe um orçamento definido para este mês/ano/categoria.")
        
        serializer.save(user= self.request.user)
    
class BudgetRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user = self.request.user)
    
    def perform_update(self, serializer):
        category = serializer.validated_data.get('category')
        if category and category.user != self.request.user:
            raise serializers.ValidationError("Categoria inválida para este usuário.")
        
        month = serializer.validated_data.get('month', None)
        year = serializer.validated_data.get('year', None)

        # Se o user mudar month/year, verificar se já existe outro budget igual

        if month and year:
            existings_qs = Budget.objects.filter(
                user = self.request.user,
                month = month,
                year = year,
                category = category
            ).exclude(pk = self.kwargs['pk'])

            if existings_qs.exists():
                raise serializers.ValidationError("Já existe um orçamento definido para este mês/ano/categoria")
            
        serializers.save()

class ExpensesByCategoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1) ler parâmetros de data (Ex: ?start=2025-03-01&end=2025-03-31)
        start_str = request.query_params.get('start') #string
        end_str = request.query_params.get('end')

        # 2) Base QuerySet: despesas (value__lt=0) do usuário logado
        qs = Transaction.objects.filter(
            user = request.user,
            value__lt=0 # < 0 => despesas
        )

        # 3) Se o usuário passou start e end, filtramos date__range
        if start_str and end_str:
            # Converter strings para objeto datetime.date
            start_date = datetime.strptime(start_str, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_str, "%Y-%m-%d").date()

            qs = qs.filter(date__range=[start_date, end_date])

        # 4) Agrupamento por categoria, somando 'value'
        date = qs.values('category__name').annotate(total=Sum('value'))

        # `data` terá algo como:
        # [{'category__name': 'Alimentação', 'total': -1200},
        # {'category__name': 'Transporte', 'total': -350, ...}]

        # 5) Ajustar formato: total de despesas em valor positivo
        results= []

        for item in data:
            category_name = item['category__name'] or 'Sem Categoria'
            total_abs = abs(item['total']) # Converter -1200 em 1200
            results.append({
                'category': category_name,
                'total_expenses': total_abs
            })

        return Response(results)
    

class IncomesByCategoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_str = request.query_params.get('start')
        end_str = request.query_params.get('end')

        qs = Transaction.objects.filter(
            user = request.user,
            value__gt= 0 # > 0 => receitas
        )

        if start_str and end_str:
            start_date = datetime.strptime(start_str, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_str, "%Y-%m-%d").date()
            qs = qs.filter(date__range=[start_date, end_date])

        data = qs.values('category__name').annotate(total = Sum('value'))

        results = []

        for item in data:
            category_name = item['category__name'] or 'Sem Categoria'
            total_value = float(item['total']) # Já é positivo
            results.append({
                'category': category_name,
                'total_incomes': total_value
            })

        return Response(results)
