//deploy previo = http://20.81.154.140:8080/
//deploy actual = https://weride.duckdns.org/api/v1
//probando
export const environment = {
  production: false,
  mapboxAccessToken: 'pk.eyJ1IjoiamhpbXlwb29sIiwiYSI6ImNtZGY4cjVoMDBheHcyaXEzaDV5a2g4eGIifQ.QYmwDCEn26DEW-8RbIG2jg',
  apiUrl: '/api/v1',
  endpoints: {
    users: '/profiles',
    vehicles: '/vehicles',
    plans: '/plans',
    locations: '/location',
    bookings: '/bookings',
    notifications: '/notifications',
    favorites: '/favorites',
    trips: '/trips',
    payments: '/payments',
    unlockRequests: '/unlockRequests',
    problemReports: '/problem-reports'
  }
};
