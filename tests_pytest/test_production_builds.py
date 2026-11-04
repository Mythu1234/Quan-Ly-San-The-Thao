from __future__ import annotations

from pathlib import Path

import pytest

from conftest import run_process


@pytest.mark.parametrize("project", ("backend", "frontend"))
def test_production_build(repo_root: Path, project: str) -> None:
    completed = run_process(
        ["npm.cmd", "run", "build"],
        cwd=repo_root / project,
        timeout=300,
    )
    if project == "backend":
        assert "> tsc" in completed.stdout
    else:
        assert "built in" in completed.stdout
