"""
AST Parser Module
Parses Python source files using the ast module to extract
function definitions, method definitions, and function calls.

Limitations:
- Dynamic dispatch is not resolved
- Monkey-patching is not detected
- Reflection-based calls (getattr) are not traced
- Conditional imports may be missed
- Runtime-generated code is not analyzed
"""
import ast
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Tuple


@dataclass
class FunctionInfo:
    name: str
    qualified_name: str
    class_name: Optional[str]
    file_path: str
    relative_path: str
    line_start: int
    line_end: int
    docstring: Optional[str]
    is_method: bool
    calls: List[str] = field(default_factory=list)


@dataclass
class ParseResult:
    file_path: str
    relative_path: str
    functions: List[FunctionInfo] = field(default_factory=list)
    has_syntax_error: bool = False
    syntax_error_message: Optional[str] = None


class FunctionCallVisitor(ast.NodeVisitor):
    """Extracts all function call names from an AST node."""

    def __init__(self):
        self.calls: List[str] = []

    def visit_Call(self, node: ast.Call):
        call_name = self._extract_call_name(node)
        if call_name:
            self.calls.append(call_name)
        self.generic_visit(node)

    def _extract_call_name(self, node: ast.Call) -> Optional[str]:
        """Extract a human-readable name from a Call node."""
        if isinstance(node.func, ast.Name):
            return node.func.id
        elif isinstance(node.func, ast.Attribute):
            # e.g. self.method() -> method, obj.func() -> func
            return node.func.attr
        return None


class ASTParser:
    """Parses Python source files and extracts function information."""

    def parse_file(self, file_path: str, relative_path: str) -> ParseResult:
        """
        Parse a single Python file and extract all function definitions.

        Args:
            file_path: Absolute path to the Python file
            relative_path: Path relative to the project root

        Returns:
            ParseResult with extracted functions or error information
        """
        result = ParseResult(file_path=file_path, relative_path=relative_path)

        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                source = f.read()
        except OSError as e:
            result.has_syntax_error = True
            result.syntax_error_message = f"Cannot read file: {e}"
            return result

        try:
            tree = ast.parse(source, filename=file_path)
        except SyntaxError as e:
            result.has_syntax_error = True
            result.syntax_error_message = f"SyntaxError at line {e.lineno}: {e.msg}"
            return result

        # Extract module name from relative path
        module_name = self._path_to_module(relative_path)

        # Walk the top-level for functions and classes
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                class_functions = self._extract_class_methods(
                    node, module_name, file_path, relative_path
                )
                result.functions.extend(class_functions)
            elif isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                # Only top-level functions (not inside classes)
                if self._is_top_level(node, tree):
                    func_info = self._extract_function(
                        node, module_name, None, file_path, relative_path
                    )
                    result.functions.append(func_info)

        return result

    def _is_top_level(self, func_node: ast.AST, tree: ast.Module) -> bool:
        """Check if a function is directly at module level."""
        for node in ast.iter_child_nodes(tree):
            if node is func_node:
                return True
        return False

    def _extract_class_methods(
        self,
        class_node: ast.ClassDef,
        module_name: str,
        file_path: str,
        relative_path: str,
    ) -> List[FunctionInfo]:
        """Extract all method definitions from a class."""
        methods = []
        for node in ast.iter_child_nodes(class_node):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                func_info = self._extract_function(
                    node, module_name, class_node.name, file_path, relative_path
                )
                methods.append(func_info)
        return methods

    def _extract_function(
        self,
        node: ast.FunctionDef,
        module_name: str,
        class_name: Optional[str],
        file_path: str,
        relative_path: str,
    ) -> FunctionInfo:
        """Extract details from a function/method AST node."""
        qualified_name = self._build_qualified_name(module_name, class_name, node.name)

        # Extract calls from the function body
        call_visitor = FunctionCallVisitor()
        call_visitor.visit(node)
        calls = list(set(call_visitor.calls))

        # Get docstring
        docstring = ast.get_docstring(node)

        # Get line end
        line_end = getattr(node, "end_lineno", node.lineno)

        return FunctionInfo(
            name=node.name,
            qualified_name=qualified_name,
            class_name=class_name,
            file_path=file_path,
            relative_path=relative_path,
            line_start=node.lineno,
            line_end=line_end,
            docstring=docstring,
            is_method=class_name is not None,
            calls=calls,
        )

    def _path_to_module(self, relative_path: str) -> str:
        """Convert a file path to a Python module name."""
        # Remove .py extension and convert path separators
        module = relative_path.replace("\\", "/").replace("/", ".").rstrip(".py")
        if module.endswith(".py"):
            module = module[:-3]
        return module

    def _build_qualified_name(
        self, module: str, class_name: Optional[str], func_name: str
    ) -> str:
        """Build a qualified name like module.ClassName.method_name."""
        parts = [module] if module else []
        if class_name:
            parts.append(class_name)
        parts.append(func_name)
        return ".".join(parts)


def parse_project_files(
    file_list: List[Tuple[str, str]]
) -> List[ParseResult]:
    """
    Parse multiple Python files.

    Args:
        file_list: List of (absolute_path, relative_path) tuples

    Returns:
        List of ParseResult objects
    """
    parser = ASTParser()
    results = []
    for abs_path, rel_path in file_list:
        result = parser.parse_file(abs_path, rel_path)
        results.append(result)
    return results
