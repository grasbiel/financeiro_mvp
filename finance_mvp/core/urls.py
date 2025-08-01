from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenBlacklistView
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet,
    MonthlySummaryView,    
    ExpensesByCategoryView,
    EmotionalSpendingView,
    IncomesByCategoryView,
    MonthlySummaryView,
    TransactionViewSet,
    UserViewSet,
    MonthlyFlowView,
    NeedsVsWantsView,
   
)
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    
    # Rotas de autenticação
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/blacklist/', TokenBlacklistView.as_view(),name='token_blacklist'),


    path('monthly-summary/', MonthlySummaryView.as_view(), name='monthly-summary'),
    path('reports/expenses-by-category/', ExpensesByCategoryView.as_view(), name="expenses-by-category"),
    path('reports/incomes-by-category/', IncomesByCategoryView.as_view(), name='incomes-by-category'),
    path('reports/expenses-by-emotion/', EmotionalSpendingView.as_view(), name='emotional-spending'),
    path('reports/needs-vs-wants/', NeedsVsWantsView.as_view(), name='needs-vs-wants'),
    path('reports/monthly-flow/', MonthlyFlowView.as_view(), name='monthly-flow'),
]   