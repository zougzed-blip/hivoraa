const mongoose = require('mongoose');

const connectDB = async () => {
     try{
     
        
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        })
        
        console.log('DATABASE CONNECTED SUCCESSFULLY');
        return true;
    }
    catch(error){
        console.error('DATABASE ERROR:', error.message);
        console.error('STACK:', error.stack);
        console.error('NAME:', error.name);
        console.error('CODE:', error.code);
        throw error; 
    }  
};

module.exports = connectDB;
