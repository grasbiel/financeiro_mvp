import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command (BaseCommand):
    help = 'Creates an admin user non-interactively from environment variables'

    def handle(self, *args, **options):
        username= os.environ.get('ADMIN_USER')
        email = os.environ.get('ADMIN_EMAIL')
        password = os.environ.get('ADMIN_PASS')

        if not all([username, email, password]):
            self.stdout.write(self.style.ERROR('As variáveis de ambiente ADMIN_USER, ADMIN_EMAIL e ADMIN_PASS devem ser definidas'))
            return
        
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f'Usuário "{username}" já existe'))
        
        else:
            User.objects.create_superuser(username=username, email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f'Usuário administrador "{username}" criado com sucesso'))