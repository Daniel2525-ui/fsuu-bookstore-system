from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelTable(name='category', table='category'),
        migrations.AlterModelTable(name='product', table='products'),
        migrations.AlterModelTable(name='sale', table='sales'),
        migrations.AlterModelTable(name='saledetail', table='sales_details'),
    ]
