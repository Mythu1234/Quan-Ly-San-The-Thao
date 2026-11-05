// Utility to manage sports and courts dynamically with LocalStorage persistence and cross-component syncing

export interface SportCategoryItem {
  id: string; // e.g. 'badminton', 'volleyball', 'football', 'pickleball'
  name: string; // 'Cầu Lông', 'Bóng Chuyền', 'Bóng Đá Mini', 'Pickleball'
  icon: string; // '🏸', '🏐', '⚽', '🏓', etc.
  pricePerHour: number; // e.g. 120000, 150000, 200000
  prefix: string; // e.g. 'CL', 'BC', 'BD', 'PB'
}

export interface AdminCourtItem {
  id: string; // e.g. 'SAN_CL_01'
  code: string; // e.g. 'CL-01'
  name: string; // e.g. 'Sân CL-01'
  sportId: string;
  sportName: string;
  pricePerHour: number;
  priceLabel: string; // e.g. '120k/h'
}

export const DEFAULT_ADMIN_SPORTS: SportCategoryItem[] = [
  { id: 'badminton', name: 'Cầu Lông', icon: '🏸', pricePerHour: 120000, prefix: 'CL' },
  { id: 'volleyball', name: 'Bóng Chuyền', icon: '🏐', pricePerHour: 150000, prefix: 'BC' },
  { id: 'football', name: 'Bóng Đá Mini', icon: '⚽', pricePerHour: 200000, prefix: 'BD' },
];

export const DEFAULT_ADMIN_COURTS: AdminCourtItem[] = [
  // 5 Sân Cầu lông (CL-01 -> CL-05): 120.000 VND / giờ
  { id: 'SAN_CL_01', code: 'CL-01', name: 'Sân CL-01', sportId: 'badminton', sportName: 'Cầu Lông', pricePerHour: 120000, priceLabel: '120k/h' },
  { id: 'SAN_CL_02', code: 'CL-02', name: 'Sân CL-02', sportId: 'badminton', sportName: 'Cầu Lông', pricePerHour: 120000, priceLabel: '120k/h' },
  { id: 'SAN_CL_03', code: 'CL-03', name: 'Sân CL-03', sportId: 'badminton', sportName: 'Cầu Lông', pricePerHour: 120000, priceLabel: '120k/h' },
  { id: 'SAN_CL_04', code: 'CL-04', name: 'Sân CL-04', sportId: 'badminton', sportName: 'Cầu Lông', pricePerHour: 120000, priceLabel: '120k/h' },
  { id: 'SAN_CL_05', code: 'CL-05', name: 'Sân CL-05', sportId: 'badminton', sportName: 'Cầu Lông', pricePerHour: 120000, priceLabel: '120k/h' },

  // 5 Sân Bóng chuyền (BC-01 -> BC-05): 150.000 VND / giờ
  { id: 'SAN_BC_01', code: 'BC-01', name: 'Sân BC-01', sportId: 'volleyball', sportName: 'Bóng Chuyền', pricePerHour: 150000, priceLabel: '150k/h' },
  { id: 'SAN_BC_02', code: 'BC-02', name: 'Sân BC-02', sportId: 'volleyball', sportName: 'Bóng Chuyền', pricePerHour: 150000, priceLabel: '150k/h' },
  { id: 'SAN_BC_03', code: 'BC-03', name: 'Sân BC-03', sportId: 'volleyball', sportName: 'Bóng Chuyền', pricePerHour: 150000, priceLabel: '150k/h' },
  { id: 'SAN_BC_04', code: 'BC-04', name: 'Sân BC-04', sportId: 'volleyball', sportName: 'Bóng Chuyền', pricePerHour: 150000, priceLabel: '150k/h' },
  { id: 'SAN_BC_05', code: 'BC-05', name: 'Sân BC-05', sportId: 'volleyball', sportName: 'Bóng Chuyền', pricePerHour: 150000, priceLabel: '150k/h' },

  // 4 Sân Bóng đá mini (BD-01 -> BD-04): 200.000 VND / giờ
  { id: 'SAN_BD_01', code: 'BD-01', name: 'Sân BD-01', sportId: 'football', sportName: 'Bóng Đá Mini', pricePerHour: 200000, priceLabel: '200k/h' },
  { id: 'SAN_BD_02', code: 'BD-02', name: 'Sân BD-02', sportId: 'football', sportName: 'Bóng Đá Mini', pricePerHour: 200000, priceLabel: '200k/h' },
  { id: 'SAN_BD_03', code: 'BD-03', name: 'Sân BD-03', sportId: 'football', sportName: 'Bóng Đá Mini', pricePerHour: 200000, priceLabel: '200k/h' },
  { id: 'SAN_BD_04', code: 'BD-04', name: 'Sân BD-04', sportId: 'football', sportName: 'Bóng Đá Mini', pricePerHour: 200000, priceLabel: '200k/h' },
];

const STORAGE_SPORTS_KEY = 'courtx_admin_sports';
const STORAGE_COURTS_KEY = 'courtx_admin_courts';
export const COURTS_UPDATED_EVENT = 'courtx_courts_updated';

export const formatPriceLabel = (price: number): string => {
  if (price >= 1000) {
    const k = Math.round(price / 1000);
    return `${k}k/h`;
  }
  return `${price.toLocaleString('vi-VN')} đ/h`;
};

export const getAdminSports = (): SportCategoryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_SPORTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Lỗi đọc danh sách bộ môn từ localStorage:', err);
  }
  return DEFAULT_ADMIN_SPORTS;
};

export const getAdminCourts = (): AdminCourtItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_COURTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Lỗi đọc danh sách sân từ localStorage:', err);
  }
  return DEFAULT_ADMIN_COURTS;
};

export const saveAdminSports = (sports: SportCategoryItem[]): void => {
  try {
    localStorage.setItem(STORAGE_SPORTS_KEY, JSON.stringify(sports));
    window.dispatchEvent(new Event(COURTS_UPDATED_EVENT));
  } catch (err) {
    console.error('Lỗi lưu danh sách môn:', err);
  }
};

export const saveAdminCourts = (courts: AdminCourtItem[]): void => {
  try {
    localStorage.setItem(STORAGE_COURTS_KEY, JSON.stringify(courts));
    window.dispatchEvent(new Event(COURTS_UPDATED_EVENT));
  } catch (err) {
    console.error('Lỗi lưu danh sách sân:', err);
  }
};

/**
 * Tự động đồng bộ danh sách bộ môn và sân từ cơ sở dữ liệu Supabase
 * Đảm bảo mọi thay đổi trên Supabase (thêm/xóa) được phản ánh 100% trên màn hình web
 */
export const syncCourtsWithBackend = async (): Promise<AdminCourtItem[]> => {
  try {
    // 1. Đồng bộ các bộ môn từ Supabase (bảng bo_mon)
    try {
      const sportsRes = await fetch('/api/sports');
      if (sportsRes.ok) {
        const sportsBody = await sportsRes.json();
        if (sportsBody?.success && Array.isArray(sportsBody?.data) && sportsBody.data.length > 0) {
          saveAdminSports(sportsBody.data);
        }
      }
    } catch (spErr) {
      console.warn('Lỗi đọc bộ môn từ Supabase:', spErr);
    }

    // 2. Đồng bộ các sân từ Supabase (bảng san)
    const res = await fetch('/api/courts');
    if (!res.ok) return getAdminCourts();
    const body = await res.json();
    if (!body?.success || !Array.isArray(body?.data)) return getAdminCourts();

    const dbCourts = body.data; // [{ id, code, name, courtNumber, sportId, isLocked }]
    const sports = getAdminSports();

    // Map các sân từ Supabase về định dạng AdminCourtItem chuẩn
    const syncedCourts: AdminCourtItem[] = dbCourts.map((c: any) => {
      const sp = sports.find((s) => s.id === c.sportId);
      const price = sp?.pricePerHour || (c.sportId === 'badminton' ? 120000 : c.sportId === 'volleyball' ? 150000 : 200000);
      return {
        id: c.id,
        code: c.code,
        name: c.name,
        sportId: c.sportId,
        sportName: sp?.name || (c.sportId === 'badminton' ? 'Cầu Lông' : c.sportId === 'volleyball' ? 'Bóng Chuyền' : 'Bóng Đá Mini'),
        pricePerHour: price,
        priceLabel: formatPriceLabel(price),
      };
    });

    saveAdminCourts(syncedCourts);
    return syncedCourts;
  } catch (err) {
    console.warn('Lỗi đồng bộ sân từ backend:', err);
    return getAdminCourts();
  }
};

export const generateSportSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/^_+|_+$/g, '');
};

export const generatePrefix = (name: string): string => {
  const clean = name
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words.map((w) => w[0].toUpperCase()).slice(0, 3).join('');
  }
  if (words.length === 1 && words[0].length >= 2) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return 'SAN';
};

/**
 * Thêm một bộ môn mới cùng số lượng sân khởi tạo ban đầu trực tiếp lên Supabase
 */
export const addNewSportWithCourts = async (params: {
  name: string;
  icon: string;
  pricePerHour: number;
  prefix?: string;
  initialCourtCount: number;
}): Promise<{ success: boolean; message?: string; sport?: SportCategoryItem; createdCourts?: AdminCourtItem[] }> => {
  const trimmedName = params.name.trim();
  if (!trimmedName) {
    return { success: false, message: 'Vui lòng nhập tên bộ môn!' };
  }

  // 1. Gửi lên backend API để lưu trực tiếp vào bảng bo_mon & san trong Supabase
  try {
    const res = await fetch('/api/sports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: trimmedName,
        pricePerHour: params.pricePerHour,
        prefix: params.prefix,
        initialCourtCount: params.initialCourtCount,
      }),
    });
    const body = await res.json();
    if (res.ok && body?.success && body?.data) {
      await syncCourtsWithBackend();
      return {
        success: true,
        sport: body.data.sport,
        createdCourts: body.data.createdCourts,
      };
    } else if (body?.message) {
      return { success: false, message: body.message };
    }
  } catch (err) {
    console.warn('Lỗi kết nối backend, chuyển sang lưu tạm local:', err);
  }

  // 2. Fallback lưu tạm local nếu offline
  const sports = getAdminSports();
  const courts = getAdminCourts();

  const existingSport = sports.find(
    (s) => s.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (existingSport) {
    return { success: false, message: `Bộ môn "${trimmedName}" đã tồn tại trên hệ thống!` };
  }

  const slug = generateSportSlug(trimmedName) || `sport_${Date.now()}`;
  const prefix = (params.prefix?.trim().toUpperCase() || generatePrefix(trimmedName)).replace(/[^A-Z0-9]/g, '');

  const newSport: SportCategoryItem = {
    id: slug,
    name: trimmedName,
    icon: params.icon || '🏅',
    pricePerHour: params.pricePerHour,
    prefix: prefix || 'SN',
  };

  const newCourts: AdminCourtItem[] = [];
  const count = Math.max(0, Math.min(params.initialCourtCount, 50));
  for (let i = 1; i <= count; i++) {
    const numStr = i.toString().padStart(2, '0');
    const code = `${newSport.prefix}-${numStr}`;
    const id = `SAN_${newSport.prefix}_${numStr}`;
    newCourts.push({
      id,
      code,
      name: `Sân ${code}`,
      sportId: newSport.id,
      sportName: newSport.name,
      pricePerHour: newSport.pricePerHour,
      priceLabel: formatPriceLabel(newSport.pricePerHour),
    });
  }

  const updatedSports = [...sports, newSport];
  const updatedCourts = [...courts, ...newCourts];

  saveAdminSports(updatedSports);
  saveAdminCourts(updatedCourts);

  return {
    success: true,
    sport: newSport,
    createdCourts: newCourts,
  };
};

/**
 * Thêm số lượng sân mới cho một bộ môn đã có trực tiếp lên Supabase
 */
export const addNewCourtsToSport = async (params: {
  sportId: string;
  quantity: number;
  pricePerHour?: number;
}): Promise<{ success: boolean; message?: string; createdCourts?: AdminCourtItem[] }> => {
  // 1. Gửi lên backend API để lưu trực tiếp vào bảng san trong Supabase
  try {
    const res = await fetch('/api/courts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sportId: params.sportId,
        quantity: params.quantity,
        pricePerHour: params.pricePerHour,
      }),
    });
    const body = await res.json();
    if (res.ok && body?.success && body?.data) {
      await syncCourtsWithBackend();
      return {
        success: true,
        createdCourts: body.data.createdCourts,
      };
    } else if (body?.message) {
      return { success: false, message: body.message };
    }
  } catch (err) {
    console.warn('Lỗi kết nối backend, chuyển sang lưu tạm local:', err);
  }

  // 2. Fallback lưu tạm local nếu offline
  const sports = getAdminSports();
  const courts = getAdminCourts();

  const sport = sports.find((s) => s.id === params.sportId);
  if (!sport) {
    return { success: false, message: 'Không tìm thấy bộ môn đã chọn!' };
  }

  const qty = Math.max(1, Math.min(params.quantity, 50));
  const price = params.pricePerHour && params.pricePerHour > 0 ? params.pricePerHour : sport.pricePerHour;
  const priceLabel = formatPriceLabel(price);

  const currentSportCourts = courts.filter((c) => c.sportId === sport.id);
  let maxIndex = 0;
  currentSportCourts.forEach((c) => {
    const match = c.code.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxIndex) maxIndex = num;
    }
  });

  const createdCourts: AdminCourtItem[] = [];
  for (let i = 1; i <= qty; i++) {
    const nextIdx = maxIndex + i;
    const numStr = nextIdx.toString().padStart(2, '0');
    const code = `${sport.prefix}-${numStr}`;
    const id = `SAN_${sport.prefix}_${numStr}`;
    
    let finalCode = code;
    let finalId = id;
    let counter = nextIdx;
    while (courts.some((c) => c.code === finalCode) || createdCourts.some((c) => c.code === finalCode)) {
      counter++;
      const cStr = counter.toString().padStart(2, '0');
      finalCode = `${sport.prefix}-${cStr}`;
      finalId = `SAN_${sport.prefix}_${cStr}`;
    }

    createdCourts.push({
      id: finalId,
      code: finalCode,
      name: `Sân ${finalCode}`,
      sportId: sport.id,
      sportName: sport.name,
      pricePerHour: price,
      priceLabel,
    });
  }

  const updatedCourts = [...courts, ...createdCourts];
  saveAdminCourts(updatedCourts);

  return {
    success: true,
    createdCourts,
  };
};
