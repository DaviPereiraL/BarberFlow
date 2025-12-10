import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, BarberService, User } from '../../services/api.service';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.css'
})
export class BookingComponent implements OnInit {
  serviceId: string | null = null;
  selectedService: BarberService | null = null;

  barbers: User[] = [];

  step = 1;
  selectedBarberId: string | null = null;
  selectedDate: string = '';
  selectedTime: string = '';
  takenTimes: string[] = [];

  // Dados do Visitante
  guestName = '';
  guestPhone = '';
  guestEmail = '';
  guestCpf = ''; 

  authMode: 'GUEST' | 'LOGIN' = 'GUEST';
  loginEmail = '';
  loginPassword = '';
  loginError = '';

  paymentMethod: 'LOCAL' | 'PIX' = 'LOCAL';

  isLoading = true;
  isSubmitting = false;

  showPixModal = false;
  pixCode = '';
  pixImage = '';

  timeSlots = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'];
  minDate = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public api: ApiService
  ) {}

  ngOnInit() {
    // 1. Pega o ID do Serviço
    this.serviceId = this.route.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('serviceId');
    
    // 2. CORREÇÃO: Pega o ID do Barbeiro se vier na URL (ex: ?barberId=123)
    const preSelectedBarberId = this.route.snapshot.queryParamMap.get('barberId');

    // Define a data mínima como hoje
    this.minDate = new Date().toISOString().split('T')[0];
    this.selectedDate = this.minDate;
    
    if (!this.serviceId) {
      alert('Serviço não identificado. Retornando para a lista.');
      this.router.navigate(['/']);
      return;
    }

    this.loadData();

    // 3. LÓGICA DE PULO DE ETAPA
    // Se o barbeiro já veio escolhido, define ele e pula para o Passo 2
    if (preSelectedBarberId) {
      this.selectedBarberId = preSelectedBarberId;
      this.step = 2; 
      this.checkAvailability(); // Já carrega os horários dele
    }
  }

  loadData() {
    this.api.getServices().subscribe(services => {
      this.selectedService = services.find(s => s.id === this.serviceId) || null;
    });

    this.api.getUsers().subscribe({
      next: (users) => {
        this.barbers = users.filter(u => u.role === 'BARBER' || u.role === 'OWNER');
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  isTimeDisabled(time: string): boolean {
    if (this.takenTimes.includes(time)) {
      return true;
    }
    const now = new Date();
    const selectedDateStr = this.selectedDate;
    const todayStr = now.toISOString().split('T')[0];

    if (selectedDateStr === todayStr) {
      const [slotHour, slotMinute] = time.split(':').map(Number);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      if (slotHour < currentHour) return true;
      if (slotHour === currentHour && slotMinute <= currentMinute) return true;
    }
    return false;
  }

  blockNonNumbers(e: KeyboardEvent) {
    if (['Backspace','Delete','Tab','Enter','ArrowLeft','ArrowRight'].includes(e.key)) return;
    if (!/^[0-9]$/.test(e.key)) e.preventDefault();
  }

  formatPhone(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 10) value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    else if (value.length > 6) value = value.replace(/^(\d{2})(\d{4,5})(\d{0,4}).*/, '($1) $2-$3');
    else if (value.length > 2) value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    else value = value.replace(/^(\d*)/, '($1');
    event.target.value = value;
    this.guestPhone = value;
  }

  formatCpf(event: any) {
    let v = event.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    event.target.value = v;
    this.guestCpf = v;
  }

  selectBarber(barber: any) {
    this.selectedBarberId = barber.id;
    this.step = 2;
    window.scrollTo(0, 0);
    this.checkAvailability();
  }

  onDateChange(e: any) {
    this.selectedDate = e.target.value;
    this.selectedTime = '';
    this.checkAvailability();
  }

  checkAvailability() {
    if (!this.selectedBarberId || !this.selectedDate) return;
    this.api.getBusyTimes(this.selectedBarberId, this.selectedDate).subscribe({
      next: times => this.takenTimes = times,
      error: () => this.takenTimes = []
    });
  }

  selectTime(time: string) {
    if (!this.isTimeDisabled(time)) {
      this.selectedTime = time;
    }
  }

  goToNextStep() {
    if (!this.selectedDate || !this.selectedTime) return;
    if (this.api.isLoggedIn()) {
      const userStr = localStorage.getItem('barber_user');
      const user = userStr ? JSON.parse(userStr) : {};
      this.authMode = 'LOGIN';
      if (confirm(`Confirmar agendamento para ${user.name}?`)) {
        this.confirmBooking(user.id);
      }
      return;
    }
    this.step = 3;
    window.scrollTo(0, 0);
  }

  goBack() {
    // Se a pessoa veio com barbeiro pré-selecionado (pulou o passo 1), 
    // o voltar deve ir para a home, senão volta pro passo 1
    const preSelectedBarberId = this.route.snapshot.queryParamMap.get('barberId');
    
    if (this.step === 2 && preSelectedBarberId) {
      this.router.navigate(['/']); // Volta pra home direto
    } else if (this.step > 1) {
      this.step--;
    } else {
      this.router.navigate(['/']);
    }
  }

  doInlineLogin() {
    this.isSubmitting = true;
    this.loginError = '';
    this.api.login({ email: this.loginEmail, password: this.loginPassword }).subscribe({
      next: (res: any) => {
        localStorage.setItem('barber_token', res.token);
        localStorage.setItem('barber_user', JSON.stringify(res.user));
        this.isSubmitting = false;
        this.confirmBooking(res.user.id);
      },
      error: () => {
        this.isSubmitting = false;
        this.loginError = 'E-mail ou senha incorretos.';
      }
    });
  }

  confirmBooking(loggedUserId: string | null = null) {
    let payerName = this.guestName;
    let payerEmail = this.guestEmail;

    if (this.api.isLoggedIn()) {
      const saved = localStorage.getItem('barber_user');
      if (saved) {
        const user = JSON.parse(saved);
        loggedUserId = user.id;
        payerName = user.name || payerName;
        payerEmail = user.email || payerEmail;
      }
    }

    if (!loggedUserId) {
      if (!this.guestName || !this.guestPhone) {
        alert('Preencha Nome e Telefone');
        return;
      }
      if (this.guestPhone.length < 14) {
        alert('Telefone incompleto');
        return;
      }
    }

    if (this.paymentMethod === 'PIX') {
      const cleanCpf = this.guestCpf.replace(/\D/g, '');
      if (cleanCpf.length !== 11) {
        alert('Por favor, digite um CPF válido para gerar o Pix.');
        return;
      }
    }

    this.isSubmitting = true;
    const fullDate = `${this.selectedDate} ${this.selectedTime}:00`;

    const appointmentPayload = {
      service_id: this.serviceId,
      barber_id: this.selectedBarberId,
      starts_at: fullDate,
      customer_id: loggedUserId,
      guest_name: loggedUserId ? null : this.guestName,
      guest_phone: loggedUserId ? null : this.guestPhone,
      guest_email: payerEmail,
      payment_method: this.paymentMethod,
      guest_cpf: this.guestCpf.replace(/\D/g, '')
    };

    this.api.createAppointment(appointmentPayload).subscribe({
      next: () => {
        if (this.paymentMethod === 'PIX') {
          this.generatePix(payerName, payerEmail, this.guestCpf);
          return;
        }
        alert('✅ Agendamento Confirmado!');
        this.finish();
      },
      error: (err: any) => {
        const msg = err.error?.error || 'Erro desconhecido.';
        alert('❌ Erro: ' + msg);
        this.isSubmitting = false;
        if (msg.includes('indisponível') || msg.includes('ocupado')) {
          this.checkAvailability();
        }
      }
    });
  }

  generatePix(fullName: string, email: string, cpf: string) {
    const names = fullName.trim().split(' ');
    const firstName = names[0];
    const lastName = names.length > 1 ? names.slice(1).join(' ') : 'Cliente';

    const safeEmail = email && email.includes('@') 
      ? email 
      : `${this.guestPhone.replace(/\D/g, '')}@barberflow.com`;

    const pixPayload = {
      transaction_amount: Number(this.selectedService?.price || 0),
      description: `Corte - ${this.selectedService?.name}`,
      payer_email: safeEmail,
      payer_first_name: firstName,
      payer_last_name: lastName,
      payer_cpf: cpf.replace(/\D/g, '')
    };

    this.api.generatePix(pixPayload).subscribe({
      next: pixRes => {
        if (pixRes.qr_code && pixRes.qr_code_base64) {
          this.pixCode = pixRes.qr_code;
          this.pixImage = 'data:image/png;base64,' + pixRes.qr_code_base64;
          this.showPixModal = true;
        } else {
          alert('Erro ao processar resposta do PIX.');
          this.finish();
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        alert('⚠ O agendamento foi salvo, mas houve um erro ao gerar o QR Code Pix.');
        this.finish();
      }
    });
  }

  copyPix() {
    navigator.clipboard.writeText(this.pixCode);
    alert('Código Pix copiado!');
  }

  finish() {
    this.router.navigate(['/']);
  }
}