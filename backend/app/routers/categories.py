from fastapi import APIRouter
from app.models import CategoryCreate, CategoryResponse
from app.services import category_service
from typing import List

router = APIRouter(
    prefix="/api/categories",
    tags=["categories"]
)

@router.get("/", response_model=List[CategoryResponse])
def get_categories():
    return category_service.get_all_categories()

@router.post("/", response_model=CategoryResponse)
def create_category(category: CategoryCreate):
    return category_service.create_category(category)

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, category: CategoryCreate):
    return category_service.update_category(category_id, category)

@router.delete("/{category_id}")
def delete_category(category_id: int):
    return category_service.delete_category(category_id)