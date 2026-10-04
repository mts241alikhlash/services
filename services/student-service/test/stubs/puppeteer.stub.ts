export default {
  launch(): Promise<never> {
    return Promise.reject(
      new Error(
        'puppeteer is stubbed under Jest — a test reached real PDF rendering',
      ),
    )
  },
}
