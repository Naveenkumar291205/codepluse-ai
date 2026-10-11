"""
Call Resolver Module
Resolves raw call names from AST to actual function identities
in the project. Uses conservative matching to avoid false positives.

Limitations:
- Cannot resolve dynamic dispatch (virtual methods, duck typing)
- Cannot resolve calls through getattr/reflection
- Cannot resolve monkey-patched names
- Multiple functions with the same name produce ambiguous matches
- Imports are not fully traced (inter-module calls may be missed)
"""
from typing import Dict, List, Optional, Set, Tuple
from app.analyzer.ast_parser import FunctionInfo


class CallResolver:
    """
    Resolves function call names to function identities within a project.
    Uses a name-based matching strategy with ambiguity tracking.
    """

    def __init__(self, all_functions: List[FunctionInfo]):
        self.all_functions = all_functions
        # Build lookup maps
        self._by_name: Dict[str, List[FunctionInfo]] = {}
        self._by_qualified_name: Dict[str, FunctionInfo] = {}
        self._build_indices()

    def _build_indices(self):
        """Build name-based lookup indices."""
        for func in self.all_functions:
            # Index by simple name
            name = func.name
            if name not in self._by_name:
                self._by_name[name] = []
            self._by_name[name].append(func)

            # Index by qualified name
            self._by_qualified_name[func.qualified_name] = func

    def resolve_calls(
        self, caller: FunctionInfo
    ) -> List[Tuple[FunctionInfo, str]]:
        """
        Resolve a function's calls to known project functions.

        Args:
            caller: The function whose calls to resolve

        Returns:
            List of (callee_function, call_type) tuples
        """
        resolved = []
        seen_callees: Set[str] = set()

        for call_name in caller.calls:
            # Skip self-calls
            if call_name == caller.name:
                continue

            candidates = self._by_name.get(call_name, [])

            # Only resolve if there is exactly one candidate (unambiguous)
            # For multiple candidates, we still include them but mark as ambiguous
            for candidate in candidates:
                # Skip self-reference
                if candidate.qualified_name == caller.qualified_name:
                    continue

                key = candidate.qualified_name
                if key not in seen_callees:
                    seen_callees.add(key)
                    call_type = "ambiguous" if len(candidates) > 1 else "direct"
                    resolved.append((candidate, call_type))

        return resolved


def resolve_all_calls(
    all_functions: List[FunctionInfo],
) -> List[Tuple[str, str, str]]:
    """
    Resolve all function calls across a project.

    Args:
        all_functions: All functions discovered in the project

    Returns:
        List of (caller_qualified_name, callee_qualified_name, call_type) tuples
    """
    resolver = CallResolver(all_functions)
    edges = []

    for func in all_functions:
        resolved = resolver.resolve_calls(func)
        for callee, call_type in resolved:
            edges.append((func.qualified_name, callee.qualified_name, call_type))

    return edges
