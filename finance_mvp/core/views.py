from django.db.models import Sum, Q, DecimalField
from django.db.models.functions import Coalesce
from django.shortcuts import render

# Create your views here.

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import generics, permissions, serializers, viewsets
from rest_framework.decorators import api_view, permission_classes
from django.http import JsonResponse
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
from django_filters import rest_framework as filters



class CategoryListCreateView (generics.ListCreateAPIView): 
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user = self.request.user).order_by('name')
    
    def perform_create(self, serializer):
        # Ao criar, definimos que a categoria pertence ao user logado
        serializer.save(user=self.request.user)

class UserViewSet (viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == 'create':
            self.permission_classes = [AllowAny]
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()
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

    filter_backends = [filters.DjangoFilterBackend]

    # Retorna apenas as transações do usuário autenticado
    def get_queryset(self):
        # Retorna as transações do Usuário logado
        return Transaction.objects.filter(user=self.request.user).order_by('-date')
    
    def check_budget(self, trans_date, category, expense_value):

        """"
        Verifica se, ao somar esta despesa + outras do mês,
        ultrapassa algum budget(geral ou da categoria).
        Se sim, lança ValidationError
        """

        budgets = Budget.objects.filter(
            user = self.request.user,
            category = category,
            start_date__lte = trans_date,
            end_date__gte = trans_date
        )

        if not budgets.exists():
            return 
        
        budget = budgets.first()

        # Calcula o total de despesas no período do orçamento para a categoria
        total_expenses = Transaction.objects.filter(
            user = self.request.user,
            category = category,
            date__range = (budget.start_date, budget.end_date),
            value__lt = 0
        ).aggregate(total = Sum('value'))['total'] or 0      

        total_spent = abs(total_expenses)

        # Verifica se o novo gasto excede o limite do orçamento
        if (total_spent + expense_value) > budget.value:
            raise serializers.ValidationError(
                f"Esta transação excede o orçamento de R$ {budget.value:.2f}"
                f"para a categoria '{category.name}'"
                f"Gasto atual: R$ {total_spent:.2f}"
            )   
        
    
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
            # O valor da despesa para o cálculo deve ser positivo
            expense_value =abs(value)
            self.check_budget(date, category, expense_value)

        serializer.save(user=self.request.user)



        
# 3) Detalhe/Atualizar/Deletar transação
class TransactionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Garante que o usuário só possa ver/modificar sua própria transação
    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)
        
    def check_budget_on_update(self, trans_date, category, new_expense_value, instance):
        budgets = Budget.objects.filter(
            user = self.request.user,
            category = category,
            start_date__lte = trans_date,
            end_date__gte = trans_date
        )

        if not budgets.exists():
            return
        
        budget = budgets.first()

        total_expenses = Transaction.objects.filter(
            user = self.request.user,
            category = category,
            date__range = (budget.start_date, budget.end_date),
            value__lt = 0
        ).exclude(pk=instance.pk).aggregate(total=Sum('value'))['total'] or 0

        total_spent_without_this = abs(total_expenses)

        if (total_spent_without_this + new_expense_value) > budget.value:
            raise serializers.ValidationError(
                f"A atualização desta transação excede o orçamento de R$ {budget.value: .2f}"
                f"para a categoria '{category.name}'"
            )

    # Atualização de transação, aplicando a verificação de orçamento
    def perform_update(self, serializer):

        # Pega a instância de transação que está sendo atualizada
        instance = self.get_object()

        new_value = serializer.validated_data.get('value', instance.value)

        if new_value < 0:
            new_date = serializer.validated_data.get('date', instance.date)
            new_category = serializer.validated_data.get('category', instance.category)

            # Valida se a categoria (se foi alterada) pertence ao usuário
            if 'category' in serializer.validated_data and new_category.user != self.request.user:
                raise serializers.ValidationError("Você só pode usar suas próprias categorias")
            
            expense_value = abs(new_value)
            self.check_budget_on_update(new_date, new_category, expense_value, instance)
        serializer.save()
            
    
# 4) Resumo Mensal
from rest_framework.views import APIView

class CreateUserView(generics.CreateAPIView):
    serializer_class = UserSerializer
    permission_classes= [permissions.AllowAny]

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes= [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes= [permissions.IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-date')
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
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
        next_month = month_start.replace(day=28) + datetime.timedelta(days=4)
        month_end = next_month - datetime.timedelta(days=next_month.day)

        transactions = Transaction.objects.filter(
            user = user,
            date__range=[month_start,month_end]
        )

        receitas = transactions.filter(value__gte=0).aggregate(
            total=Coalesce(Sum('value'),0, output_field=DecimalField())
        )['total']

        despesas= transactions.filter(value__lt=0).aggregate(
            total=Coalesce(Sum('value'), 0, output_field=DecimalField())
        )['total']

        saldo = receitas + despesas

        summary_data = {
            'receitas': receitas,
            'despesas': abs(despesas),
            'saldo': saldo
        }
        return Response(summary_data)

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
        data = qs.values('category__name').annotate(total=Sum('value'))

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
    

class ExpensesByEmotionalTriggerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Transaction.objects.filter(user = request.user, value__lt=0)
        data = (
            qs.values('emotional_trigger').annotate(total=Sum('value'))
        )

        # retorna total como valor positivo para facilitar exibição
        results = [
            {
                'emotional_trigger': item['emotional_trigger'],
                'total_expenses': abs(item['total'])
            }

            for item in data
        ]

        return Response(results)


class TransactionFilter(filters.FilterSet):
    start= filters.DateFilter(field_name="date", lookup_expr='gte')
    end = filters.DateFilter(field_name="date", lookup_expr="lte")
    category = filters.NumberFilter(field_name='category__id')
    emotion = filters.CharFilter(field_name="emotional_trigger", lookup_expr="iexact")

    class Meta:
        model = Transaction
        fields= ['start', 'end', 'category', 'emotion']

class EmotionalSpendingView(APIView):
    """
    View para calcular o total de gastos por gatilho emocional.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Agrupa as transações por 'emotional_trigger' e soma os valores
        data = (
            Transaction.objects
            .filter(user=request.user, type='expense')
            .values('emotional_trigger')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )
        return Response(data)
    
class NeedsVsWantsView(APIView):
    """
    View para comparar o total de gastos entre necessidades e desejos.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Agrupa as transações por 'purchase_type' e soma os valores
        data = (
            Transaction.objects
            .filter(user=request.user, type='expense')
            .values('purchase_type')
            .annotate(total=Sum('amount'))
            .order_by('purchase_type')
        )
        return Response(data)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_budget(request):
    """
    Verifica se um novo gasto excede o orçamento para uma determinada categoria.
    """
    category_id = request.data.get('category')
    amount = float(request.data.get('amount', 0))
    
    if not category_id:
        return JsonResponse({'error': 'Category not provided'}, status=400)

    today = datetime.date.today()
    try:
        # Encontra o orçamento para a categoria e o mês/ano atuais
        budget = Budget.objects.get(
            user=request.user,
            category_id=category_id,
            month=today.month,
            year=today.year
        )
        
        # Soma as despesas existentes na categoria no mês atual
        expenses = Transaction.objects.filter(
            user=request.user,
            category_id=category_id,
            type='expense',
            date__month=today.month,
            date__year=today.year
        ).aggregate(total_expenses=Sum('amount'))
        
        total_expenses = expenses['total_expenses'] or 0
        
        # Verifica se o novo gasto mais os gastos existentes excedem o orçamento
        if total_expenses + amount > budget.amount:
            return JsonResponse({
                'exceeded': True,
                'message': f'A adição de R${amount:.2f} excederá o orçamento de R${budget.amount:.2f} para esta categoria.'
            })
        else:
            return JsonResponse({'exceeded': False})
            
    except Budget.DoesNotExist:
        # Se não houver orçamento definido para a categoria, não há como exceder.
        return JsonResponse({'exceeded': False, 'message': 'Nenhum orçamento definido para esta categoria.'})