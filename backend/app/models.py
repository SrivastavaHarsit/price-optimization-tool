from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    cost_price: float = Field(..., gt=0)
    selling_price: float = Field(..., gt=0)
    category: str = Field(..., min_length=1, max_length=100)
    stock_available: int = Field(0, ge=0)
    units_sold: int = Field(0, ge=0)
    customer_rating: float = Field(0, ge=0, le=5)
    demand_forecast: int = Field(0, ge=0)
    optimized_price: float = Field(0, ge=0)


class ProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    cost_price: float | None = Field(None, gt=0)
    selling_price: float | None = Field(None, gt=0)
    category: str | None = Field(None, min_length=1, max_length=100)
    stock_available: int | None = Field(None, ge=0)
    units_sold: int | None = Field(None, ge=0)
    customer_rating: float | None = Field(None, ge=0, le=5)
    demand_forecast: int | None = Field(None, ge=0)
    optimized_price: float | None = Field(None, ge=0)
