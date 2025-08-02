from django.db.models import Sum, Value, Case, When, F, DecimalField
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
from .models import Transaction, Category
import datetime
from .serializers import (
    TransactionSerializer,
    UserSerializer,
    CategorySerializer,
    )
from django.contrib.auth.models import User
from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend



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
    
# 4) Resumo Mensal
from rest_framework.views import APIView

class CreateUserView(generics.CreateAPIView):
    serializer_class = UserSerializer
    permission_classes= [permissions.AllowAny]

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
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

class TransactionFilter(filters.FilterSet):
    start= filters.DateFilter(field_name="date", lookup_expr='gte')
    end = filters.DateFilter(field_name="date", lookup_expr="lte")
    category = filters.NumberFilter(field_name='category__id')
    emotion = filters.CharFilter(field_name="emotional_trigger", lookup_expr="iexact")

    class Meta:
        model = Transaction
        fields= ['start', 'end', 'category', 'emotion']

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes= [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = TransactionFilter

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-date')
    
   
    def perform_create(self, serializer):
        """Sobrescreve o método de criação para validar o orçamento."""
        transaction = serializer.save(user=self.request.user)
        
        
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

class MonthlyFlowView (APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, *args, **kwargs):
        # Calcula a soma das receitas (valores positivos)
        total_revenue = (
            Transaction.objects
            .filter(user=request.user, value__gt=0)  # CORRIGIDO
            .aggregate(total=Sum('value'))['total'] or 0 # CORRIGIDO
        )

        # Calcula a soma das despesas (valores negativos)
        total_expenses = (
            Transaction.objects
            .filter(user=request.user, value__lt=0)  # CORRIGIDO
            .aggregate(total=Sum('value'))['total'] or 0 # CORRIGIDO
        )

        # Retorna os totais
        return Response({
            'total_revenue': total_revenue,
            'total_expenses': abs(total_expenses)
        })
class EmotionalSpendingView(APIView):
    """
    View para calcular o total de gastos por gatilho emocional.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Agrupa as transações por 'emotional_trigger' e soma os valores
        data = (
            Transaction.objects
            .filter(user=request.user, value__lt=0)  # CORRIGIDO: Filtra por valor negativo
            .values('emotional_trigger')
            .annotate(total_spent=Sum('value'))  # CORRIGIDO: Soma o campo 'value'
            .order_by('-total_spent')
        )
        
        # Opcional, mas recomendado: retornar o valor como positivo para o frontend
        results = [
            {
                'emotional_trigger': item['emotional_trigger'],
                'total_spent': abs(item['total_spent'])
            }
            for item in data
        ]
        return Response(results)
    
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
    