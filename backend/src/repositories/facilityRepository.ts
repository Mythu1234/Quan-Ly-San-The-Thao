import { supabase } from '../lib/supabaseClient.js';
import type { FacilityEquipment, CourtStatusItem, FacilityIncident, IncidentTimelineLog } from '../types/facility.js';
import type { CheckoutResult } from '../types/checkout.js';

const equipmentSelect = '*';
const incidentSelect = '*,nhan_vien(ma_nhan_vien,ho_ten,so_dien_thoai,vai_tro),dat_san(ngay_dat,san(*)),chi_tiet_su_co(*,thiet_bi(*),bang_gia_den_bu(*))';
const statusLabels: Record<string,string> = {san_sang:'Sẵn sàng',dang_su_dung:'Đang sử dụng',bao_tri:'Bảo trì',hong:'Hỏng'};
const sportId = (name = ''): string => {
  if (/chuyền/i.test(name)) return 'volleyball';
  if (/đá/i.test(name)) return 'football';
  if (/lông/i.test(name)) return 'badminton';
  if (/pickleball/i.test(name)) return 'pickleball';
  if (/tennis|quần vợt/i.test(name)) return 'tennis';
  if (/bóng rổ/i.test(name)) return 'basketball';
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '') || 'sport';
};
const extractPrefix = (name = ''): string => {
  if (/lông/i.test(name)) return 'CL';
  if (/chuyền/i.test(name)) return 'BC';
  if (/đá/i.test(name)) return 'BD';
  if (/pickleball/i.test(name)) return 'PB';
  if (/tennis|quần vợt/i.test(name)) return 'TN';
  const clean = name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return words.map((w) => w[0].toUpperCase()).slice(0, 3).join('');
  if (words.length === 1 && words[0].length >= 2) return words[0].slice(0, 2).toUpperCase();
  return 'SN';
};
const detectSportIcon = (name = ''): string => {
  const lower = name.toLowerCase();
  if (lower.includes('pickleball')) return '🏓';
  if (lower.includes('tennis') || lower.includes('quần vợt')) return '🎾';
  if (lower.includes('bóng rổ') || lower.includes('basketball')) return '🏀';
  if (lower.includes('bàn') || lower.includes('ping pong')) return '🏓';
  if (lower.includes('bơi') || lower.includes('swim')) return '🏊';
  if (lower.includes('chạy') || lower.includes('điền kinh')) return '🏃';
  if (lower.includes('golf')) return '⛳';
  if (lower.includes('bóng chày') || lower.includes('baseball')) return '⚾';
  if (lower.includes('võ') || lower.includes('karate') || lower.includes('taekwondo') || lower.includes('judo')) return '🥋';
  if (lower.includes('bóng ném')) return '🤾';
  if (lower.includes('billiards') || lower.includes('bida')) return '🎱';
  if (lower.includes('cầu lông') || lower.includes('badminton')) return '🏸';
  if (lower.includes('bóng đá') || lower.includes('football') || lower.includes('soccer')) return '⚽';
  if (lower.includes('bóng chuyền') || lower.includes('volleyball')) return '🏐';
  return '🏅';
};
const displayDate = (value?: string) => value ? value.slice(0,10).split('-').reverse().join('/') : '';
export function databaseError(error: {code?:string;message:string}): never {
  if (['PGRST202','PGRST204','42703','42883'].includes(error.code || '')) {
    console.error('Missing facility migration: backend/migrations/20261103_facility_supabase.sql',error.code);
    throw Object.assign(new Error('Máy chủ chưa hoàn tất cấu hình lưu trữ. Vui lòng liên hệ quản trị.'),{status:503});
  }
  throw Object.assign(new Error(error.message),{status:error.code==='23505'?409:400});
}
export function mapCourt(row: any): CourtStatusItem {
  const codeMatch = row.ten_san?.match(/(?:Sân\s+)?([A-Za-z0-9]+)[-_](\d{1,3})/i);
  const code = codeMatch ? `${codeMatch[1].toUpperCase()}-${codeMatch[2].padStart(2, '0')}` : row.ma_san;
  const pfx = codeMatch ? codeMatch[1].toUpperCase() : '';
  const prefixToSport: Record<string, string> = {
    CL: 'badminton',
    BC: 'volleyball',
    BD: 'football',
    PB: 'pickleball',
    TN: 'tennis',
  };
  const detectedSportId = row.bo_mon?.ten_bo_mon
    ? sportId(row.bo_mon.ten_bo_mon)
    : (prefixToSport[pfx] || sportId(row.ten_san) || 'sport');

  return {
    ...row.thong_tin_bo_sung,
    id: row.ma_san,
    code,
    name: row.ten_san,
    courtNumber: Number(code.match(/\d+$/)?.[0] || 0),
    sportId: detectedSportId,
    isLocked: ['bao_tri', 'tam_dong'].includes(row.trang_thai),
  };
}
export function mapEquipment(row: any): FacilityEquipment {
  const extra = row.thong_tin_bo_sung || {};
  const optionalPrice=(value:unknown)=>value===null||value===undefined?undefined:Number(value);
  return {...extra,id:row.ma_thiet_bi,code:row.ma_thiet_bi,name:row.ten_thiet_bi,
    purchasePrice:optionalPrice(row.gia_mua!==undefined?row.gia_mua:extra.purchasePrice),
    compensationPrice:optionalPrice(row.gia_boi_thuong!==undefined?row.gia_boi_thuong:extra.compensationPrice),
    category:extra.category || 'dung_cu',categoryLabel:extra.categoryLabel || 'Dụng cụ',
    sportType:extra.sportType || (row.san ? {badminton:'CauLong',volleyball:'BongChuyen',football:'BongDa'}[sportId(row.san.bo_mon?.ten_bo_mon)]:'DungChung'),
    currentLocation:row.san?.ten_san || 'Kho chung',status:row.trang_thai,statusLabel:statusLabels[row.trang_thai],healthRate:extra.healthRate || 'Đang theo dõi',
    purchaseDate:displayDate(row.ngay_mua),warrantyExpire:displayDate(row.han_bao_hanh),serialNumber:extra.isCatalogItem&&row.so_seri?.startsWith('DM-')?'':row.so_seri || '',supplier:row.nha_cung_cap || '',supplierPhone:row.sdt_ncc || ''};
}
export function mapIncident(row: any): FacilityIncident {
  const extra = row.thong_tin_bo_sung || {}, details = row.chi_tiet_su_co || [], first = details[0];
  const court = row.dat_san?.san || first?.thiet_bi?.san;
  const status = row.trang_thai_xu_ly==='DA_XU_LY'?'da_khac_phuc':row.trang_thai_xu_ly==='DANG_SUA_CHUA'||(row.trang_thai_xu_ly==='CHO_BOI_THUONG'&&extra.status==='dang_sua_chua')?'dang_sua_chua':'cho_xu_ly';
  return {...extra,id:row.ma_su_co,bookingCode:row.ma_dat_san || undefined,bookingDate:row.dat_san?.ngay_dat,
    courtId:court?.ma_san || extra.courtId,courtName:court?.ten_san || (extra.courtName==='Kho chung'?'':extra.courtName) || '',
    equipmentCode:first?.ma_thiet_bi || undefined,equipmentName:first?.bang_gia_den_bu?.ten_vat_tu || first?.thiet_bi?.ten_thiet_bi || extra.equipmentName,
    compensationItemId:first?.ma_danh_muc_den_bu,compensationPrice:details.reduce((sum:number,d:any)=>sum+Number(d.don_gia_ap_dung)*Number(d.so_luong_hu_hai),0),
    liability:row.nguyen_nhan,compensationAmount:Number(row.tong_tien_den_bu),
    compensationPaymentStatus:extra.compensationPaymentStatus || (Number(row.tong_tien_den_bu)===0?'not_required':'pending'),
    title:extra.title || `Sự cố ${first?.bang_gia_den_bu?.ten_vat_tu || first?.thiet_bi?.ten_thiet_bi || row.ma_su_co}`,
    description:extra.description || details.map((item:any)=>item.mo_ta_chi_tiet).filter(Boolean).join('\n'),
    severity:extra.severity || 'trung_binh',severityLabel:extra.severityLabel || 'Trung bình',status,
    statusLabel:status==='da_khac_phuc'?'Đã khắc phục':status==='dang_sua_chua'?'Đang sửa chữa':'Chờ xử lý',
    reporterName:row.nhan_vien?.ho_ten || extra.reporterName || '',reporterPhone:row.nhan_vien?.so_dien_thoai || '',
    reporterRole:row.nhan_vien?.vai_tro==='ADMIN'?'Chủ sân':'Nhân viên',
    reportedAt:new Date(row.ngay_tao).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}),createdAt:row.ngay_tao,
    damageItems:details.map((item:any,index:number)=>{
      const saved=extra.damageItems?.find((entry:any)=>entry.id===item.ma_chi_tiet)
        || (extra.damageItems?.length===details.length?extra.damageItems[index]:{}) || {};
      return {...saved,id:item.ma_chi_tiet,equipmentCode:item.ma_thiet_bi || undefined,
        title:item.bang_gia_den_bu?.ten_vat_tu || item.thiet_bi?.ten_thiet_bi || saved.title,
        description:saved.description || item.mo_ta_chi_tiet,riskBadge:saved.riskBadge || 'Hư hỏng',riskColor:saved.riskColor || 'amber'};
    }),
    images:extra.images || [],timelineLogs:extra.timelineLogs || []};
}

export class FacilityRepository {
  async getAllEquipments():Promise<FacilityEquipment[]> {
    const {data,error}=await supabase.from('thiet_bi').select(equipmentSelect).order('ma_thiet_bi');
    if(error)databaseError(error);
    return (data || []).filter((row:any)=>!row.da_xoa).map(mapEquipment);
  }
  async getEquipmentById(id:string):Promise<FacilityEquipment|null> {
    const {data,error}=await supabase.from('thiet_bi').select(equipmentSelect).eq('ma_thiet_bi',id).maybeSingle();
    if(error)databaseError(error);
    return data && !data.da_xoa?mapEquipment(data):null;
  }
  async getEquipmentByCode(code:string) {return this.getEquipmentById(code);}
  async saveEquipment(item:FacilityEquipment,id?:string) {
    const date=(value:string)=>/^\d{2}\/\d{2}\/\d{4}$/.test(value)?value.split('/').reverse().join('-'):value || null;
    const {data,error}=await supabase.rpc('courtx_save_equipment',{p_item:{...item,purchaseDate:date(item.purchaseDate),warrantyExpire:date(item.warrantyExpire)},p_id:id || null});
    if(error)databaseError(error);
    return (await this.getEquipmentById(String(data)))!;
  }
  async updateEquipment(id:string,updates:Partial<FacilityEquipment>) {
    const existing=await this.getEquipmentById(id);
    return existing?this.saveEquipment({...existing,...updates,id:existing.id,code:existing.code},id):null;
  }
  async deleteEquipment(id:string) {
    const {data,error}=await supabase.from('thiet_bi').update({da_xoa:true}).eq('ma_thiet_bi',id).select('ma_thiet_bi');
    if(error)databaseError(error);
    return !!data?.length;
  }
  async getAllCourts():Promise<CourtStatusItem[]> {
    const {data,error}=await supabase.from('san').select('*,bo_mon(*)').order('ma_san');
    if(error)databaseError(error);
    return (data || []).map(mapCourt);
  }
  async getCourtById(id:string) {return (await this.getAllCourts()).find(row=>row.id===id)||null;}

  async getAllSports() {
    const { data, error } = await supabase.from('bo_mon').select('*').order('ma_bo_mon');
    if (error) databaseError(error);
    return (data || []).map((row: any) => ({
      id: sportId(row.ten_bo_mon),
      dbId: row.ma_bo_mon,
      name: row.ten_bo_mon,
      pricePerHour: Number(row.don_gia_gio) || 120000,
      prefix: extractPrefix(row.ten_bo_mon),
      icon: detectSportIcon(row.ten_bo_mon),
      description: row.mo_ta,
    }));
  }

  async createSportWithCourts(params: {
    name: string;
    pricePerHour: number;
    prefix?: string;
    initialCourtCount: number;
  }) {
    const trimmedName = params.name.trim();
    if (!trimmedName) throw Object.assign(new Error('Tên bộ môn không được để trống!'), { status: 400 });

    const { data: existingList } = await supabase.from('bo_mon').select('ma_bo_mon,ten_bo_mon');
    const existing = (existingList || []).find(
      (b: any) => b.ten_bo_mon.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      throw Object.assign(new Error(`Bộ môn "${trimmedName}" đã tồn tại trên Supabase!`), { status: 400 });
    }

    let maxBmNum = 0;
    (existingList || []).forEach((b: any) => {
      const match = String(b.ma_bo_mon).match(/(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxBmNum) maxBmNum = n;
      }
    });
    const nextBmCode = `BM${(maxBmNum + 1).toString().padStart(8, '0')}`;

    const { data: newBm, error: bmError } = await supabase.from('bo_mon').insert({
      ma_bo_mon: nextBmCode,
      ten_bo_mon: trimmedName,
      don_gia_gio: params.pricePerHour,
      mo_ta: `Bộ môn ${trimmedName}`,
    }).select().single();

    if (bmError) databaseError(bmError);

    const prefix = (params.prefix?.trim().toUpperCase() || extractPrefix(trimmedName)).replace(/[^A-Z0-9]/g, '');
    const count = Math.max(0, Math.min(params.initialCourtCount || 0, 50));
    const createdCourts = [];

    if (count > 0) {
      const { data: existingCourts } = await supabase.from('san').select('ma_san');
      let maxSanNum = 0;
      (existingCourts || []).forEach((s: any) => {
        const match = String(s.ma_san).match(/(\d+)$/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxSanNum) maxSanNum = n;
        }
      });

      const courtsToInsert = [];
      for (let i = 1; i <= count; i++) {
        const nextSanNum = maxSanNum + i;
        const ma_san = `SAN${nextSanNum.toString().padStart(8, '0')}`;
        const numStr = i.toString().padStart(2, '0');
        const ten_san = `Sân ${prefix}-${numStr}`;
        courtsToInsert.push({
          ma_san,
          ten_san,
          ma_bo_mon: nextBmCode,
          trang_thai: 'san_sang',
          thong_tin_bo_sung: {},
        });
      }

      const { data: insertedCourts, error: courtsError } = await supabase.from('san').insert(courtsToInsert).select('*,bo_mon(*)');
      if (courtsError) databaseError(courtsError);
      createdCourts.push(...(insertedCourts || []));
    }

    return {
      sport: {
        id: sportId(trimmedName),
        dbId: nextBmCode,
        name: trimmedName,
        pricePerHour: params.pricePerHour,
        prefix,
        icon: detectSportIcon(trimmedName),
      },
      createdCourts: createdCourts.map(mapCourt),
    };
  }

  async createCourtsForSport(params: {
    sportId: string;
    quantity: number;
    pricePerHour?: number;
  }) {
    const qty = Math.max(1, Math.min(params.quantity || 1, 50));

    const { data: allSports } = await supabase.from('bo_mon').select('*');
    const matchedBm = (allSports || []).find((b: any) => {
      const slug = sportId(b.ten_bo_mon);
      return slug === params.sportId || b.ma_bo_mon === params.sportId;
    });

    if (!matchedBm) {
      throw Object.assign(new Error(`Không tìm thấy bộ môn tương ứng trên Supabase!`), { status: 404 });
    }

    const { data: existingSportCourts } = await supabase
      .from('san')
      .select('ma_san,ten_san')
      .eq('ma_bo_mon', matchedBm.ma_bo_mon);

    const prefix = extractPrefix(matchedBm.ten_bo_mon);
    let maxIndex = 0;
    (existingSportCourts || []).forEach((c: any) => {
      const match = String(c.ten_san).match(/(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxIndex) maxIndex = n;
      }
    });

    const { data: allCourts } = await supabase.from('san').select('ma_san');
    let maxSanNum = 0;
    (allCourts || []).forEach((s: any) => {
      const match = String(s.ma_san).match(/(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxSanNum) maxSanNum = n;
      }
    });

    const courtsToInsert = [];
    for (let i = 1; i <= qty; i++) {
      const nextSanNum = maxSanNum + i;
      const ma_san = `SAN${nextSanNum.toString().padStart(8, '0')}`;
      const nextIndex = maxIndex + i;
      const numStr = nextIndex.toString().padStart(2, '0');
      const ten_san = `Sân ${prefix}-${numStr}`;

      courtsToInsert.push({
        ma_san,
        ten_san,
        ma_bo_mon: matchedBm.ma_bo_mon,
        trang_thai: 'san_sang',
        thong_tin_bo_sung: {},
      });
    }

    const { data: inserted, error: insertError } = await supabase.from('san').insert(courtsToInsert).select('*,bo_mon(*)');
    if (insertError) databaseError(insertError);

    return {
      sport: matchedBm,
      createdCourts: (inserted || []).map(mapCourt),
    };
  }

  async deleteCourt(id: string) {
    const { data, error } = await supabase.from('san').delete().eq('ma_san', id).select('ma_san');
    if (error) databaseError(error);
    return !!data?.length;
  }
  async updateCourtLock(id:string,isLocked:boolean,reason?:string,lockedBy='Admin') {
    const old=await this.getCourtById(id);
    if(!old)return null;
    const {data:active,error:activeError}=await supabase.from('dat_san').select('ma_dat_san').eq('ma_san',id).eq('trang_thai','DANG_SU_DUNG');
    if(activeError)databaseError(activeError);
    const {data,error}=await supabase.from('san').update({trang_thai:isLocked?'bao_tri':active?.length?'dang_su_dung':'san_sang',
      thong_tin_bo_sung:{lockReason:isLocked?reason:null,lockedBy:isLocked?lockedBy:null,lockedAt:isLocked?new Date().toISOString():null}})
      .eq('ma_san',id).select('*,bo_mon(*)').single();
    if(error)databaseError(error);
    return mapCourt(data);
  }
  async getAllIncidents():Promise<FacilityIncident[]> {
    const {data,error}=await supabase.from('bao_cao_su_co').select(incidentSelect).order('ngay_tao',{ascending:false});
    if(error)databaseError(error);
    return (data || []).map(mapIncident);
  }
  async getIncidentById(id:string):Promise<FacilityIncident|null> {
    const {data,error}=await supabase.from('bao_cao_su_co').select(incidentSelect).eq('ma_su_co',id).maybeSingle();
    if(error)databaseError(error);
    return data?mapIncident(data):null;
  }
  async createIncident(report:FacilityIncident) {
    const {data,error}=await supabase.rpc('courtx_save_incident',{p_report:report});
    if(error)databaseError(error);
    return (await this.getIncidentById(String(data)))!;
  }
  async patchIncident(id:string,patch:Partial<FacilityIncident>) {
    const {error}=await supabase.rpc('courtx_patch_incident',{p_id:id,p_patch:patch});
    if(error)databaseError(error);
    return this.getIncidentById(id);
  }
  async deleteIncident(id:string) {return this.patchIncident(id,{deletedAt:new Date().toISOString()});}
  async updateIncidentStatus(id:string,status:FacilityIncident['status'],technicianNote?:string) {
    return this.patchIncident(id,{status,...(technicianNote!==undefined?{technicianNote}:{})});
  }
  async addIncidentTimelineLog(id:string,log:IncidentTimelineLog) {
    const {error}=await supabase.rpc('courtx_patch_incident',{p_id:id,p_patch:{newLog:log}});
    if(error)databaseError(error);
    return this.getIncidentById(id);
  }
  async getCompensationPrices() {
    const {data,error}=await supabase.from('bang_gia_den_bu').select('*,bo_mon(ten_bo_mon)').order('ma_danh_muc_den_bu');
    if(error)databaseError(error);
    const equipments=await this.getAllEquipments();
    const catalog=equipments.filter(item=>item.isCatalogItem);
    return (data||[]).filter((row:any)=>!row.da_an).flatMap((row:any)=>{
      const equipment=catalog.find(item=>item.compensationItemId===row.ma_danh_muc_den_bu||row.mo_ta_hu_hai===`asset:${item.id}`);
      if(catalog.length&&!equipment)return [];
      return [{id:row.ma_danh_muc_den_bu,name:equipment?.name||row.ten_vat_tu,price:Number(equipment?.compensationPrice??row.don_gia_den_bu),
        sport:equipment?({CauLong:'badminton',BongChuyen:'volleyball',BongDa:'football'} as Record<string,string>)[equipment.sportType]||'common':row.bo_mon?sportId(row.bo_mon.ten_bo_mon):'common',
        equipmentId:equipment?.id||(row.mo_ta_hu_hai?.startsWith('asset:')?row.mo_ta_hu_hai.slice(6):undefined)}];
    });
  }
  async hideCompensationPrice(id:string) {
    const catalog=(await this.getAllEquipments()).filter(item=>item.isCatalogItem);
    const price=await supabase.from('bang_gia_den_bu').select('mo_ta_hu_hai').eq('ma_danh_muc_den_bu',id).maybeSingle();
    if(price.error)databaseError(price.error);
    const equipment=catalog.find(item=>item.compensationItemId===id||price.data?.mo_ta_hu_hai===`asset:${item.id}`);
    const {error}=await supabase.from('bang_gia_den_bu').update({da_an:true}).eq('ma_danh_muc_den_bu',id);
    if(error)databaseError(error);
    if(equipment)await this.deleteEquipment(equipment.id);
  }
  async expandCheckout(value:any):Promise<CheckoutResult> {
    const [incidents,equipments]=await Promise.all([this.getAllIncidents(),this.getAllEquipments()]);
    return {receipt:value.receipt,incidents:incidents.filter(i=>value.incidentIds.includes(i.id)),equipments:equipments.filter(e=>value.equipmentIds.includes(e.id))};
  }
  async getCheckout(reference:string):Promise<CheckoutResult|undefined> {
    const index=reference.indexOf(':');
    if(index<0)return undefined;
    const {data,error}=await supabase.from('dat_san').select('ket_qua_checkout').eq('ma_dat_san',reference.slice(index+1)).eq('ngay_dat',reference.slice(0,index)).maybeSingle();
    if(error)databaseError(error);
    return data?.ket_qua_checkout?this.expandCheckout(data.ket_qua_checkout):undefined;
  }
}
export const facilityRepository=new FacilityRepository();
