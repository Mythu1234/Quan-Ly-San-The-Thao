# Báo cáo kiểm thử tự động CourtX bằng Pytest

- Thời điểm chạy: 05/11/2026 01:43:51 (Asia/Ho_Chi_Minh)
- Python: 3.12.2
- Tổng số kiểm tra Pytest: 61
- Đạt: 58
- Không đạt: 0
- Sai lệch đã biết (XFAIL): 3
- Bỏ qua: 0
- Tổng thời gian các test: 50.29 giây

## Phạm vi

- Toàn bộ 42 test backend hiện hữu trong 11 file Node Test Runner, được Pytest chạy tuần tự.
- Toàn bộ 6 script kiểm chứng frontend.
- Build production cho backend TypeScript và frontend TypeScript/Vite.
- Hợp đồng nghiệp vụ: bảng giá, 14 sân, vai trò, OTP, khung giờ, trùng lịch, VietQR, checkout, không phụ thu quá giờ, không VAT, bồi thường, thu hồi thiết bị, Realtime, soft delete và lịch sử Git.
- Các chức năng ngoài phạm vi được đánh dấu XFAIL để không bị che giấu.

## Kết quả chi tiết

| # | Nhóm | Trường hợp | Kết quả | Thời gian (s) |
|---:|---|---|---|---:|
| 1 | Backend & PostgreSQL | test_backend_inventory_contains_all_42_declared_cases | ✅ PASSED | 0.132 |
| 2 | Backend & PostgreSQL | test_backend_node_suite[booking-payment] | ✅ PASSED | 2.824 |
| 3 | Backend & PostgreSQL | test_backend_node_suite[customer-lookup] | ✅ PASSED | 0.818 |
| 4 | Backend & PostgreSQL | test_backend_node_suite[equipment-catalog] | ✅ PASSED | 0.692 |
| 5 | Backend & PostgreSQL | test_backend_node_suite[equipment-court-removal] | ✅ PASSED | 3.472 |
| 6 | Backend & PostgreSQL | test_backend_node_suite[equipment-prices-and-codes] | ✅ PASSED | 3.984 |
| 7 | Backend & PostgreSQL | test_backend_node_suite[facility-database] | ✅ PASSED | 2.464 |
| 8 | Backend & PostgreSQL | test_backend_node_suite[incident-processing-status] | ✅ PASSED | 2.158 |
| 9 | Backend & PostgreSQL | test_backend_node_suite[normalize-booking-codes] | ✅ PASSED | 4.291 |
| 10 | Backend & PostgreSQL | test_backend_node_suite[normalize-customer-codes] | ✅ PASSED | 3.185 |
| 11 | Backend & PostgreSQL | test_backend_node_suite[rental-payment] | ✅ PASSED | 0.604 |
| 12 | Backend & PostgreSQL | test_backend_node_suite[staff-auth] | ✅ PASSED | 1.752 |
| 13 | Hợp đồng nghiệp vụ | test_standard_hourly_price[Cầu lông] | ✅ PASSED | 0.054 |
| 14 | Hợp đồng nghiệp vụ | test_standard_hourly_price[Bóng chuyền] | ✅ PASSED | 0.002 |
| 15 | Hợp đồng nghiệp vụ | test_standard_hourly_price[Bóng đá mini] | ✅ PASSED | 0.002 |
| 16 | Hợp đồng nghiệp vụ | test_initial_court_catalogue_contains_each_required_court[Sân CL-01] | ✅ PASSED | 0.002 |
| 17 | Hợp đồng nghiệp vụ | test_initial_court_catalogue_contains_each_required_court[Sân CL-02] | ✅ PASSED | 0.002 |
| 18 | Hợp đồng nghiệp vụ | test_initial_court_catalogue_contains_each_required_court[Sân CL-03] | ✅ PASSED | 0.001 |
| 19 | Hợp đồng nghiệp vụ | test_initial_court_catalogue_contains_each_required_court[Sân CL-04] | ✅ PASSED | 0.001 |
| 20 | Hợp đồng nghiệp vụ | test_initial_court_catalogue_contains_each_required_court[Sân CL-05] | ✅ PASSED | 0.001 |
| 21 | Hợp đồng nghiệp vụ | test_initial_court_catalogue_contains_each_required_court[Sân BC-01] | ✅ PASSED | 0.001 |
| 22 | Hợp đồng nghiệp vụ | test_initial_court_catalogue_contains_each_required_court[Sân BC-02] | ✅ PASSED | 0.001 |
| 23 | Hợp đồng nghiệp vụ | test_initial_court_catalogue_contains_each_required_court[Sân BC-03] | ✅ PASSED | 0.001 |
| 24 | Hợp đồng nghiệp vụ | test_initial_court_catalogue_contains_each_required_court[Sân BC-04] | ✅ PASSED | 0.002 |
| 25 | Hợp đồng nghiệp vụ | test_initial_court_catalogue_contains_each_required_court[Sân BC-05] | ✅ PASSED | 0.002 |
| 26 | Hợp đồng nghiệp vụ | test_initial_court_catalogue_contains_each_required_court[Sân BD-01] | ✅ PASSED | 0.001 |
| 27 | Hợp đồng nghiệp vụ | test_initial_court_catalogue_contains_each_required_court[Sân BD-02] | ✅ PASSED | 0.001 |
| 28 | Hợp đồng nghiệp vụ | test_initial_court_catalogue_contains_each_required_court[Sân BD-03] | ✅ PASSED | 0.001 |
| 29 | Hợp đồng nghiệp vụ | test_initial_court_catalogue_contains_each_required_court[Sân BD-04] | ✅ PASSED | 0.001 |
| 30 | Hợp đồng nghiệp vụ | test_initial_court_catalogue_has_exact_required_set | ✅ PASSED | 0.002 |
| 31 | Hợp đồng nghiệp vụ | test_internal_roles_are_admin_and_staff | ✅ PASSED | 0.002 |
| 32 | Hợp đồng nghiệp vụ | test_customer_profile_is_passwordless | ✅ PASSED | 0.002 |
| 33 | Hợp đồng nghiệp vụ | test_booking_schema_has_persistent_foreign_keys | ✅ PASSED | 0.002 |
| 34 | Hợp đồng nghiệp vụ | test_booking_persists_historical_rate_and_total | ✅ PASSED | 0.002 |
| 35 | Hợp đồng nghiệp vụ | test_booking_hours_and_half_hour_boundaries_are_enforced | ✅ PASSED | 0.057 |
| 36 | Hợp đồng nghiệp vụ | test_overlapping_booking_is_rejected_in_database | ✅ PASSED | 0.001 |
| 37 | Hợp đồng nghiệp vụ | test_booking_requires_full_confirmed_vietqr_payment | ✅ PASSED | 0.001 |
| 38 | Hợp đồng nghiệp vụ | test_no_overtime_surcharge_transaction_type_exists | ✅ PASSED | 0.001 |
| 39 | Hợp đồng nghiệp vụ | test_vat_invoice_and_tax_code_are_out_of_scope | ✅ PASSED | 0.001 |
| 40 | Hợp đồng nghiệp vụ | test_checkout_only_creates_compensation_payment_when_amount_is_positive | ✅ PASSED | 0.041 |
| 41 | Hợp đồng nghiệp vụ | test_incident_liability_has_only_customer_and_venue_branches | ✅ PASSED | 0.001 |
| 42 | Hợp đồng nghiệp vụ | test_checkout_recalls_equipment_without_resetting_damage_state | ✅ PASSED | 0.002 |
| 43 | Hợp đồng nghiệp vụ | test_staff_delete_is_soft_deactivation | ✅ PASSED | 0.026 |
| 44 | Hợp đồng nghiệp vụ | test_staff_passwords_use_salted_scrypt | ✅ PASSED | 0.021 |
| 45 | Hợp đồng nghiệp vụ | test_customer_phone_otp_guards_booking_and_cancellation | ✅ PASSED | 0.105 |
| 46 | Hợp đồng nghiệp vụ | test_cancellation_refund_xor_uses_24_hour_boundary | ✅ PASSED | 0.072 |
| 47 | Hợp đồng nghiệp vụ | test_payment_hold_countdown_and_40_second_reminder | ✅ PASSED | 0.001 |
| 48 | Hợp đồng nghiệp vụ | test_payment_hold_is_persisted_and_released_server_side | ⚠️ XFAIL | 0.101 |
| 49 | Hợp đồng nghiệp vụ | test_realtime_payment_confirm_and_cancel_events | ✅ PASSED | 0.026 |
| 50 | Hợp đồng nghiệp vụ | test_git_history_exceeds_minimum_15_commits | ✅ PASSED | 0.092 |
| 51 | Hợp đồng nghiệp vụ | test_vip_monthly_dashboard_has_no_active_login_transition | ✅ PASSED | 0.001 |
| 52 | Hợp đồng nghiệp vụ | test_shift_management_is_not_exposed_by_backend | ⚠️ XFAIL | 0.018 |
| 53 | Hợp đồng nghiệp vụ | test_all_booking_flows_use_standard_rates_without_discounts | ⚠️ XFAIL | 0.039 |
| 54 | Frontend | test_frontend_verification_script[BookingReceipt] | ✅ PASSED | 0.387 |
| 55 | Frontend | test_frontend_verification_script[CheckoutFlow] | ✅ PASSED | 4.220 |
| 56 | Frontend | test_frontend_verification_script[CourtAvailability] | ✅ PASSED | 0.381 |
| 57 | Frontend | test_frontend_verification_script[CourtLockWarnings] | ✅ PASSED | 0.411 |
| 58 | Frontend | test_frontend_verification_script[FacilityApi] | ✅ PASSED | 0.432 |
| 59 | Frontend | test_frontend_verification_script[IncidentFlow] | ✅ PASSED | 0.368 |
| 60 | Build production | test_production_build[backend] | ✅ PASSED | 3.586 |
| 61 | Build production | test_production_build[frontend] | ✅ PASSED | 13.436 |

## Lỗi và sai lệch đã biết

### XFAILED: `tests_pytest.test_business_contracts::test_payment_hold_is_persisted_and_released_server_side`

Known gap: the 60-second hold is UI state; no server-side hold row/expiry RPC currently exists.

### XFAILED: `tests_pytest.test_business_contracts::test_shift_management_is_not_exposed_by_backend`

Known scope deviation: backend still exposes /api/shifts although shift management is excluded.

### XFAILED: `tests_pytest.test_business_contracts::test_all_booking_flows_use_standard_rates_without_discounts`

Known scope deviation: event booking currently applies percentage discounts instead of standard rates.


## Danh mục đầy đủ 42 trường hợp backend đã chạy

| # | Tệp kiểm thử | Trường hợp kiểm thử |
|---:|---|---|
| 1 | `booking-payment.test.mjs` | booking and VietQR payment persist together with database IDs and historical hourly rate |
| 2 | `booking-payment.test.mjs` | missing confirmation, bank reference, wrong price, occupied or locked court cannot create paid bookings |
| 3 | `booking-payment.test.mjs` | a payment insert failure rolls back the booking and new customer |
| 4 | `booking-payment.test.mjs` | sequential allocation retains existing historical IDs without renaming |
| 5 | `customer-lookup.test.mjs` | phone and code normalization accept exact identifiers only |
| 6 | `customer-lookup.test.mjs` | lookup filters Supabase by exact booking code or phone, with no demo fallback |
| 7 | `customer-lookup.test.mjs` | lookup uses stored amounts/status and Vietnam time instead of fixed sample values |
| 8 | `equipment-catalog.test.mjs` | new catalogue equipment saves its name, sport and compensation price without requiring a physical serial |
| 9 | `equipment-catalog.test.mjs` | missing prices and duplicate catalogue names are rejected before saving |
| 10 | `equipment-catalog.test.mjs` | catalogue API uses the saved equipment identity, sport and price, hiding unrelated old price rows |
| 11 | `equipment-catalog.test.mjs` | incident details use persisted equipment links instead of incomplete draft metadata, preserving photos |
| 12 | `equipment-catalog.test.mjs` | equipment mapping reads explicit price columns and preserves unknown purchase costs as missing |
| 13 | `equipment-catalog.test.mjs` | checkout charges catalogue price for customer damage and zero for venue liability without mutating a shared physical asset |
| 14 | `equipment-court-removal.test.mjs` | removing equipment court preserves atomic catalogue saves, check-in, damage checkout and shared catalogue reuse |
| 15 | `equipment-court-removal.test.mjs` | migration refuses to discard an existing physical court assignment |
| 16 | `equipment-prices-and-codes.test.mjs` | price columns and overlapping ID renumbering preserve references, costs, checkout history and original snapshots; rerun is safe |
| 17 | `equipment-prices-and-codes.test.mjs` | new form prices persist in explicit columns; Table Editor edits sync current prices without rewriting historical charges |
| 18 | `facility-database.test.mjs` | catalogue equipment and price save atomically, and checkout preserves its shared catalogue status |
| 19 | `facility-database.test.mjs` | check-in requires paid booking and an unlocked, available court; repeated check-in is safe |
| 20 | `facility-database.test.mjs` | checkout without damage recalls equipment and creates no extra payment |
| 21 | `facility-database.test.mjs` | customer damage uses database price; payment/price failures roll back reports and equipment changes |
| 22 | `facility-database.test.mjs` | incident timeline photos persist without replacing the report, court or historical price |
| 23 | `facility-database.test.mjs` | venue liability has no compensation payment but retains damage history and images |
| 24 | `facility-database.test.mjs` | existing report keeps historical price and may not be omitted at checkout |
| 25 | `facility-database.test.mjs` | serial identity, supplier, warranty and per-asset price persist; duplicate serial is rejected |
| 26 | `facility-database.test.mjs` | maintenance acceptance updates equipment and preserves one timeline entry on retry |
| 27 | `incident-processing-status.test.mjs` | processing progress is independent of liability, including legacy data and new reports |
| 28 | `normalize-booking-codes.test.mjs` | normalization preserves money, bank references, foreign keys and nested checkout history; rerun is safe |
| 29 | `normalize-booking-codes.test.mjs` | occupied destination aborts every change |
| 30 | `normalize-booking-codes.test.mjs` | a history write failure rolls back ID changes and restores original constraints |
| 31 | `normalize-customer-codes.test.mjs` | customer normalization preserves identity and all bookings, restores constraints and supports reruns |
| 32 | `normalize-customer-codes.test.mjs` | destination collision aborts without changing customers or booking links |
| 33 | `rental-payment.test.mjs` | database paid/in-use status means 100% paid for legacy missing rental rows; pending/cancelled/failed payments are not inferred paid |
| 34 | `rental-payment.test.mjs` | legacy payment normalization uses database amount and is safe for retry/concurrent actions and ID collisions |
| 35 | `rental-payment.test.mjs` | normalization never creates payments for pending/cancelled or partially/unsuccessfully paid rows, and surfaces failures |
| 36 | `rental-payment.test.mjs` | checkout validates stored payment instead of trusting a stale browser balance |
| 37 | `staff-auth.test.mjs` | password hashes are salted, verifiable and support legacy credentials |
| 38 | `staff-auth.test.mjs` | login reads database roles and correct accounts, never returns password, rejects disabled and old sample passwords |
| 39 | `staff-auth.test.mjs` | password change checks current password and updates only the logged account; new login uses saved password |
| 40 | `staff-auth.test.mjs` | database failure is surfaced instead of accepting local sample credentials |
| 41 | `staff-auth.test.mjs` | staff directory and details use exact database identity, two roles and no secret fields |
| 42 | `staff-auth.test.mjs` | directory edits persist canonical roles and hashed reset passwords on only the selected account |
## Tệp bằng chứng

- `reports/pytest/pytest-results.xml`: báo cáo JUnit XML.
- `reports/pytest/pytest-console.txt`: toàn bộ đầu ra terminal.
- `reports/pytest/pytest-summary.md`: báo cáo trình bày này.
