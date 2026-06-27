import { Request, Response } from 'express';
import { isMockDB, ordersList, OrderType, OrderItemType, tablesList, couponsList, usersList } from '../utils/mockDbStore';
import { Order } from '../models/Order';
import { Table } from '../models/Table';
import { Coupon } from '../models/Coupon';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const placeOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      type, 
      tableNumber, 
      items, 
      couponCode, 
      paymentMethod,
      specialInstructions,
      address,
      phone,
      deliverySubtype,
      companyName,
      floorBlock,
      cabinNumber
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart items cannot be empty' });
    }

    // Calculations
    let subtotal = 0;
    const orderItems: OrderItemType[] = items.map((item: any) => {
      const price = Number(item.price);
      const qty = Number(item.quantity);
      subtotal += price * qty;
      return {
        foodId: item.foodId,
        name: item.name,
        price,
        quantity: qty,
        isVeg: !!item.isVeg
      };
    });

    // Tax and Charges (5% GST, 5% Service Charge, delivery charge if Home Delivery)
    const gst = Math.round(subtotal * 0.05 * 100) / 100;
    const serviceCharge = type === 'Dine In' ? Math.round(subtotal * 0.05 * 100) / 100 : 0;
    const deliveryCharge = type === 'Home Delivery' ? 40 : 0;

    // Coupon Discount
    let discount = 0;
    if (couponCode) {
      const codeUpper = couponCode.toUpperCase();
      if (isMockDB) {
        const cp = couponsList.find((c) => c.code === codeUpper);
        if (cp && subtotal >= cp.minOrderValue) {
          discount = Math.min(Math.round(subtotal * (cp.discountPercentage / 100) * 100) / 100, cp.maxDiscount);
        }
      } else {
        const cp = await Coupon.findOne({ code: codeUpper });
        if (cp && subtotal >= cp.minOrderValue) {
          discount = Math.min(Math.round(subtotal * (cp.discountPercentage / 100) * 100) / 100, cp.maxDiscount);
        }
      }
    }

    const grandTotal = Math.round((subtotal + gst + serviceCharge + deliveryCharge - discount) * 100) / 100;
    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const otp = type === 'Home Delivery' ? Math.floor(1000 + Math.random() * 9000).toString() : undefined;

    const userProfile = req.user ? {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: phone || ''
    } : undefined;

    let placedOrder: any;

    if (isMockDB) {
      const newOrder: OrderType = {
        _id: 'o' + (ordersList.length + 1),
        orderId,
        user: userProfile,
        type,
        tableNumber: tableNumber ? Number(tableNumber) : undefined,
        items: orderItems,
        subtotal,
        gst,
        serviceCharge,
        deliveryCharge,
        discount,
        grandTotal,
        status: 'Received',
        paymentStatus: paymentMethod === 'COD' || paymentMethod === 'Cash' ? 'Pending' : 'Paid',
        paymentMethod,
        specialInstructions,
        createdAt: new Date(),
        otp,
        address,
        phone,
        deliverySubtype: deliverySubtype || 'Home',
        companyName,
        floorBlock,
        cabinNumber
      };

      ordersList.push(newOrder);

      // If Dine In, update Table Status to Occupied
      if (type === 'Dine In' && tableNumber) {
        const idx = tablesList.findIndex((t) => t.number === Number(tableNumber));
        if (idx !== -1) {
          tablesList[idx].status = 'Occupied';
          tablesList[idx].currentOrderId = newOrder._id;
          if ((global as any).io) {
            (global as any).io.emit('tableStatusChanged', { number: Number(tableNumber), status: 'Occupied' });
          }
        }
      }

      // Add Loyalty Points (1 point per Rs 10 spent)
      if (req.user) {
        const usrIdx = usersList.findIndex((u) => u._id === req.user?._id);
        if (usrIdx !== -1) {
          usersList[usrIdx].loyaltyPoints += Math.floor(grandTotal / 10);
        }
      }

      placedOrder = newOrder;
    } else {
      const newOrder = new Order({
        orderId,
        user: userProfile,
        type,
        tableNumber: tableNumber ? Number(tableNumber) : undefined,
        items: orderItems,
        subtotal,
        gst,
        serviceCharge,
        deliveryCharge,
        discount,
        grandTotal,
        status: 'Received',
        paymentStatus: paymentMethod === 'COD' || paymentMethod === 'Cash' ? 'Pending' : 'Paid',
        paymentMethod,
        specialInstructions,
        otp,
        address,
        phone,
        deliverySubtype: deliverySubtype || 'Home',
        companyName,
        floorBlock,
        cabinNumber
      });

      await newOrder.save();

      // Update table
      if (type === 'Dine In' && tableNumber) {
        await Table.findOneAndUpdate(
          { number: Number(tableNumber) },
          { status: 'Occupied', currentOrderId: newOrder._id }
        );
        if ((global as any).io) {
          (global as any).io.emit('tableStatusChanged', { number: Number(tableNumber), status: 'Occupied' });
        }
      }

      // Update user points
      if (req.user) {
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { loyaltyPoints: Math.floor(grandTotal / 10) }
        });
      }

      placedOrder = newOrder;
    }

    // Trigger Real-Time Sockets for Admin Dashboard & Kitchen display
    if ((global as any).io) {
      (global as any).io.emit('newOrder', placedOrder);
    }

    return res.status(201).json({
      message: 'Order placed successfully',
      order: placedOrder
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    if (isMockDB) {
      return res.json(ordersList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } else {
      const orders = await Order.find().sort({ createdAt: -1 });
      return res.json(orders);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUserOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    if (isMockDB) {
      const userOrders = ordersList.filter((o) => o.user?._id === req.user?._id);
      return res.json(userOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } else {
      const userOrders = await Order.find({ 'user._id': req.user._id }).sort({ createdAt: -1 });
      return res.json(userOrders);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (isMockDB) {
      const order = ordersList.find((o) => o._id === id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      return res.json(order);
    } else {
      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      return res.json(order);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, deliveryPartnerId, chefName, deliveryPartnerName } = req.body;

    const validStatuses = ['Received', 'Preparing', 'Ready', 'Served', 'Completed', 'Cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    let updatedOrder: any;

    if (isMockDB) {
      const index = ordersList.findIndex((o) => o._id === id);
      if (index === -1) return res.status(404).json({ message: 'Order not found' });
      
      if (status) ordersList[index].status = status;
      if (deliveryPartnerId) ordersList[index].deliveryPartnerId = deliveryPartnerId;
      if (chefName) ordersList[index].chefName = chefName;
      if (deliveryPartnerName) {
        ordersList[index].deliveryPartnerName = deliveryPartnerName;
        ordersList[index].deliveryPartnerPhone = deliveryPartnerName === 'Subrahmanyam' ? '+91 8765432109' : '+91 9876543210';
        ordersList[index].deliveryLocation = { lat: 16.3067, lng: 80.4365, progress: 0 };
      }

      const order = ordersList[index];

      // Auto update table status based on order completion/servicing
      if (order.type === 'Dine In' && order.tableNumber) {
        const tblIdx = tablesList.findIndex((t) => t.number === order.tableNumber);
        if (tblIdx !== -1) {
          if (status === 'Served') {
            tablesList[tblIdx].status = 'Occupied';
          } else if (status === 'Completed' || status === 'Cancelled') {
            tablesList[tblIdx].status = 'Cleaning';
            tablesList[tblIdx].currentOrderId = undefined;
            // Simulate auto cleaning completed after 10 seconds for demo convenience
            setTimeout(() => {
              const tidx = tablesList.findIndex((t) => t.number === order.tableNumber);
              if (tidx !== -1 && tablesList[tidx].status === 'Cleaning') {
                tablesList[tidx].status = 'Available';
                if ((global as any).io) {
                  (global as any).io.emit('tableStatusChanged', { number: order.tableNumber, status: 'Available' });
                }
              }
            }, 15000);
          }
          if ((global as any).io) {
            (global as any).io.emit('tableStatusChanged', { number: order.tableNumber, status: tablesList[tblIdx].status });
          }
        }
      }

      // If Home Delivery and Completed, mark Paid
      if (order.type === 'Home Delivery' && status === 'Completed') {
        ordersList[index].paymentStatus = 'Paid';
      }

      updatedOrder = ordersList[index];
    } else {
      const updateObj: any = {};
      if (status) updateObj.status = status;
      if (deliveryPartnerId) updateObj.deliveryPartnerId = deliveryPartnerId;
      if (chefName) updateObj.chefName = chefName;
      if (deliveryPartnerName) {
        updateObj.deliveryPartnerName = deliveryPartnerName;
        updateObj.deliveryPartnerPhone = deliveryPartnerName === 'Subrahmanyam' ? '+91 8765432109' : '+91 9876543210';
        updateObj.deliveryLocation = { lat: 16.3067, lng: 80.4365, progress: 0 };
      }

      updatedOrder = await Order.findByIdAndUpdate(id, updateObj, { new: true });
      if (!updatedOrder) return res.status(404).json({ message: 'Order not found' });

      // Handle table triggers in real DB
      if (updatedOrder.type === 'Dine In' && updatedOrder.tableNumber) {
        if (status === 'Completed' || status === 'Cancelled') {
          await Table.findOneAndUpdate({ number: updatedOrder.tableNumber }, { status: 'Cleaning', currentOrderId: null as any });
          if ((global as any).io) {
            (global as any).io.emit('tableStatusChanged', { number: updatedOrder.tableNumber, status: 'Cleaning' });
          }
          setTimeout(async () => {
            await Table.findOneAndUpdate({ number: updatedOrder.tableNumber, status: 'Cleaning' }, { status: 'Available' });
            if ((global as any).io) {
              (global as any).io.emit('tableStatusChanged', { number: updatedOrder.tableNumber, status: 'Available' });
            }
          }, 15000);
        }
      }

      if (updatedOrder.type === 'Home Delivery' && status === 'Completed') {
        updatedOrder.paymentStatus = 'Paid';
        await updatedOrder.save();
      }
    }

    // Notify clients about update
    if ((global as any).io) {
      (global as any).io.emit('orderStatusChanged', updatedOrder);
    }

    return res.json(updatedOrder);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getCoupons = async (req: Request, res: Response) => {
  try {
    if (isMockDB) {
      return res.json(couponsList);
    } else {
      const coupons = await Coupon.find();
      return res.json(coupons);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const createCoupon = async (req: Request, res: Response) => {
  try {
    const { code, discountPercentage, minOrderValue, maxDiscount, expiryDate } = req.body;
    const codeUpper = code.toUpperCase();

    if (isMockDB) {
      const newCoupon = {
        _id: 'c' + (couponsList.length + 1),
        code: codeUpper,
        discountPercentage: Number(discountPercentage),
        minOrderValue: Number(minOrderValue),
        maxDiscount: Number(maxDiscount),
        expiryDate: new Date(expiryDate)
      };
      couponsList.push(newCoupon);
      return res.status(201).json(newCoupon);
    } else {
      const newCoupon = new Coupon({
        code: codeUpper,
        discountPercentage: Number(discountPercentage),
        minOrderValue: Number(minOrderValue),
        maxDiscount: Number(maxDiscount),
        expiryDate: new Date(expiryDate)
      });
      await newCoupon.save();
      return res.status(201).json(newCoupon);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateOrderItems = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { items, couponCode, specialInstructions } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart items cannot be empty' });
    }

    // Calculations
    let subtotal = 0;
    const orderItems: OrderItemType[] = items.map((item: any) => {
      const price = Number(item.price);
      const qty = Number(item.quantity);
      subtotal += price * qty;
      return {
        foodId: item.foodId,
        name: item.name,
        price,
        quantity: qty,
        isVeg: !!item.isVeg
      };
    });

    let orderToUpdate: any;

    if (isMockDB) {
      const index = ordersList.findIndex((o) => o._id === id);
      if (index === -1) {
        return res.status(404).json({ message: 'Order not found' });
      }
      orderToUpdate = ordersList[index];
    } else {
      orderToUpdate = await Order.findById(id);
      if (!orderToUpdate) {
        return res.status(404).json({ message: 'Order not found' });
      }
    }

    // Check if order is modifiable
    const nonModifiableStatuses = ['Served', 'Completed', 'Cancelled'];
    if (nonModifiableStatuses.includes(orderToUpdate.status)) {
      return res.status(400).json({ message: `Order cannot be modified as it is already ${orderToUpdate.status}` });
    }

    const type = orderToUpdate.type;

    // Tax and Charges (5% GST, 5% Service Charge, delivery charge if Home Delivery)
    const gst = Math.round(subtotal * 0.05 * 100) / 100;
    const serviceCharge = type === 'Dine In' ? Math.round(subtotal * 0.05 * 100) / 100 : 0;
    const deliveryCharge = type === 'Home Delivery' ? 40 : 0;

    // Coupon Discount
    let discount = 0;
    const activeCoupon = couponCode || orderToUpdate.couponCode;
    if (activeCoupon) {
      const codeUpper = activeCoupon.toUpperCase();
      if (isMockDB) {
        const cp = couponsList.find((c) => c.code === codeUpper);
        if (cp && subtotal >= cp.minOrderValue) {
          discount = Math.min(Math.round(subtotal * (cp.discountPercentage / 100) * 100) / 100, cp.maxDiscount);
        }
      } else {
        const cp = await Coupon.findOne({ code: codeUpper });
        if (cp && subtotal >= cp.minOrderValue) {
          discount = Math.min(Math.round(subtotal * (cp.discountPercentage / 100) * 100) / 100, cp.maxDiscount);
        }
      }
    }

    const grandTotal = Math.round((subtotal + gst + serviceCharge + deliveryCharge - discount) * 100) / 100;

    let updatedOrder: any;

    if (isMockDB) {
      const index = ordersList.findIndex((o) => o._id === id);
      ordersList[index].items = orderItems;
      ordersList[index].subtotal = subtotal;
      ordersList[index].gst = gst;
      ordersList[index].serviceCharge = serviceCharge;
      ordersList[index].deliveryCharge = deliveryCharge;
      ordersList[index].discount = discount;
      ordersList[index].grandTotal = grandTotal;
      if (specialInstructions !== undefined) {
        ordersList[index].specialInstructions = specialInstructions;
      }
      updatedOrder = ordersList[index];
    } else {
      const updateObj: any = {
        items: orderItems,
        subtotal,
        gst,
        serviceCharge,
        deliveryCharge,
        discount,
        grandTotal
      };
      if (specialInstructions !== undefined) {
        updateObj.specialInstructions = specialInstructions;
      }
      updatedOrder = await Order.findByIdAndUpdate(id, updateObj, { new: true });
    }

    // Trigger Real-Time Sockets for Admin Dashboard, Kitchen KDS, and Delivery Dashboard
    if ((global as any).io) {
      (global as any).io.emit('orderStatusChanged', updatedOrder);
    }

    return res.json({
      message: 'Order updated successfully',
      order: updatedOrder
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateOrderLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { lat, lng, progress } = req.body;

    let updatedOrder: any;

    if (isMockDB) {
      const index = ordersList.findIndex((o) => o._id === id);
      if (index === -1) return res.status(404).json({ message: 'Order not found' });
      
      ordersList[index].deliveryLocation = {
        lat: Number(lat),
        lng: Number(lng),
        progress: Number(progress)
      };
      
      updatedOrder = ordersList[index];
    } else {
      updatedOrder = await Order.findByIdAndUpdate(
        id,
        {
          deliveryLocation: {
            lat: Number(lat),
            lng: Number(lng),
            progress: Number(progress)
          }
        },
        { new: true }
      );
      if (!updatedOrder) return res.status(404).json({ message: 'Order not found' });
    }

    if ((global as any).io) {
      (global as any).io.emit('deliveryLocationUpdate', {
        orderId: id,
        deliveryLocation: updatedOrder.deliveryLocation,
        status: updatedOrder.status
      });
    }

    return res.json(updatedOrder);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

