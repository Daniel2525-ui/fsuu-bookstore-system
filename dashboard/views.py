from django.shortcuts import render, get_object_or_404, redirect
from django.utils import timezone
from django.db.models import Sum, F, Count
from django.db.models import ProtectedError
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from datetime import timedelta
import json

from .models import Product, Sale, SaleDetail, Category


# ================= Dashboard =================

def dashboard(request):
    today    = timezone.now().date()
    week_ago = today - timedelta(days=7)

    total_revenue     = Sale.objects.aggregate(total=Sum('total_amount'))['total'] or 0
    revenue_this_week = Sale.objects.filter(sales_datetime__date__gte=week_ago).aggregate(total=Sum('total_amount'))['total'] or 0
    total_sales       = Sale.objects.count()
    sales_this_week   = Sale.objects.filter(sales_datetime__date__gte=week_ago).count()
    total_products    = Product.objects.filter(is_active=True).count()
    low_stock_items   = Product.objects.filter(is_active=True, stock_quantity__lte=F('restock_threshold'))

    recent_transactions = Sale.objects.order_by('-sales_datetime')[:10]

    chart_labels, chart_values = [], []
    for i in range(6, -1, -1):
        day     = today - timedelta(days=i)
        revenue = Sale.objects.filter(sales_datetime__date=day).aggregate(total=Sum('total_amount'))['total'] or 0
        chart_labels.append(day.strftime('%a'))
        chart_values.append(float(revenue))

    top_products = (
        SaleDetail.objects
        .filter(sale__sales_datetime__date__gte=week_ago)
        .values('product__product_name')
        .annotate(units_sold=Sum('quantity'))
        .order_by('-units_sold')[:5]
    )
    top_labels = [p['product__product_name'] for p in top_products]
    top_values = [p['units_sold']            for p in top_products]

    context = {
        'page_title':          'Dashboard',
        'today':               today.strftime('%B %d, %Y'),
        'total_revenue':       total_revenue,
        'revenue_this_week':   revenue_this_week,
        'total_sales':         total_sales,
        'sales_this_week':     sales_this_week,
        'total_products':      total_products,
        'low_stock_items':     low_stock_items,
        'recent_transactions': recent_transactions,
        'chart_labels':        chart_labels,
        'chart_values':        chart_values,
        'top_labels':          top_labels,
        'top_values':          top_values,
    }
    return render(request, 'dashboard/index.html', context)


# ================= Products =================

def products(request):
    all_products     = Product.objects.filter(is_active=True).select_related('category').order_by('product_name')
    categories       = Category.objects.all()
    total_products   = all_products.count()
    active_products  = all_products.filter(is_active=True).count()
    low_stock_count  = all_products.filter(stock_quantity__lte=F('restock_threshold')).count()
    total_categories = categories.count()

    context = {
        'page_title':       'Products',
        'products':         all_products,
        'categories':       categories,
        'total_products':   total_products,
        'active_products':  active_products,
        'low_stock_count':  low_stock_count,
        'total_categories': total_categories,
    }
    return render(request, 'dashboard/products.html', context)


def product_add(request):
    if request.method == 'POST':
        try:
            Product.objects.create(
                product_name      = request.POST['name'],
                category_id       = request.POST.get('category') or None,
                price             = request.POST['price'],
                stock_quantity    = request.POST['stock'],
                restock_threshold = request.POST.get('restock_threshold') or 5,
                is_active         = 'is_active' in request.POST,
            )
            messages.success(request, 'Product added successfully.')
        except Exception as e:
            messages.error(request, f'Failed to add product: {e}')
    return redirect('dashboard:products')


def product_edit(request, pk):
    product = get_object_or_404(Product, pk=pk)
    if request.method == 'POST':
        try:
            product.product_name      = request.POST['name']
            product.category_id       = request.POST.get('category') or None
            product.price             = request.POST['price']
            product.stock_quantity    = request.POST['stock']
            product.restock_threshold = request.POST.get('restock_threshold') or 5
            product.is_active         = 'is_active' in request.POST
            product.save()
            messages.success(request, 'Product updated successfully.')
        except Exception as e:
            messages.error(request, f'Failed to update product: {e}')
    return redirect('dashboard:products')


def product_delete(request, pk):
    product = get_object_or_404(Product, pk=pk)
    if request.method == 'POST':
        try:
            product.is_active = False
            product.save()
            messages.success(request, f'"{product.product_name}" has been deactivated.')
        except Exception as e:
            messages.error(request, f'Failed to delete product: {e}')
    return redirect('dashboard:products')


# ================= Point of Sale =================

def point_of_sale(request):
    products   = Product.objects.filter(is_active=True).select_related('category').order_by('product_name')
    categories = Category.objects.all()
    today      = timezone.now().date().strftime('%B %d, %Y')

    context = {
        'page_title': 'Point of Sale',
        'products':   products,
        'categories': categories,
        'today':      today,
    }
    return render(request, 'dashboard/pos.html', context)


@require_POST
def pos_checkout(request):
    try:
        data          = json.loads(request.body)
        items         = data.get('items', [])
        cash_tendered = float(data.get('cash_tendered', 0))

        if not items:
            return JsonResponse({'success': False, 'error': 'No items in cart.'})

        order_items = []
        total       = 0

        for entry in items:
            product = get_object_or_404(Product, pk=entry['id'], is_active=True)
            qty     = int(entry['qty'])

            if qty <= 0:
                return JsonResponse({'success': False, 'error': f'Invalid quantity for {product.product_name}.'})
            if product.stock_quantity < qty:
                return JsonResponse({'success': False, 'error': f'Insufficient stock for {product.product_name}.'})

            subtotal = float(product.price) * qty
            total   += subtotal
            order_items.append({'product': product, 'qty': qty, 'unit_price': product.price})

        if cash_tendered < total:
            return JsonResponse({'success': False, 'error': 'Cash tendered is less than the total.'})

        change = round(cash_tendered - total, 2)

        sale = Sale.objects.create(
            total_amount  = total,
            status        = 'completed',
            cash_tendered = cash_tendered,
            change_amount = change,
        )

        for item in order_items:
            SaleDetail.objects.create(
                sale       = sale,
                product    = item['product'],
                quantity   = item['qty'],
                unit_price = item['unit_price'],
            )
            item['product'].stock_quantity -= item['qty']
            item['product'].save()

        return JsonResponse({
            'success':        True,
            'transaction_id': sale.sales_id,
            'total':          total,
            'change':         change,
            'receipt_url':    f'/receipt/{sale.sales_id}/',
        })

    except (ValueError, KeyError) as e:
        return JsonResponse({'success': False, 'error': str(e)})


# ================= Receipt =================

def receipt(request, pk):
    sale  = get_object_or_404(Sale, pk=pk)
    items = sale.details.select_related('product').all()

    context = {
        'transaction':   sale,
        'items':         items,
        'cash_tendered': sale.cash_tendered,
        'change':        sale.change_amount,
    }
    return render(request, 'dashboard/receipt.html', context)


# ================= Transactions =================

def transactions(request):
    today    = timezone.now().date()
    week_ago = today - timedelta(days=7)

    all_transactions = Sale.objects.prefetch_related('details__product').order_by('-sales_datetime')

    total_revenue   = all_transactions.aggregate(t=Sum('total_amount'))['t'] or 0
    total_count     = all_transactions.count()
    week_revenue    = all_transactions.filter(sales_datetime__date__gte=week_ago).aggregate(t=Sum('total_amount'))['t'] or 0
    week_count      = all_transactions.filter(sales_datetime__date__gte=week_ago).count()
    completed_count = all_transactions.filter(status='completed').count()

    context = {
        'page_title':      'Transactions',
        'today':           today.strftime('%B %d, %Y'),
        'transactions':    all_transactions,
        'total_revenue':   total_revenue,
        'total_count':     total_count,
        'week_revenue':    week_revenue,
        'week_count':      week_count,
        'completed_count': completed_count,
    }
    return render(request, 'dashboard/transactions.html', context)


# ================= Reports =================

def reports(request):
    today     = timezone.now().date()
    week_ago  = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    total_revenue = Sale.objects.aggregate(t=Sum('total_amount'))['t'] or 0
    month_revenue = Sale.objects.filter(sales_datetime__date__gte=month_ago).aggregate(t=Sum('total_amount'))['t'] or 0
    week_revenue  = Sale.objects.filter(sales_datetime__date__gte=week_ago).aggregate(t=Sum('total_amount'))['t'] or 0
    total_orders  = Sale.objects.count()
    month_orders  = Sale.objects.filter(sales_datetime__date__gte=month_ago).count()
    avg_order     = round(float(total_revenue) / total_orders, 2) if total_orders else 0

    daily_labels, daily_values = [], []
    for i in range(29, -1, -1):
        day     = today - timedelta(days=i)
        revenue = Sale.objects.filter(sales_datetime__date=day).aggregate(t=Sum('total_amount'))['t'] or 0
        daily_labels.append(day.strftime('%b %d'))
        daily_values.append(float(revenue))

    top_products = (
        SaleDetail.objects
        .values('product__product_name')
        .annotate(units_sold=Sum('quantity'), revenue=Sum(F('quantity') * F('unit_price')))
        .order_by('-units_sold')[:10]
    )

    category_data = (
        SaleDetail.objects
        .values('product__category__category_name')
        .annotate(revenue=Sum(F('quantity') * F('unit_price')))
        .order_by('-revenue')
    )
    cat_labels = [c['product__category__category_name'] or 'Uncategorized' for c in category_data]
    cat_values = [float(c['revenue']) for c in category_data]

    monthly_labels, monthly_values = [], []
    for i in range(11, -1, -1):
        month_start = (today.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
        if i == 0:
            month_end = today
        else:
            next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
            month_end  = next_month - timedelta(days=1)
        revenue = Sale.objects.filter(
            sales_datetime__date__gte=month_start,
            sales_datetime__date__lte=month_end,
        ).aggregate(t=Sum('total_amount'))['t'] or 0
        monthly_labels.append(month_start.strftime('%b %Y'))
        monthly_values.append(float(revenue))

    context = {
        'page_title':     'Sales Reports',
        'today':          today.strftime('%B %d, %Y'),
        'total_revenue':  total_revenue,
        'month_revenue':  month_revenue,
        'week_revenue':   week_revenue,
        'total_orders':   total_orders,
        'month_orders':   month_orders,
        'avg_order':      avg_order,
        'top_products':   top_products,
        'daily_labels':   daily_labels,
        'daily_values':   daily_values,
        'cat_labels':     cat_labels,
        'cat_values':     cat_values,
        'monthly_labels': monthly_labels,
        'monthly_values': monthly_values,
    }
    return render(request, 'dashboard/reports.html', context)