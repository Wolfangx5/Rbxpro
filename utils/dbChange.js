const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://nut1:UBV5YetLDQuvLnX@surveysite.oeencg9.mongodb.net/?retryWrites=true&w=majority"

const client = new MongoClient(uri);
async function connect() {
  try {
    await client.connect();
    console.log('Connected to the database');
  } catch (error) {
    console.error('Error connecting to the database', error);
  }
}
connect()
async function addnewUser(username, userID, token) {
  try {
    const database = client.db('UserInfo');
    const collection = database.collection('userData');

    const document = {
      username: username,
      id: userID,
      balance: 0,
      sessionToken: token,
    
    };

    const result = await collection.insertOne(document);
    console.log('Write result:', result);
  } catch (error) {
    console.error('Error writing data', error);
  }
}
async function changeUserBalance(userID, newBalance) {
 try{
  const database = client.db('UserInfo');
  const collection = database.collection('userData');

    const result = await collection.updateOne(
      { id: userID },
      { $set: { balance: newBalance } }
    );
    if (result.modifiedCount === 1) {
      console.log('User balance updated successfully.');
    } else {
      console.log('Failed to update user balance.');
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
}
async function checkUserExists(userID) {

  try {
    const database = client.db('UserInfo');
  const collection = database.collection('userData');
    const user = await collection.findOne({ id: userID });
    if (user) {
      console.log('User ID exists in the database.');
      return user;
    } else {
      console.log('User ID does not exist in the database.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred:', error);
    return null;
  }
}  
async function getUserData(sessionToken) {
 

  try {
    const database = client.db('UserInfo');
    const collection = database.collection('userData');
    const user = await collection.findOne({ sessionToken: sessionToken });

    if (user) {
     
      return user;
    } else {
      return null;
    }
  } catch (error) {
    console.error('An error occurred:', error);
    return null;
  }
}
async function canUseDailyCommand(id) {
  try {
    const database = client.db('UserInfo');
    const collection = database.collection('surveyDailyReset');
    const user = await collection.findOne({ id: id });

    if (user) {
      const lastUsage = user.date;
      const now = new Date();
      if ((now - new Date(lastUsage)) > 24 * 60 * 60 * 1000) {
        // More than 24 hours passed
        return false;
      }else{
        return true;
      }
    } else {
      // No record found, user can use the command
      return false;
    }
    return false;
  } catch (error) {
    console.error('An error occurred:', error);
    return false;
  }
}
async function addOrUpdateDailyUsage(id) {
  try {
    const database = client.db('UserInfo');
    const collection = database.collection('surveyDailyReset');
    const now = new Date();

    const result = await collection.updateOne(
      { id: id },
      { $set: { date: now } },
      { upsert: true } // Create a new document if it doesn't exist
    );

    if (result.upsertedCount > 0) {
      console.log('New daily usage record added:', result);
    } else if (result.modifiedCount > 0) {
      console.log('Daily usage record updated:', result);
    } else {
      console.log('No changes made to the daily usage record.');
    }
  } catch (error) {
    console.error('Error adding or updating daily usage:', error);
  }
}


  module.exports = {
    connect,
    changeUserBalance,
    getUserData,
    checkUserExists,
    addnewUser,
    addOrUpdateDailyUsage,
    canUseDailyCommand
  };
