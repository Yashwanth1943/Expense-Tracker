import Transaction from "../models/Transaction.js";

// ➕ Add Transaction
export const addTransaction = async (req, res) => {
  try {
    const { title, amount, category, date, notes } = req.body;

    const transaction = await Transaction.create({
      userId: req.user._id,
      title,
      amount,
      category,
      date,
      notes
    });

    res.status(201).json(transaction);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📥 Get All Transactions (only logged-in user)
export const getTransactions = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const { search, category, startDate, endDate } = req.query;

    let filter = { userId: req.user._id };

    // 🔍 Search by title
    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    // 📂 Filter by category
    if (category && category !== "All") {
      filter.category = category;
    }

    // 📅 Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(filter);

    res.json({
      transactions,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTransactions: total
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✏️ Update Transaction
export const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ❌ Delete Transaction
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await transaction.deleteOne();

    res.json({ message: "Transaction deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user._id
    });

    const totalExpense = transactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    const categoryBreakdown = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    res.json({
      totalExpense,
      categoryBreakdown
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Transaction.distinct("category", {
      userId: req.user._id
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
