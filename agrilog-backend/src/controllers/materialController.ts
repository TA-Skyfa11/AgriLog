import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Material } from '../models/Material';
import { MaterialLog } from '../models/MaterialLog';
import { FarmProfile } from '../models/FarmProfile';

export const getInventory = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const materials = await Material.find({ farmProfile: profile._id });
    res.json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const importMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, quantity, unit, expiryDate, date, supplier, notes } = req.body;
    
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    // Check if material exists
    let material = await Material.findOne({ farmProfile: profile._id, name, type });
    
    if (!material) {
      material = await Material.create({
        farmProfile: profile._id,
        name,
        type,
        quantity: 0,
        unit,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      });
    } else if (expiryDate) {
      material.expiryDate = new Date(expiryDate);
    }

    // Add quantity
    material.quantity += Number(quantity);
    await material.save();

    // Create log
    const log = await MaterialLog.create({
      material: material._id,
      type: 'IMPORT',
      quantity: Number(quantity),
      date: date || new Date(),
      supplier,
      notes,
    });

    res.status(201).json({ success: true, data: { material, log } });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getMaterialLogs = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    // In a real app we'd filter logs by the materials owned by this farm
    // For simplicity, find all materials of this farm, then their logs
    const materials = await Material.find({ farmProfile: profile._id }).select('_id');
    const materialIds = materials.map(m => m._id);

    const logs = await MaterialLog.find({ material: { $in: materialIds } })
                                  .populate('material', 'name type unit')
                                  .sort({ date: -1 });

    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const material = await Material.findOneAndUpdate(
      { _id: req.params.id, farmProfile: profile._id },
      req.body,
      { new: true }
    );
    
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });
    
    res.json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const material = await Material.findOneAndDelete({ _id: req.params.id, farmProfile: profile._id });
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    // Optional: Also delete related logs? Usually logs are kept or marked deleted, but we can delete them here for simplicity
    await MaterialLog.deleteMany({ material: material._id });

    res.json({ success: true, message: 'Material deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
