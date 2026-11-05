from __future__ import annotations

import re
from pathlib import Path

import pytest

from conftest import run_process


EXPECTED_PRICES = {
    "Cầu lông": 120_000,
    "Bóng chuyền": 150_000,
    "Bóng đá mini": 200_000,
}

EXPECTED_COURTS = (
    *(f"Sân CL-{index:02d}" for index in range(1, 6)),
    *(f"Sân BC-{index:02d}" for index in range(1, 6)),
    *(f"Sân BD-{index:02d}" for index in range(1, 5)),
)


def read(root: Path, relative: str) -> str:
    return (root / relative).read_text(encoding="utf-8")


@pytest.mark.contract
@pytest.mark.parametrize("sport,price", EXPECTED_PRICES.items(), ids=EXPECTED_PRICES.keys())
def test_standard_hourly_price(repo_root: Path, sport: str, price: int) -> None:
    schema = read(repo_root, "frontend/docs/supabase_schema.sql")
    pattern = rf"\([^\n]*'{re.escape(sport)}'\s*,\s*{price}\s*,"
    assert re.search(pattern, schema), f"Missing persisted standard price for {sport}: {price}."


@pytest.mark.contract
@pytest.mark.parametrize("court_name", EXPECTED_COURTS)
def test_initial_court_catalogue_contains_each_required_court(repo_root: Path, court_name: str) -> None:
    schema = read(repo_root, "frontend/docs/supabase_schema.sql")
    assert f"'{court_name}'" in schema


@pytest.mark.contract
def test_initial_court_catalogue_has_exact_required_set(repo_root: Path) -> None:
    schema = read(repo_root, "frontend/docs/supabase_schema.sql")
    seed = schema[schema.index("INSERT INTO san ") : schema.index("ON CONFLICT (ma_san)")]
    actual = set(re.findall(r"'(Sân (?:CL|BC|BD)-\d{2})'", seed))
    assert actual == set(EXPECTED_COURTS)


@pytest.mark.contract
def test_internal_roles_are_admin_and_staff(repo_root: Path) -> None:
    schema = read(repo_root, "frontend/docs/supabase_schema.sql")
    assert "CREATE TYPE vai_tro_noi_bo_enum AS ENUM ('ADMIN', 'STAFF')" in schema


@pytest.mark.contract
def test_customer_profile_is_passwordless(repo_root: Path) -> None:
    schema = read(repo_root, "frontend/docs/supabase_schema.sql")
    customer_table = schema.split("CREATE TABLE IF NOT EXISTS khach_hang", 1)[1].split(");", 1)[0]
    assert "so_dien_thoai" in customer_table
    assert "mat_khau" not in customer_table


@pytest.mark.contract
def test_booking_schema_has_persistent_foreign_keys(repo_root: Path) -> None:
    schema = read(repo_root, "frontend/docs/supabase_schema.sql")
    booking_table = schema.split("CREATE TABLE IF NOT EXISTS dat_san", 1)[1].split(");", 1)[0]
    for target in ("san(ma_san)", "khach_hang(ma_khach_hang)", "nhan_vien(ma_nhan_vien)"):
        assert f"REFERENCES {target}" in booking_table


@pytest.mark.contract
def test_booking_persists_historical_rate_and_total(repo_root: Path) -> None:
    schema = read(repo_root, "frontend/docs/supabase_schema.sql")
    booking_table = schema.split("CREATE TABLE IF NOT EXISTS dat_san", 1)[1].split(");", 1)[0]
    assert "don_gia_gio NUMERIC(12,2) NOT NULL" in booking_table
    assert "tong_tien_san NUMERIC(12,2) NOT NULL" in booking_table


@pytest.mark.contract
def test_booking_hours_and_half_hour_boundaries_are_enforced(repo_root: Path) -> None:
    migration = read(repo_root, "backend/migrations/20261103_booking_payment.sql")
    assert "v_start<'05:00'::time" in migration
    assert "v_end>'23:00'::time" in migration
    assert "mod(extract(epoch FROM v_start),1800)<>0" in migration
    assert "mod(extract(epoch FROM v_end),1800)<>0" in migration


@pytest.mark.contract
def test_overlapping_booking_is_rejected_in_database(repo_root: Path) -> None:
    migration = read(repo_root, "backend/migrations/20261103_booking_payment.sql")
    assert "gio_bat_dau<v_end AND gio_ket_thuc>v_start" in migration
    assert "Khung giờ đã có lượt đặt khác" in migration


@pytest.mark.contract
def test_booking_requires_full_confirmed_vietqr_payment(repo_root: Path) -> None:
    schema = read(repo_root, "frontend/docs/supabase_schema.sql")
    migration = read(repo_root, "backend/migrations/20261103_booking_payment.sql")
    assert "CREATE TYPE phuong_thuc_thanh_toan_enum AS ENUM ('VIETQR')" in schema
    assert "paymentConfirmed" in migration
    assert "v_total IS DISTINCT FROM (p_request->>'totalAmount')::numeric" in migration


@pytest.mark.contract
def test_no_overtime_surcharge_transaction_type_exists(repo_root: Path) -> None:
    schema = read(repo_root, "frontend/docs/supabase_schema.sql")
    expected = "CREATE TYPE loai_giao_dich_enum AS ENUM ('THANH_TOAN_DAT_SAN', 'THANH_TOAN_BOI_THUONG')"
    assert expected in schema
    assert "PHU_THU_QUA_GIO" not in schema


@pytest.mark.contract
def test_vat_invoice_and_tax_code_are_out_of_scope(repo_root: Path) -> None:
    schema = read(repo_root, "frontend/docs/supabase_schema.sql")
    assert "so_hoa_don_vat" not in schema
    assert "ma_so_thue" not in schema


@pytest.mark.contract
def test_checkout_only_creates_compensation_payment_when_amount_is_positive(repo_root: Path) -> None:
    migration = read(repo_root, "backend/migrations/20261103_facility_supabase.sql")
    assert "IF v_total>0 THEN" in migration
    assert "'THANH_TOAN_BOI_THUONG'" in migration
    assert "checkout chỉ thu bồi thường" in migration


@pytest.mark.contract
def test_incident_liability_has_only_customer_and_venue_branches(repo_root: Path) -> None:
    schema = read(repo_root, "frontend/docs/supabase_schema.sql")
    migration = read(repo_root, "backend/migrations/20261103_facility_supabase.sql")
    expected = "ENUM ('DO_KHACH_LAM_HONG', 'BAO_HANH_SAN_VAN_DONG')"
    assert expected in schema
    assert "CASE WHEN p_report->>'liability'='DO_KHACH_LAM_HONG' THEN v_price ELSE 0 END" in migration


@pytest.mark.contract
def test_checkout_recalls_equipment_without_resetting_damage_state(repo_root: Path) -> None:
    migration = read(repo_root, "backend/migrations/20261103_facility_supabase.sql")
    assert "UPDATE thiet_bi SET ma_san=NULL" in migration
    assert "trang_thai IN ('hong','bao_tri')" in migration


@pytest.mark.contract
def test_staff_delete_is_soft_deactivation(repo_root: Path) -> None:
    routes = read(repo_root, "backend/src/routes/employeeRoutes.ts")
    assert "router.delete('/:id'" in routes
    assert "{status:'inactive'}" in routes


@pytest.mark.contract
def test_staff_passwords_use_salted_scrypt(repo_root: Path) -> None:
    passwords = read(repo_root, "backend/src/services/passwords.ts")
    assert "randomBytes(16)" in passwords
    assert "scryptSync" in passwords
    assert "timingSafeEqual" in passwords


@pytest.mark.contract
def test_customer_phone_otp_guards_booking_and_cancellation(repo_root: Path) -> None:
    home = read(repo_root, "frontend/src/pages/TrangChu.tsx")
    assert "setOtpPhone(customerPhone)" in home
    assert "otpInput === '123456' || otpInput === bookingOtp" in home
    assert "setOtpAction('cancel')" in home
    assert "handleProceedCancelWithOTP" in home


@pytest.mark.contract
def test_cancellation_refund_xor_uses_24_hour_boundary(repo_root: Path) -> None:
    home = read(repo_root, "frontend/src/pages/TrangChu.tsx")
    admin_schedule = read(repo_root, "frontend/src/pages/AdminSchedulePage.tsx")
    assert "hoursUntilStart ?? 0) >= 24" in home
    assert "const isEligibleRefund = diffHours >= 24" in admin_schedule


@pytest.mark.contract
def test_payment_hold_countdown_and_40_second_reminder(repo_root: Path) -> None:
    home = read(repo_root, "frontend/src/pages/TrangChu.tsx")
    assert "useState<number>(60)" in home
    assert "paymentCd === 20" in home
    assert "paymentCd <= 0" in home


@pytest.mark.scope
@pytest.mark.xfail(
    strict=True,
    reason="Known gap: the 60-second hold is UI state; no server-side hold row/expiry RPC currently exists.",
)
def test_payment_hold_is_persisted_and_released_server_side(repo_root: Path) -> None:
    migrations = "\n".join(
        path.read_text(encoding="utf-8")
        for path in sorted((repo_root / "backend" / "migrations").glob("*.sql"))
    )
    assert re.search(r"court_hold|tam_giu_san|payment_session", migrations, flags=re.IGNORECASE)
    assert re.search(r"expires_at|het_han|interval\s+'60 seconds'", migrations, flags=re.IGNORECASE)


@pytest.mark.contract
def test_realtime_payment_confirm_and_cancel_events(repo_root: Path) -> None:
    mobile = read(repo_root, "frontend/src/components/MobilePaymentSimulator.tsx")
    home = read(repo_root, "frontend/src/pages/TrangChu.tsx")
    assert "payment_session_${params.sessionId}" in mobile
    for event in ("PAYMENT_CONFIRMED", "PAYMENT_CANCELLED"):
        assert f"event: '{event}'" in mobile
        assert f"{{ event: '{event}' }}" in home


@pytest.mark.contract
def test_git_history_exceeds_minimum_15_commits(repo_root: Path) -> None:
    completed = run_process(["git", "rev-list", "--count", "HEAD"], cwd=repo_root)
    assert int(completed.stdout.strip()) >= 15


@pytest.mark.scope
def test_vip_monthly_dashboard_has_no_active_login_transition(repo_root: Path) -> None:
    home = read(repo_root, "frontend/src/pages/TrangChu.tsx")
    assert "setIsVipLoggedIn(true)" not in home


@pytest.mark.scope
@pytest.mark.xfail(
    strict=True,
    reason="Known scope deviation: backend still exposes /api/shifts although shift management is excluded.",
)
def test_shift_management_is_not_exposed_by_backend(repo_root: Path) -> None:
    app = read(repo_root, "backend/src/app.ts")
    assert "app.use('/api/shifts'" not in app


@pytest.mark.scope
@pytest.mark.xfail(
    strict=True,
    reason="Known scope deviation: event booking currently applies percentage discounts instead of standard rates.",
)
def test_all_booking_flows_use_standard_rates_without_discounts(repo_root: Path) -> None:
    home = read(repo_root, "frontend/src/pages/TrangChu.tsx")
    assert "eventDiscountPercent" not in home
