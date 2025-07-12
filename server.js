// server.js
require('dotenv').config(); // لتحميل المتغيرات من ملف .env
const express = require('express');
const { StreamChat } = require('stream-chat'); // هذه الحزمة تم تثبيتها للتو
const cors = require('cors'); // هذه الحزمة تم تثبيتها للتو

const app = express();
const port = process.env.PORT || 3000;

// استخدام متغيرات البيئة لـ API Key و Secret من ملف .env
const api_key = process.env.GETSTREAM_API_KEY;
const api_secret = process.env.GETSTREAM_API_SECRET;

console.log('Stream API Key (from .env):', api_key);
console.log('Stream API Secret (from .env):', api_secret ? 'LOADED' : 'NOT_LOADED'); // لا تطبع المفتاح السري كاملاً للأمان

app.use(cors()); // تفعيل CORS للسماح للواجهة الأمامية بالاتصال
app.use(express.json()); // للسماح بتحليل طلبات JSON

// **هذا السطر مهم لتقديم الملفات الثابتة من مجلد 'public'**
app.use(express.static('public'));

// نقطة نهاية لتوليد Token للمستخدم
app.post('/generate-token', async (req, res) => {
    const { userId } = req.body;
    console.log(`Generating token for user: ${userId}`);

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    try {
        const serverClient = StreamChat.getInstance(api_key, api_secret);
        const token = serverClient.createToken(userId);
        res.json({ token, api_key, userId }); // إرسال الـ token والـ API Key والـ userId للواجهة الأمامية
    } catch (error) {
        console.error('Error generating token:', error);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

// نقطة نهاية بسيطة لاختبار أن الخادم يعمل
app.get('/', (req, res) => {
    res.send('Stream Video Call Backend is running!');
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});