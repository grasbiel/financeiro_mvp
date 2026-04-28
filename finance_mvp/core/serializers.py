from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Transaction, Category, RecurringTransaction, Goal


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "archived", "color_slot"]
        read_only_fields = ["id"]


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("A senha deve ter pelo menos 8 caracteres.")
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )


class TransactionSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), allow_null=True, required=False
    )
    category_name = serializers.CharField(source="category.name", read_only=True, allow_null=True)

    class Meta:
        model = Transaction
        fields = [
            "id", "kind", "value", "date", "description",
            "category", "category_name", "emotional_trigger",
            "recurring_transaction", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_value(self, value):
        if value <= 0:
            raise serializers.ValidationError("O valor deve ser positivo.")
        return value


class RecurringTransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True, allow_null=True)
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = RecurringTransaction
        fields = [
            "id", "kind", "value", "description", "category", "category_name",
            "emotional_trigger", "frequency", "day_of_month", "day_of_week",
            "start_date", "end_date", "active", "last_materialized_at", "created_at",
        ]
        read_only_fields = ["id", "last_materialized_at", "created_at"]

    def validate_value(self, value):
        if value <= 0:
            raise serializers.ValidationError("O valor deve ser positivo.")
        return value

    def validate(self, data):
        freq = data.get("frequency", getattr(self.instance, "frequency", "monthly"))
        if freq == "monthly" and not data.get("day_of_month") and not (
            self.instance and self.instance.day_of_month
        ):
            start = data.get("start_date", getattr(self.instance, "start_date", None))
            if start:
                data.setdefault("day_of_month", start.day)
        return data


class GoalSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())

    class Meta:
        model = Goal
        fields = ["id", "category", "category_name", "month", "year", "amount_limit", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_amount_limit(self, value):
        if value <= 0:
            raise serializers.ValidationError("O limite deve ser positivo.")
        return value


class GoalProgressSerializer(serializers.Serializer):
    """Serializer de leitura para progresso de metas."""
    goal_id = serializers.IntegerField()
    category_id = serializers.IntegerField()
    category_name = serializers.CharField()
    color_slot = serializers.IntegerField()
    amount_limit = serializers.DecimalField(max_digits=10, decimal_places=2)
    amount_spent = serializers.DecimalField(max_digits=10, decimal_places=2)
    percent = serializers.FloatField()
    status = serializers.CharField()  # "ok" | "warning" | "exceeded"
