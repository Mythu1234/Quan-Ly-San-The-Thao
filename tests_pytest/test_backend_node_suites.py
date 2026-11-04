from __future__ import annotations

import re
from pathlib import Path

import pytest

from conftest import run_process


BACKEND_TEST_FILES = (
    "booking-payment.test.mjs",
    "customer-lookup.test.mjs",
    "equipment-catalog.test.mjs",
    "equipment-court-removal.test.mjs",
    "equipment-prices-and-codes.test.mjs",
    "facility-database.test.mjs",
    "incident-processing-status.test.mjs",
    "normalize-booking-codes.test.mjs",
    "normalize-customer-codes.test.mjs",
    "rental-payment.test.mjs",
    "staff-auth.test.mjs",
)


@pytest.mark.backend
def test_backend_inventory_contains_all_42_declared_cases(backend_root: Path) -> None:
    declared = 0
    for filename in BACKEND_TEST_FILES:
        source = (backend_root / "tests" / filename).read_text(encoding="utf-8")
        declared += len(re.findall(r"^test\(", source, flags=re.MULTILINE))
    assert declared == 42, f"Expected 42 declared backend cases, found {declared}."


@pytest.mark.backend
@pytest.mark.parametrize("filename", BACKEND_TEST_FILES, ids=lambda value: value.removesuffix(".test.mjs"))
def test_backend_node_suite(backend_root: Path, filename: str) -> None:
    completed = run_process(
        ["node", "--test", f"tests/{filename}"],
        cwd=backend_root,
        timeout=240,
    )
    assert re.search(r"ℹ fail 0\b", completed.stdout), completed.stdout
    assert not re.search(r"^✖", completed.stdout, flags=re.MULTILINE), completed.stdout
