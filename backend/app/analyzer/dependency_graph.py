"""
Dependency Graph Module
Builds and analyzes a directed call graph using NetworkX.
Provides reverse traversal for change-impact analysis.
"""
from itertools import islice
from typing import Any, Dict, List, Optional, Set, Tuple
import networkx as nx

from app.analyzer.ast_parser import FunctionInfo
from app.analyzer.call_resolver import resolve_all_calls


class DependencyGraph:
    """
    Directed call graph of Python functions.

    Direction: caller → callee
    For impact analysis of callee changes, traverse reverse edges.
    """

    def __init__(self):
        self._graph: nx.DiGraph = nx.DiGraph()
        self._functions: Dict[str, FunctionInfo] = {}

    def build(self, all_functions: List[FunctionInfo]) -> None:
        """
        Build the graph from a list of functions.

        Args:
            all_functions: All functions discovered in the project
        """
        self._graph.clear()
        self._functions = {f.qualified_name: f for f in all_functions}

        # Add all functions as nodes
        for func in all_functions:
            self._graph.add_node(
                func.qualified_name,
                name=func.name,
                qualified_name=func.qualified_name,
                file_path=func.file_path,
                relative_path=func.relative_path,
                line_start=func.line_start,
                line_end=func.line_end,
                class_name=func.class_name,
                is_method=func.is_method,
            )

        # Resolve and add edges
        edges = resolve_all_calls(all_functions)
        for caller_qname, callee_qname, call_type in edges:
            if caller_qname in self._graph and callee_qname in self._graph:
                self._graph.add_edge(caller_qname, callee_qname, call_type=call_type)

    def get_direct_callers(self, function_qname: str) -> List[str]:
        """Get functions that directly call the given function."""
        if function_qname not in self._graph:
            return []
        return list(self._graph.predecessors(function_qname))

    def get_direct_callees(self, function_qname: str) -> List[str]:
        """Get functions that the given function directly calls."""
        if function_qname not in self._graph:
            return []
        return list(self._graph.successors(function_qname))

    def get_all_reachable_callers(
        self, function_qname: str, max_depth: Optional[int] = None
    ) -> Dict[str, int]:
        """
        Get all functions that can transitively reach the given function
        (i.e., all callers that may be affected if this function changes).

        Uses BFS on the reversed graph to avoid infinite loops with cycles.

        Args:
            function_qname: The function being changed
            max_depth: Maximum traversal depth (None = unlimited)

        Returns:
            Dict of {qualified_name: depth} for all reachable callers
        """
        if function_qname not in self._graph:
            return {}

        reversed_graph = self._graph.reverse(copy=False)
        reachable = {}

        visited: Set[str] = {function_qname}
        queue = [(function_qname, 0)]

        while queue:
            current, depth = queue.pop(0)
            if max_depth is not None and depth > max_depth:
                continue

            for predecessor in reversed_graph.successors(current):
                if predecessor not in visited:
                    visited.add(predecessor)
                    reachable[predecessor] = depth + 1
                    queue.append((predecessor, depth + 1))

        return reachable

    def get_graph_data(self) -> Dict[str, Any]:
        """
        Export graph data in a format suitable for React Flow rendering.

        Returns:
            Dict with 'nodes' and 'edges' lists
        """
        nodes = []
        for node_id, data in self._graph.nodes(data=True):
            nodes.append({
                "id": node_id,
                "data": {
                    "label": data.get("name", node_id),
                    "qualified_name": node_id,
                    "relative_path": data.get("relative_path", ""),
                    "line_start": data.get("line_start"),
                    "line_end": data.get("line_end"),
                    "class_name": data.get("class_name"),
                    "is_method": data.get("is_method", False),
                },
                "type": "functionNode",
            })

        edges = []
        for i, (source, target, data) in enumerate(self._graph.edges(data=True)):
            edges.append({
                "id": f"e{i}_{source[:20]}_{target[:20]}",
                "source": source,
                "target": target,
                "data": {"call_type": data.get("call_type", "direct")},
                "type": "smoothstep",
            })

        return {"nodes": nodes, "edges": edges}

    def node_count(self) -> int:
        return self._graph.number_of_nodes()

    def edge_count(self) -> int:
        return self._graph.number_of_edges()

    def has_function(self, qualified_name: str) -> bool:
        return qualified_name in self._graph

    def get_function_info(self, qualified_name: str) -> Optional[FunctionInfo]:
        return self._functions.get(qualified_name)

    def find_paths(
        self, source: str, target: str, max_paths: int = 5
    ) -> List[List[str]]:
        """Find dependency paths from source to target (caller to callee)."""
        try:
            paths = list(
                islice(
                    nx.all_simple_paths(self._graph, source, target),
                    max_paths,
                )
            )
            return paths
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return []
