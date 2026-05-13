import { Request, Response } from 'express';
import { Menu } from '../models/Menu';

export async function listMenus(req: Request, res: Response) {
  try {
    const { date, project } = req.query;
    const filter: any = { status: 'active' };

    if (project) filter.project = project;

    if (date) {
      const d = new Date(date as string);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const menus = await Menu.find(filter)
      .populate('project',   'name')
      .populate('createdBy', 'fullName')
      .sort({ mealType: 1 })
      .lean();

    res.json({ success: true, data: menus });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createMenu(req: Request, res: Response) {
  try {
    const menu = await Menu.create({ ...req.body, createdBy: req.user?.userId });
    res.status(201).json({ success: true, data: menu });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function getMenu(req: Request, res: Response) {
  try {
    const menu = await Menu.findById(req.params.id)
      .populate('project',   'name')
      .populate('createdBy', 'fullName')
      .lean();

    if (!menu) return res.status(404).json({ success: false, message: 'Menu not found' });
    res.json({ success: true, data: menu });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateMenu(req: Request, res: Response) {
  try {
    const menu = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('project',   'name')
      .populate('createdBy', 'fullName')
      .lean();

    if (!menu) return res.status(404).json({ success: false, message: 'Menu not found' });
    res.json({ success: true, data: menu });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}
