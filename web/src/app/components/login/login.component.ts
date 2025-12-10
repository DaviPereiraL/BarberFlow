import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(private api: ApiService, private router: Router) {}

  // Validação de Email
  isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  onLogin() {
    this.isLoading = true;
    this.errorMessage = '';

    // 1. Validações Locais
    if (!this.email || !this.password) {
      this.errorMessage = 'Preencha e-mail e senha.';
      this.isLoading = false;
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'O e-mail digitado é inválido.';
      this.isLoading = false;
      return;
    }

    // 2. Chamada API
    this.api.login({ email: this.email, password: this.password }).subscribe({
      next: (res: any) => {
        localStorage.setItem('barber_token', res.token);
        localStorage.setItem('barber_user', JSON.stringify(res.user));
        
        const role = res.user.role ? res.user.role.toUpperCase() : '';

        if (role === 'OWNER' || role === 'BARBER' || role === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        if (err.status === 401) {
          this.errorMessage = 'E-mail ou senha incorretos.';
        } else {
          this.errorMessage = 'Erro de conexão. O servidor está rodando?';
        }
        this.isLoading = false;
      }
    });
  }
}