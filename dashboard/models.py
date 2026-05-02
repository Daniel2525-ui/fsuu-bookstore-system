from django.db import models, transaction


class Category(models.Model):
    category_id   = models.AutoField(primary_key=True)
    category_name = models.CharField(max_length=50)
    code          = models.CharField(max_length=10, unique=True)  # e.g. BOOK, SUP, UNI

    def __str__(self):
        return self.category_name

    class Meta:
        db_table            = 'category'
        verbose_name_plural = 'Categories'


class Product(models.Model):
    product_id        = models.AutoField(primary_key=True)
    product_name      = models.CharField(max_length=100)
    price             = models.DecimalField(max_digits=10, decimal_places=2)
    category          = models.ForeignKey(
                            Category, on_delete=models.SET_NULL,
                            null=True, blank=True
                        )
    stock_quantity    = models.IntegerField()
    product_code      = models.CharField(max_length=20, unique=True, blank=True)
    restock_threshold = models.PositiveIntegerField(default=5)
    is_active         = models.BooleanField(default=True)
    created_at        = models.DateTimeField(auto_now_add=True)

    def generate_product_code(self):
        category_code = self.category.code.upper() if self.category else "MISC"
        prefix        = f"{category_code}-"

        with transaction.atomic():
            # Pull only products in this category prefix, locked for update
            existing = (
                Product.objects
                .select_for_update()
                .filter(product_code__startswith=prefix)
                .values_list('product_code', flat=True)
            )

            # Find the highest numeric suffix currently in use
            max_number = 0
            for code in existing:
                try:
                    num = int(code.split('-')[-1])
                    if num > max_number:
                        max_number = num
                except ValueError:
                    pass

            return f"{prefix}{max_number + 1:04d}"

    def save(self, *args, **kwargs):
        if not self.product_code:
            self.product_code = self.generate_product_code()
            # Extremely rare race-condition safety net
            while Product.objects.filter(product_code=self.product_code).exists():
                prefix, _, suffix = self.product_code.rpartition('-')
                self.product_code  = f"{prefix}-{int(suffix) + 1:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.product_name

    class Meta:
        db_table = 'products'

    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.restock_threshold

""" ERD BASED ENTITIES """
class Sale(models.Model):
    sales_id       = models.AutoField(primary_key=True)
    sales_datetime = models.DateTimeField(auto_now_add=True)
    total_amount   = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cash_tendered  = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    change_amount  = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('pending',   'Pending'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')

    def __str__(self):
        return f'Sale #{self.sales_id}'

    class Meta:
        db_table = 'sales'


class SaleDetail(models.Model):
    sales_detail_id = models.AutoField(primary_key=True)
    sale            = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='details')
    product         = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity        = models.IntegerField()
    unit_price      = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f'{self.product.product_name} x{self.quantity}'

    class Meta:
        db_table = 'sales_details'

    @property
    def subtotal(self):
        return self.unit_price * self.quantity