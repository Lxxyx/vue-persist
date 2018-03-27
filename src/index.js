export default function (Vue, {
  name: defaultStoreName = 'persist:store',
  expiration: defaultExpiration,
  read = k => localStorage.getItem(k),
  write = (k, v) => localStorage.setItem(k, v),
  clear = k => localStorage.removeItem(k)
} = {}) {
  const cache = {}

  Vue.mixin({
    beforeCreate() {
      this.$persist = (names, storeName = defaultStoreName, storeExpiration = defaultExpiration) => {

        let prefix = this.$options.name;
        if (!prefix) {
          console.error('You must set name to Vue components while using vue-persist');
          return;
        }

        storeName = `${prefix}__${storeName}`

        let store = cache[storeName] = JSON.parse(read(storeName) || '{}')
        store.data = store.data || {}

        if (isExpired(store.expiration)) {
          clear(storeName)
          store = {
            data: {},
            expiration: getExpiration(storeExpiration)
          }
        }

        if (!store.expiration) {
          store.expiration = getExpiration(storeExpiration)
        }

        this._persistWatchers = this._persistWatchers || []

        for (const name of names) {
          if (typeof store.data[name] !== 'undefined') {
            this[name] = store.data[name]
          }

          if (this._persistWatchers.indexOf(name) === -1) {
            this._persistWatchers.push(name)

            this.$watch(name, {
              handler: val => {
                store.data[name] = val;
                write(storeName, JSON.stringify(store));
              },
              deep: true
            })
          }
        }
      }
    },

    created() {
      const { persist } = this.$options
      if (persist) {
        this.$persist(persist)
      }
    }
  })
}

function getExpiration(exp) {
  return exp ? Date.now() + exp : 0
}

function isExpired(exp) {
  return exp && (Date.now() > exp)
}
