import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-barber-schedule',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './barber-schedule.component.html',
  styleUrls: ['./barber-schedule.component.css']
})
export class BarberScheduleComponent implements OnInit {
  appointments: any[] = [];
  currentUser: any = {};
  isLoading = false;
  filterMode: 'HOJE' | 'PROXIMOS' = 'HOJE';

  constructor(private api: ApiService) {}

  ngOnInit() {
    const u = localStorage.getItem('barber_user'); if (u) this.currentUser = JSON.parse(u);
    this.loadAppointments();
  }

  loadAppointments() {
    if (!this.currentUser || !this.currentUser.id) return;
    this.isLoading = true;
    const today = new Date().toISOString().split('T')[0];
    let startDate = today;
    if (this.filterMode === 'PROXIMOS') {
      startDate = today; // keep startDate but we will not pass endDate - we let server return future
    }
    this.api.getAppointments({ barberId: this.currentUser.id, startDate }).subscribe({ next: (list:any[]) => { this.appointments = list; this.isLoading = false; }, error: (e) => { console.error(e); this.isLoading = false; } });
  }
}
