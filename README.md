# TechniShop Backend API

Prosty, przejrzysty backend dla sklepu internetowego **TechniShop**, przygotowany w oparciu o **Node.js**, **Express**, **TypeScript** oraz **SQLite + Prisma**.

---

## 🚀 Uruchamianie

### 1. Instalacja zależności
```bash
npm install
```

### 2. Inicjalizacja bazy danych (SQLite)
```bash
npx prisma db push
npm run seed
```

### 3. Uruchomienie serwera w trybie developerskim
```bash
npm run dev
```
Serwer uruchomi się domyślnie pod adresem: `http://localhost:5000`

---

## 📡 Dostępne Endpointy API

### 👕 Produkty (`/api/products`)
| Metoda | Endpoint | Opis |
|---|---|---|
| `GET` | `/api/products` | Pobiera listę produktów (filtry: `?brand=...`, `?gender=...`, `?search=...`) |
| `GET` | `/api/products/:id` | Pobiera szczegóły pojedynczego produktu |
| `POST` | `/api/products` | Dodaje nowy produkt |

### 🛒 Koszyk (`/api/cart`)
| Metoda | Endpoint | Opis |
|---|---|---|
| `GET` | `/api/cart` | Pobiera elementy w koszyku oraz sumaryczną cenę |
| `POST` | `/api/cart` | Dodaje produkt do koszyka (`productId`, `selectedColor`, `selectedSize`, `quantity`) |
| `PUT` | `/api/cart/:id` | Zmienia liczbę sztuk w koszyku (`quantity`) |
| `DELETE` | `/api/cart/:id` | Usuwa pozycję z koszyka |
| `DELETE` | `/api/cart` | Czyści cały koszyk |

### 📦 Zamówienia (`/api/orders`)
| Metoda | Endpoint | Opis |
|---|---|---|
| `GET` | `/api/orders` | Pobiera listę wszystkich złożonych zamówień |
| `GET` | `/api/orders/:id` | Pobiera szczegóły danego zamówienia |
| `POST` | `/api/orders` | Składa nowe zamówienie (dane klienta, koszyk, suma) |

### 🩺 Status (`/api/health`)
| Metoda | Endpoint | Opis |
|---|---|---|
| `GET` | `/api/health` | Sprawdzenie czy serwer działa |

---

## 🛠️ Panel Podglądu Bazy Danych
Możesz podejrzeć i edytować bazę SQLite w przeglądarce za pomocą Prisma Studio:
```bash
npx prisma studio
```
