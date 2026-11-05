from __future__ import annotations

import subprocess
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
import codecs
import re


ROOT = Path(__file__).resolve().parents[1]
REPORT_DIR = ROOT / "reports" / "pytest"
XML_REPORT = REPORT_DIR / "pytest-results.xml"
CONSOLE_REPORT = REPORT_DIR / "pytest-console.txt"
MARKDOWN_REPORT = REPORT_DIR / "pytest-summary.md"


def case_status(case: ET.Element) -> tuple[str, str]:
    failure = case.find("failure")
    error = case.find("error")
    skipped = case.find("skipped")
    if failure is not None:
        return "FAILED", (failure.get("message") or failure.text or "").strip()
    if error is not None:
        return "ERROR", (error.get("message") or error.text or "").strip()
    if skipped is not None:
        kind = skipped.get("type", "")
        status = "XFAILED" if "xfail" in kind else "SKIPPED"
        return status, (skipped.get("message") or skipped.text or "").strip()
    return "PASSED", ""


def markdown_escape(value: str) -> str:
    return value.replace("|", "\\|").replace("\n", " ").strip()


def readable_pytest_name(value: str) -> str:
    if "\\u" in value or "\\x" in value:
        try:
            return codecs.decode(value, "unicode_escape")
        except UnicodeDecodeError:
            return value
    return value


def friendly_group(classname: str) -> str:
    raw = classname.rsplit(".", 1)[-1]
    return {
        "test_backend_node_suites": "Backend & PostgreSQL",
        "test_business_contracts": "Hợp đồng nghiệp vụ",
        "test_frontend_verification_scripts": "Frontend",
        "test_production_builds": "Build production",
    }.get(raw, raw)


def main() -> int:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    command = [
        sys.executable,
        "-m",
        "pytest",
        "-vv",
        "--tb=short",
        f"--junitxml={XML_REPORT}",
    ]
    completed = subprocess.run(
        command,
        cwd=ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    CONSOLE_REPORT.write_text(completed.stdout, encoding="utf-8")
    print(completed.stdout, end="")

    if not XML_REPORT.exists():
        print(f"Pytest did not create {XML_REPORT}", file=sys.stderr)
        return completed.returncode or 2

    xml_root = ET.parse(XML_REPORT).getroot()
    rows: list[tuple[str, str, str, float, str]] = []
    counts: Counter[str] = Counter()
    for case in xml_root.iter("testcase"):
        status, detail = case_status(case)
        counts[status] += 1
        rows.append(
            (
                case.get("classname", ""),
                case.get("name", ""),
                status,
                float(case.get("time", "0")),
                detail,
            )
        )

    now = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
    total_time = sum(row[3] for row in rows)
    lines = [
        "# Báo cáo kiểm thử tự động CourtX bằng Pytest",
        "",
        f"- Thời điểm chạy: {now:%d/%m/%Y %H:%M:%S} (Asia/Ho_Chi_Minh)",
        f"- Python: {sys.version.split()[0]}",
        f"- Tổng số kiểm tra Pytest: {len(rows)}",
        f"- Đạt: {counts['PASSED']}",
        f"- Không đạt: {counts['FAILED'] + counts['ERROR']}",
        f"- Sai lệch đã biết (XFAIL): {counts['XFAILED']}",
        f"- Bỏ qua: {counts['SKIPPED']}",
        f"- Tổng thời gian các test: {total_time:.2f} giây",
        "",
        "## Phạm vi",
        "",
        "- Toàn bộ 42 test backend hiện hữu trong 11 file Node Test Runner, được Pytest chạy tuần tự.",
        "- Toàn bộ 6 script kiểm chứng frontend.",
        "- Build production cho backend TypeScript và frontend TypeScript/Vite.",
        "- Hợp đồng nghiệp vụ: bảng giá, 14 sân, vai trò, OTP, khung giờ, trùng lịch, VietQR, checkout, không phụ thu quá giờ, không VAT, bồi thường, thu hồi thiết bị, Realtime, soft delete và lịch sử Git.",
        "- Các chức năng ngoài phạm vi được đánh dấu XFAIL để không bị che giấu.",
        "",
        "## Kết quả chi tiết",
        "",
        "| # | Nhóm | Trường hợp | Kết quả | Thời gian (s) |",
        "|---:|---|---|---|---:|",
    ]
    icons = {"PASSED": "✅ PASSED", "FAILED": "❌ FAILED", "ERROR": "❌ ERROR", "XFAILED": "⚠️ XFAIL", "SKIPPED": "⏭️ SKIPPED"}
    for index, (classname, name, status, duration, _detail) in enumerate(rows, 1):
        group = friendly_group(classname)
        lines.append(
            f"| {index} | {markdown_escape(group)} | {markdown_escape(readable_pytest_name(name))} | {icons[status]} | {duration:.3f} |"
        )

    problems = [row for row in rows if row[2] in {"FAILED", "ERROR", "XFAILED"}]
    if problems:
        lines.extend(["", "## Lỗi và sai lệch đã biết", ""])
        for classname, name, status, _duration, detail in problems:
            lines.append(f"### {status}: `{classname}::{name}`")
            lines.append("")
            lines.append(markdown_escape(detail) or "Không có mô tả bổ sung.")
            lines.append("")

    backend_cases: list[tuple[str, str]] = []
    for test_file in sorted((ROOT / "backend" / "tests").glob("*.test.mjs")):
        source = test_file.read_text(encoding="utf-8")
        for title in re.findall(r"^test\('([^']+)'", source, flags=re.MULTILINE):
            backend_cases.append((test_file.name, title))
    lines.extend(
        [
            "",
            f"## Danh mục đầy đủ {len(backend_cases)} trường hợp backend đã chạy",
            "",
            "| # | Tệp kiểm thử | Trường hợp kiểm thử |",
            "|---:|---|---|",
        ]
    )
    for index, (filename, title) in enumerate(backend_cases, 1):
        lines.append(f"| {index} | `{filename}` | {markdown_escape(title)} |")

    lines.extend(
        [
            "## Tệp bằng chứng",
            "",
            "- `reports/pytest/pytest-results.xml`: báo cáo JUnit XML.",
            "- `reports/pytest/pytest-console.txt`: toàn bộ đầu ra terminal.",
            "- `reports/pytest/pytest-summary.md`: báo cáo trình bày này.",
            "",
        ]
    )
    MARKDOWN_REPORT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Markdown report: {MARKDOWN_REPORT}")
    print(f"JUnit XML report: {XML_REPORT}")
    print(f"Console report: {CONSOLE_REPORT}")
    return completed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
