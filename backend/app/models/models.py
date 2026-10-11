"""
Database models for CodePulse AI
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey,
    Text, Boolean, Index, JSON
)
from sqlalchemy.orm import relationship, DeclarativeBase


class Base(DeclarativeBase):
    pass


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=True)
    status = Column(String(50), default="uploaded")  # uploaded, processing, ready, error
    total_files = Column(Integer, default=0)
    total_functions = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    source_files = relationship("SourceFile", back_populates="project", cascade="all, delete-orphan")
    functions = relationship("Function", back_populates="project", cascade="all, delete-orphan")
    dependencies = relationship("Dependency", back_populates="project", cascade="all, delete-orphan")
    analyses = relationship("AnalysisResult", back_populates="project", cascade="all, delete-orphan")


class SourceFile(Base):
    __tablename__ = "source_files"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    relative_path = Column(String(512), nullable=False)
    has_syntax_error = Column(Boolean, default=False)
    syntax_error_message = Column(Text, nullable=True)
    function_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="source_files")
    functions = relationship("Function", back_populates="source_file", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_source_files_project_id", "project_id"),
    )


class Function(Base):
    __tablename__ = "functions"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    source_file_id = Column(Integer, ForeignKey("source_files.id"), nullable=False)
    name = Column(String(255), nullable=False)
    qualified_name = Column(String(512), nullable=False)  # module.class.func
    class_name = Column(String(255), nullable=True)
    line_start = Column(Integer, nullable=True)
    line_end = Column(Integer, nullable=True)
    docstring = Column(Text, nullable=True)
    is_method = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="functions")
    source_file = relationship("SourceFile", back_populates="functions")
    caller_deps = relationship(
        "Dependency", foreign_keys="Dependency.caller_id",
        back_populates="caller", cascade="all, delete-orphan"
    )
    callee_deps = relationship(
        "Dependency", foreign_keys="Dependency.callee_id",
        back_populates="callee", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_functions_project_id", "project_id"),
        Index("ix_functions_name", "name"),
    )


class Dependency(Base):
    __tablename__ = "dependencies"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    caller_id = Column(Integer, ForeignKey("functions.id"), nullable=False)
    callee_id = Column(Integer, ForeignKey("functions.id"), nullable=False)
    call_type = Column(String(50), default="direct")  # direct, method, chained
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="dependencies")
    caller = relationship("Function", foreign_keys=[caller_id], back_populates="caller_deps")
    callee = relationship("Function", foreign_keys=[callee_id], back_populates="callee_deps")

    __table_args__ = (
        Index("ix_dependencies_project_id", "project_id"),
        Index("ix_dependencies_caller_id", "caller_id"),
        Index("ix_dependencies_callee_id", "callee_id"),
    )


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    function_id = Column(Integer, ForeignKey("functions.id"), nullable=True)
    function_name = Column(String(255), nullable=False)
    function_qualified_name = Column(String(512), nullable=False)
    risk_score = Column(Float, default=0.0)
    risk_category = Column(String(50), default="low")  # low, medium, high, critical
    affected_count = Column(Integer, default=0)
    recommendation_count = Column(Integer, default=0)
    ai_explanation = Column(Text, nullable=True)
    analysis_data = Column(JSON, nullable=True)
    status = Column(String(50), default="completed")
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="analyses")
    recommendations = relationship(
        "TestRecommendation", back_populates="analysis",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_analysis_project_id", "project_id"),
    )


class TestRecommendation(Base):
    __tablename__ = "test_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analysis_results.id"), nullable=False)
    test_function_name = Column(String(255), nullable=False)
    test_file_path = Column(String(512), nullable=False)
    reason = Column(Text, nullable=True)
    evidence = Column(Text, nullable=True)
    confidence = Column(String(50), default="medium")  # low, medium, high

    analysis = relationship("AnalysisResult", back_populates="recommendations")
