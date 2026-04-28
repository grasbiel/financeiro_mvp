from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenBlacklistView, TokenObtainPairView, TokenRefreshView

from .views import (
    CategoryExpenseView,
    CategoryViewSet,
    DashboardView,
    EmotionalExpenseView,
    EmotionalSpendingView,
    ExpensesByCategoryView,
    IncomesByCategoryView,
    MonthlySummaryView,
    MonthlyFlowView,
    NeedsVsWantsView,
    TransactionViewSet,
    UserViewSet,
)

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"transactions", TransactionViewSet, basename="transaction")
router.register(r"users", UserViewSet, basename="user")

urlpatterns = [
    path("", include(router.urls)),
    # Auth
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/blacklist/", TokenBlacklistView.as_view(), name="token_blacklist"),
    # Dashboard consolidado
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    # Relatórios
    path("monthly-summary/", MonthlySummaryView.as_view(), name="monthly-summary"),
    path("reports/expenses-by-category/", ExpensesByCategoryView.as_view(), name="expenses-by-category"),
    path("reports/incomes-by-category/", IncomesByCategoryView.as_view(), name="incomes-by-category"),
    path("reports/expenses-by-emotion/", EmotionalSpendingView.as_view(), name="emotional-spending"),
    path("reports/needs-vs-wants/", NeedsVsWantsView.as_view(), name="needs-vs-wants"),
    path("reports/monthly-flow/", MonthlyFlowView.as_view(), name="monthly-flow"),
    path("reports/category-expenses/", CategoryExpenseView.as_view(), name="category-expenses"),
    path("reports/emotional-expenses/", EmotionalExpenseView.as_view(), name="emotional-expenses"),
]
