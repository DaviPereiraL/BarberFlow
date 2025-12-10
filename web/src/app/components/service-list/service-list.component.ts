import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService, BarberService, User } from '../../services/api.service';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './service-list.component.html',
  styleUrl: './service-list.component.css'
})
export class ServiceListComponent implements OnInit {
  services: BarberService[] = [];
  barbers: User[] = []; // <--- A VARIÁVEL QUE FALTAVA
  isLoading = true;
  errorMessage = '';

  constructor(public api: ApiService) {}

  ngOnInit() {
    // 1. Buscar Serviços
    this.api.getServices().subscribe({
      next: (data: BarberService[]) => {
        this.services = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erro na API:', err);
        this.errorMessage = 'Não foi possível carregar os serviços.';
        this.isLoading = false;
      }
    });

    // 2. Buscar Barbeiros (Para a secção da Equipa)
    this.api.getUsers().subscribe({
      next: (users: User[]) => {
        // Filtra apenas quem é Barbeiro ou Dono
        this.barbers = users.filter(u => u.role === 'BARBER' || u.role === 'OWNER');
      },
      error: (err: any) => {
        console.error('Erro ao carregar equipa:', err);
      }
    });
  }

  // Função para rolar suavemente até a lista
  scrollToServices() {
    document.getElementById('servicos')?.scrollIntoView({ behavior: 'smooth' });
  }
}