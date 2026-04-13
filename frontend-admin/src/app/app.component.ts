import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  orders: any[] = [];
  private apiUrl = 'https://kursach-1-eohx.onrender.com/index.php';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.refreshOrders();
    setInterval(() => this.refreshOrders(), 3000);
  }

  refreshOrders() {
    this.http.get<any[]>('http://localhost:8000/index.php').subscribe({
      next: (data) => {
        this.orders = data; // Заменяем полностью, чтобы не было дублей
        this.cdr.detectChanges();
      }
    });
  }

  updateStatus(id: number, status: string) {
    this.http.patch('http://localhost:8000/index.php', { id, status }).subscribe(() => {
      this.refreshOrders();
    });
  }

  trackByOrderId(index: number, item: any) {
    return item.id;
  }
}
