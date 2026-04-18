from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    path('',                          views.dashboard,      name='home'),
    path('products/',                 views.products,       name='products'),
    path('products/add/',             views.product_add,    name='product_add'),
    path('products/edit/<int:pk>/',   views.product_edit,   name='product_edit'),
    path('products/delete/<int:pk>/', views.product_delete, name='product_delete'),
    path('point-of-sale/',            views.point_of_sale,  name='pos'),
    path('point-of-sale/checkout/',   views.pos_checkout,   name='pos_checkout'),
    path('receipt/<int:pk>/',         views.receipt,        name='receipt'),
    path('transactions/',             views.transactions,   name='transactions'),
    path('reports/',                  views.reports,        name='reports'),
]