export const API_BASE_URL=import.meta.env.VITE_API_URL || '/api';
export class ApiError extends Error { status:number; constructor(message:string,status:number){super(message);this.status=status;} }
export async function apiRequest<T>(path:string,init:RequestInit={}):Promise<T> {
  let response:Response;
  try {
    response=await fetch(`${API_BASE_URL}${path}`,{...init,headers:{'Content-Type':'application/json',...init.headers},signal:init.signal||AbortSignal.timeout(20000)});
  }catch {throw Error('Không kết nối được backend. Kiểm tra backend đang chạy rồi thử lại; dữ liệu chưa được lưu.');}
  const body=await response.json().catch(()=>null);
  if(!response.ok||!body?.success)throw new ApiError(body?.message||`Yêu cầu thất bại (${response.status}). Dữ liệu chưa được lưu.`,response.status);
  return body.data;
}
