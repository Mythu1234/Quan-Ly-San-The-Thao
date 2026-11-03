import {Router} from 'express';
import {listBookings,checkInBooking} from '../services/bookingService.js';
import {lookupCustomerBookings} from '../services/customerLookupService.js';
const router=Router();
router.post('/lookup',async(req,res,next)=>{
  try {res.json({success:true,data:await lookupCustomerBookings(req.body.query)});}catch(error){next(error);}
});
router.get('/',async(_req,res,next)=>{
  try {res.json({success:true,data:await listBookings()});}catch(error){next(error);}
});
router.post('/:code/check-in',async(req,res,next)=>{
  try {res.json({success:true,data:await checkInBooking(String(req.params.code),req.body.bookingDate)});}catch(error){next(error);}
});
export default router;
