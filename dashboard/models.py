from django.db import models
from django.db import transaction


class Category(models.Model):
    category_id   = models.AutoField(primary_key=True)
    category_name = models.CharField(max_length=50)
    code          = models.CharField(max_length=10, unique=True)  # e.g. BOOK, SUP, UNI

    def __str__(self):
        return self.category_name

    class Meta:
        verbose_name_plural = 'Categories'


class Product(models.Model):
    product_id        = models.AutoField(primary_key=True)
    product_name      = models.CharField(max_length=100)
    price             = models.DecimalField(max_digits=10, decimal_places=2)
    category          = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    stock_quantity    = models.IntegerField()
    product_code      = models.CharField(max_length=20, unique=True, blank=True)  # auto-generated

    restock_threshold = models.PositiveIntegerField(default=5)
    is_active         = models.BooleanField(default=True)
    created_at        = models.DateTimeField(auto_now_add=True)

    def generate_product_code(self):
        """Generate a unique product code like BOOK-0001."""
        if not self.category:
            return None

        category_code = self.category.code.upper()

        with transaction.atomic():
            # Lock all existing products in this category to prevent race conditions
            last_product = (
                Product.objects.select_for_update()
                .filter(
                    category=self.category,
                    product_code__startswith=f"{category_code}-"
                )
                .order_by('-product_code')
                .first()
            )

            if last_product and last_product.product_code:
                try:
                    last_number = int(last_product.product_code.split('-')[-1])
                    next_number = last_number + 1
                except ValueError:
                    next_number = 1
            else:
                next_number = 1

            return f"{category_code}-{next_number:04d}"

    def save(self, *args, **kwargs):
        # Only generate product_code on creation (not on every update)
        if not self.product_code:
            self.product_code = self.generate_product_code()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.product_name

    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.restock_threshold


class Sale(models.Model):
    sales_id       = models.AutoField(primary_key=True)
    sales_datetime = models.DateTimeField(auto_now_add=True)
    total_amount   = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('pending',   'Pending'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')

    def __str__(self):
        return f'Sale #{self.sales_id}'


class SaleDetail(models.Model):
    sales_detail_id = models.AutoField(primary_key=True)
    sale            = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='details')
    product         = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity        = models.IntegerField()
    unit_price      = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f'{self.product.product_name} x{self.quantity}'

    @property
    def subtotal(self):
        return self.unit_price * self.quantity