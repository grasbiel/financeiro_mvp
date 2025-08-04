from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Transaction, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category 
        fields = ['id', 'name'] # user não será exposto diretamente

    def create (self, validated_data):
        # Na view, definiremos o user
        return super().create(validated_data)

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("A senha deve ter pelo menos 8 caracteres.")
        # Adicione outras validações aqui (ex: caracteres especiais, números, etc.)
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class TransactionSerializer (serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(
        queryset = Category.objects.all(),
        allow_null= True,
        required = False
    )
    category_name= serializers.CharField(source="category.name", read_only=True, allow_null=True)
    class Meta:
        model = Transaction
        fields = ['id', 'value', 'date', 'description', 'category', 'category_name', 'emotional_trigger']
        read_only_fields= ['id']

        
