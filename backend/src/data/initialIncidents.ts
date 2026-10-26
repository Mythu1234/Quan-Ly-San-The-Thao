import { FacilityIncident } from '../types/facility.js';

export const INITIAL_INCIDENTS: FacilityIncident[] = [
  {
    id: 'SC-8921',
    courtId: 'SAN-03',
    courtName: 'Sân 03 (Trong nhà VIP)',
    courtZone: 'Khu A',
    courtSubtype: 'Sân Cầu Lông Tiêu Chuẩn Quốc Tế',
    isCourtLocked: true,
    equipmentCode: 'MATB-02',
    equipmentName: 'Thảm sàn Vinyl BWF 4.5mm',
    title: 'Sân 03 - Thảm Vinyl bong mép dán & Đèn LED Line 2 chập chờn',
    description: 'Đã điều kỹ thuật viên xử lý keo nóng và kiểm tra tụ điện trần Line 2 để bảo đảm an toàn cho các hiệp đấu tối.',
    severity: 'khan_cap',
    severityLabel: 'Khẩn cấp',
    status: 'dang_sua_chua',
    statusLabel: 'Đang sửa chữa',
    reportedAt: '07:15 • 24/10/2024',
    reporterName: 'Nguyễn Văn An',
    reporterRole: 'Nhân viên trực ca 1 • 05:00 - 11:00',
    reporterPhone: '0912.345.678',
    damageItems: [
      {
        id: 'DM-01',
        equipmentCode: 'MATB-02',
        title: 'Thảm Vinyl chuyên dụng 5 lớp',
        riskBadge: 'Nguy cơ cao',
        riskColor: 'rose',
        description: 'Bong mép dán 40cm khu vực góc giao bóng bên phải. Gờ cong vênh 1.5cm có thể gây vấp ngã hoặc rách dây chằng khi vận động viên di chuyển phanh gấp.',
        imageLabel: 'Hiện trường góc giao bóng',
        imageUrl: '/images/court_vinyl_damage.jpg'
      },
      {
        id: 'DM-02',
        equipmentCode: 'MATB-08',
        title: 'Hệ đèn LED 1000 Lux Line 2',
        riskBadge: 'Cần căn chỉnh',
        riskColor: 'blue',
        description: 'Nhấp nháy chập chờn do lỏng giắc cắm nguồn trần trên giàn đỡ số 2, gây chói mắt và không đủ chuẩn độ rọi tổ chức thi đấu.',
        imageLabel: 'Mô-đun đèn LED nhấp nháy',
        imageUrl: '/images/court_led_lights.jpg'
      }
    ],
    timelineLogs: [
      {
        id: 'TL-01',
        time: '08:00',
        title: 'Tiếp nhận & chuẩn bị vật tư dán nhiệt',
        description: 'Kỹ thuật viên Trần Minh Tuấn nhận điều động, mang bộ kích nhiệt keo chuyên dụng và thang thủy lực kiểm tra giắc nguồn.',
        active: true
      },
      {
        id: 'TL-02',
        time: '07:20',
        title: 'Khóa sân tự động & Phát cảnh báo',
        description: 'Hệ thống Master Lock kích hoạt đóng Sân 03. Gửi thông báo khẩn qua kênh điều phối Arena Admin.'
      },
      {
        id: 'TL-03',
        time: '07:15',
        title: 'Ghi nhận biên bản sự cố',
        description: 'Nguyễn Văn An kiểm tra ca sáng phát hiện sự cố bong sàn và chập giắc điện sau đợt dọn sân sớm.'
      }
    ],
    technicianNote: 'Đã hoàn thành 60% dán mép thảm, đang kiểm tra nguồn điện dàn đèn.'
  },
  {
    id: 'SC-8919',
    courtId: 'SAN-02',
    courtName: 'Sân 02 (Tiêu chuẩn A)',
    courtZone: 'Khu A',
    courtSubtype: 'Sân Cầu Lông Tiêu Chuẩn',
    isCourtLocked: false,
    equipmentCode: 'MATB-01',
    equipmentName: 'Lưới thi đấu Yonex Pro',
    title: 'Sân 02 - Lưới Yonex bị đứt dây căng góc trái',
    description: 'Dây thép định vị bị tưa sau trận bán kết. Đã xuất kho lưới dự phòng sẵn sàng thay thế trước 17:00.',
    severity: 'trung_binh',
    severityLabel: 'Trung bình',
    status: 'cho_xu_ly',
    statusLabel: 'Chờ xử lý',
    reportedAt: '09:15 Hôm qua',
    reporterName: 'Trần Quốc Bảo',
    reporterRole: 'Nhân viên trực ca 2 • 11:00 - 17:00',
    reporterPhone: '0988.112.233',
    damageItems: [
      {
        id: 'DM-03',
        equipmentCode: 'MATB-01',
        title: 'Bộ căng dây cáp lưới Yonex',
        riskBadge: 'Cần căn chỉnh',
        riskColor: 'amber',
        description: 'Dây cáp bọc nhựa bị xước đứt 3 tao cáp bên cọc số 1, độ căng giảm còn 65%.',
        imageLabel: 'Góc căng cáp cọc số 1'
      }
    ],
    timelineLogs: [
      {
        id: 'TL-04',
        time: '09:15',
        title: 'Ghi nhận sự cố lưới',
        description: 'Trần Quốc Bảo báo cáo cáp lưới trùng sau séc 3 giải phong trào.',
        active: true
      }
    ],
    technicianNote: 'Đã xuất kho lưới dự phòng MATB-06 để chuẩn bị căng thay thế.'
  },
  {
    id: 'SC-8915',
    courtId: 'SAN-04',
    courtName: 'Sân 04 (Tiêu chuẩn B)',
    courtZone: 'Khu B',
    courtSubtype: 'Sân Tập Luyện',
    isCourtLocked: false,
    equipmentCode: 'MATB-03',
    equipmentName: 'Bảng điểm lật tay kim loại',
    title: 'Sân 04 - Bảng điểm lật tay bị kẹt chốt lật số 7',
    description: 'Chốt số 7 bị rít do khô dầu. Kỹ thuật viên đã tra dầu mỡ bôi trơn và kiểm tra lật thử bình thường.',
    severity: 'thap',
    severityLabel: 'Thấp',
    status: 'da_khac_phuc',
    statusLabel: 'Đã khắc phục',
    reportedAt: '10:00 2 ngày trước',
    reporterName: 'Lê Thị Mai',
    reporterRole: 'Nhân viên phụ trách ca sáng',
    reporterPhone: '0903.456.789',
    timelineLogs: [
      {
        id: 'TL-05',
        time: '10:30',
        title: 'Đã nghiệm thu & kiểm tra lật số',
        description: 'Đã bôi trơn và kiểm tra lật mượt mà các số từ 00 đến 30.',
        active: true
      }
    ]
  }
];
