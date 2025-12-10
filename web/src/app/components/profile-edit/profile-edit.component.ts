import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, User } from '../../services/api.service';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.css']
})
export class ProfileEditComponent implements OnInit {
  userId: string | null = null;
  user: any = {}; 
  isLoading = true;
  isSaving = false;
  
  // Controle de Abas
  activeTab: 'DATA' | 'SCHEDULE' = 'DATA';

  // Estrutura de Horários (Cópia local para edição)
  workDays = [
    { id: 1, name: 'Segunda', active: false, start: '09:00', end: '18:00' },
    { id: 2, name: 'Terça', active: false, start: '09:00', end: '18:00' },
    { id: 3, name: 'Quarta', active: false, start: '09:00', end: '18:00' },
    { id: 4, name: 'Quinta', active: false, start: '09:00', end: '18:00' },
    { id: 5, name: 'Sexta', active: false, start: '09:00', end: '18:00' },
    { id: 6, name: 'Sábado', active: false, start: '09:00', end: '14:00' },
    { id: 0, name: 'Domingo', active: false, start: '00:00', end: '00:00' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router, // Mantém private
    public api: ApiService  // Public
  ) {}

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id');
    this.loadUser();
    
    // Se tiver ID, tenta carregar a agenda específica desse utilizador
    if (this.userId) {
      this.loadSchedule(this.userId);
    }
  }

  loadUser() {
    this.api.getUsers().subscribe({
      next: (users) => {
        const found = users.find(u => u.id === this.userId);
        if (found) {
          this.user = found;
        } else {
          alert('Utilizador não encontrado.');
          this.cancel();
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  // Carrega os horários do banco e preenche a tabela visual
  loadSchedule(id: string) {
    this.api.getSchedule(id).subscribe(data => {
      // 1. Reseta tudo para "fechado" antes de preencher
      this.workDays.forEach(d => d.active = false);

      // 2. Preenche com o que veio do banco
      data.forEach((item: any) => {
        const day = this.workDays.find(d => d.id === item.day_of_week);
        if (day) {
          day.active = true;
          // Corta os segundos do horário (09:00:00 -> 09:00) para o input time aceitar
          day.start = item.start_time ? item.start_time.substring(0, 5) : '09:00';
          day.end = item.end_time ? item.end_time.substring(0, 5) : '18:00';
        }
      });
    });
  }

  // Processar a Imagem (Upload)
  onFileSelected(event: any) {
    const file = event.target.files[0];
    
    if (file) {
      // Limite de 2MB
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem é muito grande! Use uma menor que 2MB.');
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        this.user.avatar_url = e.target.result; // Salva o Base64
      };

      reader.readAsDataURL(file);
    }
  }

  save() {
    this.isSaving = true;

    // 1. Salva Dados Pessoais
    const payloadUser = { 
      name: this.user.name, 
      avatarUrl: this.user.avatar_url, 
      bio: this.user.bio 
    };
    
    this.api.updateUser(this.user.id, payloadUser).subscribe({
      next: () => {
        
        // 2. Salva Horários (Apenas se for barbeiro ou dono)
        if (this.user.role === 'BARBER' || this.user.role === 'OWNER') {
          const scheduleToSend = this.workDays
            .filter(day => day.active)
            .map(day => ({ 
              day: day.id, 
              start: day.start, 
              end: day.end 
            }));
          
          this.api.updateSchedule(this.user.id, scheduleToSend).subscribe(() => {
            alert('Perfil e Horários atualizados com sucesso!');
            this.isSaving = false;
            this.cancel();
          });
        } else {
          alert('Perfil atualizado com sucesso!');
          this.isSaving = false;
          this.cancel();
        }

      },
      error: (err) => { 
        console.error(err);
        alert('Erro ao salvar.'); 
        this.isSaving = false; 
      }
    });
  }

  // Função de Cancelar/Voltar (Resolve o erro de propriedade privada no HTML)
  cancel() {
    if (this.api.isAdmin()) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/']);
    }
  }
}