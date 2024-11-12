const { MongoClient } = require('mongodb');
const crypto = require('crypto');

const uri = "mongodb+srv://nut1:UBV5YetLDQuvLnX@surveysite.oeencg9.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function connect() {
  try {
    await client.connect();
    console.log('Connected to the database');
  } catch (error) {
    console.error('Error connecting to the database', error);
  }
}

connect();

// Create Promo Code Function
async function createPromoCode(amount, durationInput, maxUses, code = null) {
  try {
    const database = client.db('UserInfo');
    const collection = database.collection('promoCodes');

    const promoCode = code || crypto.randomBytes(6).toString('hex');

    // Ensure durationInput is a string
    
    // Parse the duration input.
    console.log(durationInput)
    let durationInHours;
    const durationValue = durationInput.toString().slice(0, -1)
    const durationUnit = durationInput.toString().slice(-1).toUpperCase();

    if (isNaN(parseInt(durationValue))) {
      throw new Error('Invalid duration format. Ensure the duration value is a number followed by H, D, or W.');
    }

    switch (durationUnit) {
      case 'H':
        durationInHours = durationValue;
        break;
      case 'D':
        durationInHours = durationValue * 24;
        break;
      case 'W':
        durationInHours = durationValue * 24 * 7;
        break;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + durationInHours);

    const newPromoCode = {
      code: promoCode,
      amount,
      expiresAt,
      isActive: true,
      maxUses,
      usedCount: 0,
      redeemedUsers: [], // Add field to track users who have redeemed the promo
      createdAt: new Date(),
    };

    const result = await collection.insertOne(newPromoCode);
    console.log('Promo code created:', result);
    return newPromoCode;
  } catch (error) {
    console.error('Error creating promo code:', error);
    throw new Error('Could not create promo code');
  }
}
// Check Promo Code Validity Function
async function checkPromoCodeValidity(code, userId) {
  try {
    const database = client.db('UserInfo');
    const collection = database.collection('promoCodes');
    
    const promoCode = await collection.findOne({ code, isActive: true });

    if (promoCode && promoCode.expiresAt > new Date() && promoCode.usedCount < promoCode.maxUses) {
      if (!promoCode.redeemedUsers.includes(userId)) {
        console.log('Promo code is valid for this user.');
        return promoCode;
      } else {
        console.log('User has already redeemed this promo code.');
        return null; // User has already redeemed the code
      }
    } else {
      console.log('Promo code is invalid, expired, or has reached its usage limit.');
      return null;
    }
  } catch (error) {
    console.error('Error checking promo code validity:', error);
    return null;
  }
}

// Mark Promo Code as Used Function
async function markPromoCodeUsed(code, userId) {
  try {
    const database = client.db('UserInfo');
    const collection = database.collection('promoCodes');

    const promoCode = await collection.findOne({ code });
    
    if (promoCode && promoCode.usedCount < promoCode.maxUses && !promoCode.redeemedUsers.includes(userId)) {
      const result = await collection.updateOne(
        { code },
        { 
          $inc: { usedCount: 1 },
          $push: { redeemedUsers: userId }, // Add userId to the redeemedUsers array
          $set: { isActive: promoCode.usedCount + 1 < promoCode.maxUses }
        }
      );

      if (result.modifiedCount === 1) {
        console.log('Promo code usage recorded successfully.');
        return true;
      } else {
        console.log('Failed to update promo code usage.');
        return false;
      }
    } else {
      console.log('Promo code has reached its maximum usage limit or user has already redeemed it.');
      return false;
    }
  } catch (error) {
    console.error('Error marking promo code as used:', error);
    return false;
  }
}

module.exports = {
  connect,
  createPromoCode,
  checkPromoCodeValidity,
  markPromoCodeUsed,
};
