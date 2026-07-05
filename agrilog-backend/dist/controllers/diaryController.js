"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDiaryEntry = exports.getDiaryEntries = void 0;
const DiaryEntry_1 = require("../models/DiaryEntry");
const CropBoard_1 = require("../models/CropBoard");
const Material_1 = require("../models/Material");
const MaterialLog_1 = require("../models/MaterialLog");
const getDiaryEntries = async (req, res) => {
    try {
        const { boardId } = req.params;
        // Validate ownership
        const board = await CropBoard_1.CropBoard.findById(boardId);
        if (!board)
            return res.status(404).json({ success: false, message: 'Board not found' });
        // In a real app we'd verify the board belongs to the current user's farm profile.
        const entries = await DiaryEntry_1.DiaryEntry.find({ cropBoard: boardId }).sort({ date: -1 });
        res.json({ success: true, data: entries });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getDiaryEntries = getDiaryEntries;
const createDiaryEntry = async (req, res) => {
    try {
        const { boardId } = req.params;
        const board = await CropBoard_1.CropBoard.findById(boardId);
        if (!board)
            return res.status(404).json({ success: false, message: 'Board not found' });
        const entry = await DiaryEntry_1.DiaryEntry.create({
            ...req.body,
            cropBoard: boardId,
        });
        // Auto deduct inventory if it is FERTILIZER or PESTICIDE
        if ((req.body.type === 'FERTILIZER' || req.body.type === 'PESTICIDE') && req.body.material) {
            const material = await Material_1.Material.findById(req.body.material);
            if (material) {
                material.quantity -= Number(req.body.quantity || 0);
                await material.save();
                await MaterialLog_1.MaterialLog.create({
                    material: material._id,
                    type: 'EXPORT',
                    quantity: Number(req.body.quantity || 0),
                    date: req.body.date || new Date(),
                    notes: `Sử dụng cho bảng canh tác: ${board.name}`,
                });
            }
        }
        res.status(201).json({ success: true, data: entry });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createDiaryEntry = createDiaryEntry;
