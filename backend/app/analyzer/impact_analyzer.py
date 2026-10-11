"""
Impact Analyzer Module
Performs change-impact analysis given a selected function.
Traverses the reverse call graph to identify potentially affected callers.
"""
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from app.analyzer.dependency_graph import DependencyGraph


@dataclass
class AffectedFunction:
    qualified_name: str
    name: str
    relative_path: str
    line_start: Optional[int]
    depth: int  # How many hops from the changed function


@dataclass
class ImpactResult:
    selected_function: str
    selected_qualified_name: str
    source_file: str
    line_start: Optional[int]
    line_end: Optional[int]

    direct_callers: List[str]
    all_affected: List[AffectedFunction]
    affected_count: int

    # Dependency paths from affected callers to the changed function
    sample_paths: List[List[str]]

    limitations: List[str] = field(default_factory=list)


LIMITATIONS = [
    "Dynamic dispatch and virtual method calls are not traced.",
    "Reflection-based calls (getattr, __call__) are not resolved.",
    "Monkey-patching and runtime code modification are not detected.",
    "Conditional imports and runtime-determined call targets are not followed.",
    "Functions in unsupported file types (e.g. .pyx, .so) are not analyzed.",
    "This is a static heuristic analysis; runtime behavior may differ.",
]


class ImpactAnalyzer:
    """
    Analyzes the potential change impact of modifying a function.
    """

    def __init__(self, graph: DependencyGraph):
        self.graph = graph

    def analyze(
        self,
        function_qualified_name: str,
        max_depth: Optional[int] = None,
    ) -> ImpactResult:
        """
        Analyze the impact of changing a given function.

        Args:
            function_qualified_name: Qualified name of the function to analyze
            max_depth: Maximum traversal depth for impact propagation

        Returns:
            ImpactResult with all affected callers and metadata
        """
        func_info = self.graph.get_function_info(function_qualified_name)

        selected_name = function_qualified_name.split(".")[-1]
        source_file = ""
        line_start = None
        line_end = None

        if func_info:
            selected_name = func_info.name
            source_file = func_info.relative_path
            line_start = func_info.line_start
            line_end = func_info.line_end

        # Get direct callers
        direct_callers = self.graph.get_direct_callers(function_qualified_name)

        # Get all reachable callers via BFS on reversed graph
        all_callers_with_depth = self.graph.get_all_reachable_callers(
            function_qualified_name, max_depth=max_depth
        )

        # Build affected function objects
        affected_functions = []
        for qname, depth in sorted(
            all_callers_with_depth.items(), key=lambda x: x[1]
        ):
            caller_info = self.graph.get_function_info(qname)
            affected_functions.append(
                AffectedFunction(
                    qualified_name=qname,
                    name=qname.split(".")[-1],
                    relative_path=caller_info.relative_path if caller_info else "",
                    line_start=caller_info.line_start if caller_info else None,
                    depth=depth,
                )
            )

        # Collect sample paths (up to 3 paths from direct callers)
        sample_paths = []
        for caller in direct_callers[:3]:
            paths = self.graph.find_paths(caller, function_qualified_name, max_paths=1)
            sample_paths.extend(paths)

        return ImpactResult(
            selected_function=selected_name,
            selected_qualified_name=function_qualified_name,
            source_file=source_file,
            line_start=line_start,
            line_end=line_end,
            direct_callers=direct_callers,
            all_affected=affected_functions,
            affected_count=len(affected_functions),
            sample_paths=sample_paths,
            limitations=LIMITATIONS,
        )

    def to_dict(self, result: ImpactResult) -> Dict[str, Any]:
        """Serialize ImpactResult to a dictionary."""
        return {
            "selected_function": result.selected_function,
            "selected_qualified_name": result.selected_qualified_name,
            "source_file": result.source_file,
            "line_start": result.line_start,
            "line_end": result.line_end,
            "direct_callers": result.direct_callers,
            "all_affected": [
                {
                    "qualified_name": a.qualified_name,
                    "name": a.name,
                    "relative_path": a.relative_path,
                    "line_start": a.line_start,
                    "depth": a.depth,
                }
                for a in result.all_affected
            ],
            "affected_count": result.affected_count,
            "sample_paths": result.sample_paths,
            "limitations": result.limitations,
        }
