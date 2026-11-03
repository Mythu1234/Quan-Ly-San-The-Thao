import {Router} from 'express';
import {staffAuthService} from '../services/staffAuthService.js';
import {staffDirectoryService as directory} from '../services/staffDirectoryService.js';
const router=Router();
router.post('/login',async(req,res,next)=>{try{res.json({success:true,data:await staffAuthService.login(req.body.identifier,req.body.password)});}catch(error){next(error);}});
router.post('/:id/password',async(req,res,next)=>{try{res.json({success:true,data:await staffAuthService.changePassword(String(req.params.id),req.body.currentPassword,req.body.newPassword)});}catch(error){next(error);}});
router.get('/stats',async(_req,res,next)=>{try{const rows=await directory.list();res.json({success:true,data:{total:rows.length,active:rows.filter(row=>row.status==='active').length,inactive:rows.filter(row=>row.status==='inactive').length}});}catch(error){next(error);}});
router.get('/',async(req,res,next)=>{try{
  let rows=await directory.list();
  if(req.query.status==='active'||req.query.status==='inactive')rows=rows.filter(row=>row.status===req.query.status);
  if(typeof req.query.search==='string'){const search=req.query.search.trim().toLocaleLowerCase('vi-VN');rows=rows.filter(row=>[row.name,row.id,row.phone,row.email].some(value=>value.toLocaleLowerCase('vi-VN').includes(search)));}
  res.json({success:true,data:rows});
}catch(error){next(error);}});
router.get('/:id',async(req,res,next)=>{try{res.json({success:true,data:await directory.get(String(req.params.id))});}catch(error){next(error);}});
router.post('/',async(req,res,next)=>{try{res.status(201).json({success:true,data:await directory.create(req.body)});}catch(error){next(error);}});
router.put('/:id',async(req,res,next)=>{try{res.json({success:true,data:await directory.update(String(req.params.id),req.body)});}catch(error){next(error);}});
router.patch('/:id/status',async(req,res,next)=>{try{res.json({success:true,data:await directory.toggle(String(req.params.id))});}catch(error){next(error);}});
router.delete('/:id',async(req,res,next)=>{try{const employee=await directory.update(String(req.params.id),{status:'inactive'});res.json({success:true,data:{success:true,employee,message:'Đã ngừng hoạt động tài khoản; giữ lịch sử.'}});}catch(error){next(error);}});
export default router;
