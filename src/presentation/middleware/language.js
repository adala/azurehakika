// middleware/language.js
const setLanguage = (req, res, next) => {
  if (req.query.lang) {
    req.setLocale(req.query.lang);
    req.session.lang = req.query.lang;
    req.session.isRTL = req.query.lang === 'ar';
  }
  else if (req.session.lang) {
    req.setLocale(req.session.lang);
    req.session.isRTL = req.session.lang === 'ar';
  }
  else {
    const acceptLanguage = req.headers['accept-language'];
    if (acceptLanguage) {
      const preferredLang = acceptLanguage.split(',')[0].split('-')[0];
      if (['en', 'fr', 'pt', 'sw', 'ar'].includes(preferredLang)) {
        req.setLocale(preferredLang);
        req.session.isRTL = preferredLang === 'ar';
      }
    }
  }
  
  res.locals.currentLocale = req.getLocale();
  res.locals.isRTL = req.session.isRTL || false;
  res.locals.availableLocales = [
    { code: 'en', name: 'English', native: 'English', dir: 'ltr' },
    { code: 'fr', name: 'French', native: 'Français', dir: 'ltr' },
    { code: 'pt', name: 'Portuguese', native: 'Português', dir: 'ltr' },
    { code: 'sw', name: 'Swahili', native: 'Kiswahili', dir: 'ltr' },
    { code: 'ar', name: 'Arabic', native: 'العربية', dir: 'rtl' }
  ];
  
  next();
};

module.exports = setLanguage;