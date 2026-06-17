import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
import os
import re

load_dotenv()


def _database_name():
    name = os.getenv("MYSQL_DATABASE", "")
    if not re.fullmatch(r"[A-Za-z0-9_]+", name):
        raise RuntimeError("MYSQL_DATABASE must contain only letters, numbers, and underscores")
    return name


def get_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST"),
            port=int(os.getenv("MYSQL_PORT", "3306")),
            user=os.getenv("MYSQL_USER"),
            password=os.getenv("MYSQL_PASSWORD"),
            database=_database_name()
        )
        return connection
    except Error as e:
        print(f"Database connection error: {e}")
        return None

def init_db():
    try:
        conn = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST"),
            port=int(os.getenv("MYSQL_PORT", "3306")),
            user=os.getenv("MYSQL_USER"),
            password=os.getenv("MYSQL_PASSWORD")
        )
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{_database_name()}`")
        cursor.close()
        conn.close()
    except Error as e:
        print(f"Database creation error: {e}")
        return

    conn = get_connection()
    if not conn:
        return

    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            icon VARCHAR(50),
            color VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            category_id INT,
            name VARCHAR(255) NOT NULL,
            subject TEXT NOT NULL,
            style VARCHAR(100),
            format VARCHAR(50),
            extra_elements TEXT,
            prompt TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS generated_images (
            id INT AUTO_INCREMENT PRIMARY KEY,
            project_id INT,
            image_path VARCHAR(500),
            is_favorite BOOLEAN DEFAULT FALSE,
            is_archived BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("SHOW COLUMNS FROM projects")
    project_columns = {column[0] for column in cursor.fetchall()}

    if "room_type" in project_columns and "subject" not in project_columns:
        cursor.execute("ALTER TABLE projects CHANGE room_type subject TEXT")
        project_columns.remove("room_type")
        project_columns.add("subject")

    if "subject" not in project_columns:
        cursor.execute("ALTER TABLE projects ADD COLUMN subject TEXT AFTER name")

    if "original_image" in project_columns:
        cursor.execute("ALTER TABLE projects DROP COLUMN original_image")

    if "generation_mode" in project_columns:
        cursor.execute("ALTER TABLE projects DROP COLUMN generation_mode")

    conn.commit()
    cursor.close()
    conn.close()
    print("Database tables ready!")
