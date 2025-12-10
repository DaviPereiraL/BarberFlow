import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  user = { name: '', email: '', phone: '', password: '' };
  confirmPassword = ''; // Campo novo
  
  isLoading = false;
  errorMessage = '';

  constructor(private api: ApiService, private router: Router) {}

  formatPhone(event: any) {
    let input = event.target;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 10) value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    else if (value.length > 6) value = value.replace(/^(\d{2})(\d{4,5})(\d{0,4}).*/, '($1) $2-$3');
    else if (value.length > 2) value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    else value = value.replace(/^(\d*)/, '($1');
    input.value = value;
    this.user.phone = value;
  }

  blockNonNumbers(event: KeyboardEvent) {
    if (['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    if (!/^[0-9]$/.test(event.key)) event.preventDefault();
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  onRegister() {
    this.errorMessage = '';

    if (!this.user.name || !this.user.email || !this.user.phone || !this.user.password) {
      this.errorMessage = 'Todos os campos são obrigatórios.';
      return;
    }

    if (!this.isValidEmail(this.user.email)) {
      this.errorMessage = 'Digite um e-mail válido.';
      return;
    }

    if (this.user.phone.length < 14) {
      this.errorMessage = 'Digite um telefone válido com DDD.';
      return;
    }

    if (this.user.password.length < 6) {
      this.errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
      return;
    }

    // --- VALIDAÇÃO DE SENHA DUPLA ---
    if (this.user.password !== this.confirmPassword) {
      this.errorMessage = 'As senhas não coincidem!';
      return;
    }

    this.isLoading = true;

    this.api.register(this.user).subscribe({
      next: (res: any) => {
        if (res.token) {
            localStorage.setItem('barber_token', res.token);
            localStorage.setItem('barber_user', JSON.stringify(res.user));
            alert('Conta criada! Você já está logado.');
            this.router.navigate(['/']); 
        } else {
            alert('Conta criada! Faça login.');
            this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        this.errorMessage = err.error.error || 'Erro ao criar conta.';
        this.isLoading = false;
      }
    });
  }
}