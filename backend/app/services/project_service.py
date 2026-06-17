from app.database import get_connection
from fastapi import HTTPException
from app.models import ProjectCreate
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

def get_all_projects():
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM projects ORDER BY created_at DESC")
    projects = cursor.fetchall()
    cursor.close()
    conn.close()
    return projects

def get_project_by_id(project_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM projects WHERE id = %s", (project_id,))
    project = cursor.fetchone()
    cursor.close()
    conn.close()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

def get_projects_by_category(category_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM projects WHERE category_id = %s ORDER BY created_at DESC",
        (category_id,)
    )
    projects = cursor.fetchall()
    cursor.close()
    conn.close()
    return projects

def create_project(project: ProjectCreate):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id FROM categories WHERE id = %s",
            (project.category_id,)
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Category not found")

        cursor.execute(
            """INSERT INTO projects
            (category_id, name, subject, style, format, extra_elements, prompt)
            VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (project.category_id, project.name, project.subject, project.style,
             project.format, project.extra_elements, project.prompt)
        )
        conn.commit()
        cursor.execute("SELECT * FROM projects WHERE id = %s", (cursor.lastrowid,))
        return cursor.fetchone()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

def delete_project(project_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    files_to_delete = []

    try:
        cursor.execute(
            "SELECT id FROM projects WHERE id = %s",
            (project_id,)
        )
        project = cursor.fetchone()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        cursor.execute(
            "SELECT image_path FROM generated_images WHERE project_id = %s",
            (project_id,)
        )
        files_to_delete.extend(
            image["image_path"] for image in cursor.fetchall() if image["image_path"]
        )

        cursor.execute(
            "DELETE FROM generated_images WHERE project_id = %s",
            (project_id,)
        )
        cursor.execute("DELETE FROM projects WHERE id = %s", (project_id,))
        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception as error:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Project deletion failed: {error}"
        ) from error
    finally:
        cursor.close()
        conn.close()

    for file_path in files_to_delete:
        delete_upload_file(file_path)

    return {"message": "Project deleted successfully"}
