from django.contrib import admin
from .models import Category, Product, Sale, SaleDetail

admin.site.register(Category)
admin.site.register(Product)
admin.site.register(Sale)
admin.site.register(SaleDetail)