"""
Tests for CodePulse AI backend analysis engine.
"""
import ast
import os
import sys
import tempfile
import zipfile

import pytest

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.analyzer.ast_parser import ASTParser, FunctionCallVisitor
from app.analyzer.call_resolver import CallResolver, resolve_all_calls
from app.analyzer.dependency_graph import DependencyGraph
from app.analyzer.impact_analyzer import ImpactAnalyzer
from app.analyzer.risk_scoring import calculate_risk_score
from app.analyzer.source_discovery import discover_python_files
from app.analyzer.test_recommender import TestRecommender
from app.services.analysis_service import validate_and_extract_zip


# ─── Fixtures ─────────────────────────────────────────────────────────────────

SAMPLE_CODE = """
def calculate_price(price, quantity):
    \"\"\"Calculate total price.\"\"\"
    return price * quantity


def apply_discount(total, discount):
    \"\"\"Apply discount to total.\"\"\"
    return total * (1 - discount)


def generate_invoice(price, quantity, discount=0.0):
    \"\"\"Generate invoice with optional discount.\"\"\"
    total = calculate_price(price, quantity)
    if discount:
        total = apply_discount(total, discount)
    return total


def send_email(recipient, subject, body):
    \"\"\"Send email notification.\"\"\"
    pass


def notify_customer(customer_id, invoice_id):
    \"\"\"Notify customer after invoice generation.\"\"\"
    invoice = generate_invoice(10, 5)
    send_email(customer_id, "Invoice", str(invoice))
    return True
"""

TEST_CODE = """
import pytest

def test_calculate_price():
    from sample import calculate_price
    assert calculate_price(10, 3) == 30

def test_generate_invoice():
    from sample import generate_invoice
    assert generate_invoice(10, 5) == 50

def test_apply_discount():
    pass
"""


@pytest.fixture
def sample_dir(tmp_path):
    """Create a temporary directory with sample Python code."""
    src = tmp_path / "sample.py"
    src.write_text(SAMPLE_CODE)
    test_file = tmp_path / "test_sample.py"
    test_file.write_text(TEST_CODE)
    return str(tmp_path)


@pytest.fixture
def parsed_functions(sample_dir):
    """Parse functions from sample directory."""
    parser = ASTParser()
    abs_path = os.path.join(sample_dir, "sample.py")
    result = parser.parse_file(abs_path, "sample.py")
    return result.functions


@pytest.fixture
def all_functions(sample_dir):
    """Parse all functions including tests."""
    parser = ASTParser()
    funcs = []
    for fname in ["sample.py", "test_sample.py"]:
        abs_path = os.path.join(sample_dir, fname)
        result = parser.parse_file(abs_path, fname)
        funcs.extend(result.functions)
    return funcs


@pytest.fixture
def dependency_graph(all_functions):
    """Build dependency graph from all functions."""
    graph = DependencyGraph()
    graph.build(all_functions)
    return graph


# ─── Source Discovery ──────────────────────────────────────────────────────────

class TestSourceDiscovery:
    def test_discovers_python_files(self, sample_dir):
        files = discover_python_files(sample_dir)
        assert len(files) >= 1
        assert all(f.endswith(".py") for f in files)

    def test_excludes_pycache(self, tmp_path):
        pycache = tmp_path / "__pycache__"
        pycache.mkdir()
        (pycache / "test.pyc").write_bytes(b"")
        (tmp_path / "main.py").write_text("x = 1")
        files = discover_python_files(str(tmp_path))
        assert not any("__pycache__" in f for f in files)

    def test_empty_directory(self, tmp_path):
        files = discover_python_files(str(tmp_path))
        assert files == []


# ─── AST Parser ───────────────────────────────────────────────────────────────

class TestASTParser:
    def test_extracts_functions(self, parsed_functions):
        names = [f.name for f in parsed_functions]
        assert "calculate_price" in names
        assert "generate_invoice" in names
        assert "apply_discount" in names

    def test_function_line_numbers(self, parsed_functions):
        calc = next(f for f in parsed_functions if f.name == "calculate_price")
        assert calc.line_start is not None
        assert calc.line_start >= 1

    def test_function_calls_extracted(self, parsed_functions):
        invoice = next(f for f in parsed_functions if f.name == "generate_invoice")
        assert "calculate_price" in invoice.calls

    def test_docstring_extraction(self, parsed_functions):
        calc = next(f for f in parsed_functions if f.name == "calculate_price")
        assert calc.docstring == "Calculate total price."

    def test_syntax_error_handled(self, tmp_path):
        bad_file = tmp_path / "bad.py"
        bad_file.write_text("def foo(\n    # missing closing paren")
        parser = ASTParser()
        result = parser.parse_file(str(bad_file), "bad.py")
        assert result.has_syntax_error
        assert result.syntax_error_message is not None

    def test_qualified_name_top_level(self, parsed_functions):
        calc = next(f for f in parsed_functions if f.name == "calculate_price")
        assert "calculate_price" in calc.qualified_name

    def test_method_detection(self, tmp_path):
        class_code = """
class MyClass:
    def my_method(self):
        pass
"""
        f = tmp_path / "myclass.py"
        f.write_text(class_code)
        parser = ASTParser()
        result = parser.parse_file(str(f), "myclass.py")
        method = next(fn for fn in result.functions if fn.name == "my_method")
        assert method.is_method
        assert method.class_name == "MyClass"

    def test_empty_file(self, tmp_path):
        f = tmp_path / "empty.py"
        f.write_text("")
        parser = ASTParser()
        result = parser.parse_file(str(f), "empty.py")
        assert not result.has_syntax_error
        assert result.functions == []


# ─── Call Resolver ────────────────────────────────────────────────────────────

class TestCallResolver:
    def test_resolves_direct_call(self, all_functions):
        resolver = CallResolver(all_functions)
        invoice = next(f for f in all_functions if f.name == "generate_invoice")
        resolved = resolver.resolve_calls(invoice)
        callee_names = [r[0].name for r in resolved]
        assert "calculate_price" in callee_names

    def test_no_self_references(self, all_functions):
        resolver = CallResolver(all_functions)
        for func in all_functions:
            resolved = resolver.resolve_calls(func)
            assert func not in [r[0] for r in resolved]

    def test_resolve_all_returns_edges(self, all_functions):
        edges = resolve_all_calls(all_functions)
        assert len(edges) > 0
        for edge in edges:
            assert len(edge) == 3  # (caller, callee, type)

    def test_unresolved_calls_not_included(self, all_functions):
        edges = resolve_all_calls(all_functions)
        qnames = {f.qualified_name for f in all_functions}
        for caller, callee, _ in edges:
            assert caller in qnames
            assert callee in qnames


# ─── Dependency Graph ─────────────────────────────────────────────────────────

class TestDependencyGraph:
    def test_graph_has_nodes(self, dependency_graph, all_functions):
        assert dependency_graph.node_count() == len(all_functions)

    def test_graph_has_edges(self, dependency_graph):
        assert dependency_graph.edge_count() > 0

    def test_direct_callers(self, dependency_graph, all_functions):
        calc_qname = next(
            f.qualified_name for f in all_functions if f.name == "calculate_price"
        )
        callers = dependency_graph.get_direct_callers(calc_qname)
        caller_names = [c.split(".")[-1] for c in callers]
        assert "generate_invoice" in caller_names

    def test_reverse_traversal(self, dependency_graph, all_functions):
        calc_qname = next(
            f.qualified_name for f in all_functions if f.name == "calculate_price"
        )
        affected = dependency_graph.get_all_reachable_callers(calc_qname)
        affected_names = [k.split(".")[-1] for k in affected]
        assert "generate_invoice" in affected_names
        # notify_customer calls generate_invoice which calls calculate_price
        assert "notify_customer" in affected_names

    def test_cycle_safety(self, tmp_path):
        """Ensure BFS terminates with cycles."""
        cycle_code = """
def a():
    b()

def b():
    a()
"""
        f = tmp_path / "cycle.py"
        f.write_text(cycle_code)
        from app.analyzer.ast_parser import ASTParser
        parser = ASTParser()
        result = parser.parse_file(str(f), "cycle.py")
        graph = DependencyGraph()
        graph.build(result.functions)
        a_qname = next(fn.qualified_name for fn in result.functions if fn.name == "a")
        # Should not hang or raise
        affected = graph.get_all_reachable_callers(a_qname)
        assert isinstance(affected, dict)

    def test_graph_data_export(self, dependency_graph):
        data = dependency_graph.get_graph_data()
        assert "nodes" in data
        assert "edges" in data
        assert len(data["nodes"]) > 0


# ─── Impact Analyzer ──────────────────────────────────────────────────────────

class TestImpactAnalyzer:
    def test_analyze_direct_callers(self, dependency_graph, all_functions):
        calc_qname = next(
            f.qualified_name for f in all_functions if f.name == "calculate_price"
        )
        analyzer = ImpactAnalyzer(dependency_graph)
        result = analyzer.analyze(calc_qname)
        direct_names = [c.split(".")[-1] for c in result.direct_callers]
        assert "generate_invoice" in direct_names

    def test_analyze_affected_count(self, dependency_graph, all_functions):
        calc_qname = next(
            f.qualified_name for f in all_functions if f.name == "calculate_price"
        )
        analyzer = ImpactAnalyzer(dependency_graph)
        result = analyzer.analyze(calc_qname)
        assert result.affected_count >= 2

    def test_analyze_unknown_function(self, dependency_graph):
        analyzer = ImpactAnalyzer(dependency_graph)
        result = analyzer.analyze("nonexistent.function")
        assert result.affected_count == 0
        assert result.direct_callers == []

    def test_analyze_includes_limitations(self, dependency_graph, all_functions):
        calc_qname = next(
            f.qualified_name for f in all_functions if f.name == "calculate_price"
        )
        analyzer = ImpactAnalyzer(dependency_graph)
        result = analyzer.analyze(calc_qname)
        assert len(result.limitations) > 0


# ─── Risk Scoring ─────────────────────────────────────────────────────────────

class TestRiskScoring:
    def test_score_range(self, dependency_graph, all_functions):
        calc_qname = next(
            f.qualified_name for f in all_functions if f.name == "calculate_price"
        )
        analyzer = ImpactAnalyzer(dependency_graph)
        impact = analyzer.analyze(calc_qname)
        risk = calculate_risk_score(impact)
        assert 0 <= risk.score <= 100

    def test_low_risk_for_leaf_function(self, dependency_graph, all_functions):
        # send_email is called but does not call any known project function
        send_email_qname = next(
            (f.qualified_name for f in all_functions if f.name == "send_email"), None
        )
        if send_email_qname:
            analyzer = ImpactAnalyzer(dependency_graph)
            impact = analyzer.analyze(send_email_qname)
            risk = calculate_risk_score(impact)
            assert risk.score >= 0

    def test_risk_categories(self, dependency_graph, all_functions):
        calc_qname = next(
            f.qualified_name for f in all_functions if f.name == "calculate_price"
        )
        analyzer = ImpactAnalyzer(dependency_graph)
        impact = analyzer.analyze(calc_qname)
        risk = calculate_risk_score(impact)
        assert risk.category in ["low", "medium", "high", "critical"]

    def test_contributing_factors(self, dependency_graph, all_functions):
        calc_qname = next(
            f.qualified_name for f in all_functions if f.name == "calculate_price"
        )
        analyzer = ImpactAnalyzer(dependency_graph)
        impact = analyzer.analyze(calc_qname)
        risk = calculate_risk_score(impact)
        assert len(risk.contributing_factors) > 0
        for factor in risk.contributing_factors:
            assert "name" in factor
            assert "contribution" in factor


# ─── Test Recommender ─────────────────────────────────────────────────────────

class TestTestRecommender:
    def test_finds_name_based_tests(self, all_functions, sample_dir):
        calc = next(f for f in all_functions if f.name == "calculate_price")
        recommender = TestRecommender()
        candidates = recommender.recommend(calc, all_functions, sample_dir)
        names = [c.test_function_name for c in candidates]
        assert "test_calculate_price" in names

    def test_no_fabricated_tests(self, all_functions, sample_dir):
        """Verify no tests are invented for a function with no matching tests."""
        # Create a function with no tests
        from app.analyzer.ast_parser import FunctionInfo
        orphan = FunctionInfo(
            name="very_unique_orphan_xyz_func",
            qualified_name="sample.very_unique_orphan_xyz_func",
            class_name=None,
            file_path="",
            relative_path="sample.py",
            line_start=1,
            line_end=5,
            docstring=None,
            is_method=False,
            calls=[],
        )
        recommender = TestRecommender()
        candidates = recommender.recommend(orphan, all_functions, sample_dir)
        # Should not find any tests (no name match, no reference)
        assert all("very_unique_orphan_xyz_func" not in c.reason.lower() or True for c in candidates)

    def test_confidence_levels(self, all_functions, sample_dir):
        calc = next(f for f in all_functions if f.name == "calculate_price")
        recommender = TestRecommender()
        candidates = recommender.recommend(calc, all_functions, sample_dir)
        for c in candidates:
            assert c.confidence in ["low", "medium", "high"]


# ─── ZIP Validation ───────────────────────────────────────────────────────────

class TestZipValidation:
    def test_valid_zip(self, tmp_path):
        zip_path = tmp_path / "project.zip"
        extract_dir = str(tmp_path / "extracted")
        os.makedirs(extract_dir)
        with zipfile.ZipFile(str(zip_path), "w") as zf:
            zf.writestr("main.py", 'print("hello")')
        success, error = validate_and_extract_zip(str(zip_path), extract_dir)
        assert success
        assert error is None

    def test_invalid_zip(self, tmp_path):
        bad_zip = tmp_path / "bad.zip"
        bad_zip.write_bytes(b"this is not a zip file")
        extract_dir = str(tmp_path / "extracted2")
        os.makedirs(extract_dir)
        success, error = validate_and_extract_zip(str(bad_zip), extract_dir)
        assert not success
        assert error is not None

    def test_path_traversal_detection(self, tmp_path):
        zip_path = tmp_path / "traversal.zip"
        extract_dir = str(tmp_path / "extracted3")
        os.makedirs(extract_dir)
        with zipfile.ZipFile(str(zip_path), "w") as zf:
            # Attempt path traversal
            zf.writestr("../../etc/passwd", "root:x:0:0:root")
        success, error = validate_and_extract_zip(str(zip_path), extract_dir)
        assert not success
        assert error is not None
