import mongoose from 'mongoose';
import { format } from 'date-fns';
import { FloorCheckLine } from '../models/FloorCheckLine';
import { Item } from '../models/Item';
import { InventoryBalance } from '../models/InventoryBalance';
import { StockMovement } from '../models/StockMovement';
import { FloorCheck } from '../models/FloorCheck';
import { User } from '../models/User';
import { sendLowStockAlert, sendOutOfStockAlert } from './emailService';
import { Project } from '../models/Project';

async function getAdminEmails(): Promise<string[]> {
  const admins = await User.find({ role: { $in: ['admin', 'project_manager'] }, isActive: true }).select('email').lean();
  return admins.map((u: any) => u.email).filter(Boolean);
}

type MovementType = 'RECEIVE' | 'ISSUE' | 'CONSUMPTION' | 'RETURN' | 'DAMAGE' | 'ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT';

export async function applyMovementToBalance(params: {
  project: mongoose.Types.ObjectId | string;
  item: mongoose.Types.ObjectId | string;
  movementType: MovementType;
  quantity: number;
  date?: Date;
}): Promise<void> {
  const { project, item, movementType, quantity, date = new Date() } = params;
  const period = format(date, 'yyyy-MM');

  const balance = await InventoryBalance.findOneAndUpdate(
    { project, item, period },
    { $setOnInsert: { openingBalance: 0, monthlyLimit: 0 } },
    { upsert: true, new: true }
  );
  if (!balance) return;

  switch (movementType) {
    case 'RECEIVE':      balance.receivedQty += quantity; break;
    case 'RETURN':       balance.returnedQty += quantity; break;
    case 'TRANSFER_IN':  balance.receivedQty += quantity; break;
    case 'ISSUE':        balance.issuedQty   += quantity; break;
    case 'CONSUMPTION':  balance.consumedQty += quantity; break;
    case 'TRANSFER_OUT': balance.issuedQty   += quantity; break;
    case 'DAMAGE':       balance.damagedQty  += quantity; break;
    case 'ADJUSTMENT':   balance.receivedQty += quantity; break;
  }

  const prevStatus = balance.status;
  (balance as any).recalculate();
  await balance.save();

  // Fire stock alert emails when status transitions into low_stock or out_of_stock
  const newStatus = balance.status;
  if (newStatus !== prevStatus && (newStatus === 'low_stock' || newStatus === 'out_of_stock')) {
    (async () => {
      try {
        const [itemDoc, projectDoc] = await Promise.all([
          Item.findById(item).select('name unit type').lean() as any,
          Project.findById(project).select('name').lean() as any,
        ]);
        const emails = await getAdminEmails();
        const alertData = {
          itemName: itemDoc?.name || String(item),
          itemType: itemDoc?.type || 'unknown',
          remainingQty: balance.remainingQty,
          monthlyLimit: balance.monthlyLimit,
          unit: itemDoc?.unit || '',
          project: projectDoc?.name || String(project),
          period,
        };
        for (const email of emails) {
          if (newStatus === 'out_of_stock') {
            await sendOutOfStockAlert({ to: email, ...alertData });
          } else {
            await sendLowStockAlert({ to: email, ...alertData });
          }
        }
      } catch { /* silent */ }
    })();
  }
}

export async function updateOnApproval(floorCheckId: string): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const floorCheck = await FloorCheck.findById(floorCheckId).session(session);
    if (!floorCheck) throw new Error('Floor check not found');

    const lines = await FloorCheckLine.find({ floorCheck: floorCheckId }).populate('item').session(session);
    const period = format(floorCheck.date, 'yyyy-MM');

    for (const line of lines) {
      if (line.actualQty <= 0) continue;
      const item = await Item.findById(line.item).session(session);
      if (!item) continue;

      const movementType = item.type === 'food' ? 'CONSUMPTION' : 'ISSUE';

      await StockMovement.create(
        [
          {
            project: floorCheck.project,
            item: line.item,
            movementType,
            quantity: line.actualQty,
            movementDate: floorCheck.date,
            sourceType: 'floor_check',
            sourceRef: floorCheck._id,
            notes: `Auto-generated from floor check approval`,
            createdBy: floorCheck.supervisor,
          },
        ],
        { session }
      );

      const balance = await InventoryBalance.findOneAndUpdate(
        { project: floorCheck.project, item: line.item, period },
        { $setOnInsert: { openingBalance: 0, receivedQty: 0, monthlyLimit: 0 } },
        { upsert: true, new: true, session }
      );

      if (balance) {
        if (item.type === 'food') {
          balance.consumedQty += line.actualQty;
        } else {
          balance.issuedQty += line.actualQty;
        }
        (balance as any).recalculate();
        await balance.save({ session });
      }
    }

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
