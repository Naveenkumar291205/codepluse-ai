"""
FastAPI Routes for CodePulse AI
"""
import os
import shutil
import tempfile
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.models.models import (
    AnalysisResult, Dependency, Function, Project, SourceFile, TestRecommendation
)
from app.schemas.schemas import (
    AnalysisHistoryItem, AnalysisHistoryResponse, AnalysisRequest, AnalysisResponse,
    DashboardStats, FunctionListResponse, FunctionResponse, GraphResponse,
    ProjectListResponse, ProjectResponse,
)
from app.services.analysis_service import process_project, run_analysis

router = APIRouter()


# ─── Health ───────────────────────────────────────────────────────────────────

@router.get("/health")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


# ─── Dashboard ────────────────────────────────────────────────────────────────

@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    total_projects = db.query(func.count(Project.id)).scalar() or 0
    total_functions = db.query(func.count(Function.id)).scalar() or 0
    total_analyses = db.query(func.count(AnalysisResult.id)).scalar() or 0
    high_priority = (
        db.query(func.count(AnalysisResult.id))
        .filter(AnalysisResult.risk_category.in_(["high", "critical"]))
        .scalar()
        or 0
    )
    return DashboardStats(
        total_projects=total_projects,
        total_functions=total_functions,
        total_analyses=total_analyses,
        high_priority_analyses=high_priority,
    )


@router.get("/dashboard/recent-analyses")
async def get_recent_analyses(limit: int = 5, db: Session = Depends(get_db)):
    analyses = (
        db.query(AnalysisResult)
        .order_by(desc(AnalysisResult.created_at))
        .limit(limit)
        .all()
    )
    results = []
    for a in analyses:
        project = db.query(Project).filter(Project.id == a.project_id).first()
        results.append({
            "id": a.id,
            "project_id": a.project_id,
            "project_name": project.name if project else "Unknown",
            "function_name": a.function_name,
            "risk_score": a.risk_score,
            "risk_category": a.risk_category,
            "affected_count": a.affected_count,
            "created_at": a.created_at.isoformat(),
        })
    return {"analyses": results}


# ─── Projects ─────────────────────────────────────────────────────────────────

@router.post("/projects/upload", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def upload_project(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # Validate file type
    if not file.filename or not file.filename.endswith(".zip"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only ZIP files are accepted",
        )

    # Validate file size
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    contents = await file.read()
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    # Save to temp file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        delete=False, suffix=".zip", dir=settings.UPLOAD_DIR
    ) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    # Create project record
    project_name = file.filename.replace(".zip", "").replace("_", " ").title()
    project = Project(
        name=project_name,
        original_filename=file.filename,
        file_path=tmp_path,
        status="uploaded",
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Process the project
    process_project(project, tmp_path, db)
    db.refresh(project)

    return project


@router.get("/projects", response_model=ProjectListResponse)
async def list_projects(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    total = db.query(func.count(Project.id)).scalar() or 0
    projects = (
        db.query(Project)
        .order_by(desc(Project.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return ProjectListResponse(projects=projects, total=total)


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    # Clean up uploaded file
    if project.file_path and os.path.exists(project.file_path):
        os.remove(project.file_path)
    db.delete(project)
    db.commit()


@router.get("/projects/{project_id}/files")
async def get_project_files(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    files = db.query(SourceFile).filter(SourceFile.project_id == project_id).all()
    return {
        "files": [
            {
                "id": f.id,
                "relative_path": f.relative_path,
                "has_syntax_error": f.has_syntax_error,
                "syntax_error_message": f.syntax_error_message,
                "function_count": f.function_count,
            }
            for f in files
        ],
        "total": len(files),
    }


@router.get("/projects/{project_id}/functions", response_model=FunctionListResponse)
async def get_project_functions(
    project_id: int,
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    query = db.query(Function).filter(Function.project_id == project_id)
    if search:
        query = query.filter(Function.name.ilike(f"%{search}%"))

    total = query.count()
    functions = query.offset(skip).limit(limit).all()

    result = []
    for f in functions:
        result.append(
            FunctionResponse(
                id=f.id,
                name=f.name,
                qualified_name=f.qualified_name,
                class_name=f.class_name,
                line_start=f.line_start,
                line_end=f.line_end,
                docstring=f.docstring,
                is_method=f.is_method,
                source_file_path=f.source_file.relative_path if f.source_file else "",
            )
        )

    return FunctionListResponse(functions=result, total=total)


@router.get("/projects/{project_id}/graph")
async def get_project_graph(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Project not ready for analysis (status: {project.status})",
        )

    functions = db.query(Function).filter(Function.project_id == project_id).all()
    dependencies = db.query(Dependency).filter(Dependency.project_id == project_id).all()

    # Build nodes
    nodes = []
    for i, f in enumerate(functions):
        nodes.append({
            "id": f.qualified_name,
            "data": {
                "label": f.name,
                "qualified_name": f.qualified_name,
                "relative_path": f.source_file.relative_path if f.source_file else "",
                "line_start": f.line_start,
                "line_end": f.line_end,
                "class_name": f.class_name,
                "is_method": f.is_method,
            },
            "type": "functionNode",
        })

    # Build edges
    edges = []
    for i, dep in enumerate(dependencies):
        edges.append({
            "id": f"e{i}",
            "source": dep.caller.qualified_name,
            "target": dep.callee.qualified_name,
            "data": {"call_type": dep.call_type},
            "type": "smoothstep",
        })

    return {
        "nodes": nodes,
        "edges": edges,
        "node_count": len(nodes),
        "edge_count": len(edges),
    }


# ─── Analysis ─────────────────────────────────────────────────────────────────

@router.post("/projects/{project_id}/analyze")
async def analyze_function(
    project_id: int,
    request: AnalysisRequest,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Project not ready (status: {project.status})",
        )

    # Verify function exists
    func = db.query(Function).filter(
        Function.project_id == project_id,
        Function.qualified_name == request.function_qualified_name,
    ).first()
    if not func:
        raise HTTPException(
            status_code=404,
            detail=f"Function '{request.function_qualified_name}' not found in project",
        )

    try:
        result = run_analysis(
            project_id=project_id,
            function_qualified_name=request.function_qualified_name,
            use_ai=request.use_ai,
            db=db,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}",
        )


@router.get("/projects/{project_id}/history")
async def get_project_history(
    project_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    analyses = (
        db.query(AnalysisResult)
        .filter(AnalysisResult.project_id == project_id)
        .order_by(desc(AnalysisResult.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "history": [
            {
                "id": a.id,
                "function_name": a.function_name,
                "function_qualified_name": a.function_qualified_name,
                "risk_score": a.risk_score,
                "risk_category": a.risk_category,
                "affected_count": a.affected_count,
                "recommendation_count": a.recommendation_count,
                "status": a.status,
                "created_at": a.created_at.isoformat(),
            }
            for a in analyses
        ],
        "total": len(analyses),
    }


@router.get("/history")
async def get_all_history(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    total = db.query(func.count(AnalysisResult.id)).scalar() or 0
    analyses = (
        db.query(AnalysisResult)
        .order_by(desc(AnalysisResult.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )
    items = []
    for a in analyses:
        project = db.query(Project).filter(Project.id == a.project_id).first()
        items.append({
            "id": a.id,
            "project_id": a.project_id,
            "project_name": project.name if project else "Unknown",
            "function_name": a.function_name,
            "function_qualified_name": a.function_qualified_name,
            "risk_score": a.risk_score,
            "risk_category": a.risk_category,
            "affected_count": a.affected_count,
            "recommendation_count": a.recommendation_count,
            "status": a.status,
            "created_at": a.created_at.isoformat(),
        })
    return {"history": items, "total": total}


@router.get("/analyses/{analysis_id}")
async def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    analysis = db.query(AnalysisResult).filter(AnalysisResult.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    recommendations = (
        db.query(TestRecommendation)
        .filter(TestRecommendation.analysis_id == analysis_id)
        .all()
    )

    return {
        "id": analysis.id,
        "project_id": analysis.project_id,
        "function_name": analysis.function_name,
        "function_qualified_name": analysis.function_qualified_name,
        "risk_score": analysis.risk_score,
        "risk_category": analysis.risk_category,
        "affected_count": analysis.affected_count,
        "recommendation_count": analysis.recommendation_count,
        "ai_explanation": analysis.ai_explanation,
        "analysis_data": analysis.analysis_data,
        "status": analysis.status,
        "created_at": analysis.created_at.isoformat(),
        "test_recommendations": [
            {
                "id": r.id,
                "test_function_name": r.test_function_name,
                "test_file_path": r.test_file_path,
                "reason": r.reason,
                "evidence": r.evidence,
                "confidence": r.confidence,
            }
            for r in recommendations
        ],
    }
