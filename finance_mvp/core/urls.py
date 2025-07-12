from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenBlacklistView
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet,
    SignupView,
    TransactionListCreateView,
    TransactionRetrieveUpdateDestroyView,
    MonthlySummaryView,    
    CategoryListCreateView,
    CategoryRetrieveUpdateDestroyView,
    BudgetRetrieveUpdateDestroyView,
    BudgetListCreateView,
    ExpensesByCategoryView,
    IncomesByCategoryView,
    ExpensesByEmotionalTriggerView,
    MonthlySummaryView,
    TransactionViewSet,
    BudgetViewSet,
    CreateUserView,
)
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'budgets', BudgetViewSet, basename='budget')

urlpatterns = [
    path('', include(router.urls)),
    # Cadastro de Usuário
    path('signup/', SignupView.as_view(), name='signup'),

    # Login via JWT
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),

    # Refresh do token
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Transações
    path('transactions/', TransactionListCreateView.as_view(), name= 'transactions-list'),
    path('transactions/<int:pk>/', TransactionRetrieveUpdateDestroyView.as_view(), name='transactions-detail'),

    # Resumo
    path('transactions/summary', MonthlySummaryView.as_view(), name='transactions-summary'),

    # Categories
    path('categories/', CategoryListCreateView.as_view(), name= 'categories-list-create'),
    path('categories/<int:pk>/', CategoryRetrieveUpdateDestroyView.as_view(), name='categories-detail'),

    path('budgets/', BudgetListCreateView.as_view(), name= 'budget-list-create'),
    path('budgets/<int:pk>/', BudgetRetrieveUpdateDestroyView.as_view(), name= 'budget-detail'),

    # Expenses and Incomes ByCategory
    path('reports/expenses_by_category/', ExpensesByCategoryView.as_view(), name= "expenses-by-category"),
    path('reports/incomes_by_category/', IncomesByCategoryView.as_view(), name='incomes-by-category'),

    path('reports/expenses_by_emotion/', ExpensesByEmotionalTriggerView.as_view(), name="expenses-by-emotion"),

    path('token/blacklist/', TokenBlacklistView.as_view(), name='token_blacklist'),

    path('register/', CreateUserView.as_view(), name='register'),
    path('monthly-summary/', MonthlySummaryView.as_view(), name='monthly-summary')
]   