# Importação de libs e bibliotecas
from django.test import TestCase
from core.models import Transaction, Budget, Category
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from datetime import date
from rest_framework import status

# Create your tests here.

class BudgetModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('teste', password='123456')

    def test_budget_str(self):
        budget = Budget.objects.create(
            user = self.user,
            amount_limit = 1000,
            month = 3,
            year = 2025
        )

        self.assertIn('2025', str(budget))


class TransactionAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user('teste', password='123456')

        # pegar token
        resp = self.client.post('/api/login/', {
            'username': 'teste',
            'password': '123456'
        }, format= 'json')

        self.token= resp.data['access']

    def test_create_transaction(self):
        self.client.credentials(HTTP_AUTHORIZATION = 'Bearer ' + self.token)
        response = self.client.post('/api/transactions/', {
            'value': -100,
            'date': '2025-03-15'
        }, format= 'json')
        self.assertEqual(response.status_code, 201)

class ModelTestCase(TestCase):
    
    def setUp(self):
        self.user = User.objects.create_user(username='teste', password='123456')
        self.category = Category.objects.create(user= self.user, name= 'Alimentação')

    def test_budget_str(self):
        budget = Budget.objects.create(
            user = self.user,
            amount_limit = 1000,
            month = 3,
            year = 2025,
            category = self.category
        )
        # Checamos se a string de Budget contém algo esperado
        self.assertIn('2025', str(budget))
        self.assertIn('Alimentação', str(budget))


    def test_transaction_str(self):
        trans = Transaction.objects.create(
            user = self.user,
            value = -150,
            date = date(2025,3,15),
            category = self.category
        )
        self.assertIn(self.user.username, str(trans))
        self.assertIn('2025-03-15', str(trans))

class APITestCase(TestCase):
    def setUp(self):
        self.client= APIClient()
        self.user = User.objects.create_user(username='teste', password='123456')

        # Fazer login e pegar token
        resp = self.client.post(
            '/api/login',
            {'username': 'teste', 'password': '123456'},
            format='json'
        )
        self.assertEqual(resp.status_code,200)
        self.token = resp.data['access']

    def test_create_transaction(self):
        # Autenticar
        self.client.credentials(HTTP_AUTHORIZATION='Bearer' + self.token)

        data = {
            'value': -150.0,
            'date': '2025-03-15',
            'description': 'Supermercado',
        }

        response = self.client.post('/api/transactions/', data, format= 'json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)

        # Verifica se o valor criado é -150.0
        self.assertEqual(float(response.data['value']), -150.0)

    def test_get_transactions(self):
        # Autenticar
        self.client.credentials(HTTP_AUTHORIZATION = 'Bearer ' + self.token)

        # Criar uma transação primeiro
        self.client.post('/api/transactions/',{
            'value': -100,
            'date': '2025-03-10'
        }, format= 'json')

        # Agora listar
        resp = self.client.get('/api/transactions/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(float(resp.data[0]['value']), -100.0)

    def test_exceed_budget(self):
        """"
        Deve bloquear despesa que ultrapassa o limite
        """

        # cria o budget
        self.client.post('/api/budgets/', {
            'amount_limit': 200,
            'month': 3,
            'year': 2025
        }, format= 'json')

        # tenta despesa que estoura o limite
        resp = self.client.post('/api/transactions/', {
            'value': -300,
            'date': '2025-03-20'
        }, format= 'json')

        self.assertEqual(resp.status_code, 400)
        self.assertIn('Limite do orçamento excedido', str(resp.data))

class ReportsAPITestCase (TestCase):
    """
    Testes para os relatórios (ex: despesas por categoria)
    """

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username = 'teste', password= '123456'
        )

        resp = self.client.post(
            '/api/login/',
            {'username': 'teste', 'password': '123456'},
            format='json'
        )

        self.token = resp.data['access']
        self.client.credentials(HTTP_AUTHORIZATION = 'Bearer ' + self.token)

        # cria categoria
        cat = self.client.post('/api/categories/', {'name': 'Alimentação'}, format= 'json').data
        self.category_id = cat['id']
        
        # cria 2 despesas na mesma categoria
        self.client.post('/api/transactions/', {
            'value': -100, 'date': '2025-03-05', 'category': self.category_id
        }, format= 'json')

        self.client.post('/api/transactions/', {
            'value': -200, 'date': '2025-03-10', 'category': self.category_id
        }, format='json')


    def test_report_expenses_by_category(self):
        """
        Deve retornar a soma correta de despesas por categoria no período 
        """

        resp = self.client.get(
            '/api/reports/expenses_by_category/?start=2025-03-01&end=2025-03-31'
        )

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['category'], 'Alimentação')
        self.assertEqual(float(resp.data[0]['total_expenses']), 300.00)