import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-quick-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quick-register.component.html',
  styleUrls: ['./quick-register.component.css']
})
export class QuickRegisterComponent implements OnInit {
  quickData: any = { customer_name: '', customer_phone: '', service_id: '', barber_id: '', payment_method: 'LOCAL' };
  services: any[] = [];
  staff: any[] = [];
  isRegistering = false;
  currentUser: any = {};

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    const userStr = localStorage.getItem('barber_user');
    if (userStr) this.currentUser = JSON.parse(userStr);
    this.api.getServices().subscribe(s => { this.services = s; this.quickData.service_id = s[0]?.id; });
    this.api.getUsers().subscribe(u => { this.staff = u.filter((x:any)=> x.role === 'BARBER' || x.role === 'OWNER'); this.quickData.barber_id = this.currentUser.role === 'BARBER' ? this.currentUser.id : this.staff[0]?.id; });
  }

  formatPhone(v: string | null | undefined) {
    if (!v) return '';
    const nums = v.replace(/\D/g, '');
    if (nums.length <= 2) return '(' + nums;
    if (nums.length <= 7) return '(' + nums.slice(0,2) + ') ' + nums.slice(2);
    if (nums.length <= 11) return '(' + nums.slice(0,2) + ') ' + nums.slice(2, 7) + '-' + nums.slice(7);
    return '(' + nums.slice(0,2) + ') ' + nums.slice(2, 7) + '-' + nums.slice(7, 11);
  }

  saveQuickRegister(){
    if (!this.quickData.customer_name || !this.quickData.service_id || !this.quickData.barber_id) return alert('Preencha todos os campos!');
    const now = new Date();
    const nowStr = now.toISOString().replace('T', ' ').substring(0, 19);
    const dateOnly = nowStr.split(' ')[0];
    const timeOnly = nowStr.split(' ')[1].substring(0,5);

    const payload:any = {
      service_id: this.quickData.service_id,
      barber_id: this.quickData.barber_id,
      starts_at: nowStr,
      guest_name: this.quickData.customer_name,
      guest_phone: this.quickData.customer_phone || null,
      payment_method: this.quickData.payment_method,
      payment_status: 'PAID'
    };

    this.api.getBusyTimes(payload.barber_id, dateOnly).subscribe({ next: (busyTimes:string[]) => {
      const conflict = busyTimes.includes(timeOnly);
      if (conflict && this.currentUser.role !== 'OWNER') return alert('Horário já ocupado.');
      if (conflict && this.currentUser.role === 'OWNER' && !confirm('Já existe um agendamento neste horário. Deseja forçar?')) return;
      if (conflict && this.currentUser.role === 'OWNER') { payload.force_create = true; payload.admin_id = this.currentUser.id; payload.override_reason = 'Quick Register (owner)'; }
      this.isRegistering = true;
      this.api.createAppointment(payload).subscribe({ next: (res:any) => {
        // finalizar
        this.api.updateAppointmentStatus(res.data.id, 'COMPLETED').subscribe(() => {
          this.isRegistering = false; alert('Corte registrado com sucesso!'); this.router.navigateByUrl('/admin');
        });
      }, error: (e) => { console.error(e); alert('Erro ao registrar'); this.isRegistering = false; } });
    }, error: (e) => { console.error('Erro ao verificar horários', e); alert('Erro ao verificar horários'); } });
  }
}
