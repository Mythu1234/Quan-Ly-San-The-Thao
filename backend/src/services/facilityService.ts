import type { FacilityEquipment, CreateEquipmentDTO, UpdateEquipmentDTO, CreateIncidentDTO, FacilityIncident } from '../types/facility.js';
import { facilityRepository as repository } from '../repositories/facilityRepository.js';

const labels:Record<string,string>={tru_luoi:'Trụ & Lưới',tham_san:'Mặt thảm',chieu_sang:'Chiếu sáng',dung_cu:'Dụng cụ',ve_sinh:'Vệ sinh'};
function validatePrices(dto:UpdateEquipmentDTO) {
  for(const price of [dto.purchasePrice,dto.compensationPrice]) if(price!==undefined && price!==null && (!Number.isSafeInteger(price)||price<0)) throw Error('Giá thiết bị phải là số nguyên không âm.');
}
export class FacilityService {
  async getDashboardStats() {
    const [equipments,courts,all]=await Promise.all([repository.getAllEquipments(),repository.getAllCourts(),repository.getAllIncidents()]);
    const incidents=all.filter(i=>!i.deletedAt);
    return {totalEquipments:equipments.length,readyEquipments:equipments.filter(e=>e.status==='san_sang').length,
      inUseEquipments:equipments.filter(e=>e.status==='dang_su_dung').length,maintenanceEquipments:equipments.filter(e=>['hong','bao_tri'].includes(e.status)).length,
      totalCourts:courts.length,lockedCourts:courts.filter(c=>c.isLocked).length,openCourts:courts.filter(c=>!c.isLocked).length,
      totalIncidents:incidents.length,urgentIncidents:incidents.filter(i=>i.severity==='khan_cap'&&i.status!=='da_khac_phuc').length,
      pendingIncidents:incidents.filter(i=>i.status!=='da_khac_phuc').length};
  }
  async listEquipments(filters:{location?:string;category?:string;status?:string;search?:string}={}) {
    return (await repository.getAllEquipments()).filter(e=>(!filters.location||filters.location==='ALL'||e.currentLocation===filters.location)
      &&(!filters.category||filters.category==='ALL'||e.category===filters.category)&&(!filters.status||filters.status==='ALL'||e.status===filters.status)
      &&(!filters.search||[e.name,e.code,e.serialNumber,e.currentLocation].join(' ').toLowerCase().includes(filters.search.trim().toLowerCase())));
  }
  async getEquipment(id:string) {
    const item=await repository.getEquipmentById(id);
    if(!item)throw Error('Không tìm thấy thiết bị.');
    return item;
  }
  async createEquipment(dto:CreateEquipmentDTO) {
    validatePrices(dto);
    if(!dto.name?.trim())throw Error('Nhập tên thiết bị.');
    if(!Number.isSafeInteger(dto.compensationPrice)||Number(dto.compensationPrice)<=0)throw Error('Nhập mức giá bồi thường lớn hơn 0.');
    const nameKey=(value:string)=>value.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('vi-VN');
    const existing=await repository.getAllEquipments();
    if(existing.some(item=>item.isCatalogItem&&item.sportType===(dto.sportType||'DungChung')&&nameKey(item.name)===nameKey(dto.name)))
      throw Object.assign(Error('Thiết bị này đã có trong danh mục của bộ môn. Vui lòng dùng mục hiện có.'),{status:409});
    const equipment:FacilityEquipment={...dto,id:'',code:'',name:dto.name.trim(),category:dto.category||'dung_cu',categoryLabel:labels[dto.category]||'Dụng cụ',
      isCatalogItem:true,serialNumber:dto.serialNumber?.trim()||`DM-${crypto.randomUUID()}`,
      sportType:dto.sportType||'DungChung',currentLocation:'Kho chung',status:'san_sang',statusLabel:'Sẵn sàng',
      healthRate:dto.healthRate||'Mới 100%',purchaseDate:dto.purchaseDate||'',warrantyExpire:dto.warrantyExpire||''};
    return repository.saveEquipment(equipment);
  }
  async updateEquipment(id:string,dto:UpdateEquipmentDTO) {
    validatePrices(dto);
    const old=await this.getEquipment(id);
    const saved=await repository.updateEquipment(old.id,{...dto,...(dto.category?{categoryLabel:labels[dto.category]}:{})});
    if(!saved)throw Error('Chưa cập nhật được thiết bị.');
    return saved;
  }
  async relocateEquipment(code:string,targetLocation:string,bookingDetails?:{bookingCode?:string;timeSlot?:string;customerName?:string}) {
    const old=await this.getEquipment(code);
    const warehouse=targetLocation.toLowerCase().includes('kho');
    const damaged=['hong','bao_tri'].includes(old.status);
    if(!warehouse&&damaged)throw Error('Thiết bị hỏng hoặc bảo trì chưa thể điều phối ra sân.');
    return this.updateEquipment(code,{currentLocation:targetLocation,status:damaged?old.status:warehouse?'san_sang':'dang_su_dung',
      assignedBookingCode:warehouse?'':bookingDetails?.bookingCode||'',assignedCourt:warehouse?'':targetLocation,
      assignedTimeSlot:warehouse?'':bookingDetails?.timeSlot||'',assignedCustomer:warehouse?'':bookingDetails?.customerName||''});
  }
  async returnToWarehouse(code:string) {return this.relocateEquipment(code,'Kho chung');}
  async checkoutCourtEquipments(_courtName:string):Promise<FacilityEquipment[]> {
    throw Error('Vui lòng thực hiện quyết toán Checkout theo lượt đặt để thu hồi thiết bị.');
  }
  async deleteEquipment(id:string) {
    const old=await this.getEquipment(id);
    if(old.status==='dang_su_dung')throw Error('Thu hồi thiết bị trước khi ngừng sử dụng.');
    return repository.deleteEquipment(id);
  }
  async listCourts() {return repository.getAllCourts();}
  async toggleCourtLock(id:string,isLocked:boolean,reason?:string,lockedBy?:string) {
    const row=await repository.updateCourtLock(id,isLocked,reason,lockedBy);
    if(!row)throw Error('Không tìm thấy sân.');
    return row;
  }
  async listIncidents(filters:{status?:string;severity?:string;courtId?:string}={}) {
    return (await repository.getAllIncidents()).filter(i=>!i.deletedAt&&(!filters.status||filters.status==='ALL'||i.status===filters.status)
      &&(!filters.severity||filters.severity==='ALL'||i.severity===filters.severity)&&(!filters.courtId||filters.courtId==='ALL'||i.courtId===filters.courtId));
  }
  async getIncident(id:string) {
    const incident=await repository.getIncidentById(id);
    if(!incident||incident.deletedAt)throw Error('Không tìm thấy báo cáo sự cố.');
    return incident;
  }
  async deleteIncident(id:string) {
    const old=await this.getIncident(id);
    if(old.compensationPaymentStatus==='paid'||old.checkoutReference)throw Error('Báo cáo đã quyết toán phải được giữ để đối soát.');
    return repository.deleteIncident(id);
  }
  async createIncident(dto:CreateIncidentDTO) {
    const now=new Date().toISOString();
    const report:FacilityIncident={...dto,id:dto.id||'',title:dto.title?.trim(),description:dto.description?.trim(),
      severity:dto.severity||'trung_binh',severityLabel:{khan_cap:'Khẩn cấp',trung_binh:'Trung bình',thap:'Thấp'}[dto.severity]||'Trung bình',
      status:'cho_xu_ly',statusLabel:'Chờ xử lý',reportedAt:now,createdAt:now,updatedAt:now,reporterName:dto.reporterName};
    return {incident:await repository.createIncident(report),courtLocked:false};
  }
  async updateIncidentStatus(id:string,status:FacilityIncident['status'],unlockCourt=false,technicianNote?:string) {
    if(!['cho_xu_ly','dang_sua_chua','da_khac_phuc'].includes(status))throw Error('Trạng thái sự cố không hợp lệ.');
    const old=await this.getIncident(id);
    await repository.updateIncidentStatus(id,status,technicianNote);
    if(unlockCourt&&status==='da_khac_phuc'&&old.courtId)await this.toggleCourtLock(old.courtId,false);
    return {incident:(await this.getIncident(id)),courtUnlocked:unlockCourt&&status==='da_khac_phuc'};
  }
  async addTimelineLog(id:string,title:string,description:string,images:string[]=[]) {
    await this.getIncident(id);
    if(!title?.trim())throw Error('Nhập tiêu đề nhật ký.');
    return repository.addIncidentTimelineLog(id,{id:crypto.randomUUID(),time:new Date().toISOString(),title:title.trim(),description:description?.trim()||'',images,active:true});
  }
}
export const facilityService=new FacilityService();
