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
    category_name= serializers.CharField(source="category.name", read_only=True, allow_null=True)
    class Meta:
        model = Transaction
        fields = ['id', 'value', 'date', 'description', 'category', 'category_name', 'emotional_trigger']
        read_only_fields= ['id']

        
