"""
Project Analysis Service
Orchestrates the complete analysis pipeline for an uploaded project.
"""
import os
import shutil
import tempfile
import zipfile
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.analyzer.source_discovery import discover_python_files, get_relative_path
from app.analyzer.ast_parser import parse_project_files, FunctionInfo
from app.analyzer.call_resolver import resolve_all_calls
from app.analyzer.dependency_graph import DependencyGraph
from app.analyzer.impact_analyzer import ImpactAnalyzer
from app.analyzer.risk_scoring import calculate_risk_score, risk_score_to_dict
from app.analyzer.test_recommender import recommend_tests
from app.analyzer.ai_explainer import generate_explanation
from app.core.config import settings
from app.models.models import (
    Project, SourceFile, Function, Dependency, AnalysisResult, TestRecommendation
)

MAX_UNCOMPRESSED_MB = 200
ALLOWED_EXTENSIONS = {".py", ".txt", ".md", ".cfg", ".toml", ".ini", ".yaml", ".yml", ".json"}


def validate_and_extract_zip(
    zip_path: str, extract_dir: str
) -> Tuple[bool, Optional[str]]:
    """
    Safely extract a ZIP archive to a directory.

    Returns (success, error_message)
    """
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            # Security checks
            names = zf.namelist()
            if len(names) > settings.MAX_FILES_IN_ARCHIVE:
                return False, f"Archive contains too many files ({len(names)} > {settings.MAX_FILES_IN_ARCHIVE})"

            # Check for path traversal
            extract_path = Path(extract_dir).resolve()
            total_size = 0
            for member in zf.infolist():
                # Path traversal check
                member_path = (extract_path / member.filename).resolve()
                if not str(member_path).startswith(str(extract_path)):
                    return False, f"Unsafe archive path detected: {member.filename}"

                total_size += member.file_size
                if total_size > MAX_UNCOMPRESSED_MB * 1024 * 1024:
                    return False, f"Archive would expand beyond {MAX_UNCOMPRESSED_MB}MB limit"

            zf.extractall(extract_dir)
            return True, None

    except zipfile.BadZipFile:
        return False, "Invalid or corrupted ZIP archive"
    except Exception as e:
        return False, f"Archive extraction error: {str(e)}"


def process_project(project: Project, zip_path: str, db: Session) -> Dict[str, Any]:
    """
    Process an uploaded project ZIP file:
    1. Extract archive
    2. Discover Python files
    3. Parse functions
    4. Build dependency graph
    5. Persist to database

    Returns processing results
    """
    project.status = "processing"
    db.commit()

    extract_dir = tempfile.mkdtemp(prefix="codepulse_")

    try:
        # Extract
        success, error = validate_and_extract_zip(zip_path, extract_dir)
        if not success:
            project.status = "error"
            project.error_message = error
            db.commit()
            return {"success": False, "error": error}

        # Find the actual project root (handle single top-level directory in ZIP)
        project_root = _find_project_root(extract_dir)

        # Discover Python files
        python_files = discover_python_files(project_root)

        if not python_files:
            project.status = "error"
            project.error_message = "No Python files found in the archive"
            db.commit()
            return {"success": False, "error": "No Python files found"}

        # Parse files
        file_pairs = [
            (f, get_relative_path(f, project_root)) for f in python_files
        ]
        parse_results = parse_project_files(file_pairs)

        # Persist source files and functions
        all_functions: List[FunctionInfo] = []
        func_db_map: Dict[str, Function] = {}  # qualified_name -> db Function

        for parse_result in parse_results:
            source_file = SourceFile(
                project_id=project.id,
                relative_path=parse_result.relative_path,
                has_syntax_error=parse_result.has_syntax_error,
                syntax_error_message=parse_result.syntax_error_message,
                function_count=len(parse_result.functions),
            )
            db.add(source_file)
            db.flush()

            for func_info in parse_result.functions:
                func_db = Function(
                    project_id=project.id,
                    source_file_id=source_file.id,
                    name=func_info.name,
                    qualified_name=func_info.qualified_name,
                    class_name=func_info.class_name,
                    line_start=func_info.line_start,
                    line_end=func_info.line_end,
                    docstring=func_info.docstring,
                    is_method=func_info.is_method,
                )
                db.add(func_db)
                db.flush()
                func_db_map[func_info.qualified_name] = func_db
                all_functions.append(func_info)

        # Build dependency graph
        graph = DependencyGraph()
        graph.build(all_functions)

        # Persist dependencies
        edges = resolve_all_calls(all_functions)
        for caller_qname, callee_qname, call_type in edges:
            caller_db = func_db_map.get(caller_qname)
            callee_db = func_db_map.get(callee_qname)
            if caller_db and callee_db:
                dep = Dependency(
                    project_id=project.id,
                    caller_id=caller_db.id,
                    callee_id=callee_db.id,
                    call_type=call_type,
                )
                db.add(dep)

        # Update project metadata
        project.total_files = len(parse_results)
        project.total_functions = len(all_functions)
        project.status = "ready"
        db.commit()

        return {
            "success": True,
            "total_files": project.total_files,
            "total_functions": project.total_functions,
            "dependency_count": len(edges),
        }

    except Exception as e:
        project.status = "error"
        project.error_message = f"Processing error: {str(e)}"
        db.commit()
        return {"success": False, "error": str(e)}

    finally:
        # Always clean up temp directory
        if os.path.exists(extract_dir):
            shutil.rmtree(extract_dir, ignore_errors=True)


def _find_project_root(extract_dir: str) -> str:
    """
    If the ZIP contained a single top-level directory, return that as the root.
    Otherwise return the extract directory itself.
    """
    entries = [
        e for e in os.listdir(extract_dir)
        if not e.startswith("__MACOSX") and not e.startswith(".")
    ]
    if len(entries) == 1:
        candidate = os.path.join(extract_dir, entries[0])
        if os.path.isdir(candidate):
            return candidate
    return extract_dir


def run_analysis(
    project_id: int,
    function_qualified_name: str,
    use_ai: bool,
    db: Session,
) -> Dict[str, Any]:
    """
    Run full change-impact analysis for a function.
    Persists result to database and returns analysis data.
    """
    # Rebuild graph from database
    from app.models.models import Function as FunctionModel, Dependency as DepModel

    functions_db = db.query(FunctionModel).filter(
        FunctionModel.project_id == project_id
    ).all()
    dependencies_db = db.query(DepModel).filter(
        DepModel.project_id == project_id
    ).all()

    # Reconstruct FunctionInfo objects
    func_map: Dict[int, FunctionInfo] = {}
    all_functions: List[FunctionInfo] = []
    for f in functions_db:
        fi = FunctionInfo(
            name=f.name,
            qualified_name=f.qualified_name,
            class_name=f.class_name,
            file_path=f.source_file.relative_path,
            relative_path=f.source_file.relative_path,
            line_start=f.line_start or 0,
            line_end=f.line_end or 0,
            docstring=f.docstring,
            is_method=f.is_method,
            calls=[],
        )
        func_map[f.id] = fi
        all_functions.append(fi)

    # Rebuild calls from dependencies
    qname_to_fi: Dict[str, FunctionInfo] = {fi.qualified_name: fi for fi in all_functions}
    for dep in dependencies_db:
        caller_fi = func_map.get(dep.caller_id)
        callee_fi = func_map.get(dep.callee_id)
        if caller_fi and callee_fi:
            if callee_fi.name not in caller_fi.calls:
                caller_fi.calls.append(callee_fi.name)

    # Build graph
    graph = DependencyGraph()
    graph.build(all_functions)

    # Analyze impact
    analyzer = ImpactAnalyzer(graph)
    impact = analyzer.analyze(function_qualified_name)

    # Calculate risk
    risk = calculate_risk_score(impact)

    # Recommend tests
    target_func_info = qname_to_fi.get(function_qualified_name)
    test_candidates = []
    if target_func_info:
        test_candidates = recommend_tests(target_func_info, all_functions, "")

    # Generate explanation
    explanation = generate_explanation(impact, risk, use_ai=use_ai)

    # Persist analysis result
    # Find function DB record
    func_db = db.query(FunctionModel).filter(
        FunctionModel.project_id == project_id,
        FunctionModel.qualified_name == function_qualified_name,
    ).first()

    analysis_data = {
        "impact": analyzer.to_dict(impact),
        "risk": risk_score_to_dict(risk),
        "graph_node_count": graph.node_count(),
        "graph_edge_count": graph.edge_count(),
    }

    analysis = AnalysisResult(
        project_id=project_id,
        function_id=func_db.id if func_db else None,
        function_name=impact.selected_function,
        function_qualified_name=function_qualified_name,
        risk_score=risk.score,
        risk_category=risk.category,
        affected_count=impact.affected_count,
        recommendation_count=len(test_candidates),
        ai_explanation=explanation,
        analysis_data=analysis_data,
        status="completed",
    )
    db.add(analysis)
    db.flush()

    # Persist test recommendations
    for tc in test_candidates:
        rec = TestRecommendation(
            analysis_id=analysis.id,
            test_function_name=tc.test_function_name,
            test_file_path=tc.test_file_path,
            reason=tc.reason,
            evidence=tc.evidence,
            confidence=tc.confidence,
        )
        db.add(rec)

    db.commit()
    db.refresh(analysis)

    return {
        "analysis_id": analysis.id,
        "impact": analyzer.to_dict(impact),
        "risk": risk_score_to_dict(risk),
        "test_recommendations": [
            {
                "test_function_name": tc.test_function_name,
                "test_file_path": tc.test_file_path,
                "reason": tc.reason,
                "evidence": tc.evidence,
                "confidence": tc.confidence,
            }
            for tc in test_candidates
        ],
        "explanation": explanation,
    }
