import { supabase } from '../lib/supabaseClient.js';
import type { FacilityEquipment, CourtStatusItem, FacilityIncident, IncidentTimelineLog } from '../types/facility.js';
import type { CheckoutResult } from '../types/checkout.js';

const equipmentSelect = '*,san(*,bo_mon(*))';
const incidentSelect = '*,nhan_vien(ma_nhan_vien,ho_ten,so_dien_thoai,vai_tro),dat_san(ngay_dat,san(*)),chi_tiet_su_co(*,thiet_bi(*,san(*)),bang_gia_den_bu(*))';
const statusLabels: Record<string,string> = {san_sang:'Sẵn sàng',dang_su_dung:'Đang sử dụng',bao_tri:'Bảo trì',hong:'Hỏng'};
const sportId = (name = ''): 'badminton'|'volleyball'|'football' => /chuyền/i.test(name)?'volleyball':/đá/i.test(name)?'football':'badminton';
const displayDate = (value?: string) => value ? value.slice(0,10).split('-').reverse().join('/') : '';
export function databaseError(error: {code?:string;message:string}): never {
  if (['PGRST202','PGRST204','42703','42883'].includes(error.code || '')) {
    console.error('Missing facility migration: backend/migrations/20261103_facility_supabase.sql',error.code);
    throw Object.assign(new Error('Máy chủ chưa hoàn tất cấu hình lưu trữ. Vui lòng liên hệ quản trị.'),{status:503});
  }
  throw Object.assign(new Error(error.message),{status:error.code==='23505'?409:400});
}
export function mapCourt(row: any): CourtStatusItem {
  const code = row.ten_san?.match(/(?:CL|BC|BD)[-_]\d{2}/)?.[0] || row.ma_san;
  return {...row.thong_tin_bo_sung,id:row.ma_san,code,name:row.ten_san,courtNumber:Number(code.match(/\d+$/)?.[0]||0),
    sportId:sportId(row.bo_mon?.ten_bo_mon),isLocked:['bao_tri','tam_dong'].includes(row.trang_thai)};
}
export function mapEquipment(row: any): FacilityEquipment {
  const extra = row.thong_tin_bo_sung || {};
  return {...extra,id:row.ma_thiet_bi,code:row.ma_thiet_bi,name:row.ten_thiet_bi,
    category:extra.category || 'dung_cu',categoryLabel:extra.categoryLabel || 'Dụng cụ',
    sportType:extra.sportType || (row.san ? {badminton:'CauLong',volleyball:'BongChuyen',football:'BongDa'}[sportId(row.san.bo_mon?.ten_bo_mon)]:'DungChung'),
    currentLocation:row.san?.ten_san || 'Kho chung',status:row.trang_thai,statusLabel:statusLabels[row.trang_thai],healthRate:extra.healthRate || 'Đang theo dõi',
    purchaseDate:displayDate(row.ngay_mua),warrantyExpire:displayDate(row.han_bao_hanh),serialNumber:row.so_seri || '',supplier:row.nha_cung_cap || '',supplierPhone:row.sdt_ncc || ''};
}
export function mapIncident(row: any): FacilityIncident {
  const extra = row.thong_tin_bo_sung || {}, details = row.chi_tiet_su_co || [], first = details[0];
  const court = row.dat_san?.san || first?.thiet_bi?.san;
  const status = row.trang_thai_xu_ly==='DA_XU_LY'?'da_khac_phuc':extra.status==='dang_sua_chua'?'dang_sua_chua':'cho_xu_ly';
  return {...extra,id:row.ma_su_co,bookingCode:row.ma_dat_san || undefined,bookingDate:row.dat_san?.ngay_dat,
    courtId:court?.ma_san || extra.courtId,courtName:court?.ten_san || extra.courtName || 'Kho chung',
    equipmentCode:first?.ma_thiet_bi || undefined,equipmentName:first?.thiet_bi?.ten_thiet_bi || first?.bang_gia_den_bu?.ten_vat_tu || extra.equipmentName,
    compensationItemId:first?.ma_danh_muc_den_bu,compensationPrice:details.reduce((sum:number,d:any)=>sum+Number(d.don_gia_ap_dung)*Number(d.so_luong_hu_hai),0),
    liability:row.nguyen_nhan,compensationAmount:Number(row.tong_tien_den_bu),
    compensationPaymentStatus:extra.compensationPaymentStatus || (Number(row.tong_tien_den_bu)===0?'not_required':'pending'),
    title:extra.title || `Sự cố ${first?.thiet_bi?.ten_thiet_bi || first?.bang_gia_den_bu?.ten_vat_tu || row.ma_su_co}`,
    description:extra.description || details.map((item:any)=>item.mo_ta_chi_tiet).filter(Boolean).join('\n'),
    severity:extra.severity || 'trung_binh',severityLabel:extra.severityLabel || 'Trung bình',status,
    statusLabel:status==='da_khac_phuc'?'Đã khắc phục':status==='dang_sua_chua'?'Đang sửa chữa':'Chờ xử lý',
    reporterName:row.nhan_vien?.ho_ten || extra.reporterName || '',reporterPhone:row.nhan_vien?.so_dien_thoai || '',
    reporterRole:row.nhan_vien?.vai_tro==='ADMIN'?'Chủ sân':'Nhân viên',
    reportedAt:new Date(row.ngay_tao).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}),createdAt:row.ngay_tao,
    damageItems:extra.damageItems || details.map((item:any)=>({id:item.ma_chi_tiet,equipmentCode:item.ma_thiet_bi,
      title:item.thiet_bi?.ten_thiet_bi || item.bang_gia_den_bu?.ten_vat_tu,description:item.mo_ta_chi_tiet,riskBadge:'Hư hỏng',riskColor:'amber'})),
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
    return (data||[]).filter((row:any)=>!row.da_an).map((row:any)=>({id:row.ma_danh_muc_den_bu,name:row.ten_vat_tu,price:Number(row.don_gia_den_bu),
      sport:row.bo_mon?sportId(row.bo_mon.ten_bo_mon):'common',equipmentId:row.mo_ta_hu_hai?.startsWith('asset:')?row.mo_ta_hu_hai.slice(6):undefined}));
  }
  async hideCompensationPrice(id:string) {
    const {error}=await supabase.from('bang_gia_den_bu').update({da_an:true}).eq('ma_danh_muc_den_bu',id);
    if(error)databaseError(error);
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
