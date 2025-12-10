import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router'; // Adicione RouterModule
import { CommonModule } from '@angular/common'; // Adicione CommonModule
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule], // Adicione aqui
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'BarberFlow';

  constructor(public api: ApiService) {} // Injete o API Service como Public

  logout() {
    this.api.logout();
  }
}