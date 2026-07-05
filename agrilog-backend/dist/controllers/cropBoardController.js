"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCropBoardById = exports.createCropBoard = exports.getCropBoards = void 0;
const CropBoard_1 = require("../models/CropBoard");
const FarmProfile_1 = require("../models/FarmProfile");
const getCropBoards = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Farm profile not found' });
        const { boardType } = req.query;
        const filter = { farmProfile: profile._id };
        if (boardType) {
            filter.boardType = boardType;
        }
        const boards = await CropBoard_1.CropBoard.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, data: boards });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCropBoards = getCropBoards;
const createCropBoard = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Farm profile not found' });
        const board = await CropBoard_1.CropBoard.create({
            ...req.body,
            farmProfile: profile._id,
        });
        res.status(201).json({ success: true, data: board });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createCropBoard = createCropBoard;
const getCropBoardById = async (req, res) => {
    try {
        const board = await CropBoard_1.CropBoard.findById(req.params.id);
        if (!board)
            return res.status(404).json({ success: false, message: 'Board not found' });
        res.json({ success: true, data: board });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCropBoardById = getCropBoardById;
