/**
 * IndexedDB 存储模块
 */
export class IndexedDB {
  private dbName = 'KidsGameDB'
  private version = 1
  private db: IDBDatabase | null = null

  /**
   * 初始化数据库
   */
  async init(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(this.dbName, this.version)

        request.onerror = () => {
          console.error('IndexedDB open error')
          resolve(false)
        }

        request.onsuccess = () => {
          this.db = request.result
          resolve(true)
        }

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result

          // 创建对象存储
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' })
          }

          if (!db.objectStoreNames.contains('progress')) {
            db.createObjectStore('progress', { keyPath: 'key' })
          }

          if (!db.objectStoreNames.contains('gameData')) {
            db.createObjectStore('gameData', { keyPath: 'key' })
          }
        }
      } catch (e) {
        console.error('IndexedDB init error:', e)
        resolve(false)
      }
    })
  }

  /**
   * 检查 IndexedDB 是否可用
   */
  isAvailable(): boolean {
    return typeof indexedDB !== 'undefined'
  }

  /**
   * 设置值
   */
  async set(storeName: string, key: string, value: unknown): Promise<boolean> {
    if (!this.db) {
      await this.init()
    }

    if (!this.db) return false

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)

        const request = store.put({ key, value })

        request.onsuccess = () => resolve(true)
        request.onerror = () => resolve(false)
      } catch (e) {
        console.error('IndexedDB set error:', e)
        resolve(false)
      }
    })
  }

  /**
   * 获取值
   */
  async get<T>(storeName: string, key: string): Promise<T | null> {
    if (!this.db) {
      await this.init()
    }

    if (!this.db) return null

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([storeName], 'readonly')
        const store = transaction.objectStore(storeName)
        const request = store.get(key)

        request.onsuccess = () => {
          const result = request.result
          if (result) {
            resolve(result.value as T)
          } else {
            resolve(null)
          }
        }

        request.onerror = () => resolve(null)
      } catch (e) {
        console.error('IndexedDB get error:', e)
        resolve(null)
      }
    })
  }

  /**
   * 删除值
   */
  async remove(storeName: string, key: string): Promise<boolean> {
    if (!this.db) {
      await this.init()
    }

    if (!this.db) return false

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        const request = store.delete(key)

        request.onsuccess = () => resolve(true)
        request.onerror = () => resolve(false)
      } catch (e) {
        console.error('IndexedDB remove error:', e)
        resolve(false)
      }
    })
  }

  /**
   * 清空指定存储
   */
  async clear(storeName: string): Promise<boolean> {
    if (!this.db) {
      await this.init()
    }

    if (!this.db) return false

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        const request = store.clear()

        request.onsuccess = () => resolve(true)
        request.onerror = () => resolve(false)
      } catch (e) {
        console.error('IndexedDB clear error:', e)
        resolve(false)
      }
    })
  }
}

// 单例实例
export const indexedDB$ = new IndexedDB()