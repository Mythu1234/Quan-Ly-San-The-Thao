from __future__ import annotations

import os
import subprocess
from pathlib import Path
from typing import Sequence

import pytest


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"


def run_process(
    command: Sequence[str],
    *,
    cwd: Path = ROOT,
    timeout: int = 180,
) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    env.setdefault("PYTHONUTF8", "1")
    env.setdefault("NO_COLOR", "1")
    completed = subprocess.run(
        list(command),
        cwd=cwd,
        env=env,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        timeout=timeout,
        check=False,
    )
    if completed.returncode != 0:
        pytest.fail(
            f"Command failed with exit code {completed.returncode}: "
            f"{' '.join(command)}\n\n{completed.stdout}",
            pytrace=False,
        )
    return completed


@pytest.fixture(scope="session")
def repo_root() -> Path:
    return ROOT


@pytest.fixture(scope="session")
def backend_root() -> Path:
    return BACKEND


@pytest.fixture(scope="session")
def frontend_root() -> Path:
    return FRONTEND
