import Subscriber from "../models/subscriberModel.js";

// ➕ Add New Subscriber
export const addSubscriber = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email || !phone) {
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });
    }

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Email already subscribed" });
    }

    const subscriber = await Subscriber.create({ email, phone });
    res.status(201).json({
      success: true,
      message: "Subscription successful",
      subscriber,
    });
  } catch (error) {
    console.error("Add Subscriber Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📋 Get All Subscribers
export const getSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: subscribers.length,
      subscribers,
    });
  } catch (error) {
    console.error("Get Subscribers Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ❌ Delete Subscriber
export const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;

    const subscriber = await Subscriber.findById(id);
    if (!subscriber) {
      return res
        .status(404)
        .json({ success: false, message: "Subscriber not found" });
    }

    await Subscriber.findByIdAndDelete(id);
    res
      .status(200)
      .json({ success: true, message: "Subscriber deleted successfully" });
  } catch (error) {
    console.error("Delete Subscriber Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
