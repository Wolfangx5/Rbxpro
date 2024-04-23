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



  module.exports = {
    connect,
    changeUserBalance,
    getUserData,
    checkUserExists,
    addnewUser,
  };
