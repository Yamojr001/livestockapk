# Livestock Data API - Laravel 12

Complete API backend for the Jigawa State Livestock Data Collection System.

## Quick Start

### 1. Configure Environment
```bash
cp .env.example .env
php artisan key:generate
```

### 2. Edit .env File
```env
APP_NAME="Livestock API"
APP_URL=https://livestock.hargei.org

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_username
DB_PASSWORD=your_password

SANCTUM_STATEFUL_DOMAINS=localhost,livestock.hargei.org
```

### 3. Run Migrations & Seed
```bash
php artisan migrate:fresh
php artisan db:seed
```

### 4. Set Permissions (Linux/Hostinger)
```bash
chmod -R 775 storage bootstrap/cache
```

---

## Default Admin Credentials
- **Email:** admin@jigawa.gov.ng
- **Password:** admin123

---

## API Endpoints

### Base URL
`https://livestock1.hargei.org/api/v1`

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login | No |
| POST | `/auth/logout` | Logout | Yes |
| GET | `/auth/me` | Get current user | Yes |
| PUT | `/auth/profile` | Update profile | Yes |
| POST | `/auth/change-password` | Change password | Yes |

### Submissions (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/submissions` | List submissions |
| POST | `/submissions` | Create submission |
| GET | `/submissions/stats` | Get statistics |
| POST | `/submissions/sync` | Batch sync offline |
| GET | `/submissions/{id}` | Get single |
| PUT | `/submissions/{id}` | Update |
| DELETE | `/submissions/{id}` | Delete |

### Users (Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List users |
| POST | `/users` | Create user |
| GET | `/users/stats` | User statistics |
| GET | `/users/{id}` | Get single |
| PUT | `/users/{id}` | Update |
| DELETE | `/users/{id}` | Delete |

---

## Hostinger Deployment

1. Upload entire `livestock-api` folder to Hostinger
2. Point domain to the `public` folder
3. Create `.htaccess` in root (if needed):

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
```

4. Run migrations via SSH or Hostinger terminal:
```bash
php artisan migrate:fresh
php artisan db:seed
```
