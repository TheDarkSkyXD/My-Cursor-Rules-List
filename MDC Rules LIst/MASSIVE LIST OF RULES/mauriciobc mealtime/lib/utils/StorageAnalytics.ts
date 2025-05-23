// Utility for tracking storage usage and analytics
export class StorageAnalytics {
  static getStorageUsage(): { used: number; total: number } {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      }
    }

    const total = 5 * 1024 * 1024; // Approximate 5MB limit for localStorage
    return { used, total };
  }

  static logStorageUsage(): void {
    const { used, total } = this.getStorageUsage();
    console.log(`Storage Usage: ${(used / 1024).toFixed(2)} KB / ${(total / 1024).toFixed(2)} KB`);
  }
}

// Example usage:
// StorageAnalytics.logStorageUsage();