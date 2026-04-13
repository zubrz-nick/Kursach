import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  orders: any[] = [];
  products: any[] = [];
  view: 'orders' | 'menu' = 'orders';
  newProduct = { name: '', price: 0, icon: '☕' };
  private apiUrl = 'https://kursach-h63g.onrender.com';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.refreshData();
    setInterval(() => this.refreshOrders(), 3000);
  }

  refreshData() {
    this.refreshOrders();
    this.refreshProducts();
  }

  refreshOrders() {
    this.http.get<any[]>(`${this.apiUrl}/index.php`).subscribe(data => {
      this.orders = data;
      this.cdr.detectChanges();
    });
  }

  refreshProducts() {
    this.http.get<any[]>(`${this.apiUrl}/index.php?action=get_products`).subscribe(data => {
      this.products = data;
    });
  }

  updateStatus(id: number, status: string) {
    this.http.patch(`${this.apiUrl}/index.php`, { id, status }).subscribe(() => this.refreshOrders());
  }

  addProduct() {
    if (!this.newProduct.name || this.newProduct.price <= 0) return;
    this.http.post(`${this.apiUrl}/index.php`, { action: 'add_product', ...this.newProduct })
      .subscribe(() => {
        this.refreshProducts();
        this.newProduct = { name: '', price: 0, icon: '☕' };
      });
  }

  deleteProduct(id: number) {
    this.http.post(`${this.apiUrl}/index.php`, { action: 'delete_product', id })
      .subscribe(() => this.refreshProducts());
  }

  trackByOrderId(index: number, item: any) { return item.id; }
}
