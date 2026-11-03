import { Router } from 'express';
import { facilityController } from '../controllers/facilityController.js';
import { facilityRepository } from '../repositories/facilityRepository.js';
import {supabase} from '../lib/supabaseClient.js';
import {databaseError} from '../repositories/facilityRepository.js';

const router = Router();
router.post('/equipments/:id/complete-maintenance',async(req,res,next)=>{
  try {
    const id=String(req.params.id);
    const {error}=await supabase.rpc('courtx_complete_maintenance',{p_code:id});
    if(error)databaseError(error);
    res.json({success:true,data:await facilityRepository.getEquipmentById(id)});
  }catch(error){next(error);}
});
router.get('/compensation-prices', async (_req,res,next) => {
  try {res.json({success:true,data:await facilityRepository.getCompensationPrices()});}catch(error){next(error);}
});
router.delete('/compensation-prices/:id', async (req,res,next) => {
  try {await facilityRepository.hideCompensationPrice(String(req.params.id));res.json({success:true});}catch(error){next(error);}
});

// ==========================================
// 1. DASHBOARD & KPI (UC-06)
// ==========================================
router.get('/dashboard', (req, res) => facilityController.getDashboardStats(req, res));

// ==========================================
// 2. COURTS & MASTER LOCK (UC-04)
// ==========================================
router.get('/courts', (req, res) => facilityController.getCourts(req, res));
router.patch('/courts/:id/lock', (req, res) => facilityController.toggleCourtLock(req, res));

// ==========================================
// 3. EQUIPMENT & ASSET INVENTORY (UC-07)
// ==========================================
router.get('/equipments', (req, res) => facilityController.getEquipments(req, res));
router.get('/equipments/:id', (req, res) => facilityController.getEquipmentById(req, res));
router.post('/equipments', (req, res) => facilityController.createEquipment(req, res));
router.put('/equipments/:id', (req, res) => facilityController.updateEquipment(req, res));
router.delete('/equipments/:id', (req, res) => facilityController.deleteEquipment(req, res));
router.patch('/equipments/:code/relocate', (req, res) => facilityController.relocateEquipment(req, res));
router.patch('/equipments/:code/return-warehouse', (req, res) => facilityController.returnToWarehouse(req, res));
router.post('/equipments/checkout-court', (req, res) => facilityController.checkoutCourtEquipments(req, res));
router.post('/checkout-settlements', (req, res) => facilityController.completeCheckout(req, res));
router.get('/checkout-settlements/:reference', (req, res) => facilityController.getCheckoutReceipt(req, res));

// ==========================================
// 4. INCIDENT REPORTING & AUDIT (UC-03, UC-05)
// ==========================================
router.get('/incidents', (req, res) => facilityController.getIncidents(req, res));
router.get('/incidents/:id', (req, res) => facilityController.getIncidentById(req, res));
router.post('/incidents', (req, res) => facilityController.createIncident(req, res));
router.delete('/incidents/:id', (req, res) => facilityController.deleteIncident(req, res));
router.patch('/incidents/:id/status', (req, res) => facilityController.updateIncidentStatus(req, res));
router.post('/incidents/:id/timeline', (req, res) => facilityController.addIncidentTimelineLog(req, res));

export default router;
