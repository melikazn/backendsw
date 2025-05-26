// Ett objekt som innehåller alla fördefinierade systemmeddelanden 

const messages = {
    passwordChanged: {
      sv: "Lösenordet har uppdaterats",
      fa: "گذرواژه با موفقیت تغییر یافت"
    },
    invalidPassword: {
      sv: "Fel nuvarande lösenord",
      fa: "گذرواژه فعلی نادرست است"
    },
    userNotFound: {
      sv: "Användare hittades inte",
      fa: "کاربر پیدا نشد"
    },
    videoUploaded: {
      sv: "Video uppladdad och sparad",
      fa: "ویدیو با موفقیت بارگذاری شد"
    },
    categoryExists: {
      sv: "Kategorin finns redan",
      fa: "این دسته‌بندی قبلاً وجود دارد"
    },
    questionCreated: {
      sv: "Fråga skapad",
      fa: "سوال با موفقیت ایجاد شد"
    },
    answerPublished: {
      sv: "Svar publicerat",
      fa: "پاسخ با موفقیت ثبت شد"
    },
    favoriteAdded: {
      sv: "Tillagd i favoriter",
      fa: "به علاقه‌مندی‌ها اضافه شد"
    },
    favoriteRemoved: {
      sv: "Borttagen från favoriter",
      fa: "از علاقه‌مندی‌ها حذف شد"
    },
    notificationMarkedRead: {
      sv: "Notis markerad som läst",
      fa: "اعلان به عنوان خوانده شده علامت خورد"
    },
    globalMessageSent: {
      sv: "Globalt meddelande skickat",
      fa: "پیام سراسری با موفقیت ارسال شد"
    },
    globalMessageRequired: {
      sv: "Meddelande krävs",
      fa: "وارد کردن پیام الزامی است"
    },
    noUsers: {
      sv: "Inga användare att skicka till",
      fa: "کاربری برای ارسال پیام وجود ندارد"
    },
    errorFetching: {
      sv: "Fel vid hämtning",
      fa: "خطا در بازیابی اطلاعات"
    },
    errorSaving: {
      sv: "Fel vid sparande",
      fa: "خطا در ذخیره‌سازی"
    },
    nswerContentRequired: {
      sv: "Svarsinnehåll krävs",
      fa: "وارد کردن محتوای پاسخ الزامی است"
    },
    questionNotFound: {
      sv: "Frågan hittades inte",
      fa: "سوال پیدا نشد"
    },
    newAnswer: {
      sv: "Du har fått ett nytt svar på din fråga:",
      fa: "شما یک پاسخ جدید برای سوال خود دریافت کردید:"
    },
    questionDeleted: {
      sv: "Fråga borttagen",
      fa: "سوال حذف شد"
    },
    answerDeleted: {
      sv: "Svar borttaget",
      fa: "پاسخ حذف شد"
    },
    globalMessageRequired: {
      sv: "Meddelande krävs",
      fa: "وارد کردن پیام الزامی است"
    },
    noUsers: {
      sv: "Inga användare att skicka till",
      fa: "کاربری برای ارسال پیام وجود ندارد"
    },
    answerContentRequired: {
      sv: "Svarsinnehåll krävs",
      fa: "وارد کردن محتوای پاسخ الزامی است"
   },
   notificationNotFound: {
    sv: "Notis hittades inte",
    fa: "اعلان پیدا نشد"
    },
    resetPasswordSubject: {
      sv: "Återställ ditt lösenord",
      fa: "بازنشانی گذرواژه شما"
    },
    resetPasswordText: {
      sv: "Klicka på länken för att återställa ditt lösenord",
      fa: "برای بازنشانی گذرواژه خود روی لینک کلیک کنید"
    },
    resetLinkSent: {
      sv: "Återställningslänk skickad till din e-post",
      fa: "لینک بازنشانی به ایمیل شما ارسال شد"
    },
    invalidToken: {
      sv: "Ogiltig eller utgången token",
      fa: "توکن نامعتبر یا منقضی شده است"
    },
    bothPasswordsRequired: {
      sv: "Både nuvarande och nytt lösenord krävs",
      fa: "وارد کردن گذرواژه فعلی و جدید الزامی است"
    },
    questionAdded: {
      sv: "Fråga tillagd",
      fa: "سوال اضافه شد"
    },
    questionTextRequired: {
      sv: "Frågetext krävs",
      fa: "متن سوال الزامی است"
    },
    answerTextRequired: {
      sv: "Svarsalternativ krävs",
      fa: "متن پاسخ الزامی است"
    },
    answerAdded: {
      sv: "Svar tillagt",
      fa: "پاسخ اضافه شد"
    },
    questionUpdated: {
      sv: "Fråga uppdaterad",
      fa: "سوال به‌روزرسانی شد"
    },
    categoryNameRequired: {
      sv: "Namn på kategori krävs",
      fa: "نام دسته‌بندی الزامی است"
    },
    categoryAdded: {
      sv: "Kategori tillagd",
      fa: "دسته‌بندی اضافه شد"
    },
    categoryNotFound: {
      sv: "Kategorin hittades inte",
      fa: "دسته‌بندی پیدا نشد"
    },
    categoryUpdated: {
      sv: "Kategori uppdaterad",
      fa: "دسته‌بندی به‌روزرسانی شد"
    },
    categoryDeleted: {
      sv: "Kategori borttagen",
      fa: "دسته‌بندی حذف شد"
    },
    sectionFieldsRequired: {
      sv: "category_name, name och level krävs",
      fa: "نام دسته‌بندی، نام و سطح الزامی هستند"
    },
    sectionAdded: {
      sv: "Sektion tillagd",
      fa: "بخش اضافه شد"
    },
    sectionNotFound: {
      sv: "Sektionen hittades inte",
      fa: "بخش پیدا نشد"
    },
    sectionUpdated: {
      sv: "Sektion uppdaterad",
      fa: "بخش به‌روزرسانی شد"
    },
    sectionDeleted: {
      sv: "Sektion borttagen",
      fa: "بخش حذف شد"
    },
    testAdded: {
      sv: "Test tillagt",
      fa: "آزمون اضافه شد"
    },
    errorSavingTest: {
      sv: "Fel vid skapande av test",
      fa: "خطا در ذخیره‌سازی آزمون"
    },
    errorSearchingTests: {
      sv: "Fel vid sökning av tester",
      fa: "خطا در جستجوی آزمون‌ها"
    },
    sectionIdTitleRequired: {
      sv: "section_id och title krävs",
      fa: "شناسه بخش و عنوان الزامی است"
    },
    testStarted: {
      sv: "Test startat",
      fa: "آزمون شروع شد"
    },
    errorStartingTest: {
      sv: "Kunde inte starta testet",
      fa: "خطا در شروع آزمون"
    },
    answersMustBeArray: {
      sv: "'answers' måste vara en array",
      fa: "پاسخ‌ها باید به صورت آرایه باشند"
    },
    testNotStartedProperly: {
      sv: "Testet har inte startats korrekt",
      fa: "آزمون به درستی شروع نشده است"
    },
    testPassed: {
      sv: "Test godkänt 🎉",
      fa: "آزمون با موفقیت گذرانده شد 🎉"
    },
    testFailed: {
      sv: "Test ej godkänt",
      fa: "آزمون قبول نشد"
    },
    errorSubmittingTest: {
      sv: "Fel vid testinlämning",
      fa: "خطا در ارسال آزمون"
    },
    errorFetchingResults: {
      sv: "Kunde inte hämta testresultat",
      fa: "خطا در بازیابی نتایج آزمون"
    },
    userRegistered: {
      sv: "Användare registrerad",
      fa: "کاربر با موفقیت ثبت شد"
    },
    errorRegistering: {
      sv: "Fel vid registrering",
      fa: "خطا در ثبت‌نام"
    },
    loginSuccess: {
      sv: "Inloggning lyckades",
      fa: "ورود با موفقیت انجام شد"
    },
    errorLoggingIn: {
      sv: "Fel vid inloggning",
      fa: "خطا در ورود"
    },
    errorFetchingProfile: {
      sv: "Något gick fel vid hämtning av profil",
      fa: "خطا در بازیابی پروفایل"
    },
    profileUpdated: {
      sv: "Profil uppdaterad",
      fa: "پروفایل به‌روزرسانی شد"
    },
    errorUpdatingProfile: {
      sv: "Kunde inte uppdatera profil",
      fa: "خطا در به‌روزرسانی پروفایل"
    },
    noImageUploaded: {
      sv: "Ingen bild uppladdad",
      fa: "هیچ تصویری آپلود نشده است"
    },
    profileImageUpdated: {
      sv: "Profilbild uppdaterad",
      fa: "تصویر پروفایل با موفقیت به‌روزرسانی شد"
    },
    errorUploadingProfileImage: {
      sv: "Fel vid uppladdning av profilbild",
      fa: "خطا در آپلود تصویر پروفایل"
    },
    noProfileImage: {
      sv: "Ingen profilbild att ta bort",
      fa: "تصویر پروفایلی برای حذف وجود ندارد"
    },
    profileImageDeleted: {
      sv: "Profilbild borttagen",
      fa: "تصویر پروفایل حذف شد"
    },
    errorDeletingProfileImage: {
      sv: "Fel vid borttagning av profilbild",
      fa: "خطا در حذف تصویر پروفایل"
    },
    levelUpMessage: {
      sv: "Grattis! Du har klarat nivå {current} och är nu på nivå {next}!",
      fa: "تبریک! شما سطح {current} را با موفقیت گذرانده‌اید و اکنون در سطح {next} هستید!"
    },
    errorFetchingOverview: {
      sv: "Fel vid hämtning av testöversikt",
      fa: "خطا در بازیابی نمای کلی آزمون‌ها"
    },    
    noVideoUploaded: {
      sv: "Ingen video uppladdad",
      fa: "هیچ ویدیویی بارگذاری نشده است"
    },
    errorUploadingVideo: {
      sv: "Fel vid videouppladdning",
      fa: "خطا در بارگذاری ویدیو"
    },
    errorFetchingVideos: {
      sv: "Fel vid hämtning av videor",
      fa: "خطا در دریافت ویدیوها"
    },
    errorSearchingVideos: {
      sv: "Fel vid sökning av videor",
      fa: "خطا در جستجوی ویدیوها"
    },
  };

  
  const getMessage = (key, lang = 'sv') => {
    return messages[key]?.[lang] || messages[key]?.sv || "Okänt meddelande";
  };
  
  module.exports = { getMessage };
  