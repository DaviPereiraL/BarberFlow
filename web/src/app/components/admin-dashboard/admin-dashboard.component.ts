import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import * as XLSX from 'xlsx'; // Certifique-se de ter rodado: npm install xlsx

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  
  // Controle de Abas
  activeTab: string = 'AGENDA';
  isLoading: boolean = false;

  // Notificações
  showNotifications: boolean = false;
  unreadNotificationsCount: number = 0;
  notifications: any[] = [];

  // Agenda
  groupedAgenda: any[] = [];
  barberStats: any[] = [];

  // Serviços
  services: any[] = [];
  newService: any = { name: '', price: null };

  // Equipe
  staff: any[] = [];

  // Horários
  workDays: any[] = [
    { name: 'Segunda', active: true, start: '09:00', end: '18:00' },
    { name: 'Terça', active: true, start: '09:00', end: '18:00' },
    { name: 'Quarta', active: true, start: '09:00', end: '18:00' },
    { name: 'Quinta', active: true, start: '09:00', end: '18:00' },
    { name: 'Sexta', active: true, start: '09:00', end: '18:00' },
    { name: 'Sábado', active: true, start: '09:00', end: '14:00' },
    { name: 'Domingo', active: false, start: '09:00', end: '14:00' }
  ];

  // --- RELATÓRIOS ---
  reportStart: string = '';
  reportEnd: string = '';
  reportStats = {
    totalRevenue: 0,
    totalAppointments: 0,
    averageTicket: 0,
    topService: '-',
    barberRanking: [] as any[],
    history: [] as any[]
  };

  constructor(public api: ApiService, private router: Router) {}

  ngOnInit() {
    this.loadInitialData();

    // Inicializa datas do relatório
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.reportStart = firstDay.toISOString().split('T')[0];
    this.reportEnd = today.toISOString().split('T')[0];
  }

  loadInitialData() {
    this.loadAgenda();
    this.loadServices();
    this.loadStaff();
    this.loadNotifications();
  }

  // --- 1. ABA AGENDA ---
  loadAgenda() {
    this.isLoading = true;
    this.api.getAppointments().subscribe({
      next: (appointments) => {
        this.processAgenda(appointments);
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  processAgenda(appointments: any[]) {
    const groups: any = {};
    const stats: any = {};

    appointments.forEach(appt => {
      const dateKey = String(appt.starts_at).substring(0, 10);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(appt);

      if (appt.status !== 'CANCELED') {
        const bName = appt.nome_barbeiro || 'Geral';
        if (!stats[bName]) stats[bName] = { nome: bName, cortes: 0, faturamento: 0 };
        stats[bName].cortes++;
        stats[bName].faturamento += Number(appt.price_snapshot || appt.price || 0);
      }
    });

    this.groupedAgenda = Object.keys(groups).sort().map(date => {
        const parts = date.split('-');
        const localDate = new Date(+parts[0], +parts[1] - 1, +parts[2]);
        return {
            displayDate: localDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }),
            appointments: groups[date].sort((a: any, b: any) => String(a.starts_at).localeCompare(String(b.starts_at)))
        };
    });

    this.barberStats = Object.values(stats);
  }

  changeStatus(id: string, status: string) {
    if (confirm('Deseja alterar o status para ' + status + '?')) {
      this.api.updateAppointmentStatus(id, status).subscribe(() => this.loadAgenda());
    }
  }

  // --- 2. ABA RELATÓRIOS ---
  generateReport() {
    if (!this.reportStart || !this.reportEnd) {
      alert('Selecione as datas de início e fim.');
      return;
    }

    this.isLoading = true;
    this.api.getAppointments().subscribe({
      next: (allAppointments: any[]) => {
        const filtered = allAppointments.filter(app => {
          const appDateStr = String(app.starts_at).substring(0, 10);
          const isDateValid = appDateStr >= this.reportStart && appDateStr <= this.reportEnd;
          const isNotCanceled = app.status !== 'CANCELED';
          return isDateValid && isNotCanceled;
        });

        // Cálculos
        let totalRev = 0;
        let serviceCounts: any = {};
        let barberStats: any = {};

        filtered.forEach(app => {
          const price = Number(app.price_snapshot || app.price || 0);
          totalRev += price;
          const sName = app.servico || 'Outros';
          serviceCounts[sName] = (serviceCounts[sName] || 0) + 1;
          const bName = app.nome_barbeiro || 'Desconhecido';
          if (!barberStats[bName]) barberStats[bName] = { name: bName, revenue: 0, count: 0 };
          barberStats[bName].revenue += price;
          barberStats[bName].count += 1;
        });

        let topSvc = '-';
        let maxCount = 0;
        for (const [key, value] of Object.entries(serviceCounts)) {
          if ((value as number) > maxCount) {
            maxCount = (value as number);
            topSvc = key;
          }
        }

        const ranking = Object.values(barberStats).sort((a: any, b: any) => b.revenue - a.revenue);
        ranking.forEach((b: any) => {
          b.percent = totalRev > 0 ? (b.revenue / totalRev) * 100 : 0;
        });

        this.reportStats = {
          totalRevenue: totalRev,
          totalAppointments: filtered.length,
          averageTicket: filtered.length > 0 ? totalRev / filtered.length : 0,
          topService: topSvc,
          barberRanking: ranking,
          history: filtered.sort((a,b) => String(b.starts_at).localeCompare(String(a.starts_at)))
        };

        this.isLoading = false;
      },
      error: () => {
        alert('Erro ao buscar dados do relatório.');
        this.isLoading = false;
      }
    });
  }

  // --- EXPORTAR PARA EXCEL (PROFISSIONAL) ---
  exportToExcel() {
    if (this.reportStats.totalAppointments === 0) {
      alert('Gere o relatório primeiro para ter dados para exportar.');
      return;
    }

    const wb = XLSX.utils.book_new();

    // Helper para formatar moeda
    const fmtBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // 1. ABA RESUMO
    const resumoData = [
      ['RELATÓRIO DE DESEMPENHO - BARBERFLOW'],
      ['Gerado em:', new Date().toLocaleString()],
      ['Período:', `${this.reportStart} até ${this.reportEnd}`],
      [],
      ['KPI', 'VALOR'],
      ['Faturamento Total', fmtBRL(this.reportStats.totalRevenue)],
      ['Total de Cortes', this.reportStats.totalAppointments],
      ['Ticket Médio', fmtBRL(this.reportStats.averageTicket)],
      ['Serviço Mais Vendido', this.reportStats.topService]
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    this.adjustColumnWidths(resumoData, wsResumo); // Ajusta largura
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Visão Geral');

    // 2. ABA RANKING
    const rankingHeader = ['Barbeiro', 'Faturamento', 'Cortes', 'Participação'];
    const rankingRows = this.reportStats.barberRanking.map((b: any) => [
      b.name,
      fmtBRL(b.revenue),
      b.count,
      (b.percent / 100).toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: 1 })
    ]);
    const rankingData = [rankingHeader, ...rankingRows];
    const wsRanking = XLSX.utils.aoa_to_sheet(rankingData);
    this.adjustColumnWidths(rankingData, wsRanking);
    XLSX.utils.book_append_sheet(wb, wsRanking, 'Ranking Equipe');

    // 3. ABA EXTRATO
    const extratoHeader = ['Data', 'Hora', 'Profissional', 'Cliente', 'Serviço', 'Valor', 'Status', 'Pagamento'];
    const extratoRows = this.reportStats.history.map((app: any) => {
      const dataClean = app.starts_at.replace(' ', 'T');
      const dataObj = new Date(dataClean);
      const dataStr = isNaN(dataObj.getTime()) ? app.starts_at : dataObj.toLocaleDateString('pt-BR');
      const horaStr = isNaN(dataObj.getTime()) ? '-' : dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      return [
        dataStr,
        horaStr,
        app.nome_barbeiro,
        app.guest_name || app.cliente_logado || 'Anônimo',
        app.servico,
        fmtBRL(Number(app.price_snapshot || app.price)),
        app.status,
        app.payment_method
      ];
    });
    const extratoData = [extratoHeader, ...extratoRows];
    const wsExtrato = XLSX.utils.aoa_to_sheet(extratoData);
    this.adjustColumnWidths(extratoData, wsExtrato);
    XLSX.utils.book_append_sheet(wb, wsExtrato, 'Extrato Detalhado');

    // Salva
    XLSX.writeFile(wb, `Relatorio_BarberFlow_${this.reportStart}.xlsx`);
  }

  // --- FUNÇÃO AUXILIAR: Ajusta largura das colunas ---
  private adjustColumnWidths(data: any[], worksheet: XLSX.WorkSheet) {
    if (!data || data.length === 0) return;
    
    // Calcula o tamanho máximo de texto em cada coluna
    const colWidths = data[0].map((_: any, colIndex: number) => {
      const maxLen = data.reduce((acc, row) => {
        const cellValue = row[colIndex] ? String(row[colIndex]) : '';
        return Math.max(acc, cellValue.length);
      }, 10); // Mínimo de 10 caracteres
      return { wch: maxLen + 2 }; // Adiciona uma margem
    });

    worksheet['!cols'] = colWidths;
  }

  // --- OUTRAS FUNÇÕES (Serviços, Equipe, Notificações) ---
  loadServices() { this.api.getServices().subscribe(data => this.services = data); }
  addService() { if (!this.newService.name || !this.newService.price) return; this.api.createService(this.newService).subscribe(() => { this.newService = { name: '', price: null }; this.loadServices(); }); }
  deleteService(id: string) { if(confirm('Tem certeza?')) { this.api.deleteService(id).subscribe(() => this.loadServices()); } }
  loadStaff() { this.api.getUsers().subscribe(users => { this.staff = users.filter(u => u.role === 'BARBER' || u.role === 'OWNER'); }); }
  openBarberModal() { alert('Funcionalidade de cadastro modal aqui'); }
  loadNotifications() { this.api.getNotifications().subscribe(data => { this.notifications = data; this.unreadNotificationsCount = data.filter(n => !n.seen).length; }); }
  markSeen(id: string) { this.api.markNotificationSeen(id).subscribe(() => this.loadNotifications()); }
  markAllSeen() { const unread = this.notifications.filter(n => !n.seen); unread.forEach(n => this.markSeen(n.id)); }
  sair() { this.api.logout(); }
}