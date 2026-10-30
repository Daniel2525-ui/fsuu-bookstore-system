<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:14532d,100:16a34a&height=200&section=header&text=FSUU%20Bookstore&fontSize=52&fontColor=ffffff&animation=fadeIn&fontAlignY=36&desc=Campus%20bookstore%20POS%20and%20inventory&descAlignY=58&descSize=18" alt="FSUU Bookstore" />

**A Django point of sale for the university bookstore: books, supplies and uniforms.**

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django_6-092E20?style=for-the-badge&logo=django&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Gunicorn](https://img.shields.io/badge/Gunicorn-499848?style=for-the-badge&logo=gunicorn&logoColor=white)

</div>

---

## ✨ Features

| | Page | What it does |
| --- | --- | --- |
| 🏠 | **Dashboard** | Today's sales and stock overview |
| 🛒 | **POS** | Ring up items, take cash and compute change automatically |
| 🧾 | **Receipts** | A printable receipt for every sale |
| 📦 | **Products** | Categories (`BOOK`, `SUP`, `UNI`…), auto product codes and active/inactive flags |
| ⚠️ | **Restock alerts** | A threshold per product warns you before stock runs out |
| 📜 | **Transactions** | Full sales history with status tracking |
| 📈 | **Reports** | Sales summaries for the store |

## 🗃️ Data model

```mermaid
erDiagram
    CATEGORY ||--o{ PRODUCT : groups
    PRODUCT  ||--o{ SALE_DETAIL : "sold as"
    SALE     ||--|{ SALE_DETAIL : contains
    PRODUCT { string product_code  decimal price  int stock_quantity  int restock_threshold }
    SALE    { datetime sales_datetime  decimal total_amount  decimal cash_tendered  decimal change_amount }
```

## 🚀 Run it locally

```bash
git clone https://github.com/Daniel2525-ui/fsuu-bookstore-system.git
cd fsuu-bookstore-system
python -m venv venv
source venv/bin/activate     # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

---

<div align="center">

Built by **[Erle Daniel Sudario](https://github.com/Daniel2525-ui)**

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:16a34a,100:14532d&height=100&section=footer" />

</div>
