"""
End-to-End API Integration Tests for CodePulse AI
Tests the complete workflow:
1. Health check
2. ZIP project upload & safe extraction
3. Database persistence of SourceFiles, Functions, and Dependencies
4. Graph extraction (caller -> callee)
5. Function selection & Change-Impact Analysis (reverse BFS)
6. Risk score calculation
7. Candidate test recommendation
8. Persisted analysis history retrieval
"""
import io
import os
import sys
import zipfile
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.main import app
from app.db.database import init_db

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()


def create_test_project_zip() -> io.BytesIO:
    """Create an in-memory zip of a sample Python project."""
    pricing_code = """
def calculate_price(price: float, quantity: int) -> float:
    return price * quantity

def apply_discount(total: float, rate: float) -> float:
    return total * (1.0 - rate)

def generate_invoice(customer: str, price: float, quantity: int, discount: float = 0.0) -> dict:
    subtotal = calculate_price(price, quantity)
    total = apply_discount(subtotal, discount) if discount > 0 else subtotal
    return {"customer": customer, "total": total}

def notify_customer(customer: str, invoice: dict) -> bool:
    inv = generate_invoice(customer, 10, 2)
    return True
"""
    test_code = """
import pytest

def test_calculate_price():
    pass

def test_generate_invoice():
    pass
"""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("ecommerce/pricing.py", pricing_code)
        zf.writestr("tests/test_pricing.py", test_code)
    zip_buffer.seek(0)
    return zip_buffer


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "CodePulse AI" in data["app"]


def test_full_project_analysis_workflow():
    # 1. Upload Project ZIP
    zip_buf = create_test_project_zip()
    files = {"file": ("demo_ecommerce.zip", zip_buf, "application/zip")}
    upload_res = client.post("/api/projects/upload", files=files)
    assert upload_res.status_code == 201, upload_res.text
    project_data = upload_res.json()
    project_id = project_data["id"]
    assert project_data["status"] == "ready"
    assert project_data["total_functions"] >= 4

    # 2. Verify Extracted Functions
    func_res = client.get(f"/api/projects/{project_id}/functions")
    assert func_res.status_code == 200
    functions = func_res.json()["functions"]
    func_names = [f["name"] for f in functions]
    assert "calculate_price" in func_names
    assert "generate_invoice" in func_names
    assert "notify_customer" in func_names

    # 3. Verify Dependency Graph
    graph_res = client.get(f"/api/projects/{project_id}/graph")
    assert graph_res.status_code == 200
    graph_data = graph_res.json()
    assert graph_data["node_count"] >= 4
    assert graph_data["edge_count"] >= 2

    # 4. Run Change-Impact Analysis on `calculate_price`
    # calculate_price is called by generate_invoice, which is called by notify_customer!
    calc_func = next(f for f in functions if f["name"] == "calculate_price")
    analyze_payload = {
        "function_qualified_name": calc_func["qualified_name"],
        "use_ai": False,
    }
    analyze_res = client.post(f"/api/projects/{project_id}/analyze", json=analyze_payload)
    assert analyze_res.status_code == 200, analyze_res.text
    analysis = analyze_res.json()

    impact = analysis["impact"]
    assert impact["selected_function"] == "calculate_price"
    # generate_invoice should be a direct caller
    direct_callers = [c.split(".")[-1] for c in impact["direct_callers"]]
    assert "generate_invoice" in direct_callers

    # notify_customer should be in affected callers
    affected_names = [a["name"] for a in impact["all_affected"]]
    assert "generate_invoice" in affected_names
    assert "notify_customer" in affected_names

    # 5. Verify Risk Score Formula
    risk = analysis["risk"]
    assert 0 <= risk["score"] <= 100
    assert risk["category"] in ["low", "medium", "high", "critical"]
    assert len(risk["contributing_factors"]) > 0

    # 6. Verify Test Recommendations
    test_recs = analysis["test_recommendations"]
    assert len(test_recs) > 0
    rec_names = [r["test_function_name"] for r in test_recs]
    assert "test_calculate_price" in rec_names

    # 7. Verify SQLite Persistence of Analysis History
    history_res = client.get(f"/api/projects/{project_id}/history")
    assert history_res.status_code == 200
    hist = history_res.json()["history"]
    assert len(hist) >= 1
    assert hist[0]["function_name"] == "calculate_price"
    assert hist[0]["affected_count"] >= 2
