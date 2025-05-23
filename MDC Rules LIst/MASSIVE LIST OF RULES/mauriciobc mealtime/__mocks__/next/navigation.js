// __mocks__/next/navigation.js
module.exports = {
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/',
    route: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  redirect: jest.fn((url) => {
    console.log(`Mock redirect to: ${url}`);
  }),
  permanentRedirect: jest.fn((url) => {
    console.log(`Mock permanent redirect to: ${url}`);
  }),
  // Add any other exports from next/navigation you use
}; 