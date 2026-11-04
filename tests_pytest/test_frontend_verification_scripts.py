from __future__ import annotations

from pathlib import Path

import pytest

from conftest import run_process


FRONTEND_VERIFICATION_SCRIPTS = (
    "verifyBookingReceipt.cjs",
    "verifyCheckoutFlow.cjs",
    "verifyCourtAvailability.cjs",
    "verifyCourtLockWarnings.cjs",
    "verifyFacilityApi.cjs",
    "verifyIncidentFlow.cjs",
)


@pytest.mark.frontend
@pytest.mark.parametrize(
    "filename",
    FRONTEND_VERIFICATION_SCRIPTS,
    ids=lambda value: value.removeprefix("verify").removesuffix(".cjs"),
)
def test_frontend_verification_script(frontend_root: Path, filename: str) -> None:
    completed = run_process(
        ["node", f"scripts/{filename}"],
        cwd=frontend_root,
        timeout=300,
    )
    assert completed.stdout.strip(), "Verification script produced no diagnostic output."
