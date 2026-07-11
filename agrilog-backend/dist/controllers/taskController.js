"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeTask = exports.createTask = exports.getTasks = void 0;
const Task_1 = require("../models/Task");
const FarmProfile_1 = require("../models/FarmProfile");
const getTasks = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Profile not found' });
        const tasks = await Task_1.Task.find({ farmProfile: profile._id }).sort({ dueDate: 1 });
        res.json({ success: true, data: tasks });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getTasks = getTasks;
const createTask = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Profile not found' });
        const task = await Task_1.Task.create({
            ...req.body,
            farmProfile: profile._id,
        });
        res.status(201).json({ success: true, data: task });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createTask = createTask;
const completeTask = async (req, res) => {
    try {
        const task = await Task_1.Task.findByIdAndUpdate(req.params.id, { status: 'COMPLETED' }, { returnDocument: 'after' });
        if (!task)
            return res.status(404).json({ success: false, message: 'Task not found' });
        res.json({ success: true, data: task });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.completeTask = completeTask;
