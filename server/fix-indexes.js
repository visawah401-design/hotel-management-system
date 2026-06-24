const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const bookings = mongoose.connection.collection('bookings');
    
    // Check for duplicate ids
    const duplicates = await bookings.aggregate([
      { $group: { _id: '$id', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    if (duplicates.length > 0) {
      console.log('Found duplicates:', duplicates);
      // Remove duplicates - keep only first of each
      for (const dup of duplicates) {
        const docs = await bookings.find({ id: dup._id }).toArray();
        if (docs.length > 1) {
          const idsToDelete = docs.slice(1).map(d => d._id);
          await bookings.deleteMany({ _id: { $in: idsToDelete } });
          console.log('Deleted ' + idsToDelete.length + ' duplicates for id:', dup._id);
        }
      }
    } else {
      console.log('✅ No duplicate ids found');
    }
    
    // Drop old non-unique index
    try {
      await bookings.dropIndex('id_1');
      console.log('Dropped old id_1 index');
    } catch(e) {
      console.log('⚠️  Could not drop id_1 (probably already unique or gone)');
    }
    
    // Create unique index on id
    await bookings.createIndex({ id: 1 }, { unique: true, sparse: true });
    console.log('✅ Created unique index on id field');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixIndexes();
