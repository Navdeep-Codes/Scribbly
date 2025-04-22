const mongoose = require('mongoose');

const DiaryEntrySchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true,
    default: 'anonymous' // For now, before we implement authentication
  },
  content: { 
    type: String, 
    required: true 
  },
  title: {
    type: String,
    default: 'Untitled Entry'
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  formattedContent: { 
    type: String 
  },
  lastModified: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('DiaryEntry', DiaryEntrySchema);