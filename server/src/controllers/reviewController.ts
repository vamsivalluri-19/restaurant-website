import { Request, Response } from 'express';
import { Review } from '../models/Review';
import { isMockDB, reviewsList } from '../utils/mockDbStore';

export const getReviews = async (req: Request, res: Response) => {
  try {
    if (isMockDB) {
      return res.json(reviewsList);
    } else {
      const reviews = await Review.find().sort({ createdAt: -1 });
      return res.json(reviews);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getPublicApprovedReviews = async (req: Request, res: Response) => {
  try {
    if (isMockDB) {
      return res.json(reviewsList.filter(r => r.isApproved));
    } else {
      const reviews = await Review.find({ isApproved: true }).sort({ createdAt: -1 });
      return res.json(reviews);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const createReview = async (req: Request, res: Response) => {
  try {
    const { rating, comment, userName, foodName } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }

    // Determine user name
    const finalUserName = userName || ((req as any).user ? (req as any).user.name : 'Anonymous Guest');

    let placedReview: any;

    if (isMockDB) {
      const newReview = {
        _id: 'rev' + (reviewsList.length + 1),
        userName: finalUserName,
        foodName,
        rating: Number(rating),
        comment,
        createdAt: new Date(),
        isApproved: false // Requires admin/manager approval
      };
      reviewsList.push(newReview);
      placedReview = newReview;
    } else {
      const newReview = new Review({
        userName: finalUserName,
        foodName,
        rating: Number(rating),
        comment,
        createdAt: new Date(),
        isApproved: false
      });
      await newReview.save();
      placedReview = newReview;
    }

    // Emit live review notification to the admin/manager so they know to approve it!
    if ((global as any).io) {
      (global as any).io.emit('newReviewSubmitted', placedReview);
    }

    return res.status(201).json({
      message: 'Review submitted successfully. Pending approval.',
      review: placedReview
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const approveReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    let updatedReview: any;

    if (isMockDB) {
      const idx = reviewsList.findIndex(r => r._id === id);
      if (idx === -1) return res.status(404).json({ message: 'Review not found' });
      reviewsList[idx].isApproved = true;
      updatedReview = reviewsList[idx];
    } else {
      updatedReview = await Review.findByIdAndUpdate(id, { isApproved: true }, { new: true });
      if (!updatedReview) return res.status(404).json({ message: 'Review not found' });
    }

    // Notify clients that review was approved (so it displays on public menu landing page)
    if ((global as any).io) {
      (global as any).io.emit('reviewApproved', updatedReview);
    }

    return res.json(updatedReview);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
