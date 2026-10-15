# AI AGENT & ASSISTANT GUIDELINES

## ⚠️ MANDATORY FIRST STEP FOR ALL AI AGENTS
Before analyzing, designing, writing code, or answering questions in this repository, you **MUST ALWAYS** read the following business requirement document first:

👉 **[`frontend/docs/BusinessRequirements.md`](frontend/docs/BusinessRequirements.md)**

### Key Business Rules & Invariants:
1. **Core Pricing:**
   - Cầu lông: `120.000 VNĐ / giờ` (1 ô sân cơ sở)
   - Bóng chuyền: `150.000 VNĐ / giờ` (4 ô sân liên tiếp bất kỳ)
   - Bóng đá mini: `200.000 VNĐ / giờ` (toàn bộ 8 ô sân)
2. **Dynamic Spatial Conversion:**
   - 8 physical court units (`SAN_01` to `SAN_08`).
   - Free conversion throughout operating hours (05:00 - 23:00). NO fixed badminton hours anymore.
3. **VIP Monthly Subscriptions:**
   - 3 - 6 months: -10% discount.
   - > 6 months: -15% discount.
   - Booked only by Staff / Admin at the desk. Flexible installment payments.
4. **Asset & Maintenance:**
   - Tracked individually by Serial/Asset ID (no total quantities).
   - Warranty & maintenance history tracked in dedicated tables.
5. **Staff & Shift Tasks:**
   - Daily shift task checklist assigned by Admin and completed by Staff.
