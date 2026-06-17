from app.database import get_connection
from fastapi import HTTPException
from app.models import CategoryCreate
from pathlib import Path
import logging

logger = logging.getLogger(__name__)
BASE_DIR = Path(__file__).resolve().parents[2]
UPLOADS_DIR = BASE_DIR / "uploads"


def resolve_upload_path(stored_path):
    candidate = (BASE_DIR / stored_path).resolve()
    uploads_root = UPLOADS_DIR.resolve()
    if candidate != uploads_root and uploads_root not in candidate.parents:
        raise HTTPException(status_code=400, detail="Invalid upload path")
    return candidate


def delete_upload_file(stored_path):
    try:
        resolve_upload_path(stored_path).unlink(missing_ok=True)
    except (HTTPException, OSError):
        logger.warning("Could not delete upload file: %s", stored_path, exc_info=True)

def get_all_categories():
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM categories ORDER BY created_at DESC")
    categories = cursor.fetchall()
    cursor.close()
    conn.close()
    return categories

def create_category(category: CategoryCreate):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "INSERT INTO categories (name, description, icon, color) VALUES (%s, %s, %s, %s)",
        (category.name, category.description, category.icon, category.color)
    )
    conn.commit()

    cursor.execute("SELECT * FROM categories WHERE id = %s", (cursor.lastrowid,))
    new_category = cursor.fetchone()
    cursor.close()
    conn.close()
    return new_category

def update_category(category_id: int, category: CategoryCreate):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "UPDATE categories SET name=%s, description=%s, icon=%s, color=%s WHERE id=%s",
        (category.name, category.description, category.icon, category.color, category_id)
    )
    conn.commit()

    cursor.execute("SELECT * FROM categories WHERE id = %s", (category_id,))
    updated_category = cursor.fetchone()
    cursor.close()
    conn.close()

    if not updated_category:
        raise HTTPException(status_code=404, detail="Category not found")
    return updated_category

def delete_category(category_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    files_to_delete = []

    try:
        cursor.execute(
            "SELECT id FROM categories WHERE id = %s",
            (category_id,)
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Category not found")

        cursor.execute(
            "SELECT id FROM projects WHERE category_id = %s",
            (category_id,)
        )
        projects = cursor.fetchall()
        project_ids = [project["id"] for project in projects]

        if project_ids:
            placeholders = ", ".join(["%s"] * len(project_ids))
            cursor.execute(
                f"SELECT image_path FROM generated_images "
                f"WHERE project_id IN ({placeholders})",
                tuple(project_ids)
            )
            files_to_delete.extend(
                image["image_path"]
                for image in cursor.fetchall()
                if image["image_path"]
            )
            cursor.execute(
                f"DELETE FROM generated_images "
                f"WHERE project_id IN ({placeholders})",
                tuple(project_ids)
            )

        cursor.execute(
            "DELETE FROM projects WHERE category_id = %s",
            (category_id,)
        )
        cursor.execute("DELETE FROM categories WHERE id = %s", (category_id,))
        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception as error:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Category deletion failed: {error}"
        ) from error
    finally:
        cursor.close()
        conn.close()

    for file_path in files_to_delete:
        delete_upload_file(file_path)

    return {"message": "Category deleted successfully"}
