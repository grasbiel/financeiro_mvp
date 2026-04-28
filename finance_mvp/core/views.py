import csv
import datetime
import io
from decimal import Decimal, InvalidOperation

from django.contrib.auth.models import User
from django.db import IntegrityError
from django.db.models import DecimalField, F, Q, Sum
from django.db.models.functions import Coalesce, TruncMonth
from django.utils import timezone

from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Category, Goal, RecurringTransaction, Transaction
from .serializers import (
    CategorySerializer, GoalProgressSerializer, GoalSerializer,
    RecurringTransactionSerializer, TransactionSerializer, UserSerializer,
)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _month_range(year: int, month: int):
    first = datetime.date(year, month, 1)
    if month == 12:
        last = datetime.date(year + 1, 1, 1) - datetime.timedelta(days=1)
    else:
        last = datetime.date(year, month + 1, 1) - datetime.timedelta(days=1)
    return first, last


def _parse_int(request, name, default):
    try:
        return int(request.query_params.get(name, default))
    except (ValueError, TypeError):
        return default


# ─── Usuários ─────────────────────────────────────────────────────────────────

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError:
            return Response(
                {"error": "Este nome de usuário ou e-mail já está em uso."},
                status=status.HTTP_400_BAD_REQUEST,
            )


# ─── Categorias ───────────────────────────────────────────────────────────────

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["patch"], url_path="archive")
    def archive(self, request, pk=None):
        cat = self.get_object()
        cat.archived = not cat.archived
        cat.save(update_fields=["archived"])
        return Response(CategorySerializer(cat).data)

    @action(detail=False, methods=["get"], url_path="suggest")
    def suggest(self, request):
        """
        GET /categories/suggest/?q=texto
        Retorna até 3 categorias ativas do usuário ordenadas por:
          1. frequência de uso em transações com descrição contendo q
          2. frequência geral de uso
        """
        q = request.query_params.get("q", "").strip()
        if len(q) < 2:
            return Response([])

        # Categorias com transações que contêm q na descrição
        from django.db.models import Count
        by_desc = (
            Category.objects.filter(
                user=request.user,
                archived=False,
                transaction__description__icontains=q,
            )
            .annotate(freq=Count("transaction"))
            .order_by("-freq")[:3]
        )

        if by_desc.exists():
            return Response(CategorySerializer(by_desc, many=True).data)

        # Fallback: top 3 categorias por uso geral
        by_use = (
            Category.objects.filter(user=request.user, archived=False)
            .annotate(freq=Count("transaction"))
            .order_by("-freq")[:3]
        )
        return Response(CategorySerializer(by_use, many=True).data)


# ─── Transações ───────────────────────────────────────────────────────────────

class TransactionFilter(filters.FilterSet):
    start = filters.DateFilter(field_name="date", lookup_expr="gte")
    end = filters.DateFilter(field_name="date", lookup_expr="lte")
    category = filters.NumberFilter(field_name="category__id")
    kind = filters.CharFilter(field_name="kind", lookup_expr="iexact")
    emotion = filters.CharFilter(field_name="emotional_trigger", lookup_expr="iexact")

    class Meta:
        model = Transaction
        fields = ["start", "end", "category", "kind", "emotion"]


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = TransactionFilter

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).select_related("category")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["post"], url_path="quick-add")
    def quick_add(self, request):
        kind = request.data.get("kind", "expense")
        value_raw = request.data.get("value")
        category_name = request.data.get("category_name", "").strip()
        date_str = request.data.get("date")
        description = request.data.get("description", "")
        emotional_trigger = request.data.get("emotional_trigger", "Necessidade Básica")

        if kind not in ("income", "expense"):
            return Response({"error": "kind deve ser 'income' ou 'expense'."}, status=400)
        try:
            value = Decimal(str(value_raw))
            if value <= 0:
                raise ValueError
        except (TypeError, ValueError, InvalidOperation):
            return Response({"error": "value deve ser um número positivo."}, status=400)

        category = None
        if category_name:
            category, _ = Category.objects.get_or_create(
                user=request.user, name=category_name, defaults={"archived": False}
            )

        if date_str:
            try:
                date = datetime.date.fromisoformat(date_str)
            except ValueError:
                return Response({"error": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)
        else:
            date = timezone.localdate()

        tx = Transaction.objects.create(
            user=request.user, kind=kind, value=value, date=date,
            description=description, category=category,
            emotional_trigger=emotional_trigger,
        )
        return Response(TransactionSerializer(tx).data, status=201)


# ─── Recorrências ─────────────────────────────────────────────────────────────

class RecurringTransactionViewSet(viewsets.ModelViewSet):
    serializer_class = RecurringTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RecurringTransaction.objects.filter(user=self.request.user).select_related("category")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["post"], url_path="materialize")
    def materialize(self, request):
        """
        Percorre todas as RecurringTransactions ativas do usuário,
        verifica períodos não materializados e cria Transaction para cada um.
        Retorna a contagem de lançamentos criados.
        """
        created_count = _materialize_for_user(request.user)
        return Response({"created": created_count})


def _materialize_for_user(user) -> int:
    """Materializa recorrências para o usuário. Retorna nº de transações criadas."""
    today = datetime.date.today()
    count = 0

    for rec in RecurringTransaction.objects.filter(user=user, active=True).select_related("category"):
        if rec.end_date and rec.end_date < today:
            continue

        from_date = rec.last_materialized_at or (
            rec.start_date - datetime.timedelta(days=1)
        )
        pending_dates = rec.next_dates_after(from_date)

        for d in pending_dates:
            Transaction.objects.get_or_create(
                user=user,
                recurring_transaction=rec,
                date=d,
                defaults={
                    "kind": rec.kind,
                    "value": rec.value,
                    "description": rec.description,
                    "category": rec.category,
                    "emotional_trigger": rec.emotional_trigger,
                },
            )
            count += 1

        if pending_dates:
            rec.last_materialized_at = pending_dates[-1]
            rec.save(update_fields=["last_materialized_at"])

    return count


# ─── Metas ────────────────────────────────────────────────────────────────────

class GoalViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user).select_related("category")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"], url_path="progress")
    def progress(self, request):
        """
        GET /goals/progress/?year=&month=
        Retorna cada meta com o valor consumido no período e o percentual.
        """
        now = timezone.localdate()
        year = _parse_int(request, "year", now.year)
        month = _parse_int(request, "month", now.month)
        first, last = _month_range(year, month)

        goals = Goal.objects.filter(user=request.user, year=year, month=month).select_related("category")
        result = []
        for goal in goals:
            spent = Transaction.objects.filter(
                user=request.user, kind="expense",
                category=goal.category, date__range=[first, last],
            ).aggregate(
                t=Coalesce(Sum("value"), Decimal("0"), output_field=DecimalField())
            )["t"]

            pct = float(spent / goal.amount_limit * 100) if goal.amount_limit else 0.0
            if pct >= 100:
                st = "exceeded"
            elif pct >= 80:
                st = "warning"
            else:
                st = "ok"

            result.append({
                "goal_id": goal.id,
                "category_id": goal.category.id,
                "category_name": goal.category.name,
                "color_slot": goal.category.color_slot,
                "amount_limit": goal.amount_limit,
                "amount_spent": spent,
                "percent": round(pct, 1),
                "status": st,
            })
        return Response(result)


# ─── Dashboard consolidado ────────────────────────────────────────────────────

class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.localdate()
        year = _parse_int(request, "year", now.year)
        month = _parse_int(request, "month", now.month)
        first, last = _month_range(year, month)

        month_qs = Transaction.objects.filter(user=user, date__range=[first, last])

        total_income = month_qs.filter(kind="income").aggregate(
            t=Coalesce(Sum("value"), Decimal("0"), output_field=DecimalField())
        )["t"]
        total_expense = month_qs.filter(kind="expense").aggregate(
            t=Coalesce(Sum("value"), Decimal("0"), output_field=DecimalField())
        )["t"]
        balance = total_income - total_expense

        top_categories = (
            month_qs.filter(kind="expense")
            .values("category__id", "category__name", "category__color_slot")
            .annotate(total=Coalesce(Sum("value"), Decimal("0"), output_field=DecimalField()))
            .order_by("-total")[:5]
        )

        six_months_ago = (datetime.date(year, month, 1) - datetime.timedelta(days=150)).replace(day=1)
        flow_rows = (
            Transaction.objects.filter(user=user, date__range=[six_months_ago, last])
            .annotate(m=TruncMonth("date"))
            .values("m", "kind")
            .annotate(total=Sum("value"))
            .order_by("m")
        )
        flow_map: dict = {}
        for row in flow_rows:
            key = row["m"].strftime("%Y-%m")
            flow_map.setdefault(key, {"month": key, "income": Decimal("0"), "expense": Decimal("0")})
            flow_map[key][row["kind"]] = row["total"]

        recent = Transaction.objects.filter(user=user).select_related("category")[:5]

        # Metas do mês
        goals_data = _goals_progress(user, year, month, first, last)

        return Response({
            "year": year, "month": month,
            "total_income": total_income,
            "total_expense": total_expense,
            "balance": balance,
            "top_categories": [
                {
                    "category_id": r["category__id"],
                    "category_name": r["category__name"] or "Sem Categoria",
                    "color_slot": r["category__color_slot"],
                    "total": r["total"],
                }
                for r in top_categories
            ],
            "monthly_flow": sorted(flow_map.values(), key=lambda x: x["month"]),
            "recent_transactions": TransactionSerializer(recent, many=True).data,
            "goals_progress": goals_data,
        })


def _goals_progress(user, year, month, first, last):
    goals = Goal.objects.filter(user=user, year=year, month=month).select_related("category")
    result = []
    for goal in goals:
        spent = Transaction.objects.filter(
            user=user, kind="expense", category=goal.category, date__range=[first, last],
        ).aggregate(t=Coalesce(Sum("value"), Decimal("0"), output_field=DecimalField()))["t"]
        pct = float(spent / goal.amount_limit * 100) if goal.amount_limit else 0.0
        result.append({
            "goal_id": goal.id, "category_id": goal.category.id,
            "category_name": goal.category.name, "color_slot": goal.category.color_slot,
            "amount_limit": goal.amount_limit, "amount_spent": spent,
            "percent": round(pct, 1),
            "status": "exceeded" if pct >= 100 else "warning" if pct >= 80 else "ok",
        })
    return result


# ─── Importação CSV ───────────────────────────────────────────────────────────

class CSVAnalyzeView(APIView):
    """
    POST /csv-import/analyze/
    Recebe multipart/form-data com campo 'file'.
    Detecta colunas e retorna amostra de 5 linhas.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "Nenhum arquivo enviado."}, status=400)
        if not file.name.endswith(".csv"):
            return Response({"error": "Somente arquivos .csv são aceitos."}, status=400)

        try:
            text = file.read().decode("utf-8-sig")  # remove BOM se houver
        except UnicodeDecodeError:
            try:
                file.seek(0)
                text = file.read().decode("latin-1")
            except Exception:
                return Response({"error": "Não foi possível decodificar o arquivo."}, status=400)

        reader = csv.reader(io.StringIO(text))
        rows = list(reader)
        if not rows:
            return Response({"error": "Arquivo vazio."}, status=400)

        headers = rows[0]
        sample = rows[1:6]  # até 5 linhas de amostra

        return Response({
            "columns": headers,
            "sample": sample,
            "total_rows": len(rows) - 1,
        })


class CSVConfirmView(APIView):
    """
    POST /csv-import/confirm/
    Campos: file (CSV), mapping (JSON):
      { date_col, value_col, description_col?, kind_col?, kind_default }
    Persiste as transações e retorna contagem.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        import json

        file = request.FILES.get("file")
        mapping_raw = request.data.get("mapping")
        if not file or not mapping_raw:
            return Response({"error": "Campos 'file' e 'mapping' são obrigatórios."}, status=400)

        try:
            mapping = json.loads(mapping_raw)
        except (json.JSONDecodeError, TypeError):
            return Response({"error": "mapping deve ser um JSON válido."}, status=400)

        date_col = mapping.get("date_col")
        value_col = mapping.get("value_col")
        description_col = mapping.get("description_col")
        kind_col = mapping.get("kind_col")
        kind_default = mapping.get("kind_default", "expense")
        category_col = mapping.get("category_col")

        if date_col is None or value_col is None:
            return Response({"error": "date_col e value_col são obrigatórios no mapping."}, status=400)

        try:
            text = file.read().decode("utf-8-sig")
        except UnicodeDecodeError:
            file.seek(0)
            text = file.read().decode("latin-1")

        reader = csv.reader(io.StringIO(text))
        rows = list(reader)
        if not rows:
            return Response({"error": "Arquivo vazio."}, status=400)

        headers = rows[0]

        def col_index(col):
            if isinstance(col, int):
                return col
            try:
                return headers.index(col)
            except ValueError:
                return None

        di = col_index(date_col)
        vi = col_index(value_col)
        desi = col_index(description_col) if description_col is not None else None
        ki = col_index(kind_col) if kind_col is not None else None
        cati = col_index(category_col) if category_col is not None else None

        if di is None or vi is None:
            return Response({"error": "Colunas de data ou valor não encontradas."}, status=400)

        created, skipped, errors = 0, 0, []

        for i, row in enumerate(rows[1:], start=2):
            try:
                if len(row) <= max(filter(lambda x: x is not None, [di, vi])):
                    skipped += 1
                    continue

                raw_date = row[di].strip()
                raw_value = row[vi].strip().replace("R$", "").replace(".", "").replace(",", ".").strip()
                if not raw_date or not raw_value:
                    skipped += 1
                    continue

                # Tentar vários formatos de data
                tx_date = None
                for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%m/%d/%Y"):
                    try:
                        tx_date = datetime.datetime.strptime(raw_date, fmt).date()
                        break
                    except ValueError:
                        continue
                if not tx_date:
                    errors.append(f"Linha {i}: data inválida '{raw_date}'")
                    skipped += 1
                    continue

                try:
                    value = Decimal(raw_value)
                except InvalidOperation:
                    errors.append(f"Linha {i}: valor inválido '{row[vi]}'")
                    skipped += 1
                    continue

                # Inferir kind do valor (negativo = expense) ou da coluna
                if ki is not None and ki < len(row):
                    raw_kind = row[ki].strip().lower()
                    kind = "income" if raw_kind in ("entrada", "income", "receita", "credit", "crédito") else "expense"
                elif value < 0:
                    kind = "expense"
                    value = abs(value)
                else:
                    kind = kind_default
                    value = abs(value)

                description = row[desi].strip() if desi is not None and desi < len(row) else ""

                category = None
                if cati is not None and cati < len(row):
                    cat_name = row[cati].strip()
                    if cat_name:
                        category, _ = Category.objects.get_or_create(
                            user=request.user, name=cat_name, defaults={"archived": False}
                        )

                Transaction.objects.create(
                    user=request.user, kind=kind, value=value,
                    date=tx_date, description=description, category=category,
                )
                created += 1

            except Exception as e:
                errors.append(f"Linha {i}: {str(e)}")
                skipped += 1

        return Response({
            "created": created,
            "skipped": skipped,
            "errors": errors[:20],  # limitar lista de erros
        })


# ─── Relatórios (mantidos / corrigidos) ──────────────────────────────────────

class MonthlySummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.localdate()
        year = _parse_int(request, "year", now.year)
        month = _parse_int(request, "month", now.month)
        first, last = _month_range(year, month)
        qs = Transaction.objects.filter(user=request.user, date__range=[first, last])
        income = qs.filter(kind="income").aggregate(
            t=Coalesce(Sum("value"), Decimal("0"), output_field=DecimalField())
        )["t"]
        expense = qs.filter(kind="expense").aggregate(
            t=Coalesce(Sum("value"), Decimal("0"), output_field=DecimalField())
        )["t"]
        return Response({"receitas": income, "despesas": expense, "saldo": income - expense})


class ExpensesByCategoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        start_str = request.query_params.get("start")
        end_str = request.query_params.get("end")
        qs = Transaction.objects.filter(user=request.user, kind="expense")
        if start_str and end_str:
            try:
                qs = qs.filter(date__range=[
                    datetime.date.fromisoformat(start_str),
                    datetime.date.fromisoformat(end_str),
                ])
            except ValueError:
                return Response({"error": "Datas inválidas."}, status=400)
        data = qs.values("category__name").annotate(total=Sum("value")).order_by("-total")
        return Response([
            {"category": r["category__name"] or "Sem Categoria", "total_expenses": r["total"]}
            for r in data
        ])


class IncomesByCategoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        start_str = request.query_params.get("start")
        end_str = request.query_params.get("end")
        qs = Transaction.objects.filter(user=request.user, kind="income")
        if start_str and end_str:
            try:
                qs = qs.filter(date__range=[
                    datetime.date.fromisoformat(start_str),
                    datetime.date.fromisoformat(end_str),
                ])
            except ValueError:
                return Response({"error": "Datas inválidas."}, status=400)
        data = qs.values("category__name").annotate(total=Sum("value")).order_by("-total")
        return Response([
            {"category": r["category__name"] or "Sem Categoria", "total_incomes": float(r["total"])}
            for r in data
        ])


class EmotionalSpendingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.localdate()
        year = _parse_int(request, "year", now.year)
        month = _parse_int(request, "month", now.month)
        first, last = _month_range(year, month)

        def _month_data(y, m):
            f, l = _month_range(y, m)
            rows = (
                Transaction.objects.filter(user=request.user, kind="expense", date__range=[f, l])
                .values("emotional_trigger")
                .annotate(total=Sum("value"))
            )
            return {r["emotional_trigger"]: float(r["total"]) for r in rows}

        current = _month_data(year, month)
        # mês anterior
        if month == 1:
            prev = _month_data(year - 1, 12)
        else:
            prev = _month_data(year, month - 1)

        triggers = sorted(set(list(current.keys()) + list(prev.keys())))
        return Response([
            {
                "emotional_trigger": t,
                "current": current.get(t, 0),
                "previous": prev.get(t, 0),
            }
            for t in triggers
        ])


class MonthlyFlowView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.db.models.functions import TruncDay
        now = timezone.localdate()
        year = _parse_int(request, "year", now.year)
        month = _parse_int(request, "month", now.month)
        first, last = _month_range(year, month)
        qs = Transaction.objects.filter(user=request.user, date__range=[first, last])
        daily = (
            qs.annotate(day_date=TruncDay("date"))
            .values("day_date", "kind")
            .annotate(total=Sum("value"))
            .order_by("day_date")
        )
        day_map: dict = {}
        for row in daily:
            key = row["day_date"].strftime("%d")
            day_map.setdefault(key, {"day": key, "receita": Decimal("0"), "despesa": Decimal("0")})
            day_map[key]["receita" if row["kind"] == "income" else "despesa"] = row["total"]
        return Response(sorted(day_map.values(), key=lambda x: x["day"]))


class NeedsVsWantsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = (
            Transaction.objects.filter(user=request.user, kind="expense")
            .values("emotional_trigger")
            .annotate(total=Sum("value"))
            .order_by("emotional_trigger")
        )
        return Response(data)


class CategoryExpenseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.localdate()
        year = _parse_int(request, "year", now.year)
        month = _parse_int(request, "month", now.month)
        first, last = _month_range(year, month)
        data = (
            Transaction.objects.filter(user=request.user, kind="expense", date__range=[first, last])
            .values("category__name")
            .annotate(total_spent=Sum(F("value")))
            .order_by("-total_spent")[:5]
        )
        return Response([
            {"category_name": r["category__name"] or "Sem Categoria", "total_spent": r["total_spent"]}
            for r in data
        ])


class EmotionalExpenseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.localdate()
        year = _parse_int(request, "year", now.year)
        month = _parse_int(request, "month", now.month)
        first, last = _month_range(year, month)
        data = (
            Transaction.objects.filter(user=request.user, kind="expense", date__range=[first, last])
            .exclude(emotional_trigger__isnull=True).exclude(emotional_trigger="")
            .values("emotional_trigger")
            .annotate(total_spent=Sum(F("value")))
            .order_by("-total_spent")[:5]
        )
        return Response([
            {"emotional_trigger": r["emotional_trigger"], "total_spent": r["total_spent"]}
            for r in data
        ])
