import mongoose from 'mongoose';
import { format } from 'date-fns';
import { FloorCheckLine } from '../models/FloorCheckLine';
import { Item } from '../models/Item';
import { InventoryBalance } from '../models/InventoryBalance';
import { StockMovement } from '../models/StockMovement';
import { FloorCheck } from '../models/FloorCheck';

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
