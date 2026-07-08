const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/agrilog').then(async () => {
  const FarmProfile = mongoose.model('FarmProfile', new mongoose.Schema({}, { strict: false }));
  await FarmProfile.updateMany({ plan: 'STANDARD' }, { $set: { planExpiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
  console.log('Updated planExpiresAt to yesterday');
  mongoose.disconnect();
});
