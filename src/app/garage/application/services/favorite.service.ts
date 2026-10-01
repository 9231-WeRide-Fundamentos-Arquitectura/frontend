export class FavoriteService {
  private static STORAGE_KEY = 'favorites';

  static getFavorites(): string[] {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
  }

  static toggleFavorite(vehicleId: string): void {
    const favs = this.getFavorites();
    if (favs.includes(vehicleId)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favs.filter(f => f !== vehicleId)));
    } else {
      favs.push(vehicleId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favs));
    }
  }

  static isFavorite(vehicleId: string): boolean {
    return this.getFavorites().includes(vehicleId);
  }
}
