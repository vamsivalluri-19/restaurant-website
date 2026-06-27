import { Request, Response } from 'express';
import { isMockDB, tablesList, reservationsList } from '../utils/mockDbStore';
import { Table } from '../models/Table';
import { Reservation } from '../models/Reservation';

export const getTables = async (req: Request, res: Response) => {
  try {
    if (isMockDB) {
      return res.json(tablesList);
    } else {
      const tables = await Table.find().sort({ number: 1 });
      return res.json(tables);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getTableByNumber = async (req: Request, res: Response) => {
  try {
    const num = Number(req.params.number);
    if (isMockDB) {
      const table = tablesList.find((t) => t.number === num);
      if (!table) return res.status(404).json({ message: 'Table not found' });
      return res.json(table);
    } else {
      const table = await Table.findOne({ number: num });
      if (!table) return res.status(404).json({ message: 'Table not found' });
      return res.json(table);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateTableStatus = async (req: Request, res: Response) => {
  try {
    const num = Number(req.params.number);
    const { status } = req.body;

    if (!['Available', 'Occupied', 'Reserved', 'Cleaning'].includes(status)) {
      return res.status(400).json({ message: 'Invalid table status' });
    }

    if (isMockDB) {
      const index = tablesList.findIndex((t) => t.number === num);
      if (index === -1) return res.status(404).json({ message: 'Table not found' });
      tablesList[index].status = status;
      
      // Notify via Socket.IO (will be triggered in server.ts/socketHandler.ts)
      if ((global as any).io) {
        (global as any).io.emit('tableStatusChanged', { number: num, status });
      }
      
      return res.json(tablesList[index]);
    } else {
      const updated = await Table.findOneAndUpdate({ number: num }, { status }, { new: true });
      if (!updated) return res.status(404).json({ message: 'Table not found' });
      
      if ((global as any).io) {
        (global as any).io.emit('tableStatusChanged', { number: num, status });
      }

      return res.json(updated);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const reserveTable = async (req: Request, res: Response) => {
  try {
    const { customerName, email, phone, tableNumber, guestsCount, date, time } = req.body;

    if (isMockDB) {
      const newReservation = {
        _id: 'res' + (reservationsList.length + 1),
        customerName,
        email,
        phone,
        tableNumber: Number(tableNumber),
        guestsCount: Number(guestsCount),
        date,
        time,
        status: 'Pending' as const
      };
      reservationsList.push(newReservation);

      // Reserve table status
      const index = tablesList.findIndex((t) => t.number === Number(tableNumber));
      if (index !== -1) {
        tablesList[index].status = 'Reserved';
        if ((global as any).io) {
          (global as any).io.emit('tableStatusChanged', { number: Number(tableNumber), status: 'Reserved' });
        }
      }

      return res.status(201).json(newReservation);
    } else {
      const newReservation = new Reservation({
        customerName,
        email,
        phone,
        tableNumber: Number(tableNumber),
        guestsCount: Number(guestsCount),
        date,
        time,
        status: 'Pending'
      });
      await newReservation.save();

      // Reserve table status
      await Table.findOneAndUpdate({ number: Number(tableNumber) }, { status: 'Reserved' });
      if ((global as any).io) {
        (global as any).io.emit('tableStatusChanged', { number: Number(tableNumber), status: 'Reserved' });
      }

      return res.status(201).json(newReservation);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getReservations = async (req: Request, res: Response) => {
  try {
    if (isMockDB) {
      return res.json(reservationsList);
    } else {
      const reservations = await Reservation.find().sort({ createdAt: -1 });
      return res.json(reservations);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
