import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BarberService { id: string; name: string; description: string; price: string; duration_minutes: number; }
export interface User { id: string; name: string; email: string; role: 'OWNER' | 'BARBER' | 'CLIENT'; avatar_url?: string; bio?: string; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = 'http://localhost:3333';

  constructor(public http: HttpClient) { } 

  // --- SERVIÇOS ---
  getServices(): Observable<BarberService[]> { return this.http.get<BarberService[]>(`${this.apiUrl}/services`); }
  createService(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/services`, data); }
  updateService(id: string, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/services/${id}`, data); }
  deleteService(id: string): Observable<any> { return this.http.delete(`${this.apiUrl}/services/${id}`); }
  
  // --- USUÁRIOS ---
  getUsers(): Observable<User[]> { return this.http.get<User[]>(`${this.apiUrl}/users`); }
  register(user: any): Observable<any> { return this.http.post(`${this.apiUrl}/users`, user); }
  login(credentials: any): Observable<any> { return this.http.post(`${this.apiUrl}/login`, credentials); }
  updateUser(id: string, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/users/${id}`, data); }

  // --- HORÁRIOS ---
  getSchedule(userId: string): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/users/${userId}/availability`); }
  updateSchedule(userId: string, schedule: any[]): Observable<any> { return this.http.put(`${this.apiUrl}/users/${userId}/availability`, { schedule }); }
  getAvailabilityOverrides(userId: string): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/users/${userId}/availability/overrides`); }
  createAvailabilityOverride(userId: string, data: any): Observable<any> { return this.http.post(`${this.apiUrl}/users/${userId}/availability/overrides`, data); }
  deleteAvailabilityOverride(userId: string, overrideId: string): Observable<any> { return this.http.delete(`${this.apiUrl}/users/${userId}/availability/overrides/${overrideId}`); }

  // --- AGENDAMENTOS ---
  getBusyTimes(barberId: string, date: string): Observable<string[]> { return this.http.get<string[]>(`${this.apiUrl}/availability?barberId=${barberId}&date=${date}`); }
  createAppointment(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/appointments`, data); }
  
  getAppointments(filters: any = {}): Observable<any[]> { 
    const queryString = new URLSearchParams(filters).toString();
    return this.http.get<any[]>(`${this.apiUrl}/appointments?${queryString}`); 
  }
  
  updateAppointmentStatus(id: string, status: string): Observable<any> { return this.http.patch(`${this.apiUrl}/appointments/${id}`, { status }); }

  // --- NOTIFICAÇÕES ---
  getNotifications(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/notifications`); }
  markNotificationSeen(id: string): Observable<any> { return this.http.patch(`${this.apiUrl}/notifications/${id}/seen`, {}); }

  // --- PAGAMENTOS (A CORREÇÃO) ---
  generatePix(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/pix`, data);
  }

  // --- HELPERS ---
  isLoggedIn(): boolean { return !!localStorage.getItem('barber_token'); }
  
  isAdmin(): boolean {
    const userStr = localStorage.getItem('barber_user');
    if (!userStr) return false;
    const user = JSON.parse(userStr);
    return user.role === 'BARBER' || user.role === 'OWNER';
  }
  
  logout() {
    localStorage.removeItem('barber_token');
    localStorage.removeItem('barber_user');
    window.location.href = '/login';
  }
}