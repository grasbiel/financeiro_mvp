from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Transaction, Category, Budget

class BudgetSerializer (serializers.ModelSerializer):
    month = serializers.IntegerField(required=True)
    year = serializers.IntegerField(required=True)
    amount_limit = serializers.DecimalField(required=True, max_digits=10, decimal_places=2)

    class Meta:
        model = Budget
        fields = ['id', 'category', 'amount_limit','month', 'year']

    def validate(self, data):
        month = data['month']
        year = data['year']

        #Validação simples de mês/ano
        if month < 1 or month > 12:
            raise serializers.ValidationError("Mês inválido. Use valores entre 1 e 12.")
        
        if year < 2000 or year > 2100:
            raise serializers.ValidationError("Ano inválido ou fora do intervalo permitido.")

        return data
        

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category 
        fields = ['id', 'name'] # user não será exposto diretamente

    def create (self, validated_data):
        # Na view, definiremos o user
        return super().create(validated_data)

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only= True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs= {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        # sobrescreve para criar usuário com senha criptografada
        password = validated_data.pop('password', None)
        user = User(**validated_data)

        if password:
            user.set_password(password)

        user.save()

        return user
    

class TransactionSerializer (serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(
        queryset = Category.objects.all(),
        allow_null= True,
        required = False
    )
    
    class Meta:
        model = Transaction
        fields = ['id', 'value', 'date', 'description', 'category', 'emotional_trigger']
        read_only_fields= ['id']

        
