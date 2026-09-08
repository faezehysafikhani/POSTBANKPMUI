# فاصله‌های فعلی UI و Core API

## endpoint موجود نیست

- حذف دائمی Action؛ UI این دکمه را غیرفعال کرده است.
- بارگذاری و دریافت فایل پیوست Chat Message.
- ایجاد Notification از سمت UI (Core فقط خواندن و read/read-all دارد).
- حذف گروهی داده‌ها برای گزینه پاک‌سازی کامل UI.

## endpoint وجود دارد ولی قرارداد تمام فیلدهای UI را پوشش نمی‌دهد

- Project: فیلدهای `priority`، `category` آزاد، `spent` و `tags` در DTO فعلی Core وجود ندارند.
- Project progress: به‌جای فیلد مستقیم پروژه از ماژول `progress-updates` استفاده شده است.
- Action: درصد پیشرفت عددی و `priority` ندارد؛ وضعیت Core به نمایش تقریبی 0/50/100 نگاشت شده است.
- Strategy: `targetYear`، درصد پیشرفت، owner، تعداد پروژه‌های متصل و وضعیت on-track/at-risk در DTO فعلی موجود نیست.
- Knowledge: نویسنده و tag در DTO موجود نیست؛ فایل و توضیح موجود است.
- User/Team: واحد سازمانی، آواتار و آمار taskهای فعال/تمام‌شده در User DTO موجود نیست.
- Workflow approval-center: عنوان subject، نام درخواست‌کننده و تاریخ ارسال را مستقیماً برنمی‌گرداند و UI آن‌ها را با Actionهای دریافت‌شده تطبیق می‌دهد.
- Notification: priority و link مقصد در DTO موجود نیست.

## پیش‌نیاز داده‌ای

- ثبت Action به وجود حداقل یک Organization Unit و یک Work Calendar در Core نیاز دارد.
- ارسال Action برای تأیید به Workflow Definition و step مناسب نیاز دارد.
- گفتگوی گروهی/مستقیم باید قبلاً وجود داشته باشد یا هنگام پیام مستقیم توسط endpoint ساخته شود.

## نکته امنیتی Core

- مسیر `POST /api/chat/messages` برخلاف سایر مسیرهای Chat در کد فعلی به‌صورت صریح `RequireAuthorization()` ندارد. بهتر است پیش از استقرار اصلاح شود.
