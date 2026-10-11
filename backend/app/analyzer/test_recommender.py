"""
Test Recommendation Engine
Discovers candidate test functions for a changed function using static signals.

Discovery strategy:
1. Test functions by naming convention (test_*, *_test)
2. Test files by naming convention (test_*.py, *_test.py)
3. Test functions that reference the changed function's name in their body
4. Test functions in the same module as the changed function's callers

Does NOT execute uploaded test code.
Does NOT claim coverage — only recommends candidates for review.
"""
import ast
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

from app.analyzer.ast_parser import FunctionInfo


@dataclass
class TestCandidate:
    test_function_name: str
    test_file_path: str
    reason: str
    evidence: str
    confidence: str  # low | medium | high


class TestRecommender:
    """
    Discovers test candidates for a given function using static signals.
    """

    def recommend(
        self,
        target_function: FunctionInfo,
        all_functions: List[FunctionInfo],
        project_root: str,
    ) -> List[TestCandidate]:
        """
        Find candidate tests for the target function.

        Args:
            target_function: The function being changed
            all_functions: All functions in the project
            project_root: Absolute path to the project root

        Returns:
            List of TestCandidate recommendations
        """
        candidates: List[TestCandidate] = []
        seen: set = set()

        # Signal 1: Name-based matching in test functions
        name_based = self._find_by_name_convention(target_function, all_functions)
        for c in name_based:
            key = (c.test_function_name, c.test_file_path)
            if key not in seen:
                seen.add(key)
                candidates.append(c)

        # Signal 2: Reference-based matching (function name appears in test body)
        reference_based = self._find_by_reference(
            target_function, all_functions, project_root
        )
        for c in reference_based:
            key = (c.test_function_name, c.test_file_path)
            if key not in seen:
                seen.add(key)
                candidates.append(c)

        # Signal 3: Tests in same module as direct callers
        caller_based = self._find_by_caller_module(target_function, all_functions)
        for c in caller_based:
            key = (c.test_function_name, c.test_file_path)
            if key not in seen:
                seen.add(key)
                candidates.append(c)

        # Sort: high confidence first
        priority = {"high": 0, "medium": 1, "low": 2}
        candidates.sort(key=lambda c: priority.get(c.confidence, 2))

        return candidates[:20]  # Cap at 20 recommendations

    def _is_test_function(self, name: str) -> bool:
        return name.startswith("test_") or name.endswith("_test")

    def _is_test_file(self, path: str) -> bool:
        basename = os.path.basename(path)
        return basename.startswith("test_") or basename.endswith("_test.py")

    def _find_by_name_convention(
        self,
        target: FunctionInfo,
        all_functions: List[FunctionInfo],
    ) -> List[TestCandidate]:
        """Find tests whose names include the target function name."""
        candidates = []
        target_name = target.name.lower()

        for func in all_functions:
            if not self._is_test_function(func.name):
                continue
            func_name_lower = func.name.lower()
            # e.g. test_calculate_price matches calculate_price
            if target_name in func_name_lower:
                candidates.append(
                    TestCandidate(
                        test_function_name=func.name,
                        test_file_path=func.relative_path,
                        reason=f"Test function name contains '{target.name}'",
                        evidence=f"Test: {func.name} | Target: {target.name}",
                        confidence="high",
                    )
                )

        return candidates

    def _find_by_reference(
        self,
        target: FunctionInfo,
        all_functions: List[FunctionInfo],
        project_root: str,
    ) -> List[TestCandidate]:
        """Find test functions whose source body references the target function name."""
        candidates = []

        for func in all_functions:
            if not self._is_test_function(func.name):
                continue
            if not self._is_test_file(func.relative_path):
                continue

            # Check if the target function's name appears in the test function's calls
            if target.name in func.calls:
                candidates.append(
                    TestCandidate(
                        test_function_name=func.name,
                        test_file_path=func.relative_path,
                        reason=f"Test function calls '{target.name}' directly",
                        evidence=f"Static call reference found in {func.name}",
                        confidence="high",
                    )
                )
            elif target.name.lower() in [c.lower() for c in func.calls]:
                candidates.append(
                    TestCandidate(
                        test_function_name=func.name,
                        test_file_path=func.relative_path,
                        reason=f"Test function references '{target.name}' (case-insensitive)",
                        evidence=f"Static reference found in {func.name}",
                        confidence="medium",
                    )
                )

        return candidates

    def _find_by_caller_module(
        self,
        target: FunctionInfo,
        all_functions: List[FunctionInfo],
    ) -> List[TestCandidate]:
        """
        Find test files that are in the same directory as callers of the target function.
        This is a low-confidence signal.
        """
        candidates = []

        # Get modules that call the target function
        caller_modules = set()
        for func in all_functions:
            if target.name in func.calls and not self._is_test_function(func.name):
                caller_modules.add(os.path.dirname(func.relative_path))

        # Find test files in those modules
        for func in all_functions:
            if not self._is_test_function(func.name):
                continue
            func_dir = os.path.dirname(func.relative_path)
            if func_dir in caller_modules:
                candidates.append(
                    TestCandidate(
                        test_function_name=func.name,
                        test_file_path=func.relative_path,
                        reason=f"Test is in the same directory as callers of '{target.name}'",
                        evidence=f"Structural proximity to caller module",
                        confidence="low",
                    )
                )

        return candidates


def recommend_tests(
    target_function: FunctionInfo,
    all_functions: List[FunctionInfo],
    project_root: str,
) -> List[TestCandidate]:
    """Convenience wrapper for TestRecommender."""
    recommender = TestRecommender()
    return recommender.recommend(target_function, all_functions, project_root)
