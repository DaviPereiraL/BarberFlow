import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ApiService } from '../services/api.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const api = inject(ApiService);

  // 1. Pergunta ao serviço: "Estou logado?"
  if (api.isLoggedIn()) {
    return true; // Pode passar!
  } else {
    // 2. Se não, manda pro Login
    alert('Área restrita! Faça login primeiro.');
    router.navigate(['/login']);
    return false;
  }
};