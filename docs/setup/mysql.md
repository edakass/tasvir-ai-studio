# MySQL Setup

Tasvir uses MySQL to store categories, Image Studio projects, prompts, and
generated image records.

## 1. Install MySQL

Use the official MySQL Community Server installer for your operating system:

- [MySQL downloads](https://dev.mysql.com/downloads/mysql/)
- [Official installation guide](https://dev.mysql.com/doc/en/installing.html)

During installation, keep note of:

- Host, normally `localhost`
- Port, normally `3306`
- MySQL username
- MySQL password

Start the MySQL service before running the backend.

## 2. Configure Tasvir

Copy the example environment file:

```bash
cp backend/.env.example backend/.env
```

Set the MySQL values:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=tasvir_ai_studio
```

`MYSQL_DATABASE` may contain only letters, numbers, and underscores.

## 3. Create Tables

The backend creates the database and required tables automatically on startup:

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

You can also run the migration helper manually:

```bash
cd backend
source venv/bin/activate
python migrate.py
```

## Common Check

Confirm that MySQL accepts the configured credentials:

```bash
mysql -h localhost -P 3306 -u root -p
```
