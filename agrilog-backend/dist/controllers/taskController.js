"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.completeTask = exports.updateTask = exports.createTask = exports.getTasks = void 0;
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
        const { recurrence, recurrenceCustomDays, recurrenceEndDate, dueDate, title, notes, priority, ...rest } = req.body;
        const baseDate = new Date(dueDate);
        // Create the base task
        const task = await Task_1.Task.create({
            title,
            notes,
            priority: priority || 'MEDIUM',
            status: 'PENDING',
            recurrence: recurrence || 'NONE',
            recurrenceCustomDays: Number(recurrenceCustomDays) || undefined,
            recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : undefined,
            farmProfile: profile._id,
            dueDate: baseDate,
            ...rest,
        });
        // Generate recurrent tasks
        if (recurrence && recurrence !== 'NONE') {
            let endRecurrence;
            if (recurrenceEndDate) {
                endRecurrence = new Date(recurrenceEndDate);
            }
            else {
                // Default end date: 3 months from baseDate
                endRecurrence = new Date(baseDate);
                endRecurrence.setMonth(endRecurrence.getMonth() + 3);
            }
            const generatedTasks = [];
            const customDays = Math.max(1, Number(recurrenceCustomDays) || 1);
            const originalDay = baseDate.getDate();
            let step = 1;
            while (true) {
                let nextDate;
                if (recurrence === 'DAILY') {
                    nextDate = new Date(baseDate);
                    nextDate.setDate(baseDate.getDate() + step);
                }
                else if (recurrence === 'WEEKLY') {
                    nextDate = new Date(baseDate);
                    nextDate.setDate(baseDate.getDate() + (step * 7));
                }
                else if (recurrence === 'MONTHLY') {
                    let targetMonth = baseDate.getMonth() + step;
                    const targetYear = baseDate.getFullYear() + Math.floor(targetMonth / 12);
                    targetMonth = ((targetMonth % 12) + 12) % 12;
                    const maxDaysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
                    const safeDay = Math.min(originalDay, maxDaysInMonth);
                    nextDate = new Date(targetYear, targetMonth, safeDay, baseDate.getHours(), baseDate.getMinutes());
                }
                else if (recurrence === 'CUSTOM') {
                    nextDate = new Date(baseDate);
                    nextDate.setDate(baseDate.getDate() + (step * customDays));
                }
                else {
                    break;
                }
                if (nextDate > endRecurrence)
                    break;
                if (generatedTasks.length >= 100)
                    break; // Safety cap
                generatedTasks.push({
                    title,
                    notes,
                    priority: priority || 'MEDIUM',
                    farmProfile: profile._id,
                    dueDate: nextDate,
                    status: 'PENDING',
                    recurrence,
                    recurrenceCustomDays: Number(recurrenceCustomDays) || undefined,
                    recurrenceEndDate: endRecurrence,
                    parentTaskId: task._id,
                });
                step++;
            }
            if (generatedTasks.length > 0) {
                await Task_1.Task.insertMany(generatedTasks);
            }
        }
        res.status(201).json({ success: true, data: task });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createTask = createTask;
const updateTask = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Profile not found' });
        const task = await Task_1.Task.findOne({ _id: req.params.id, farmProfile: profile._id });
        if (!task)
            return res.status(404).json({ success: false, message: 'Task not found' });
        if (req.body.title !== undefined)
            task.title = req.body.title;
        if (req.body.dueDate !== undefined)
            task.dueDate = new Date(req.body.dueDate);
        if (req.body.status !== undefined)
            task.status = req.body.status;
        if (req.body.priority !== undefined)
            task.priority = req.body.priority;
        if (req.body.notes !== undefined)
            task.notes = req.body.notes;
        await task.save();
        res.json({ success: true, data: task });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateTask = updateTask;
const completeTask = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Profile not found' });
        const task = await Task_1.Task.findOne({ _id: req.params.id, farmProfile: profile._id });
        if (!task)
            return res.status(404).json({ success: false, message: 'Task not found' });
        task.status = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        await task.save();
        res.json({ success: true, data: task });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.completeTask = completeTask;
const deleteTask = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Profile not found' });
        const task = await Task_1.Task.findOne({ _id: req.params.id, farmProfile: profile._id });
        if (!task)
            return res.status(404).json({ success: false, message: 'Task not found' });
        const deleteSeries = req.query.deleteSeries === 'true';
        if (deleteSeries && (task.parentTaskId || task.recurrence !== 'NONE')) {
            const rootId = task.parentTaskId || task._id;
            await Task_1.Task.deleteMany({
                farmProfile: profile._id,
                $or: [{ _id: rootId }, { parentTaskId: rootId }],
            });
            res.json({ success: true, message: 'Đã xóa toàn bộ chuỗi công việc lặp lại' });
        }
        else {
            await Task_1.Task.findByIdAndDelete(task._id);
            res.json({ success: true, message: 'Đã xóa công việc' });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteTask = deleteTask;
