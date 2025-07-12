// script.js

// 1. الحصول على عناصر الواجهة من الـ HTML
const userIdInput = document.getElementById('userIdInput');
const loginButton = document.getElementById('loginButton');
const loginStatus = document.getElementById('loginStatus');
const callIdInput = document.getElementById('callIdInput');
const joinCallButton = document.getElementById('joinCallButton');
const leaveCallButton = document.getElementById('leaveCallButton');
const callStatus = document.getElementById('callStatus');
const loginSection = document.getElementById('login-section');
const callSection = document.getElementById('call-section');
const callUI = document.getElementById('call-ui'); // العنصر الذي ستُعرض فيه واجهة المكالمة

// 2. تعريف المتغيرات العامة لعميل الفيديو والمكالمة
let videoClient; // كائن StreamVideoClient (سيتم تهيئته عند تسجيل الدخول)
let currentCall; // كائن المكالمة الحالي (سيتم تعيينه عند الانضمام لمكالمة)

// 3. وظيفة مساعدة لتهيئة Stream Video Client
async function initializeClient(userId, token, apiKey) {
    // إذا كان هناك عميل فيديو موجود مسبقًا، قم بفصله أولاً لتجنب مشاكل الاتصال المتعدد
    if (videoClient) {
        await videoClient.disconnectUser();
    }

    // إنشاء عميل StreamVideoClient جديد باستخدام مفتاح الـ API وتوكن المستخدم
    // هذا هو السطر الذي يتطلب أن تكون مكتبة Stream Video SDK قد تم تحميلها
    videoClient = new StreamVideoClient({
        apiKey,         // مفتاح الـ API الذي يتم جلبه من الخادم الخلفي
        user: { id: userId }, // معلومات المستخدم المطلوبة لتهيئة العميل
        token,          // توكن المصادقة الخاص بالمستخدم، يتم جلبه من الخادم الخلفي
    });
    console.log('Stream Video Client initialized:', videoClient); // لتتبع حالة التهيئة
}

// 4. التعامل مع حدث النقر على زر تسجيل الدخول
loginButton.addEventListener('click', async () => {
    const userId = userIdInput.value.trim(); // الحصول على معرف المستخدم من حقل الإدخال

    // التحقق من أن معرف المستخدم ليس فارغًا
    if (!userId) {
        loginStatus.textContent = 'الرجاء إدخال معرف المستخدم.';
        return;
    }

    loginButton.disabled = true; // تعطيل زر تسجيل الدخول لمنع النقرات المتعددة
    loginStatus.textContent = 'جاري تسجيل الدخول...'; // تحديث حالة تسجيل الدخول

    try {
        // إرسال طلب إلى الخادم الخلفي لجلبتوكن المصادقة للمستخدم
        const response = await fetch('http://localhost:3000/generate-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // تحديد نوع المحتوى كـ JSON
            },
            body: JSON.stringify({ userId }), // إرسال معرف المستخدم في جسم الطلب كـ JSON
        });

        // التحقق مما إذا كانت استجابة الخادم غير ناجحة (مثل خطأ 4xx أو 5xx)
        if (!response.ok) {
            const errorData = await response.json(); // محاولة قراءة رسالة الخطأ من الاستجابة
            throw new Error(errorData.error || 'فشل في جلب التوكن من الخادم الخلفي.');
        }

        const data = await response.json(); // قراءة بيانات الاستجابة (التوكن ومفتاح الـ API)
        const { token, api_key, userId: backendUserId } = data; // استخلاص البيانات الضرورية

        // تهيئة Stream Video Client باستخدام البيانات المستلمة من الخادم
        await initializeClient(backendUserId, token, api_key);

        // تحديث الواجهة بعد تسجيل الدخول بنجاح
        loginStatus.textContent = `تم تسجيل الدخول بنجاح كـ ${backendUserId}`;
        loginSection.style.display = 'none'; // إخفاء قسم تسجيل الدخول
        callSection.style.display = 'block'; // إظهار قسم المكالمة
        callStatus.textContent = 'جاهز للانضمام إلى مكالمة.';

    } catch (error) {
        // معالجة الأخطاء التي قد تحدث أثناء عملية تسجيل الدخول
        console.error('Login failed:', error);
        loginStatus.textContent = `فشل تسجيل الدخول: ${error.message}`;
    } finally {
        loginButton.disabled = false; // إعادة تفعيل زر تسجيل الدخول بغض النظر عن النتيجة
    }
});

// 5. التعامل مع حدث النقر على زر الانضمام إلى المكالمة
joinCallButton.addEventListener('click', async () => {
    const callId = callIdInput.value.trim(); // الحصول على معرف المكالمة من حقل الإدخال

    // التحقق من أن معرف المكالمة ليس فارغًا وأن العميل قد تم تهيئته
    if (!callId) {
        callStatus.textContent = 'الرجاء إدخال معرف المكالمة.';
        return;
    }
    if (!videoClient) {
        callStatus.textContent = 'الرجاء تسجيل الدخول أولاً.';
        return;
    }

    joinCallButton.disabled = true; // تعطيل زر الانضمام
    callStatus.textContent = 'جاري الانضمام إلى المكالمة...'; // تحديث حالة المكالمة

    try {
        // الحصول على كائن المكالمة من العميل. 'default' هو نوع المكالمة الافتراضي في Stream.
        currentCall = videoClient.getCall('default', callId);

        // الانضمام إلى المكالمة
        await currentCall.join();
        console.log('Joined call:', currentCall); // لتتبع حالة الانضمام

        // عرض واجهة المكالمة داخل العنصر #call-ui باستخدام وظيفة Stream SDK
        // (تتطلب هذه الوظيفة أن تكون مكتبة Stream Video SDK محملة بالكامل)
        StreamVideo.StreamCall.mount(callUI, { call: currentCall });

        // تحديث الواجهة بعد الانضمام بنجاح
        callUI.style.display = 'block'; // إظهار واجهة المكالمة
        joinCallButton.style.display = 'none'; // إخفاء زر الانضمام
        leaveCallButton.style.display = 'inline-block'; // إظهار زر المغادرة
        callStatus.textContent = `متصل بالمكالمة: ${callId}`;

    } catch (error) {
        // معالجة الأخطاء التي قد تحدث أثناء الانضمام للمكالمة
        console.error('Failed to join call:', error);
        callStatus.textContent = `فشل الانضمام إلى المكالمة: ${error.message}`;
        joinCallButton.disabled = false; // إعادة تفعيل زر الانضمام عند الفشل
    }
});

// 6. التعامل مع حدث النقر على زر مغادرة المكالمة
leaveCallButton.addEventListener('click', async () => {
    // التحقق من أن هناك مكالمة نشطة للمغادرة
    if (!currentCall) {
        callStatus.textContent = 'أنت لست في مكالمة.';
        return;
    }

    leaveCallButton.disabled = true; // تعطيل زر المغادرة
    callStatus.textContent = 'جاري مغادرة المكالمة...'; // تحديث حالة المكالمة

    try {
        await currentCall.leave(); // مغادرة المكالمة
        console.log('Left call:', currentCall); // لتتبع حالة المغادرة

        // إزالة واجهة المكالمة من العنصر #call-ui وتنظيفها
        callUI.innerHTML = '';
        callUI.style.display = 'none';

        // تحديث الواجهة بعد مغادرة المكالمة
        joinCallButton.style.display = 'inline-block'; // إظهار زر الانضمام مرة أخرى
        leaveCallButton.style.display = 'none'; // إخفاء زر المغادرة
        callStatus.textContent = 'تم مغادرة المكالمة.';

    } catch (error) {
        // معالجة الأخطاء التي قد تحدث أثناء مغادرة المكالمة
        console.error('Failed to leave call:', error);
        callStatus.textContent = `فشل مغادرة المكالمة: ${error.message}`;
    } finally {
        leaveCallButton.disabled = false; // إعادة تفعيل زر المغادرة (في حال وجود خطأ)
    }
});