from fastapi import APIRouter
from app.models import ProjectCreate, ProjectResponse
from app.services import project_service
from typing import List

router = APIRouter(
    prefix="/api/projects",
    tags=["projects"]
)

@router.get("/", response_model=List[ProjectResponse])
def get_projects():
    return project_service.get_all_projects()

@router.get("/category/{category_id}", response_model=List[ProjectResponse])
def get_projects_by_category(category_id: int):
    return project_service.get_projects_by_category(category_id)

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int):
    return project_service.get_project_by_id(project_id)

@router.post("/", response_model=ProjectResponse)
def create_project(project: ProjectCreate):
    return project_service.create_project(project)

@router.delete("/{project_id}")
def delete_project(project_id: int):
    return project_service.delete_project(project_id)
