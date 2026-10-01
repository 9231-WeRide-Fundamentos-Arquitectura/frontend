//db.json deploy = https://db-weride-4.onrender.com
//deploy previo = http://20.81.154.140:8080/
//deploy actual = https://weride.duckdns.org/api/v1
//probando
export const environment = {
  production: false,
  mapboxAccessToken: '',
  apiUrl: 'https://weride.duckdns.org/api/v1',
  endpoints: {
    users: '/users',
    vehicles: '/vehicles',
    plans: '/plans',
    locations: '/location',
    bookings: '/bookings',
    notifications: '/notifications',
    favorites: '/favorites',
    trips: '/trips',
    payments: '/payments',
    unlockRequests: '/unlockRequests',
    problemReports: '/problemReports',
    ratings: '/ratings'
  }
};
