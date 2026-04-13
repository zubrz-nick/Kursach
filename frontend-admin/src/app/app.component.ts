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
  private apiUrl = 'https://kursach-h63g.onrender.com';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.refreshOrders();
    setInterval(() => this.refreshOrders(), 3000);
  }

refreshOrders() {
    // ЗАМЕНИЛИ 'http://localhost:8000/index.php' на переменную + путь к файлу
    this.http.get<any[]>(`https://kursach-h63g.onrender.com/index.php`).subscribe({
      next: (data) => {
        this.orders = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Ошибка загрузки:', err)
    });
  }

  updateStatus(id: number, status: string) {
    // ЗАМЕНИЛИ 'http://localhost:8000/index.php' на переменную
    this.http.patch(`https://kursach-h63g.onrender.com/index.php`, { id, status }).subscribe({
      next: () => this.refreshOrders(),
      error: (err) => console.error('Ошибка обновления:', err)
    });
  }

  trackByOrderId(index: number, item: any) {
    return item.id;
  }
}
