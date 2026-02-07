# הגדרת Netlify - פתרון שגיאת Build

## הבעיה
הבילד נכשל עם השגיאה:
```
Error: Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## הפתרון: הגדרת משתני סביבה ב-Netlify

### שלב 1: קבלת פרטי Supabase
1. היכנס ל-[Supabase Dashboard](https://supabase.com/dashboard)
2. בחר את הפרויקט שלך
3. לך ל-**Settings** → **API**
4. העתק את הערכים הבאים:
   - **Project URL** - זה הערך עבור `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** - זה הערך עבור `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### שלב 2: הגדרת משתני סביבה ב-Netlify
1. היכנס ל-[Netlify Dashboard](https://app.netlify.com)
2. בחר את האתר שלך
3. לך ל-**Site settings** (הגדרות האתר)
4. בתפריט השמאלי, לחץ על **Environment variables** (משתני סביבה)
5. לחץ על **Add a variable** (הוסף משתנה)
6. הוסף את שני המשתנים הבאים:

   **משתנה ראשון:**
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: ה-URL של הפרויקט שלך ב-Supabase (לדוגמה: `https://xxxxx.supabase.co`)
   - **Scopes**: בחר **All scopes** (או **Production** אם אתה רוצה רק לייצור)

   **משתנה שני:**
   - **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: ה-anon key של הפרויקט שלך ב-Supabase
   - **Scopes**: בחר **All scopes** (או **Production** אם אתה רוצה רק לייצור)

7. לחץ על **Save** (שמור)

### שלב 3: הפעלת Build מחדש
1. לאחר שמירת המשתנים, לך ל-**Deploys** (פריסות)
2. לחץ על **Trigger deploy** → **Deploy site** (הפעל פריסה)
3. או פשוט דחוף שינוי חדש ל-GitHub והבילד יתחיל אוטומטית

## אימות שהכל עובד
לאחר שהבילד מסתיים בהצלחה:
1. בדוק שהאתר נטען ללא שגיאות
2. נסה להתחבר/להירשם - זה צריך לעבוד עם Supabase

## הערות חשובות
- ⚠️ **אל תעלה את ה-keys ל-Git!** הם כבר ב-`.gitignore`
- משתנים עם `NEXT_PUBLIC_` נגישים גם בצד הלקוח (client-side)
- ודא שאתה משתמש ב-**anon key** ולא ב-**service role key** (שהוא רגיש יותר)
- אם יש לך סביבות נפרדות (dev/prod), תוכל להגדיר משתנים שונים לכל סביבה

## פתרון בעיות
### הבילד עדיין נכשל
- ודא שהמשתנים נשמרו נכון (ללא רווחים מיותרים)
- ודא שהמשתנים מוגדרים ל-scope הנכון (Production/Deploy previews)
- נסה למחוק את ה-cache: **Site settings** → **Build & deploy** → **Clear cache and retry deploy**

### האתר לא מתחבר ל-Supabase
- ודא שה-URL וה-key נכונים
- בדוק ב-console של הדפדפן אם יש שגיאות
- ודא שה-RLS policies ב-Supabase מוגדרים נכון

