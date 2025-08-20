import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Book {
  id: number;
  title: string;
  author: string;
  status: 'available' | 'borrowed';
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  books: Book[] = [];
  newTitle = '';
  newAuthor = '';
  editBookId: number | null = null;
  editTitle = '';
  editAuthor = '';
  api = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadBooks();
  }

  loadBooks() {
    this.http.get<Book[]>(`${this.api}/books`)
      .subscribe(data => {
        this.books = data;
      });
  }

  addBook() {
    if (!this.newTitle.trim() || !this.newAuthor.trim()) return;

    const newBook = {
      title: this.newTitle,
      author: this.newAuthor
    };

    this.http.post<Book>(`${this.api}/books`, newBook)
      .subscribe({
        next: (createdBook) => {
          this.books = [createdBook, ...this.books]; // Live update with real ID
          this.newTitle = '';
          this.newAuthor = '';
        },
        error: err => console.error('Failed to add book:', err)
      });
  }

  deleteBook(id: number) {
    this.http.delete(`${this.api}/books/${id}`)
      .subscribe(() => {
        this.books = this.books.filter(book => book.id !== id);
      });
  }

  startEdit(book: Book) {
    this.editBookId = book.id;
    this.editTitle = book.title;
    this.editAuthor = book.author;
  }

  cancelEdit() {
    this.editBookId = null;
    this.editTitle = '';
    this.editAuthor = '';
  }

  saveEdit(id: number) {
    const updatedBook = {
      title: this.editTitle,
      author: this.editAuthor
    };

    this.http.put(`${this.api}/books/${id}`, updatedBook)
      .subscribe(() => {
        const index = this.books.findIndex(b => b.id === id);
        if (index !== -1) {
          this.books[index] = {
            ...this.books[index],
            title: this.editTitle,
            author: this.editAuthor
          };
          this.books = [...this.books]; // trigger UI update
        }
        this.cancelEdit();
      });
  }

  toggleStatus(book: Book) {
    const newStatus: Book['status'] = book.status === 'available' ? 'borrowed' : 'available';

    this.http.patch(`${this.api}/books/${book.id}/status`, { status: newStatus })
      .subscribe(() => {
        const index = this.books.findIndex(b => b.id === book.id);
        if (index !== -1) {
          this.books[index] = {
            ...this.books[index],
            status: newStatus
          };
          this.books = [...this.books]; // trigger UI update
        }
      });
  }

  // Method to get background color class cycling through 4 colors
  getBookBgClass(index: number): string {
    const classes = ['bg-warning', 'bg-info', 'bg-primary', 'bg-secondary'];
    return classes[index % classes.length] + ' text-black';
  }
}
