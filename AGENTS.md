# AI AGENT & ASSISTANT GUIDELINES

## ⚠️ MANDATORY FIRST STEP FOR ALL AI AGENTS
Before analyzing, designing, writing code, or answering questions in this repository, you **MUST ALWAYS** read the following business requirement document first:

👉 **[`frontend/docs/BusinessRequirements.md`](frontend/docs/BusinessRequirements.md)**

### Key Business Rules & Invariants:
1. **Core Pricing:**
   - Cầu lông: `120.000 VNĐ / giờ / sân`
   - Bóng chuyền: `150.000 VNĐ / giờ / sân`
   - Bóng đá mini: `200.000 VNĐ / giờ / sân`
2. **Court Structure & Admin Management:**
   - 5 Sân Cầu lông: `Sân CL-01` đến `Sân CL-05`
   - 5 Sân Bóng chuyền: `Sân BC-01` đến `Sân BC-05`
   - 4 Sân Bóng đá mini: `Sân BD-01` đến `Sân BD-04`
   - Chủ sân (Admin) có chức năng Thêm / Sửa / Xóa sân linh hoạt theo nhu cầu cơ sở.
3. **VIP Monthly Subscriptions:**
   - 3 - 6 months: -10% discount.
   - > 6 months: -15% discount.
   - Booked only by Staff / Admin at the desk. Flexible installment payments.
4. **Asset & Incident Liability (Bồi thường & Bảo hành):**
   - Tracked individually by Serial/Asset ID (no total quantities).
   - Incident classification: **Do khách làm hỏng** (áp dụng bồi thường theo Bảng giá niêm yết thu lúc Checkout) vs **Bảo hành của sân** (sân chịu 100% chi phí).
   - Automatic equipment recall to warehouse upon checkout.
5. **Staff & Account Management:**
   - Soft delete / account deactivation to preserve financial, incident, and operation history.
   - Staff accounts managed with credential setup and self-service password update.
   - No shift management in project scope.
